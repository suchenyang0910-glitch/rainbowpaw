import { test, expect } from '@playwright/test';

test.use({
  // Simulate mobile device for Mini App tests
  viewport: { width: 375, height: 667 },
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1',
});

test.describe('Mini App Pages', () => {
  
  test('Claw Machine Page visual and interaction', async ({ page }) => {
    // 根据 main.jsx，真实路由是 /rainbowpawclaw
    await page.goto('/rainbowpawclaw');
    // 等待页面加载
    await page.waitForLoadState('networkidle');

    // 1. 验证控件、字段、文本 (机器信息、按钮)
    await expect(page.locator('text=PLAY NOW')).toBeVisible();
    await expect(page.locator('text=1x 单抽')).toBeVisible();
    
    // 2. 验证图片展示 (机器图等)
    const images = page.locator('img');
    await expect(images.first()).toBeVisible();

    // 3. 视觉回归 (样式与间距)
    await expect(page).toHaveScreenshot('miniapp-claw-page.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05
    });
  });

  test('Product/Shop Page visual and layout', async ({ page }) => {
    // 根据 main.jsx，商品页面路由为 /rainbowpaw/marketplace
    await page.goto('/rainbowpaw/marketplace');
    await page.waitForLoadState('networkidle');

    // 视觉回归: 间距、样式、商品图
    await expect(page).toHaveScreenshot('miniapp-marketplace-page.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
      mask: [page.locator('.text-lg.font-bold')] // 屏蔽可能变动的价格
    });
  });

});
