# Skill: CI/CD — GitHub Actions + CodeRabbit

## Context
Three workflows: `ci.yml` (every PR), `deploy-uat.yml` (push to `uat`), `deploy-prod.yml` (push to `main`). CodeRabbit reviews PRs automatically — no config needed beyond installing the GitHub App on the public repo.

---

## ci.yml — runs on every PR

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main, uat]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v3
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Type check
        run: pnpm typecheck

      - name: Lint
        run: pnpm lint

      - name: JEST (API)
        run: pnpm --filter api test --coverage
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
          JWT_SECRET: ${{ secrets.JWT_SECRET }}
          JWT_REFRESH_SECRET: ${{ secrets.JWT_REFRESH_SECRET }}

      - name: Build web (smoke check)
        run: pnpm --filter web build
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.UAT_API_URL }}
          NEXT_PUBLIC_SANITY_PROJECT_ID: ${{ secrets.SANITY_PROJECT_ID }}
          NEXT_PUBLIC_SANITY_DATASET: production

      - name: Install Playwright browsers
        run: pnpm --filter web exec playwright install --with-deps chromium

      - name: Playwright E2E
        run: pnpm --filter web e2e --project=chromium
        env:
          E2E_BASE_URL: http://localhost:3000  # served from build output

      - name: Upload Playwright report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report-${{ github.run_id }}
          path: apps/web/playwright-report/
          retention-days: 7
```

---

## deploy-uat.yml — push to `uat`

```yaml
# .github/workflows/deploy-uat.yml
name: Deploy UAT

on:
  push:
    branches: [uat]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: uat
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v3
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - name: Deploy API to Railway (UAT)
        uses: bervProject/railway-deploy@main
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: ${{ secrets.RAILWAY_UAT_SERVICE_ID }}

      - name: Build Next.js
        run: pnpm --filter web build
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.UAT_API_URL }}
          NEXT_PUBLIC_SANITY_PROJECT_ID: ${{ secrets.SANITY_PROJECT_ID }}
          NEXT_PUBLIC_SANITY_DATASET: production
          SANITY_API_TOKEN: ${{ secrets.SANITY_API_TOKEN }}

      - name: Deploy to Vercel (UAT)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: apps/web
```

---

## deploy-prod.yml — push to `main`

```yaml
# .github/workflows/deploy-prod.yml
name: Deploy Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v3
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - name: Deploy API to Railway (Prod)
        uses: bervProject/railway-deploy@main
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: ${{ secrets.RAILWAY_PROD_SERVICE_ID }}

      - name: Build Next.js (static export)
        run: pnpm --filter web build
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.PROD_API_URL }}
          NEXT_PUBLIC_SANITY_PROJECT_ID: ${{ secrets.SANITY_PROJECT_ID }}
          NEXT_PUBLIC_SANITY_DATASET: production
          SANITY_API_TOKEN: ${{ secrets.SANITY_API_TOKEN }}

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-southeast-2

      - name: Sync to S3
        run: |
          aws s3 sync apps/web/out s3://${{ secrets.S3_BUCKET }} \
            --delete \
            --cache-control "public,max-age=31536000,immutable" \
            --exclude "*.html" \
            --exclude "*.json"
          aws s3 sync apps/web/out s3://${{ secrets.S3_BUCKET }} \
            --delete \
            --cache-control "public,max-age=0,must-revalidate" \
            --include "*.html" \
            --include "*.json"

      - name: Invalidate CloudFront
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/*"
```

Note the two-pass S3 sync strategy: immutable cache for hashed assets (JS/CSS), no-cache for HTML and JSON (so CloudFront always serves fresh routing files).

---

## CodeRabbit setup

CodeRabbit requires zero config for public repos — just install the GitHub App from `coderabbit.ai`. It posts review comments automatically on every PR. Optionally add a config file for custom rules:

```yaml
# .coderabbit.yaml
language: en-US
reviews:
  profile: assertive
  request_changes_workflow: true
  high_level_summary: true
  poem: false
  review_status: true
  collapse_walkthrough: false
  path_filters:
    - '!**/*.lock'
    - '!**/migrations/**'
  auto_review:
    enabled: true
    drafts: false
```

---

## Required GitHub secrets

| Secret | Used in |
|--------|---------|
| `TEST_DATABASE_URL` | CI — JEST DB |
| `JWT_SECRET` | CI, UAT, Prod |
| `JWT_REFRESH_SECRET` | CI, UAT, Prod |
| `UAT_API_URL` | UAT deploy |
| `PROD_API_URL` | Prod deploy |
| `SANITY_PROJECT_ID` | All |
| `SANITY_API_TOKEN` | UAT + Prod builds |
| `RAILWAY_TOKEN` | UAT + Prod deploys |
| `RAILWAY_UAT_SERVICE_ID` | UAT |
| `RAILWAY_PROD_SERVICE_ID` | Prod |
| `VERCEL_TOKEN` | UAT |
| `VERCEL_ORG_ID` | UAT |
| `VERCEL_PROJECT_ID` | UAT |
| `AWS_ACCESS_KEY_ID` | Prod |
| `AWS_SECRET_ACCESS_KEY` | Prod |
| `S3_BUCKET` | Prod |
| `CLOUDFRONT_DISTRIBUTION_ID` | Prod |

Store all secrets in GitHub → Settings → Secrets and variables → Actions. Use separate Environments (`uat`, `production`) for environment-specific protection rules.
