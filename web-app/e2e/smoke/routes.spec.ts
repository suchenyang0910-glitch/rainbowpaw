import { test, expect } from '@playwright/test'

test.describe('Smoke Routes', () => {
  test('admin login renders', async ({ page }) => {
    await page.goto('/console/login', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('text=管理后台登录')).toBeVisible({ timeout: 30000 })
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

