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

## /db-reset
Usage: /db-reset (UAT only -- never production)

```bash
pnpm --filter db generate
pnpm --filter db migrate
```
