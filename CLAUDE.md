# CLAUDE.md — Portfolio 2026

> This file is read by Claude at the start of every session. It contains project conventions, architecture decisions, and working rules. Keep it up to date as the project evolves.

---

## Project overview

A personal portfolio site built as a monorepo with an Angular 18 frontend (prerendered/SSG for S3 hosting) and a standalone Fastify API backend.

**Live environments**
| Branch | Frontend | Backend |
|--------|----------|---------|
| `main` | CloudFront + S3 (prod) | Railway prod service |
| `uat`  | Vercel (uat, static deploy) | Railway uat service |

---

## Monorepo structure

```
portfolio-2026/
├── apps/
│   ├── web/          # Angular 18 — prerendered static output
│   └── api/          # Fastify 4 — REST API on Railway
├── packages/
│   ├── db/           # Drizzle schema + migrations (shared)
│   ├── types/        # Shared TypeScript types/interfaces
│   └── config/       # Shared ESLint, tsconfig bases
├── .claude/          # Claude skills, commands, agents
├── .github/
│   └── workflows/    # CI, deploy-uat, deploy-prod
├── CLAUDE.md         # you are here
└── pnpm-workspace.yaml
```

**Package manager:** pnpm workspaces. Always use `pnpm` — never npm or yarn.

---

## Tech stack

### Frontend (apps/web)
- **Framework:** Angular 18 with standalone components, Signals, and @angular/ssr for prerendering
- **Rendering:** Static Site Generation (SSG) via Angular prerender — every route baked to static HTML for S3
- **Styling:** Tailwind CSS v3, tweakcn color presets, CSS custom properties on :root; SASS (scss) for component stylesheets and global mixins; PostCSS (Tailwind + autoprefixer) processes all CSS after SASS compilation
- **Theming:** Angular DOCUMENT injection + class toggle for light/dark; runtime color palette via CSS vars
- **CMS:** Sanity v3 — GROQ queries via @sanity/client (fetched at build time in prerender)
- **Icons:** lucide-angular — import individually via LucideAngularModule
- **State:** Angular Signals + inject()-based services — no NgRx for this project size
- **HTTP:** HttpClient with typed generics and toSignal() for reactive data
- **Auth UI:** JWT stored in httpOnly cookie (set by API); auth state via /auth/me call in AuthService
- **Testing:** Playwright for E2E; Angular Testing Library + Jasmine for unit tests
- **Performance:** NgOptimizedImage, lazy-loaded routes, @defer blocks, OnPush change detection
- **SEO:** Meta + Title services, prerendered HTML, JSON-LD structured data, Open Graph tags
- **Accessibility:** ARIA attributes, LiveAnnouncer, @angular/cdk/a11y, skip links, semantic HTML
- **Language:** TypeScript strict mode

### Backend (apps/api)
- **Framework:** Fastify 4 with @fastify/cors, @fastify/cookie, @fastify/multipart
- **ORM:** Drizzle ORM with drizzle-kit for migrations
- **Database:** Neon Postgres (serverless)
- **Auth:** JWT (access token 15 min, refresh token 7 days, both httpOnly cookies)
- **Password hashing:** bcryptjs (12 rounds)
- **Testing:** JEST with Fastify inject()
- **Language:** TypeScript strict mode

### Infrastructure
- **CI/CD:** GitHub Actions + CodeRabbit (free, public repo)
- **Linting:** ESLint with @typescript-eslint, @angular-eslint, eslint-plugin-playwright
- **Secrets:** Environment variables only — never committed, never hardcoded

---

## Key architectural decisions

### Angular prerender to S3
Angular 18's @angular/ssr with outputMode: 'static' prerenders every route to static HTML at build time. The output dist/web/browser/ folder is synced to S3 + CloudFront. No Node.js server is required at runtime.

### AWS proxy pattern
The frontend never calls AWS endpoints directly. All AWS calls (chatbot, doc-query, S3 upload) are proxied through the Fastify API, which holds the AWS API key in Railway environment variables.

  Browser -> Railway API -> AWS endpoint
                    ^
             API key lives here only

### JWT in httpOnly cookies
- Access token: portfolio_access cookie, 15 min expiry
- Refresh token: portfolio_refresh cookie, 7 days expiry
- Cookies are httpOnly, sameSite: 'strict', secure: true in prod
- The frontend reads auth state via a /auth/me API call in AuthService — never decodes JWT client-side

### Sanity as the single source of truth for content
Projects, skills, work experience, and bio live in Sanity. The Postgres database is only for user credentials and sessions. Do not store content in Postgres.

