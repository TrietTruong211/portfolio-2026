# Skill: Drizzle ORM + Neon Postgres

## Context
The database layer lives in `packages/db` and is shared between `apps/api` and any future tooling. Neon Postgres is the serverless Postgres provider. Drizzle is the type-safe ORM.

---

## Package structure

```
packages/db/
├── src/
│   ├── index.ts          # export { db, schema }
│   ├── client.ts         # Neon + Drizzle client
│   └── schema/
│       ├── users.ts
│       └── index.ts      # barrel export all tables
├── drizzle.config.ts
└── package.json
```

---

## Client setup

```ts
// packages/db/src/client.ts
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

const sql = neon(process.env.DATABASE_URL!)
export const db = drizzle(sql, { schema })
```

```ts
// packages/db/src/index.ts
export { db } from './client'
export * as schema from './schema'
```

---

## Schema conventions

```ts
// packages/db/src/schema/users.ts
import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id:           uuid('id').defaultRandom().primaryKey(),
  email:        text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt:    timestamp('created_at').defaultNow().notNull(),
  updatedAt:    timestamp('updated_at').defaultNow().notNull(),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
```

**Rules:**
- Primary keys: `uuid` with `defaultRandom()`
- Timestamps: always include `created_at` and `updated_at`
- Column names: snake_case in DB, camelCase in TypeScript (Drizzle handles mapping)
- Export `$inferSelect` and `$inferInsert` types from every table file
- No nullable columns unless the business logic truly requires NULL — prefer `''` or `0` defaults

---

## Drizzle config

```ts
// packages/db/drizzle.config.ts
import type { Config } from 'drizzle-kit'

export default {
  schema: './src/schema/index.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! },
} satisfies Config
```

---

## Migration workflow

```bash
# 1. Edit schema files
# 2. Generate migration SQL
pnpm --filter db generate

# 3. Inspect the generated SQL in packages/db/migrations/ — review before running
# 4. Apply to the target database
pnpm --filter db migrate
```

**Never** write raw SQL migration files by hand. Always go through `drizzle-kit generate`.

---

## Query patterns

### Select with filter
```ts
import { db, schema } from '@portfolio/db'
import { eq } from 'drizzle-orm'

const [user] = await db
  .select()
  .from(schema.users)
  .where(eq(schema.users.email, email))
// returns User[] — always destructure [first] when expecting one row
```

### Insert
```ts
const [newUser] = await db
  .insert(schema.users)
  .values({ email, passwordHash: hash })
  .returning()
```

### Update
```ts
await db
  .update(schema.users)
  .set({ updatedAt: new Date() })
  .where(eq(schema.users.id, userId))
```

### Delete
```ts
await db.delete(schema.users).where(eq(schema.users.id, userId))
```

---

## Neon serverless notes

- Neon uses HTTP-based connections via `@neondatabase/serverless` — no persistent connection pool needed
- Cold starts are fast (~50ms); no connection limit issues in Railway's serverless-like environment
- `DATABASE_URL` format: `postgresql://user:password@host/dbname?sslmode=require`
- Use separate Neon branches for prod and UAT: Neon's branching feature creates instant DB copies

---

## Type safety tips

```ts
// Use inferred types everywhere — never write manual DB types
import type { User } from '@portfolio/db/schema/users'

// When returning from API, strip sensitive fields explicitly
function sanitizeUser(user: User): Omit<User, 'passwordHash'> {
  const { passwordHash: _, ...safe } = user
  return safe
}
```
