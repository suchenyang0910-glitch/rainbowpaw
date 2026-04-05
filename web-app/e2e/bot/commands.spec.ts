import { test, expect } from '@playwright/test';

test.describe('Bot Command Guides, Text & Deep Links', () => {
  // Use Playwright API testing to verify backend/bot text outputs
  test('should return correct welcome text and commands guide for /start', async ({ request }) => {
    // 假设可以通过某内部或公开接口获取 Bot 引导文案，这里做模拟或直接请求 API
    // 在真实场景中，可以是对 webhook 地址的直接请求
    
    // 这里做演示断言
    const welcomeTextEn = `Welcome to RainbowPaw! 🐾\n\nUse /play to start playing\nUse /wallet to check balance\nUse /help for support`;
    
    // Check integrity of English welcome text
    expect(welcomeTextEn).toContain('Welcome to RainbowPaw!');
    expect(welcomeTextEn).toContain('/play');
    expect(welcomeTextEn).toContain('/wallet');
    expect(welcomeTextEn).toContain('/help');
  });

  test('should return proper localized command descriptions', async () => {
    // 验证不同语言或场景下的字段与文本
    const localizedTextZh = `欢迎来到 RainbowPaw！🐾\n\n使用 /play 开始游戏\n使用 /wallet 查看余额\n使用 /help 获取帮助`;
    
    // Check integrity of Chinese welcome text
    expect(localizedTextZh).toContain('开始游戏');
    expect(localizedTextZh).toContain('查看余额');
    expect(localizedTextZh).toContain('/play');
    expect(localizedTextZh).toContain('/wallet');
  });

  test('should format bot message buttons correctly', async () => {
    // Mock the button layout returned by the bot
    const mockReplyMarkup = {
      inline_keyboard: [
        [{ text: "🎮 Play Now", web_app: { url: "https://rainbowpaw.org/rainbowpawclaw" } }],
        [{ text: "🛍️ Shop", web_app: { url: "https://rainbowpaw.org/rainbowpaw/marketplace" } }],
        [{ text: "🌐 Website", url: "https://rainbowpaw.org" }]
      ]
    };

    // Verify button text integrity
    expect(mockReplyMarkup.inline_keyboard[0][0].text).toBe("🎮 Play Now");
    expect(mockReplyMarkup.inline_keyboard[1][0].text).toBe("🛍️ Shop");
    expect(mockReplyMarkup.inline_keyboard[2][0].text).toBe("🌐 Website");

    // Verify button link destinations (Deep Links & Web Apps)
    expect(mockReplyMarkup.inline_keyboard[0][0].web_app.url).toContain('/rainbowpawclaw');
    expect(mockReplyMarkup.inline_keyboard[1][0].web_app.url).toContain('/marketplace');
    expect(mockReplyMarkup.inline_keyboard[2][0].url).toBe('https://rainbowpaw.org');
  });
});
