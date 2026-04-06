# Skill: Git workflow

## Branch strategy

```
main   ──────────────────────────────── production (CloudFront + S3)
  │
  └── uat ────────────────────────────── UAT (Vercel)
        │
        └── feature/<name>
        └── fix/<name>
        └── chore/<name>
```

**Rules:**
- Always branch from `uat`, not `main`
- PRs always target `uat` first
- `uat` → `main` merges happen after UAT sign-off
- Never push directly to `main` or `uat` (use branch protection)
- Delete branches after merging

---

## Commit message format

Follow Conventional Commits: `<type>(<scope>): <description>`

**Types:**
- `feat` — new feature
- `fix` — bug fix
- `chore` — tooling, config, deps (no production code change)
- `docs` — documentation only
- `test` — adding or fixing tests
- `refactor` — refactor without behaviour change
- `style` — formatting, whitespace

**Scopes** (use the affected package):
- `web` — apps/web
- `api` — apps/api
- `db` — packages/db
- `types` — packages/types
- `config` — packages/config
- `ci` — GitHub Actions

**Examples:**
```
feat(web): add project filter by tech stack
fix(api): handle AWS timeout with 502 response
chore(db): add missing updated_at to users table
test(api): add auth route JEST coverage
refactor(web): extract ProjectCard to ui/ folder
docs(ci): document required GitHub secrets
```

---

## PR checklist

Before opening a PR:
- [ ] `pnpm typecheck` — zero errors
- [ ] `pnpm lint` — zero errors
- [ ] `pnpm --filter api test` — all tests pass
- [ ] `pnpm --filter web build` — static export succeeds
- [ ] No `.env` files staged
- [ ] No `console.log` left in production code
- [ ] New feature has at least one test
- [ ] PR description explains *what* and *why*, not just *what*

---

## Branch protection settings (GitHub)

Configure for both `main` and `uat`:
- Require pull request before merging
- Require 1 approval (yourself for solo — or CodeRabbit counts)
- Require status checks: `CI / ci` must pass
- Require branches to be up to date before merging
- Do not allow bypassing the above settings

---

## .gitignore additions

```gitignore
# Env files
.env
.env.local
.env.*.local

# Next.js
apps/web/.next/
apps/web/out/

# Build output
apps/api/dist/
packages/*/dist/

# Test artifacts
apps/web/playwright-report/
apps/web/test-results/
coverage/

# Misc
.DS_Store
*.tsbuildinfo
```
