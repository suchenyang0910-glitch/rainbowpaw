import { test, expect, type Page } from '@playwright/test'

async function expectNoViteErrorOverlay(page: Page) {
  await expect(page.locator('vite-error-overlay')).toHaveCount(0)
}

test.describe('Smoke Routes', () => {
  test('admin login renders', async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.clear()
        sessionStorage.clear()
      } catch {
      }
    })

    await page.goto('/console/login', { waitUntil: 'domcontentloaded' })
    await expectNoViteErrorOverlay(page)

    const loginTitle = page.locator('text=管理后台登录')
    if (await loginTitle.count()) {
      await expect(loginTitle.first()).toBeVisible({ timeout: 45000 })
      return
    }

    const dashboardTitle = page.locator('text=平台钱包概览')
    await expect(dashboardTitle.first()).toBeVisible({ timeout: 45000 })
  })

  test('claw page renders', async ({ page }) => {
    await page.goto('/rainbowpawclaw', { waitUntil: 'domcontentloaded' })
    await expectNoViteErrorOverlay(page)

    const primaryCta = page.getByRole('button').filter({ hasText: /play|单抽|抽/i }).first()
    await expect(primaryCta).toBeVisible({ timeout: 45000 })
  })

  test('marketplace page renders', async ({ page }) => {
    await page.goto('/rainbowpaw/marketplace', { waitUntil: 'domcontentloaded' })
    await expectNoViteErrorOverlay(page)

    const title = page.locator('h1.section-title')
    if (await title.count()) {
      await expect(title.first()).toBeVisible({ timeout: 45000 })
      return
    }

    const cartLink = page.locator('a:has-text("购物车")')
    await expect(cartLink.first()).toBeVisible({ timeout: 45000 })
  })
})

