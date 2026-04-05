import { test, expect } from '@playwright/test';

test.use({
  // Simulate mobile device for Mini App tests
  viewport: { width: 375, height: 667 },
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1',
});

test.describe('Mini App Pages', () => {
  
  test('Claw Machine Page visual and interaction', async ({ page }) => {
    // Handle ERR_NETWORK_CHANGED which might occur on some environments
    let retries = 3;
    let isLoaded = false;
    while (retries > 0 && !isLoaded) {
      try {
        await page.goto('/rainbowpawclaw', { waitUntil: 'domcontentloaded' });
        await expect(page.locator('text=PLAY NOW')).toBeVisible({ timeout: 5000 });
        isLoaded = true;
      } catch (err: any) {
        console.log('Retry loading page due to error:', err.message);
        retries--;
        await page.waitForTimeout(2000);
      }
    }
    
    if (!isLoaded) {
      throw new Error('Failed to load claw machine page after retries');
    }

    await expect(page.locator('text=1x 单抽')).toBeVisible({ timeout: 15000 });

    // 2. 视觉回归 (样式与间距)
    await expect(page).toHaveScreenshot('miniapp-claw-page.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05
    });
  });

  test('Product/Shop Page visual and layout', async ({ page }) => {
    // Handle ERR_NETWORK_CHANGED which might occur on some environments
    let retries = 3;
    let isLoaded = false;
    while (retries > 0 && !isLoaded) {
      try {
        await page.goto('/rainbowpaw/marketplace', { waitUntil: 'domcontentloaded' });
        await expect(page.locator('text=纪念商城')).toBeVisible({ timeout: 5000 });
        isLoaded = true;
      } catch (err: any) {
        console.log('Retry loading page due to error:', err.message);
        retries--;
        await page.waitForTimeout(2000);
      }
    }
    
    if (!isLoaded) {
      throw new Error('Failed to load marketplace page after retries');
    }

    // 视觉回归: 间距、样式、商品图
    await expect(page).toHaveScreenshot('miniapp-marketplace-page.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
      mask: [page.locator('.text-lg.font-bold')] // 屏蔽可能变动的价格
    });
  });

});
