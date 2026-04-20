import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('renders h1 heading', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('skip link is first focusable element', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Tab key not available on mobile')
    await page.keyboard.press('Tab')
    await expect(page.getByText('Skip to main content', { exact: true })).toBeFocused()
  })

  test('page has a title', async ({ page }) => {
    await expect(page).toHaveTitle(/Chris/)
  })
})
