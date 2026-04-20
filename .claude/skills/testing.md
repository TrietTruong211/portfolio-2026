# Skill: Testing -- Playwright + Jasmine (Angular)

## Context
Two test layers: Playwright for E2E and accessibility (axe-core), Jasmine for Angular unit tests. Both run in CI on every PR. Zero axe violations is a hard requirement.

---

## Playwright (E2E + Accessibility)

### Config
```ts
// web/playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : undefined,
  reporter: process.env['CI'] ? 'github' : 'html',
  use: {
    baseURL: process.env['E2E_BASE_URL'] ?? 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile',   use: { ...devices['iPhone 14'] } },
  ],
  webServer: process.env['CI'] ? undefined : {
    command: 'pnpm --filter web start',
    url: 'http://localhost:4200',
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
```

If you need tests to run only on one project, use `test.use({ viewport })` inside the
describe block rather than `grep`/`grepInvert` at the project level — it keeps
desktop-only and mobile-only groups in the same spec file without needing prefixed names.

---

### Angular readiness wait — REQUIRED after every goto

Angular uses `<script type="module">` which executes **after** the `load` event fires.
`waitUntil: 'load'` (default) is NOT sufficient — Angular may not have bootstrapped yet.

**Always** do this after navigating:
```ts
await page.goto('/some-route')
await page.waitForLoadState('networkidle')
```

`networkidle` waits until there are no network connections for 500 ms. This covers:
- Angular bootstrap completing
- `APP_INITIALIZER` HTTP calls (e.g. `auth/me`)
- Lazy chunk loading triggered by `PreloadAllModules`
- Any component `ngOnInit` HTTP calls (e.g. `loadSubmissions`)

ESLint: add `'playwright/no-networkidle': 'off'` to the e2e block in `eslint.config.js`
so the `no-networkidle` rule doesn't fire.

---

### API route mocking — always use ** glob, never hardcode the host

The Angular app calls `http://localhost:3001/auth/me` (the API origin), but Playwright
tests run with the dev server on `http://localhost:4200`. Using a hardcoded host in
`page.route()` means the mock is set for the wrong origin.

**Correct pattern — glob that matches any host:**
```ts
await page.route(`**/auth/me`, route =>
  route.fulfill({ status: 401, contentType: 'application/json',
    body: JSON.stringify({ error: 'Unauthenticated' }) })
)
```

`**` matches any prefix including `http://localhost:3001`, so the mock always fires.

To match paths with optional query strings append `**`:
```ts
await page.route(`**/api/admin/contact-submissions**`, route => ...)
```

---

### Scoping locators — the footer collision problem

`<app-footer>` renders on **every** page. It contains:
- A contact form with `<label>Email</label>`, `<label>Name</label>`, a `<button type="submit">`
- Social links inside `<ul>` elements

This means unscoped locators silently match footer elements and cause strict-mode
violations (multiple elements matched → Playwright throws).

**Always scope to `main#main-content`** when the target is inside the router outlet:
```ts
// ✗ matches login form AND footer form → strict-mode violation
page.getByLabel('Email')
page.locator('button[type="submit"]')
page.getByRole('list')

// ✓ scoped to the router outlet, footer excluded
page.locator('main#main-content').getByLabel('Email')
page.locator('main#main-content').locator('button[type="submit"]')
page.locator('main#main-content').getByRole('list')
```

Recommended: define helpers at the top of each spec file:
```ts
const main        = (page: Page) => page.locator('main#main-content')
const submitBtn   = (page: Page) => main(page).locator('button[type="submit"]')
const emailInput  = (page: Page) => main(page).getByLabel('Email')
const passInput   = (page: Page) => main(page).getByLabel('Password')
```

Note: there are two `<main>` elements in the DOM when the login component is active
(the app shell's `<main id="main-content">` and the login component's own `<main>`).
`main#main-content` selects the outer shell one; both contain the form inputs and
neither contains the footer, so the scope is correct.

---

### `getByText` — always use `{ exact: true }` for short or numeric strings

`getByText(text)` defaults to `exact: false`, which means **substring matching on all
elements in the DOM tree**, including ancestors. An ancestor `<li>` / `<div>` / `<main>`
whose combined text *contains* "Alice Smith" or "0" also matches, producing multiple
elements and a strict-mode failure.

