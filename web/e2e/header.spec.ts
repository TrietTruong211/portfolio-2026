import { test, expect } from '@playwright/test'


function mockUnauthenticated({ page }: { page: import('@playwright/test').Page }) {
  return page.route(`**/auth/me`, route =>
    route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'Unauthenticated' }) })
  )
}

function mockAdmin({ page }: { page: import('@playwright/test').Page }) {
  return page.route(`**/auth/me`, route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'admin-1', role: 'admin' }) })
  )
}

function mockUser({ page }: { page: import('@playwright/test').Page }) {
  return page.route(`**/auth/me`, route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'user-1', role: 'user' }) })
  )
}

async function openDrawer(page: import('@playwright/test').Page): Promise<void> {
  await expect(async () => {
    const toggleButton = page.getByRole('button', { name: 'Toggle navigation menu' })
    await toggleButton.click()
    await expect(page.getByRole('dialog', { name: 'Navigation menu' })).toBeVisible()
  }).toPass({ timeout: 10000 })
}

// ─── Desktop nav links ────────────────────────────────────────────────────────

test.describe('Desktop — nav links from homepage', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test.beforeEach(async ({ page }) => {
    await mockUnauthenticated({ page })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('About link reaches /#about', async ({ page }) => {
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'About' }).click()
    await expect(page).toHaveURL('/#about')
  })

  test('Works link reaches /#works', async ({ page }) => {
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Works' }).click()
    await expect(page).toHaveURL('/#works')
  })

  test('Experience link reaches /#experience', async ({ page }) => {
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Experience' }).click()
    await expect(page).toHaveURL('/#experience')
  })

  test('Contact link reaches /#contact', async ({ page }) => {
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Contact' }).click()
    await expect(page).toHaveURL('/#contact')
  })
})

test.describe('Desktop — nav links from /login', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test.beforeEach(async ({ page }) => {
    await mockUnauthenticated({ page })
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
  })

  test('About link navigates from /login to /#about', async ({ page }) => {
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'About' }).click()
    await expect(page).toHaveURL('/#about')
  })

  test('Works link navigates from /login to /#works', async ({ page }) => {
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Works' }).click()
    await expect(page).toHaveURL('/#works')
  })

  test('Experience link navigates from /login to /#experience', async ({ page }) => {
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Experience' }).click()
    await expect(page).toHaveURL('/#experience')
  })

  test('Contact link navigates from /login to /#contact', async ({ page }) => {
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Contact' }).click()
    await expect(page).toHaveURL('/#contact')
  })
})

test.describe('Mobile - hamburger visibility', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('hamburger is visible on mobile', async ({ page }) => {
    await mockUnauthenticated({ page })
    await page.goto('/', { waitUntil: 'load' })
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('button', { name: 'Toggle navigation menu' })).toBeVisible()
  })
})

test.describe('Desktop - hamburger visibility', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('hamburger is hidden on desktop', async ({ page }) => {
    await mockUnauthenticated({ page })
    await page.goto('/', { waitUntil: 'load' })
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('button', { name: 'Toggle navigation menu' })).toBeHidden()
  })
})

// ─── Mobile nav links (via hamburger) ────────────────────────────────────────

test.describe('Mobile — nav links via hamburger from homepage', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test.beforeEach(async ({ page }) => {
    await mockUnauthenticated({ page })
    await page.goto('/', { waitUntil: 'load' })
    await page.waitForLoadState('networkidle')
    await openDrawer(page)
  })

  for (const { label, fragment } of [
    { label: 'About',      fragment: '#about' },
    { label: 'Works',      fragment: '#works' },
    { label: 'Experience', fragment: '#experience' },
    { label: 'Contact',    fragment: '#contact' },
  ]) {
    test(`${label} link reaches /${fragment}`, async ({ page }) => {
      const drawer = page.getByRole('dialog', { name: 'Navigation menu' })
      await drawer.waitFor({ state: 'visible' })
      await drawer.getByRole('link', { name: label }).click()
      await expect(page).toHaveURL(`/${fragment}`)
    })
  }
})

