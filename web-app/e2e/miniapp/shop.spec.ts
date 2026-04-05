import { test, expect } from '@playwright/test';

test.describe('Mini App - Shop/Product Page', () => {
  test.beforeEach(async ({ page }) => {
    // 假设这是商品或商店页面
    await page.goto('/miniapp/shop?test_mode=1');
    await page.waitForLoadState('networkidle');
  });

  test('should display product list UI, fields, text, and styles correctly', async ({ page }) => {
    // 1. 验证控件、字段、文本 (如商品名称、价格、购买按钮)
    const firstProduct = page.locator('.product-item, [data-testid="product-card"]').first();
    // 假设商品卡片上会有价格标签等
    await expect(firstProduct).toBeVisible();

    // 2. 验证样式与图片展示 (视觉回归测试)
    await expect(page).toHaveScreenshot('miniapp-shop-layout.png', {
      fullPage: true,
      mask: [page.locator('.product-image')], // 如果商品图随机，可以mask掉
      maxDiffPixelRatio: 0.05
    });
  });
});
