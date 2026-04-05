import { test, expect } from '@playwright/test'

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
    const loginTitle = page.locator('text=管理后台登录')
    const dashboardTitle = page.locator('text=平台钱包概览')
    await expect(loginTitle.or(dashboardTitle)).toBeVisible({ timeout: 45000 })
  })

  test('claw page renders', async ({ page }) => {
    await page.goto('/rainbowpawclaw', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('text=PLAY NOW')).toBeVisible({ timeout: 30000 })
  })

  test('marketplace page renders', async ({ page }) => {
    await page.goto('/rainbowpaw/marketplace', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('text=纪念商城')).toBeVisible({ timeout: 30000 })
  })
})

