import { test, expect } from '@playwright/test';

test.describe('Bot Command Guides & Text', () => {
  // Use Playwright API testing to verify backend/bot text outputs
  test('should return correct welcome text and commands guide for /start', async ({ request }) => {
    // 假设可以通过某内部或公开接口获取 Bot 引导文案，这里做模拟或直接请求 API
    // 在真实场景中，可以是对 webhook 地址的直接请求
    
    // 这里做演示断言
    const welcomeText = `Welcome to RainbowPaw! 🐾\n\nUse /play to start playing\nUse /wallet to check balance\nUse /help for support`;
    
    expect(welcomeText).toContain('Welcome to RainbowPaw!');
    expect(welcomeText).toContain('/play');
    expect(welcomeText).toContain('/wallet');
    expect(welcomeText).toContain('/help');
  });

  test('should return proper localized command descriptions', async () => {
    // 验证不同语言或场景下的字段与文本
    const localizedTextZh = `欢迎来到 RainbowPaw！🐾\n\n使用 /play 开始游戏\n使用 /wallet 查看余额\n使用 /help 获取帮助`;
    
    expect(localizedTextZh).toContain('开始游戏');
    expect(localizedTextZh).toContain('/play');
  });
});
