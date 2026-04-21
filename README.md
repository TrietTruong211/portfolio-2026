# Portfolio 2026

A personal portfolio site built as a monorepo with an Angular 18 prerendered frontend (SSG) and a standalone Fastify 5 API backend.

**Live:** [trietportfolio.site](https://trietportfolio.site)

---

## Repository structure

```
portfolio-2026/
├── web/              # Angular 18 — static prerendered output → S3 / Vercel
├── api/              # Fastify 5 — REST API → Railway
├── infra/            # Terraform — CloudFront + S3 + WAF configuration
└── .github/
    └── workflows/    # CI, deploy-uat, deploy-prod
```

---

## Architecture

```
                      ┌──────────────────────────┐
                      │    CloudFront (CDN/WAF)   │
                      │   trietportfolio.site      │
                      └────────────┬─────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                                         │
     ┌────────▼────────┐                     ┌──────────▼──────────┐
     │    S3 Bucket    │                     │  Railway (Fastify)  │
     │  Static HTML /  │                     │    REST API          │
     │  JS / CSS       │                     │  /api/*              │
     └─────────────────┘                     └──────────┬──────────┘
                                                        │
                                             ┌──────────▼──────────┐
                                             │   Neon Postgres      │
                                             │  (users, sessions,   │
                                             │   contact forms)     │
                                             └─────────────────────┘

Build time only:
  Angular prerender → @sanity/client → Sanity CMS
  (all content baked into static HTML at build time, no runtime CMS calls)
```

### Key decisions

**Static Site Generation (SSG)**  
Angular 18's `@angular/ssr` with `outputMode: 'static'` prerenders every route to static HTML at build time. The `dist/web/browser/` folder is synced directly to S3. No Node.js server runs at runtime — the entire frontend is static files served through CloudFront.

**Sanity as the content layer**  
Projects, skills, work experience, and bio live in Sanity. GROQ queries are executed once at build time via `@sanity/client`. Content is baked into the prerendered HTML — there are no CMS API calls in the browser.

**AWS proxy pattern**  
The browser never calls AWS directly. All AWS operations (chatbot, document query, S3 uploads) are proxied through the Fastify API, which holds the AWS credentials in Railway environment variables.

```
Browser → Railway API → AWS endpoint
                 ↑
         credentials live here only
```

**JWT in httpOnly cookies**  
- Access token: 15-minute expiry
- Refresh token: 7-day expiry
- Both cookies are `httpOnly`, `sameSite: strict`, `secure: true` in production
- Auth state is read via a `/auth/me` API call — the frontend never decodes JWTs client-side

**Terraform-managed infrastructure**  
CloudFront distribution, S3 origin access control, WAF ACL, and ACM certificate are all declared in `/infra` and applied by the production deploy pipeline — no manual console changes.

---

## Tech stack

### Frontend (`web/`)

| Concern | Choice |
|---|---|
| Framework | Angular 18 (standalone components, Signals) |
| Rendering | SSG via `@angular/ssr` — every route prerendered to static HTML |
| Styling | Tailwind CSS v3 + SASS (scss) + PostCSS |
| Theming | CSS custom properties on `:root`; light/dark toggle via class strategy |
| CMS client | `@sanity/client` v6 — GROQ queries at build time only |
| Icons | `lucide-angular` |
| State | Angular Signals + `inject()`-based services (no NgRx) |
| HTTP | `HttpClient` with typed generics + `toSignal()` |
| Auth UI | `AuthService` calls `/auth/me`; JWT stored in httpOnly cookie |
| Fonts | Self-hosted via `@fontsource/inter` + `@fontsource/jetbrains-mono` |
| Unit tests | Angular Testing Library + Jasmine + Karma |
| E2E tests | Playwright + `@axe-core/playwright` |
| Language | TypeScript 5.5, strict mode |

### Backend (`api/`)

| Concern | Choice |
|---|---|
| Framework | Fastify 5 |
| Plugins | `@fastify/cors`, `@fastify/cookie`, `@fastify/multipart`, `@fastify/sensible` |
| ORM | Drizzle ORM 0.38 |
| Migrations | drizzle-kit (`generate` → `migrate`) |
| Database | Neon Postgres (serverless) |
| Auth | JWT (`jsonwebtoken`) — access 15 min, refresh 7 days |
| Password hashing | bcrypt (12 rounds) |
| AWS SDK | `@aws-sdk/client-s3` |
| Tests | Jest 29 with `app.inject()` for route tests |
| Language | TypeScript 5.5, strict mode |

### Infrastructure & CI/CD

| Concern | Choice |
|---|---|
| CDN | AWS CloudFront |
| Static hosting | AWS S3 |
| WAF | AWS WAF (ACL attached to CloudFront) |
| TLS | AWS ACM certificate |
| IaC | Terraform (~1.6) |
| API hosting | Railway |
| UAT frontend | Vercel (static deploy) |
| CI/CD | GitHub Actions |
| Code review | CodeRabbit (automatic PR reviews) |
| Linting | ESLint 9 + `@typescript-eslint` + `@angular-eslint` + `eslint-plugin-playwright` |

---

## Environments

| Branch | Frontend | Backend |
|---|---|---|
| `main` | CloudFront + S3 → `trietportfolio.site` | Railway prod service |
| `uat` | Vercel (static deploy) | Railway UAT service |

---

## Local development

**Prerequisites:** Node.js 24, npm

```bash
# Install dependencies
cd web && npm install
cd ../api && npm install

# Start frontend (Angular dev server on :4200)
cd web && npm start

# Start backend (Fastify on :3001, watch mode)
cd api && npm run dev

# Database migrations
cd api && npm run db:generate   # generate migration from schema changes
cd api && npm run db:migrate    # apply migrations against $DATABASE_URL
cd api && npm run db:studio     # open Drizzle Studio
```

### Environment variables

`api/.env`:
```
DATABASE_URL=           # Neon connection string
JWT_SECRET=             # min 64 random chars
JWT_REFRESH_SECRET=     # min 64 random chars, different from above
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=
AWS_REGION=ap-southeast-2
CORS_ORIGIN=http://localhost:4200
NODE_ENV=development
```

`web/src/environments/environment.ts`:
```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3001',
  sanityProjectId: '',
  sanityDataset: 'production',
}
```

---

## Testing

```bash
# API — Jest (with coverage)
cd api && npm test

# Frontend — Jasmine unit tests
cd web && npm test

# Frontend — Playwright E2E (includes axe-core accessibility checks)
cd web && npm run e2e
```

Coverage targets: 80% for the API; zero axe-core violations on all pages.

---

## CI/CD pipelines

### `ci.yml` — every pull request
1. TypeScript type-check (`web` + `api`)
2. ESLint across both packages
3. Jest tests (`api`)
4. Angular unit tests (`web`)
5. Playwright E2E with axe-core accessibility audit
6. Bundle size check — fails if initial chunk exceeds 150 KB gzipped

### `deploy-uat.yml` — push to `uat`
1. Run CI checks
2. `ng build --configuration=uat` → deploy static output to Vercel
3. Deploy Fastify to Railway UAT service

### `deploy-prod.yml` — push to `main`
1. Run CI checks
2. `ng build --configuration=production` → bake all routes to static HTML
3. Terraform apply — reconcile CloudFront/S3/WAF/ACM configuration
4. Sync immutable assets (JS/CSS/fonts) to S3 with `max-age=31536000,immutable`
5. Sync HTML + JSON with `max-age=0,must-revalidate`
6. CloudFront invalidation `/*`
7. Deploy Fastify to Railway prod service

---

## Git workflow

```
main  ──────────────────────────────►  production
  │
  └── uat  ──────────────────────────►  Vercel UAT
        │
        └── feature/your-feature  ──►  PR → uat
```

- Branch from `uat` for all feature work: `feature/`, `fix/`, `chore/`
- PRs target `uat` first — CodeRabbit reviews automatically
- After UAT sign-off, open a PR from `uat` → `main`
- Commit messages follow Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`

---

## Sanity content schema

| Type | Key fields |
|---|---|
| `project` | `title`, `slug`, `description`, `tags[]`, `techStack[]`, `image`, `url`, `githubUrl`, `featured`, `order` |
| `skill` | `name`, `category`, `level` (1–5), `icon` |
| `workExperience` | `company`, `role`, `startDate`, `endDate`, `current`, `description`, `techStack[]` |
| `bio` | `name`, `headline`, `about` (portable text), `avatar`, `resumeUrl`, `socials[]` |
