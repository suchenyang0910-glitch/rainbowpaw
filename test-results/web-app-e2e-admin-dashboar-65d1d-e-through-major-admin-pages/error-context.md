# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: web-app\e2e\admin\dashboard.spec.ts >> Admin Dashboard >> should navigate through major admin pages
- Location: web-app\e2e\admin\dashboard.spec.ts:40:3

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/console/login", waiting until "domcontentloaded"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Admin Dashboard', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  6  |     page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  7  | 
> 8  |     await page.goto('/console/login', { waitUntil: 'domcontentloaded' });
     |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  9  |     // 等待页面加载完成，确保不是白屏
  10 |     await expect(page.locator('text=管理后台登录')).toBeVisible({ timeout: 15000 });
  11 |     // 使用更明确的选择器
  12 |     await page.locator('.ant-select-selector').click();
  13 |     // 选择 super_admin
  14 |     await page.locator('.ant-select-item-option[title="super_admin"]').click();
  15 |     // 点击登录
  16 |     await page.locator('button[type="submit"]').click();
  17 |     // Wait for redirect to dashboard
  18 |     await page.waitForURL('**/console/dashboard');
  19 |   });
  20 | 
  21 |   test('should display dashboard correctly and match visual standards', async ({ page }) => {
  22 |     // 1. 验证关键元素存在 (页面上的控件、字段、文本)
  23 |     await expect(page.locator('text=平台钱包概览')).toBeVisible();
  24 |     await expect(page.locator('text=今日核心指标')).toBeVisible();
  25 |     await expect(page.locator('text=风险与异常')).toBeVisible();
  26 | 
  27 |     // 2. 验证图表和图片加载 (图片展示)
  28 |     const charts = page.locator('svg');
  29 |     await expect(charts.first()).toBeVisible();
  30 | 
  31 |     // 3. 验证样式和间距标准 (截屏对比视觉回归，覆盖间距、样式)
  32 |     // 使用 mask 遮罩动态数据，避免测试因为数据变动而 fail
  33 |     await expect(page).toHaveScreenshot('admin-dashboard-layout.png', {
  34 |       fullPage: true,
  35 |       mask: [page.locator('.ant-statistic-content-value'), page.locator('table')],
  36 |       maxDiffPixelRatio: 0.05
  37 |     });
  38 |   });
  39 | 
  40 |   test('should navigate through major admin pages', async ({ page }) => {
  41 |     // 验证侧边栏菜单控件
  42 |     const menus = ['订单中心', '系统设置'];
  43 |     
  44 |     for (const menu of menus) {
  45 |       await page.click(`text=${menu}`);
  46 |       // 等待加载状态消失
  47 |       await page.waitForTimeout(1000); // 等待过渡动画
  48 |       
  49 |       // 验证页面的样式、间距标准 (截屏)
  50 |       await expect(page).toHaveScreenshot(`admin-page-${menu}.png`, {
  51 |         fullPage: true,
  52 |         mask: [page.locator('table'), page.locator('.ant-table-tbody')],
  53 |         maxDiffPixelRatio: 0.05
  54 |       });
  55 |     }
  56 |   });
  57 | });
  58 | 
```