test.describe('Mobile — nav links via hamburger from /login', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test.beforeEach(async ({ page }) => {
    await mockUnauthenticated({ page })
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await openDrawer(page)
  })

  for (const { label, fragment } of [
    { label: 'About',      fragment: '#about' },
    { label: 'Works',      fragment: '#works' },
    { label: 'Experience', fragment: '#experience' },
    { label: 'Contact',    fragment: '#contact' },
  ]) {
    test(`${label} link navigates from /login to /${fragment}`, async ({ page }) => {
      const drawer = page.getByRole('dialog', { name: 'Navigation menu' })
      await drawer.waitFor({ state: 'visible' })
      await drawer.getByRole('link', { name: label }).click()
      await expect(page).toHaveURL(`/${fragment}`)
    })
  }
})

// ─── Desktop auth controls ────────────────────────────────────────────────────

test.describe('Desktop — auth controls unauthenticated', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test.beforeEach(async ({ page }) => {
    await mockUnauthenticated({ page })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('shows Sign in link', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible()
  })

  test('Sign in link navigates to /login', async ({ page }) => {
    await page.getByRole('link', { name: 'Sign in' }).click()
    await expect(page).toHaveURL('/login')
  })

  test('does not show Dashboard link', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Dashboard' })).not.toBeVisible()
  })

  test('does not show Sign out button', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Sign out' })).not.toBeVisible()
  })
})

test.describe('Desktop — auth controls admin', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test.beforeEach(async ({ page }) => {
    await mockAdmin({ page })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('shows Dashboard link', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible()
  })

  test('shows Sign out button', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible()
  })

  test('does not show Sign in link', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Sign in' })).not.toBeVisible()
  })

  test('Dashboard link navigates to /admin', async ({ page }) => {
    await page.route(`**/api/admin/contact-submissions**`, route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [], total: 0, limit: 20, offset: 0 }) })
    )
    await page.getByRole('link', { name: 'Dashboard' }).click()
    await expect(page).toHaveURL('/admin')
  })
})

test.describe('Desktop — auth controls regular user', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test.beforeEach(async ({ page }) => {
    await mockUser({ page })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('does not show Dashboard link', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Dashboard' })).not.toBeVisible()
  })

  test('shows Sign out button', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible()
  })
})

// ─── Mobile auth controls (via hamburger) ────────────────────────────────────

test.describe('Mobile — auth controls unauthenticated', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test.beforeEach(async ({ page }) => {
    await mockUnauthenticated({ page })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await openDrawer(page)
  })

  test('shows Sign in link in drawer', async ({ page }) => {
    await expect(page.getByRole('dialog', { name: 'Navigation menu' }).getByRole('link', { name: 'Sign in' })).toBeVisible()
  })

  test('does not show Dashboard link in drawer', async ({ page }) => {
    await expect(page.getByRole('dialog', { name: 'Navigation menu' }).getByRole('link', { name: 'Dashboard' })).toBeHidden()
  })
})

test.describe('Mobile — auth controls admin', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test.beforeEach(async ({ page }) => {
    await mockAdmin({ page })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await openDrawer(page)
  })

  test('shows Dashboard link in drawer', async ({ page }) => {
    await expect(page.getByRole('dialog', { name: 'Navigation menu' }).getByRole('link', { name: 'Dashboard' })).toBeVisible()
  })

  test('shows Sign out button in drawer', async ({ page }) => {
    await expect(page.getByRole('dialog', { name: 'Navigation menu' }).getByRole('button', { name: 'Sign out' })).toBeVisible()
  })

  test('does not show Sign in link in drawer', async ({ page }) => {
    await expect(page.getByRole('dialog', { name: 'Navigation menu' }).getByRole('link', { name: 'Sign in' })).toBeHidden()
  })
})