### Signals-first state management
Use Angular Signals for all state. Use computed() for derived state. Use effect() sparingly (prefer template bindings). No NgRx — service-per-domain with signals is sufficient.

---

## Coding conventions

### TypeScript
- Strict mode enabled everywhere ("strict": true)
- No any — use unknown and narrow, or define a proper type
- Prefer type over interface for data shapes; use interface for class contracts
- All async functions and service methods must have explicit return types
- Export shared types from packages/types/src/index.ts

### File naming (Angular conventions)
- Components: kebab-case.component.ts + .html + .scss (e.g. project-card.component.ts)
- Services: kebab-case.service.ts (e.g. auth.service.ts)
- Guards: kebab-case.guard.ts
- Pipes: kebab-case.pipe.ts
- Models/types: kebab-case.model.ts
- API routes: camelCase.ts under apps/api/src/routes/
- Drizzle schema files: camelCase.ts under packages/db/src/schema/

### Angular components
- All components are standalone — no NgModules
- Default to ChangeDetectionStrategy.OnPush on every component — no exceptions
- Use inject() function instead of constructor injection
- Use input() signal-based inputs, output() for events (Angular 17.1+)
- No logic in templates beyond simple conditionals — extract to computed signals or methods
- Use @defer for below-the-fold sections (skills, work experience, contact)
- Use @for with track — never @ngFor without trackBy equivalent

### Tailwind + SASS + PostCSS
- Use the shared config from packages/config/tailwind.config.ts
- Color tokens: bg-background, text-foreground, bg-primary, etc. (mapped to CSS vars)
- No arbitrary values unless absolutely no Tailwind equivalent exists
- Dark mode via 'class' strategy on <html> — toggled by ThemeService
- PostCSS config lives at apps/web/postcss.config.js — Angular CLI picks it up automatically; do not move it
- `@apply` is valid inside any .scss file — PostCSS processes it after SASS compilation
- Prefer inline Tailwind classes in templates for one-off styles; use `@apply` in .scss only for multi-state patterns (hover, focus-visible, responsive variants) or shared mixins
- Shared SASS mixins with `@apply` live in apps/web/src/styles/_mixins.scss — import with `@use`
- Never use SASS variables for colors or spacing — use CSS custom properties (--background, --primary, etc.) so dark mode and theming work automatically
- Design tokens live in CSS vars on :root (in globals.scss) — not in SASS $variables

### Fastify API
- Each route plugin goes in its own file: apps/api/src/routes/<resource>.ts
- Use Fastify JSON Schema for request/response validation on every route
- Auth middleware as a Fastify plugin: apps/api/src/plugins/auth.ts
- All errors via reply.code(n).send({ error: '...' }) — no raw throw new Error
- Wrap AWS proxy calls in try/catch with a 10-second timeout

### Drizzle
- Schema lives in packages/db/src/schema/; one file per table
- Always use drizzle-kit generate then drizzle-kit migrate — never hand-write SQL migrations
- Use pgTable from drizzle-orm/pg-core
- Timestamps: always created_at and updated_at with .defaultNow().notNull()

### Testing
- Playwright: test files in apps/web/e2e/, named *.spec.ts. Use getByRole, getByLabel, getByTestId.
- Jasmine: co-located *.spec.ts alongside Angular source files.
- JEST: co-located *.test.ts in apps/api/src/. Use app.inject() for route tests.
- Coverage threshold: 80% for API; axe-core zero violations for all pages

---

## Performance rules (enforce always)

1. ChangeDetectionStrategy.OnPush on every component — no exceptions
2. NgOptimizedImage for every <img> — never raw <img src="...">
3. @defer on every below-the-fold section (skills, experience, contact)
4. Lazy-load every route except the homepage
5. No third-party scripts in <head> without async or defer
6. Fonts: self-hosted via @fontsource — no Google Fonts runtime requests
7. Initial bundle target: < 150KB gzipped (< 350KB raw) — check estimated transfer size in ng build output
8. Use track in all @for loops

## SEO rules (enforce always)

1. Every route sets Title and Meta description via SeoService
2. Canonical URL set on every page
3. Open Graph tags (og:title, og:description, og:image) on every page
4. JSON-LD structured data on homepage (Person schema) and project pages (SoftwareApplication schema)
5. All routes prerendered — no client-side-only content search engines can't index
6. robots.txt and sitemap.xml generated at build time
7. Images have descriptive alt text — never empty unless purely decorative

## Accessibility rules (enforce always)

