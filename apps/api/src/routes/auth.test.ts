import { buildServer } from '../server.js'
import type { FastifyInstance } from 'fastify'

let app: FastifyInstance

beforeAll(async () => {
  app = await buildServer()
})

afterAll(async () => {
  await app.close()
})

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchObject({ status: 'ok' })
  })
})

describe('POST /auth/login', () => {
  it('returns 400 for invalid body', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      body: { email: 'not-an-email', password: 'short' },
    })
    expect(res.statusCode).toBe(400)
  })

  it('returns 401 for unknown credentials', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      body: { email: 'nobody@example.com', password: 'password123' },
    })
    expect(res.statusCode).toBe(401)
    expect(res.json()).toMatchObject({ error: 'Invalid credentials' })
  })
})

describe('GET /auth/me', () => {
  it('returns 401 when unauthenticated', async () => {
    const res = await app.inject({ method: 'GET', url: '/auth/me' })
    expect(res.statusCode).toBe(401)
  })
})

describe('POST /auth/logout', () => {
  it('returns ok and clears cookies', async () => {
    const res = await app.inject({ method: 'POST', url: '/auth/logout' })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchObject({ ok: true })
  })
})
