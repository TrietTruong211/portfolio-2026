import { test, expect } from '@playwright/test'

// Scope all helpers to main#main-content to avoid colliding with the footer's form
const loginForm     = (page: import('@playwright/test').Page) => page.locator('main#main-content')
const submitBtn     = (page: import('@playwright/test').Page) => loginForm(page).locator('button[type="submit"]')
const emailInput    = (page: import('@playwright/test').Page) => loginForm(page).getByLabel('Email')
const passwordInput = (page: import('@playwright/test').Page) => loginForm(page).getByLabel('Password')

test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(`**/auth/me`, route =>
      route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'Unauthenticated' }) })
    )
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
  })

  test('renders sign-in form by default', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
    await expect(emailInput(page)).toBeVisible()
    await expect(passwordInput(page)).toBeVisible()
    await expect(submitBtn(page)).toBeVisible()
  })

  test('has correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/Sign In/)
  })

  test('switches to register form when Create Account tab is clicked', async ({ page }) => {
    await page.getByRole('tab', { name: 'Create Account' }).click()
    await expect(page.getByRole('heading', { name: 'Create an account' })).toBeVisible()
    await expect(submitBtn(page)).toContainText('Create Account')
  })

  test('switching back to Sign In tab restores the heading', async ({ page }) => {
    await page.getByRole('tab', { name: 'Create Account' }).click()
    await page.getByRole('tab', { name: 'Sign In' }).click()
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
  })

  test('submit button is disabled when fields are empty', async ({ page }) => {
    await expect(submitBtn(page)).toBeDisabled()
  })

  test('submit button enables when both fields are filled', async ({ page }) => {
    await emailInput(page).fill('user@example.com')
    await passwordInput(page).fill('password123')
    await expect(submitBtn(page)).toBeEnabled()
  })

  test('shows error alert on invalid credentials', async ({ page }) => {
    await page.route(`**/auth/login`, route =>
      route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'Invalid credentials' }) })
    )
    await emailInput(page).fill('wrong@example.com')
    await passwordInput(page).fill('wrongpassword')
    await submitBtn(page).click()
    await expect(page.getByRole('alert')).toContainText('Invalid credentials')
  })

  test('shows generic error when server returns no message', async ({ page }) => {
    await page.route(`**/auth/login`, route =>
      route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({}) })
    )
    await emailInput(page).fill('user@example.com')
    await passwordInput(page).fill('password123')
    await submitBtn(page).click()
    await expect(page.getByRole('alert')).toContainText('Invalid email or password')
  })

  test('redirects to home on successful login', async ({ page }) => {
    await page.route(`**/auth/login`, route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) })
    )
    await page.route(`**/auth/me`, route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: '1', role: 'user' }) })
    )
    await emailInput(page).fill('user@example.com')
    await passwordInput(page).fill('password123')
    await submitBtn(page).click()
    await expect(page).toHaveURL('/')
  })

  test('button shows loading text while submitting', async ({ page }) => {
    await page.route(`**/auth/login`, async route => {
      await new Promise(resolve => setTimeout(resolve, 200))
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) })
    })
    await page.route(`**/auth/me`, route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: '1', role: 'user' }) })
    )
    await emailInput(page).fill('user@example.com')
    await passwordInput(page).fill('password123')
    await submitBtn(page).click()
    await expect(submitBtn(page)).toBeDisabled()
    await expect(submitBtn(page)).toContainText('Signing in')
  })

  test('back to portfolio link navigates to home', async ({ page }) => {
    await page.getByRole('link', { name: /Back to portfolio/ }).click()
    await expect(page).toHaveURL('/')
  })
})
