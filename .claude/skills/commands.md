# Claude slash commands for portfolio-2026

## /new-feature
Usage: /new-feature <name>

Steps:
1. git checkout -b feature/<name> uat
2. Identify affected packages: web, api, db, types
3. Update shared types in packages/types first if new data shapes are needed
4. Implement backend route in apps/api/src/routes/
5. Write JEST tests for the route
6. Generate Angular component/service: ng generate component features/<name>/<name> --standalone
7. Set ChangeDetectionStrategy.OnPush, use inject(), use Signals
8. Set SEO via SeoService in ngOnInit()
9. Run axe check via Playwright
10. Run pnpm typecheck && pnpm lint -- fix all errors
11. Commit with: feat(<package>): <description>
12. Push and open PR -> uat

---

## /new-component
Usage: /new-component <name>

Steps:
1. Decide: shared/components/ (reusable) or features/<feature>/ (feature-specific)
2. ng generate component <path>/<name> --standalone --change-detection=OnPush
3. Define all inputs with input() signal API
4. Define outputs with output()
5. Import only what's needed (RouterLink, NgOptimizedImage, LucideAngularModule)
6. Use Tailwind semantic tokens only (bg-background, text-foreground, etc.)
7. Add data-testid to interactive and key elements
8. Add ARIA attributes: aria-label, aria-expanded, aria-pressed, role as needed
9. Write Jasmine unit test in co-located .spec.ts file

---

## /new-service
Usage: /new-service <name>

Steps:
1. ng generate service core/services/<name> 
2. Use inject() for all dependencies
3. Expose state as readonly signals via .asReadonly()
4. Use computed() for derived state
5. Add explicit return types to all methods
6. Write Jasmine unit test with HttpClientTestingModule if HTTP is needed

---

## /new-route
Usage: /new-route <method> <path> [owner-only]

Steps:
1. Identify which route file in apps/api/src/routes/ or create new one
2. Define JSON Schema for request body/params
3. Add preHandler: requireOwner if owner-only
4. Implement handler with try/catch
5. Add JEST test using app.inject()
6. Register in server.ts if it's a new route file

---

## /check
Usage: /check

Run full local quality check before opening a PR:
```bash
pnpm typecheck
pnpm lint
pnpm --filter api test
pnpm --filter web test -- --watch=false --browsers=ChromeHeadless
pnpm --filter web build
pnpm --filter web e2e --project=chromium
```
All must pass with zero errors and zero axe violations.

---

## /seo-check
Usage: /seo-check <component-path>

Verify a route component has correct SEO setup:
- [ ] SeoService.set() called in ngOnInit() with title, description, url
- [ ] og:image set (or falls back to default)
- [ ] JSON-LD injected for Person (homepage) or SoftwareApplication (project pages)
- [ ] Canonical URL matches the route path

---

## /a11y-check
Usage: /a11y-check <component-path>

Verify a component meets accessibility requirements:
- [ ] All interactive elements are <button> or <a> (never <div> or <span> with click)
- [ ] All buttons have aria-label if icon-only
- [ ] All images have descriptive alt text
- [ ] Form inputs have associated <label>
- [ ] Custom toggles/switches have aria-pressed
- [ ] Custom accordions have aria-expanded
- [ ] Loading states have aria-live="polite"
- [ ] Focus management handled for modals/drawers (FocusTrap from CDK)

---

## /bundle-check
Usage: /bundle-check

Check bundle sizes after build:
```bash
pnpm --filter web build -- --stats-json
node -e "
const stats = require('./apps/web/dist/web/browser/stats.json');
const initial = stats.chunks
  .filter(c => c.initial)
  .reduce((sum, c) => sum + c.size, 0);
const kb = (initial / 1024).toFixed(1);
console.log('Initial bundle:', kb, 'KB');
if (initial > 150 * 1024) process.exit(1);
"
```

---

## /db-generate
Usage: /db-generate

Generate a new migration from the current schema state. Run this after any schema change in `packages/db/src/schema/`.

```bash
pnpm --filter db generate
```

Drizzle will diff the schema against the last migration snapshot and write a new SQL file to `packages/db/migrations/`. Review the generated SQL before migrating.

---

## /db-migrate
Usage: /db-migrate

Apply all pending migrations to the database pointed at by `DATABASE_URL` in `apps/api/.env`.

```bash
pnpm --filter db migrate
```

**Never run against production without reviewing the generated SQL first.**

---

## /db-studio
Usage: /db-studio

Open Drizzle Studio — a local browser UI to inspect and edit the database.

```bash
pnpm --filter db studio
```

Requires `DATABASE_URL` to be set. Studio runs at https://local.drizzle.studio.

---

## /db-push
Usage: /db-push (dev/UAT only — never production)

Push schema changes directly to the database without generating a migration file. Useful during early development when you don't want to accumulate migration files.

```bash
pnpm --filter db -- drizzle-kit push
```

**Do not use on production.** For prod, always use `/db-generate` then `/db-migrate`.

---

## /db-status
Usage: /db-status

Show which migrations have been applied and which are pending.

```bash
pnpm --filter db -- drizzle-kit status
```

---

## /db-drop
Usage: /db-drop (dev/UAT only — never production)

Drop all tables and reapply all migrations from scratch. Use when you need a clean slate in dev.

Steps:
1. Confirm we are NOT on a production `DATABASE_URL` (check `apps/api/.env`)
2. Run:
```bash
pnpm --filter db -- drizzle-kit drop
```
3. Then re-migrate:
```bash
pnpm --filter db migrate
```

---

## /db-new-table
Usage: /db-new-table <name>

Add a new Drizzle table to the schema.

Steps:
1. Create `packages/db/src/schema/<name>.ts` using `pgTable` from `drizzle-orm/pg-core`
2. Always include `id` (uuid, primaryKey, defaultRandom), `created_at`, and `updated_at` columns with `.defaultNow().notNull()`
3. Export from `packages/db/src/schema/index.ts`
4. Export from `packages/db/src/index.ts` if the table needs to be used by the API
5. Run `/db-generate` to create the migration
6. Review the generated SQL
7. Run `/db-migrate` to apply
