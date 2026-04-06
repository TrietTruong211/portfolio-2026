# Skill: Fastify 4 API

## Context
The backend is a standalone Fastify 4 server deployed on Railway. It handles auth, proxies AWS calls, and manages document uploads. It is the only place AWS credentials and JWT secrets exist.

---

## Project structure

```
apps/api/
├── src/
│   ├── index.ts              # Entry point — build server, listen
│   ├── server.ts             # buildServer() factory (testable)
│   ├── plugins/
│   │   ├── auth.ts           # JWT verify hook, decorateRequest
│   │   ├── cors.ts           # @fastify/cors config
│   │   └── sensible.ts       # @fastify/sensible (http errors)
│   ├── routes/
│   │   ├── auth.ts           # POST /auth/login, /auth/logout, GET /auth/me
│   │   ├── chat.ts           # GET /api/chat (AWS proxy — public)
│   │   └── documents.ts      # POST /api/documents/upload, /query (owner only)
│   ├── db/                   # Re-exports from packages/db
│   ├── lib/
│   │   ├── aws.ts            # AWS proxy helpers
│   │   └── jwt.ts            # Sign / verify tokens
│   └── types/
│       └── fastify.d.ts      # Augment FastifyRequest with user
├── src/**/*.test.ts          # JEST tests co-located
└── tsconfig.json
```

---

## Server factory pattern (for testability)

```ts
// src/server.ts
import Fastify from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import sensible from '@fastify/sensible'
import { authPlugin } from './plugins/auth'
import { authRoutes } from './routes/auth'
import { chatRoutes } from './routes/chat'
import { documentRoutes } from './routes/documents'

export async function buildServer() {
  const app = Fastify({ logger: true })

  await app.register(cors, {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  })
  await app.register(cookie)
  await app.register(sensible)
  await app.register(authPlugin)

  await app.register(authRoutes, { prefix: '/auth' })
  await app.register(chatRoutes, { prefix: '/api' })
  await app.register(documentRoutes, { prefix: '/api' })

  app.get('/health', async () => ({ status: 'ok' }))

  return app
}
```

```ts
// src/index.ts
import { buildServer } from './server'

const app = await buildServer()
await app.listen({ port: Number(process.env.PORT ?? 3001), host: '0.0.0.0' })
```

---

## Auth plugin

```ts
// src/plugins/auth.ts
import fp from 'fastify-plugin'
import type { FastifyPluginAsync } from 'fastify'
import { verifyAccessToken } from '../lib/jwt'

const authPlugin: FastifyPluginAsync = fp(async (app) => {
  app.decorateRequest('user', null)

  app.addHook('preHandler', async (request, reply) => {
    const token = request.cookies['portfolio_access']
    if (!token) return  // unauthenticated — routes guard themselves

    try {
      request.user = verifyAccessToken(token)
    } catch {
      reply.clearCookie('portfolio_access').clearCookie('portfolio_refresh')
    }
  })
})

export { authPlugin }
```

```ts
// src/types/fastify.d.ts
import type { JwtPayload } from '../lib/jwt'

declare module 'fastify' {
  interface FastifyRequest {
    user: JwtPayload | null
  }
}
```

---

## Route pattern with JSON Schema validation

```ts
// src/routes/auth.ts
import type { FastifyPluginAsync } from 'fastify'
import { db } from '../db'
import { users } from '@portfolio/db/schema'
import { eq } from 'drizzle-orm'
import { compare } from 'bcryptjs'
import { signAccessToken, signRefreshToken } from '../lib/jwt'

const loginBody = {
  type: 'object',
  required: ['email', 'password'],
  properties: {
    email: { type: 'string', format: 'email' },
    password: { type: 'string', minLength: 8 },
  },
  additionalProperties: false,
} as const

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post('/login', { schema: { body: loginBody } }, async (request, reply) => {
    const { email, password } = request.body as { email: string; password: string }

    const [user] = await db.select().from(users).where(eq(users.email, email))
    if (!user) return reply.code(401).send({ error: 'Invalid credentials' })

    const valid = await compare(password, user.passwordHash)
    if (!valid) return reply.code(401).send({ error: 'Invalid credentials' })

    const cookieOpts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
    }

    reply
      .setCookie('portfolio_access', signAccessToken({ id: user.id, role: 'owner' }), {
        ...cookieOpts,
        maxAge: 60 * 15,               // 15 min
      })
      .setCookie('portfolio_refresh', signRefreshToken({ id: user.id }), {
        ...cookieOpts,
        maxAge: 60 * 60 * 24 * 7,     // 7 days
      })
      .send({ ok: true })
  })

  app.post('/logout', async (_request, reply) => {
    reply
      .clearCookie('portfolio_access')
      .clearCookie('portfolio_refresh')
      .send({ ok: true })
  })

  app.get('/me', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'Unauthenticated' })
    reply.send({ id: request.user.id, role: request.user.role })
  })
}
```

---

## Owner-only guard

```ts
function requireOwner(request: FastifyRequest, reply: FastifyReply, done: () => void) {
  if (!request.user || request.user.role !== 'owner') {
    return reply.code(403).send({ error: 'Forbidden' })
  }
  done()
}

// Usage in a route:
app.post('/documents/upload', { preHandler: requireOwner }, async (request, reply) => {
  // ...
})
```

---

## AWS proxy helper

```ts
// src/lib/aws.ts
const AWS_TIMEOUT_MS = 10_000

export async function proxyToAws(url: string, body: unknown): Promise<unknown> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), AWS_TIMEOUT_MS)

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.AWS_API_KEY!,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    if (!res.ok) {
      throw new Error(`AWS responded with ${res.status}`)
    }

    return res.json()
  } finally {
    clearTimeout(timer)
  }
}
```

---

## JEST test pattern

```ts
// src/routes/auth.test.ts
import { buildServer } from '../server'
import type { FastifyInstance } from 'fastify'

let app: FastifyInstance

beforeAll(async () => { app = await buildServer() })
afterAll(async () => { await app.close() })

describe('POST /auth/login', () => {
  it('returns 401 for wrong credentials', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      body: { email: 'wrong@example.com', password: 'wrongpass' },
    })
    expect(res.statusCode).toBe(401)
    expect(res.json()).toMatchObject({ error: 'Invalid credentials' })
  })
})
```

Use `app.inject()` for all route tests — no real HTTP, fast, no port conflicts.

---

## Error handling rules

- Use `reply.code(n).send({ error: '...' })` — never `throw new Error`
- Use `@fastify/sensible` for standard HTTP errors: `reply.notFound()`, `reply.badRequest()`, `reply.unauthorized()`
- Log errors via `request.log.error(err)` — Fastify's built-in pino logger
- Wrap all AWS calls in try/catch — return 502 if AWS is unreachable
- Never expose internal error messages or stack traces in production responses

---

## Railway deployment

- Set `PORT` env var — Railway injects it automatically, but declare it in your config
- Health check: `GET /health` returns `{ status: 'ok' }` — configure in Railway dashboard
- The Railway service for UAT and prod are separate services with separate env var sets
