import { test, expect } from '@playwright/test';

test.describe('Mini App - Claw Machine Page', () => {
  test.beforeEach(async ({ page }) => {
    // 假设可以通过携带 tgAuth / tgWebAppStartParam 访问抓娃娃 Mini App 页面
    await page.goto('/miniapp/claw?test_mode=1');
    // 等待页面主要加载完毕
    await page.waitForLoadState('networkidle');
  });

  test('should display Claw machine UI, fields, text, and styles correctly', async ({ page }) => {
    // 1. 验证控件和文本 (如 Play 按钮、奖池信息等)
    // 假设有 play button
    const playButton = page.locator('button', { hasText: /Play|Catch|开始/i }).first();
    await expect(playButton).toBeVisible();

    // 2. 验证样式与图片展示 (视觉回归测试)
    // Mini App 的图片和样式间距是核心测试对象
    await expect(page).toHaveScreenshot('miniapp-claw-layout.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05
    });
  });
});
