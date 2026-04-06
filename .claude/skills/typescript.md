# Skill: TypeScript Conventions

## Context
TypeScript strict mode is enabled across the entire monorepo. Shared types live in `packages/types`. The goal is zero `any`, explicit return types on all async functions, and type safety across the API/frontend boundary.

---

## Shared types package

```ts
// packages/types/src/index.ts

// ── Sanity / Content ────────────────────────────────────────────
export type Project = {
  title: string
  slug: string
  description: string
  tags: string[]
  techStack: string[]
  image: string | null
  url: string | null
  githubUrl: string | null
  featured: boolean
  order: number
}

export type Skill = {
  name: string
  category: 'frontend' | 'backend' | 'devops' | 'other'
  level: 1 | 2 | 3 | 4 | 5
  icon: string | null
}

export type WorkExperience = {
  company: string
  role: string
  startDate: string    // ISO date string
  endDate: string | null
  current: boolean
  description: PortableTextBlock[]
  techStack: string[]
  logo: string | null
}

export type Bio = {
  name: string
  headline: string
  about: PortableTextBlock[]
  avatar: string | null
  resumeUrl: string | null
  socials: SocialLink[]
}

export type SocialLink = {
  platform: 'github' | 'linkedin' | 'twitter' | 'email' | 'website'
  url: string
}

// ── API ──────────────────────────────────────────────────────────
export type ApiUser = {
  id: string
  role: 'owner'
}

export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export type ApiError = {
  error: string
}

// ── Utility types ─────────────────────────────────────────────────
export type Result<T, E = ApiError> =
  | { ok: true; data: T }
  | { ok: false; error: E }
```

---

## tsconfig bases

```json
// packages/config/tsconfig.base.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

Key flags to know:
- `noUncheckedIndexedAccess` — array index access returns `T | undefined`, not `T`. Always check.
- `exactOptionalPropertyTypes` — `{ a?: string }` means `a` can be `string` or absent, not `undefined`.
- `noImplicitOverride` — must mark overriding methods with `override`.

---

## Rules and patterns

### No `any`
```ts
// BAD
const data: any = await res.json()

// GOOD — use unknown and narrow
const raw: unknown = await res.json()
if (typeof raw !== 'object' || raw === null) throw new Error('Unexpected response')
const data = raw as ApiResponseType  // after validation
```

### Explicit async return types
```ts
// BAD
async function getUser(id: string) {
  return db.select().from(users).where(eq(users.id, id))
}

// GOOD
async function getUser(id: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.id, id))
  return user
}
```

### Type vs Interface
```ts
// Use type for shapes, unions, intersections
type Status = 'active' | 'inactive' | 'pending'
type ProjectWithAuthor = Project & { author: string }

// Use interface only for class contracts or when you need declaration merging
interface Repository<T> {
  findById(id: string): Promise<T | null>
  save(entity: T): Promise<T>
}
```

### Discriminated unions for results
```ts
type UploadResult =
  | { success: true; key: string; url: string }
  | { success: false; error: string }

async function uploadDocument(file: File): Promise<UploadResult> {
  try {
    const { key, url } = await doUpload(file)
    return { success: true, key, url }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

// Caller uses the discriminant:
const result = await uploadDocument(file)
if (result.success) {
  console.log(result.url)  // TS knows url exists here
} else {
  console.error(result.error)
}
```

### Safe array access (noUncheckedIndexedAccess)
```ts
const items = ['a', 'b', 'c']

// BAD — TS error with noUncheckedIndexedAccess
const first = items[0].toUpperCase()

// GOOD
const first = items[0]
if (first !== undefined) {
  first.toUpperCase()
}

// Or use destructuring (TS infers correctly)
const [head, ...tail] = items
```

### Exhaustive switch
```ts
type Theme = 'light' | 'dark' | 'system'

function applyTheme(theme: Theme): void {
  switch (theme) {
    case 'light':  return applyLight()
    case 'dark':   return applyDark()
    case 'system': return applySystem()
    default: {
      const _exhaustive: never = theme
      throw new Error(`Unhandled theme: ${_exhaustive}`)
    }
  }
}
```

---

## API client (frontend)

```ts
// apps/web/src/lib/api.ts
import type { ApiError } from '@portfolio/types'

const BASE = process.env.NEXT_PUBLIC_API_URL!

class ApiClient {
  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      credentials: 'include',  // send cookies
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    })

    if (!res.ok) {
      const err: ApiError = await res.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(err.error)
    }

    return res.json() as Promise<T>
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>(path)
  }

  post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, { method: 'POST', body: JSON.stringify(body) })
  }
}

export const apiClient = new ApiClient()
```

---

## ESLint config

```js
// packages/config/eslint.config.js
import tseslint from 'typescript-eslint'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'

export default tseslint.config(
  tseslint.configs.strictTypeChecked,
  {
    plugins: { react, 'react-hooks': reactHooks },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': ['warn', { allowExpressions: true }],
      '@typescript-eslint/no-floating-promises': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  }
)
```
