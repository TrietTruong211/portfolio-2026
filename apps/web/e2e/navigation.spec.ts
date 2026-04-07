import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('navigates to projects page', async ({ page }) => {
    await page.goto('/')
    await page.goto('/projects')
    await expect(page).toHaveURL('/projects')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('unknown route redirects to homepage', async ({ page }) => {
    await page.goto('/this-does-not-exist')
    await expect(page).toHaveURL('/')
  })
})
