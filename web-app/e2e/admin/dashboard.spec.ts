import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
    
    await page.goto('/console/login');
    // 等待页面加载完成，确保不是白屏
    await page.waitForSelector('text=管理后台登录', { timeout: 15000 });
    // 使用更明确的选择器
    await page.locator('.ant-select').click();
    // 选择 super_admin
    await page.locator('.ant-select-item-option[title="super_admin"]').click();
    // 点击登录
    await page.locator('button[type="submit"]').click();
    // Wait for redirect to dashboard
    await page.waitForURL('**/console/dashboard');
  });

  test('should display dashboard correctly and match visual standards', async ({ page }) => {
    // 1. 验证关键元素存在 (页面上的控件、字段、文本)
    await expect(page.locator('text=平台钱包概览')).toBeVisible();
    await expect(page.locator('text=今日核心指标')).toBeVisible();
    await expect(page.locator('text=风险与异常')).toBeVisible();

    // 2. 验证图表和图片加载 (图片展示)
    const charts = page.locator('svg');
    await expect(charts.first()).toBeVisible();

    // 3. 验证样式和间距标准 (截屏对比视觉回归，覆盖间距、样式)
    // 使用 mask 遮罩动态数据，避免测试因为数据变动而 fail
    await expect(page).toHaveScreenshot('admin-dashboard-layout.png', {
      fullPage: true,
      mask: [page.locator('.ant-statistic-content-value'), page.locator('table')],
      maxDiffPixelRatio: 0.05
    });
  });

  test('should navigate through major admin pages', async ({ page }) => {
    // 验证侧边栏菜单控件
    const menus = ['订单中心', '系统设置'];
    
    for (const menu of menus) {
      await page.click(`text=${menu}`);
      // 等待加载状态消失
      await page.waitForTimeout(1000); // 等待过渡动画
      
      // 验证页面的样式、间距标准 (截屏)
      await expect(page).toHaveScreenshot(`admin-page-${menu}.png`, {
        fullPage: true,
        mask: [page.locator('table'), page.locator('.ant-table-tbody')],
        maxDiffPixelRatio: 0.05
      });
    }
  });
});