1. All interactive elements reachable and operable by keyboard
2. Skip-to-content link as the first focusable element in <body>
3. Colour contrast ratio >= 4.5:1 for normal text, >= 3:1 for large text (both themes)
4. All form inputs have associated <label> — never use placeholder as the only label
5. Focus ring must always be visible — never outline: none without a custom focus indicator
6. Route changes announce page title to screen readers via LiveAnnouncer
7. All icons either aria-hidden="true" or have an accessible label
8. Use semantic HTML: <nav>, <main>, <article>, <section>, <header>, <footer>
9. Run axe-core in Playwright E2E on every page — zero violations policy

---

## Environment variables

### apps/web/src/environments/
```ts
// environment.ts (dev) / environment.prod.ts (prod)
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3001',
  sanityProjectId: '',
  sanityDataset: 'production',
}
```

### apps/api/.env
```
DATABASE_URL=              # Neon connection string
JWT_SECRET=                # min 64 random chars
JWT_REFRESH_SECRET=        # min 64 random chars, different from above
AWS_API_KEY=               # key for chatbot + doc-query endpoints
AWS_CHATBOT_URL=
AWS_DOC_QUERY_URL=
AWS_S3_BUCKET=
AWS_REGION=ap-southeast-2
CORS_ORIGIN=http://localhost:4200
NODE_ENV=development
```

Rules:
- Never log environment variables, even in dev
- Never commit .env* files
- Railway and Vercel/GitHub Actions hold prod/uat values

---

## Git workflow

```
main  -------------------------------->  production (CloudFront + S3)
  |
  +-- uat  -------------------------->  Vercel UAT (static)
        |
        +-- feature/your-feature   -->  PR -> uat
```

- Branch from uat for all feature work: feature/, fix/, chore/
- PRs target uat first — CodeRabbit reviews automatically
- After UAT sign-off, open a PR from uat -> main
- Commit messages follow Conventional Commits: feat:, fix:, chore:, docs:, test:, refactor:

---

## CI/CD pipelines

### ci.yml (every PR)
1. pnpm install
2. TypeScript type-check for all packages
3. ESLint + @angular-eslint on all packages
4. JEST tests (apps/api)
5. Angular unit tests (ng test --watch=false)
6. Playwright E2E with axe-core accessibility checks
7. Bundle size check — fail if initial chunk > 150KB gzipped

### deploy-uat.yml (push to uat)
1. Run CI checks
2. ng build --configuration=uat -> deploy static output to Vercel
3. Deploy Fastify to Railway uat service

### deploy-prod.yml (push to main)
1. Run CI checks
2. ng build --configuration=production -> sync dist/web/browser/ to S3
3. CloudFront invalidation /*
4. Deploy Fastify to Railway prod service

---

## Sanity content schema summary

| Type | Fields |
|------|--------|
| project | title, slug, description, tags[], techStack[], image, url, githubUrl, featured, order |
| skill | name, category (frontend/backend/devops/other), level (1-5), icon |
| workExperience | company, role, startDate, endDate, current, description, techStack[] |
| bio | name, headline, about (portable text), avatar, resumeUrl, socials[] |

---

## Common commands

```bash
# Install
pnpm install

# Dev
pnpm --filter web start       # Angular dev server on :4200
pnpm --filter api dev         # Fastify on :3001

# DB
pnpm --filter db generate     # generate migration
pnpm --filter db migrate      # run migrations against $DATABASE_URL

# Test
pnpm --filter api test        # JEST
pnpm --filter web test        # Jasmine unit tests
pnpm --filter web e2e         # Playwright

# Lint + type-check
pnpm lint                     # ESLint across all packages
pnpm typecheck                # tsc --noEmit across all packages

# Build
pnpm --filter web build       # ng build -> dist/web/browser/ (static)
pnpm --filter api build       # tsc -> dist/

# Analyse bundle
pnpm --filter web build -- --stats-json
npx webpack-bundle-analyzer dist/web/browser/stats.json
```

---

## Claude working rules

1. Always read this file at session start before touching any code.
2. Check the skill files in .claude/skills/ before implementing anything in their domain. For any .scss work, read sass-postcss.md first.
3. Never hardcode secrets — always use environment variables.
4. Never use any — define a proper type or use unknown.
5. Always OnPush — every Angular component must use ChangeDetectionStrategy.OnPush.
6. No NgModules — all Angular components, pipes, and directives are standalone.
7. All routes are lazy-loaded except the homepage shell.
8. Run pnpm typecheck and pnpm lint after every significant change and fix all errors before closing a task.
9. Write tests alongside implementation — don't defer testing.
10. Check the three pillars before opening a PR: performance (bundle size), SEO (meta tags set), accessibility (axe passes).
11. Commit message format: feat(web): add project filter component — scope is the affected package.
