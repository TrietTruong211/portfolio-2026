import type { Config } from 'drizzle-kit'

export default {
  schema: ['./src/db/schema/users.ts', './src/db/schema/contactSubmissions.ts'],
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env['DATABASE_URL']!,
  },
} satisfies Config
