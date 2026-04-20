import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const publicRoutes = ['/', '/projects', '/login']

for (const route of publicRoutes) {
  test(`${route} — zero axe violations`, async ({ page }) => {
    await page.route(`**/auth/me`, r =>
      r.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'Unauthenticated' }) })
    )
    await page.goto(route)
    await page.waitForLoadState('networkidle')

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()

    expect(results.violations).toEqual([])
  })
}

test('/admin — zero axe violations', async ({ page }) => {
  await page.route(`**/auth/me`, r =>
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'admin-1', role: 'admin' }) })
  )
  await page.route(`**/api/admin/contact-submissions**`, r =>
    r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [], total: 0, limit: 20, offset: 0 }),
    })
  )
  await page.goto('/admin')
  await page.waitForLoadState('networkidle')

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze()

  expect(results.violations).toEqual([])
})
