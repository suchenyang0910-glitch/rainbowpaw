import { test, expect } from '@playwright/test'

async function expectNoViteErrorOverlay(page) {
  await expect(page.locator('vite-error-overlay')).toHaveCount(0)
}

test.describe('Smoke Routes', () => {
  test('admin login renders', async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.clear()
        sessionStorage.clear()
      } catch {}
    })

    let retries = 3;
    let isLoaded = false;
    while (retries > 0 && !isLoaded) {
      try {
        await page.goto('/console/login', { waitUntil: 'domcontentloaded' })
        await expectNoViteErrorOverlay(page)

        const loginTitle = page.locator('text=管理后台登录')
        if (await loginTitle.count()) {
          await expect(loginTitle.first()).toBeVisible({ timeout: 5000 })
          isLoaded = true;
          return
        }

        const dashboardTitle = page.locator('text=平台钱包概览')
        await expect(dashboardTitle.first()).toBeVisible({ timeout: 5000 })
        isLoaded = true;
      } catch (err: any) {
        console.log(`Retry loading admin login due to error:`, err.message);
        retries--;
        await page.waitForTimeout(2000);
      }
    }
    if (!isLoaded) {
      throw new Error(`Failed to load admin login after retries`);
    }
  })

  test('claw page renders', async ({ page }) => {
    let retries = 3;
    let isLoaded = false;
    while (retries > 0 && !isLoaded) {
      try {
        await page.goto('/rainbowpawclaw', { waitUntil: 'domcontentloaded' })
        await expectNoViteErrorOverlay(page)

        const primaryCta = page.getByRole('button').filter({ hasText: /play|单抽|抽/i }).first()
        await expect(primaryCta).toBeVisible({ timeout: 5000 })
        isLoaded = true;
      } catch (err: any) {
        console.log(`Retry loading claw page due to error:`, err.message);
        retries--;
        await page.waitForTimeout(2000);
      }
    }
    if (!isLoaded) {
      throw new Error(`Failed to load claw page after retries`);
    }
  })

  test('marketplace page renders', async ({ page }) => {
    let retries = 3;
    let isLoaded = false;
    while (retries > 0 && !isLoaded) {
      try {
        await page.goto('/rainbowpaw/marketplace', { waitUntil: 'domcontentloaded' })
        await expectNoViteErrorOverlay(page)
        
        const title = page.locator('text=纪念商城')
        if (await title.count()) {
          await expect(title.first()).toBeVisible({ timeout: 5000 })
          isLoaded = true;
          return
        }

        // Fallback element check
        const cartIcon = page.locator('svg.lucide-shopping-cart').first()
        await expect(cartIcon).toBeVisible({ timeout: 5000 })
        isLoaded = true;
      } catch (err: any) {
        console.log(`Retry loading marketplace due to error:`, err.message);
        retries--;
        await page.waitForTimeout(2000);
      }
    }
    
    if (!isLoaded) {
      throw new Error(`Failed to load marketplace after retries`);
    }
  })
})
