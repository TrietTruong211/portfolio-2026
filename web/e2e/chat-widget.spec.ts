import { test, expect } from '@playwright/test'

test.describe('Chat widget', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('FAB is visible on page load', async ({ page }) => {
    const fab = page.getByRole('button', { name: "Chat with Chris's AI" })
    await expect(fab).toBeVisible()
  })

  test('opens chat panel when FAB is clicked', async ({ page }) => {
    await page.getByRole('button', { name: "Chat with Chris's AI" }).click()

    const panel = page.getByRole('dialog', { name: "Chat with Chris's AI" })
    await expect(panel).toBeVisible()
  })

  test('panel shows starter prompts before any message', async ({ page }) => {
    await page.getByRole('button', { name: "Chat with Chris's AI" }).click()

    await expect(page.getByText('Try asking:')).toBeVisible()
    await expect(
      page.getByRole('button', { name: "What technologies does Chris work with?" }),
    ).toBeVisible()
  })

  test('closes panel via close button', async ({ page }) => {
    await page.getByRole('button', { name: "Chat with Chris's AI" }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    await page.getByRole('button', { name: 'Close chat' }).first().click()
    await expect(page.getByRole('dialog')).toBeHidden()
  })

  test('closes panel via FAB toggle', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Button is covered by chat panel on mobile, so toggle behavior is disabled')
    const fab = page.getByRole('button', { name: "Chat with Chris's AI" })
    await fab.click()
    await expect(page.getByRole('dialog')).toBeVisible()

    await page.getByRole('button', { name: 'Close chat' }).last().click()
    await expect(page.getByRole('dialog')).toBeHidden()
  })

  test('send button is disabled when input is empty', async ({ page }) => {
    await page.getByRole('button', { name: "Chat with Chris's AI" }).click()

    const sendBtn = page.locator('form[aria-label="Chat input"]').getByRole('button', { name: 'Send message' })
    await expect(sendBtn).toBeDisabled()
  })

  test('send button enables when input has text', async ({ page }) => {
    await page.getByRole('button', { name: "Chat with Chris's AI" }).click()

    await page.getByLabel('Type your message').fill('Hello')
    await expect(page.locator('form[aria-label="Chat input"]').getByRole('button', { name: 'Send message' })).toBeEnabled()
  })

  test('sends message and shows user bubble', async ({ page }) => {
    await page.route('**/api/chat', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          reply: "Hi! I am Chris's AI assistant.",
          sessionId: 'test-session-id',
          flagForHuman: false,
        }),
      })
    })

    await page.getByRole('button', { name: "Chat with Chris's AI" }).click()
    await page.getByLabel('Type your message').fill('Hello')
    await page.locator('form[aria-label="Chat input"]').getByRole('button', { name: 'Send message' }).click()

    await expect(page.getByRole('dialog').getByText('Hello')).toBeVisible()
  })

  test('displays bot reply after successful API response', async ({ page }) => {
    await page.route('**/api/chat', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          reply: 'Chris is a full-stack developer.',
          sessionId: 'test-session-id',
          flagForHuman: false,
        }),
      })
    })

    await page.getByRole('button', { name: "Chat with Chris's AI" }).click()
    await page.getByLabel('Type your message').fill('Who is Chris?')
    await page.locator('form[aria-label="Chat input"]').getByRole('button', { name: 'Send message' }).click()

    await expect(page.getByText('Chris is a full-stack developer.')).toBeVisible()
  })

  test('shows error message on API failure', async ({ page }) => {
    await page.route('**/api/chat', async route => {
      await route.abort('failed')
    })

    await page.getByRole('button', { name: "Chat with Chris's AI" }).click()
    await page.getByLabel('Type your message').fill('Hello')
    await page.locator('form[aria-label="Chat input"]').getByRole('button', { name: 'Send message' }).click()

    await expect(
      page.getByText("Sorry, I'm having trouble connecting right now."),
    ).toBeVisible()
  })

  test('shows flagForHuman link when flagged', async ({ page }) => {
    await page.route('**/api/chat', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          reply: 'You should contact Chris directly.',
          sessionId: 'test-session-id',
          flagForHuman: true,
        }),
      })
    })

    await page.getByRole('button', { name: "Chat with Chris's AI" }).click()
    await page.getByLabel('Type your message').fill('Hire Chris')
    await page.locator('form[aria-label="Chat input"]').getByRole('button', { name: 'Send message' }).click()

    await expect(page.getByRole('link', { name: 'email me directly' })).toBeVisible()
  })

  test('sends message via starter prompt chip', async ({ page }) => {
    await page.route('**/api/chat', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          reply: 'Chris works with Angular, TypeScript, and more.',
          sessionId: 'test-session-id',
          flagForHuman: false,
        }),
      })
    })

    await page.getByRole('button', { name: "Chat with Chris's AI" }).click()
    await page.getByRole('button', { name: 'What technologies does Chris work with?' }).click()

    await expect(
      page.getByText('What technologies does Chris work with?'),
    ).toBeVisible()
  })

  test('input is cleared after sending', async ({ page }) => {
    await page.route('**/api/chat', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ reply: 'Hello!', sessionId: 'sid', flagForHuman: false }),
      })
    })

    await page.getByRole('button', { name: "Chat with Chris's AI" }).click()
    const input = page.getByLabel('Type your message')
    await input.fill('Test message')
    await page.locator('form[aria-label="Chat input"]').getByRole('button', { name: 'Send message' }).click()

    await expect(input).toHaveValue('')
  })

  test('input focuses when panel opens', async ({ page }) => {
    await page.getByRole('button', { name: "Chat with Chris's AI" }).click()

    const input = page.getByLabel('Type your message')
    await expect(input).toBeFocused()
  })

  test('FAB aria-expanded reflects panel state', async ({ page }) => {
    const fab = page.getByRole('button', { name: "Chat with Chris's AI" })
    await expect(fab).toHaveAttribute('aria-expanded', 'false')

    await fab.click()
    await expect(
      page.getByRole('button', { name: 'Close chat' }).last(),
    ).toHaveAttribute('aria-expanded', 'true')
  })
})