**Rule:** use `{ exact: true }` so only the element whose entire text equals the string
matches (ancestors won't match because their text is longer):
```ts
// ✗ matches <p>, <li>, <section>, <main>… → strict-mode violation
page.getByText('Alice Smith')
page.getByText('0')

// ✓ matches only the leaf element whose full text is exactly that string
page.getByText('Alice Smith', { exact: true })
page.getByText('0', { exact: true })
```

For long, unique sentences (e.g. 'No submissions yet.') the risk is lower but apply
`{ exact: true }` consistently anyway.

---

### `not.toBeVisible()` vs `not.toBeAttached()` for conditional blocks

Angular `@if` blocks **remove** elements from the DOM entirely (they are not just hidden).

- `not.toBeVisible()` can flake — it requires the element to exist in the DOM first,
  then checks visibility. If the element is absent it waits until timeout.
- `not.toBeAttached()` asserts the element is not in the DOM at all — correct for `@if`.

```ts
// ✗ flaky for @if-rendered elements
await expect(page.locator('ul[role="list"]')).not.toBeVisible()

// ✓ precise
await expect(page.locator('main#main-content').getByRole('list')).not.toBeAttached()
await expect(page.getByText('No submissions yet.', { exact: true })).not.toBeAttached()
```

---

### `page.waitForTimeout` must NOT be used inside route handlers

Calling `page.waitForTimeout()` inside a `page.route()` callback deadlocks — the page
is blocked waiting for the route to fulfill while the route waits on the page.

```ts
// ✗ deadlock
await page.route(`**/auth/login`, async route => {
  await page.waitForTimeout(200)
  await route.fulfill({ ... })
})

// ✓ pure Node.js timer, no page involvement
await page.route(`**/auth/login`, async route => {
  await new Promise(resolve => setTimeout(resolve, 200))
  await route.fulfill({ ... })
})
```

---

### Retrying flaky interactions (Angular hydration window)

Angular's `provideClientHydration()` briefly reconciles the server-rendered DOM with
the client state. During this window, Angular may re-attach directives and signals,
causing interactions to fail transiently.

Use `expect(async () => { ... }).toPass({ timeout })` to retry the entire
click-and-assert sequence:
```ts
async function openDrawer(page: Page): Promise<void> {
  await expect(async () => {
    await page.getByRole('button', { name: 'Toggle navigation menu' }).click()
    await expect(page.getByRole('dialog', { name: 'Navigation menu' })).toBeVisible()
  }).toPass({ timeout: 10_000 })
}
```

Then inside each test that relies on the drawer being open:
```ts
const drawer = page.getByRole('dialog', { name: 'Navigation menu' })
await drawer.waitFor({ state: 'visible' })  // re-confirm inside the test
await drawer.getByRole('link', { name: 'About' }).click()
```

---

### Selector priority (unchanged)

1. `getByRole` — semantic, accessible
2. `getByLabel` — form fields (scoped to `main#main-content`)
3. `getByTestId` — for `data-testid` attributes on key elements
4. `getByText` — with `{ exact: true }` always
5. **Never** `locator('.css-class')` as primary selector

---

### Viewport-specific describe blocks

For tests that only make sense on one viewport, use `test.use` inside the describe:
```ts
test.describe('Mobile — hamburger', () => {
  test.use({ viewport: { width: 390, height: 844 } })
  // ...
})

test.describe('Desktop — nav links', () => {
  test.use({ viewport: { width: 1280, height: 800 } })
  // ...
})
```

Both groups can live in the same spec file and run on both Playwright projects —
`test.use` overrides the project viewport for that describe block.

---

### Accessibility tests (axe-core)

```ts
// e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const routes = ['/', '/projects', '/login']

for (const route of routes) {
  test(`${route} — zero axe violations`, async ({ page }) => {
    await page.route(`**/auth/me`, route =>
      route.fulfill({ status: 401, contentType: 'application/json',
        body: JSON.stringify({ error: 'Unauthenticated' }) })
    )
    await page.goto(route)
    await page.waitForLoadState('networkidle')

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()

    expect(results.violations).toEqual([])
  })
}
```

Install: `pnpm --filter web add -D @axe-core/playwright`

---

## Jasmine (Angular Unit Tests)

### Config
```ts
// Use ng test --watch=false --code-coverage for CI
```

### Component test pattern

```ts
// src/app/shared/components/project-card/project-card.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { By } from '@angular/platform-browser'
import { ProjectCardComponent } from './project-card.component'
import type { Project } from '@portfolio/types'

const mockProject: Project = {
  title: 'Test App',
  slug: 'test-app',
  description: 'A test project description',
  tags: ['Angular', 'TypeScript'],
  techStack: ['Angular', 'Fastify'],
  image: null,
  url: 'https://example.com',
  githubUrl: 'https://github.com/example',
  featured: false,
  order: 1,
}

describe('ProjectCardComponent', () => {
  let fixture: ComponentFixture<ProjectCardComponent>
  let component: ProjectCardComponent

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectCardComponent],
    }).compileComponents()

    fixture = TestBed.createComponent(ProjectCardComponent)
    component = fixture.componentInstance
    fixture.componentRef.setInput('project', mockProject)
    fixture.detectChanges()
  })

  it('renders the project title in an h3', () => {
    const h3 = fixture.debugElement.query(By.css('h3'))
    expect(h3.nativeElement.textContent).toContain('Test App')
  })

  it('renders all tags', () => {
    const tags = fixture.debugElement.queryAll(By.css('[class*="rounded-full"]'))
    expect(tags.length).toBe(2)
  })

  it('has accessible article label', () => {
    const article = fixture.debugElement.query(By.css('article'))
    expect(article.nativeElement.getAttribute('aria-label')).toBe('Test App')
  })
})
```

### Service test pattern (with Signals)

```ts
import { TestBed } from '@angular/core/testing'
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'
import { AuthService } from './auth.service'

describe('AuthService', () => {
  let service: AuthService
  let http: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] })
    service = TestBed.inject(AuthService)
    http = TestBed.inject(HttpTestingController)
  })

  afterEach(() => http.verify())

  it('starts unauthenticated', () => {
    expect(service.isAuthenticated()).toBeFalse()
  })

  it('sets user on successful checkSession', async () => {
    const check = service.checkSession()
    http.expectOne('/auth/me').flush({ id: 'abc', role: 'admin' })
    await check
    expect(service.isAuthenticated()).toBeTrue()
  })
})
```

---

## JEST (API)

Use `app.inject()` for all route tests. See fastify.md for full patterns.

---

## CI integration

```yaml
- name: Angular unit tests
  run: pnpm --filter web test -- --watch=false --code-coverage --browsers=ChromeHeadless

- name: Install Playwright
  run: pnpm --filter web exec playwright install --with-deps chromium

- name: Playwright E2E + axe
  run: pnpm --filter web e2e --project=chromium
  env:
    E2E_BASE_URL: http://localhost:4200

- name: Upload Playwright report
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: playwright-report-${{ github.run_id }}
    path: web/playwright-report/
    retention-days: 7
```
