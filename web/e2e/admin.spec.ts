import { test, expect } from '@playwright/test'

const SUBMISSIONS = [
  {
    id: '1',
    name: 'Alice Smith',
    email: 'alice@example.com',
    message: 'Hello, I would love to work with you!',
    createdAt: '2026-01-15T10:30:00.000Z',
  },
  {
    id: '2',
    name: 'Bob Jones',
    email: 'bob@example.com',
    message: 'Interested in a collaboration.',
    createdAt: '2026-01-14T08:00:00.000Z',
  },
]

test.describe('Admin route protection', () => {
  test('redirects unauthenticated user away from /admin', async ({ page }) => {
    await page.route(`**/auth/me`, route =>
      route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'Unauthenticated' }) })
    )
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL('/')
  })

  test('redirects user-role away from /admin', async ({ page }) => {
    await page.route(`**/auth/me`, route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'user-1', role: 'user' }) })
    )
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL('/')
  })
})

test.describe('Admin dashboard — authenticated as admin', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(`**/auth/me`, route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'admin-1', role: 'admin' }) })
    )
    await page.route(`**/api/admin/contact-submissions**`, route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], total: 0, limit: 20, offset: 0 }),
      })
    )
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')
  })

  test('renders dashboard heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  })

  test('renders Contact Submissions section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Contact Submissions' })).toBeVisible()
  })

  test('shows submission count badge', async ({ page }) => {
    await expect(page.getByText('0', { exact: true })).toBeVisible()
  })

  test('shows empty state when there are no submissions', async ({ page }) => {
    await expect(page.getByText('No submissions yet.', { exact: true })).toBeVisible()
  })

  test('does not render a list when empty', async ({ page }) => {
    await expect(page.locator('main#main-content').getByRole('list')).not.toBeAttached()
  })
})

test.describe('Admin dashboard — with contact submissions', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(`**/auth/me`, route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'admin-1', role: 'admin' }) })
    )
    await page.route(`**/api/admin/contact-submissions**`, route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: SUBMISSIONS, total: 2, limit: 20, offset: 0 }),
      })
    )
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')
  })

  test('renders each submission name', async ({ page }) => {
    await expect(page.getByText('Alice Smith', { exact: true })).toBeVisible()
    await expect(page.getByText('Bob Jones', { exact: true })).toBeVisible()
  })

  test('renders email as mailto link', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'alice@example.com' })).toHaveAttribute('href', 'mailto:alice@example.com')
  })

  test('renders submission message text', async ({ page }) => {
    await expect(page.getByText('Hello, I would love to work with you!', { exact: true })).toBeVisible()
  })

  test('renders submission count badge with correct number', async ({ page }) => {
    await expect(page.getByText('2', { exact: true })).toBeVisible()
  })

  test('does not show empty state when submissions exist', async ({ page }) => {
    await expect(page.getByText('No submissions yet.', { exact: true })).not.toBeAttached()
  })
})

test.describe('Admin dashboard — API error', () => {
  test('shows error message when submissions fail to load', async ({ page }) => {
    await page.route(`**/auth/me`, route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'admin-1', role: 'admin' }) })
    )
    await page.route(`**/api/admin/contact-submissions**`, route =>
      route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Internal error' }) })
    )
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('alert')).toContainText('Failed to load submissions')
  })
})
