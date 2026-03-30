const rainbowBot = require('../../bots/rainbowBot');
const bridgeService = require('../../services/bridgeService');
const identityService = require('../../services/identityService');

function registerRainbowStartRoute() {
  if (!rainbowBot) return;

  rainbowBot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const token = match[1];

    try {
      if (!token) {
        return rainbowBot.sendMessage(
          chatId,
          '🌈 欢迎来到 RainbowPaw\n\n请选择你要探索的服务。',
          {
            reply_markup: {
              keyboard: [
                ['🛍 商城', '🕊 善终服务'],
                ['📸 纪念页', '👩‍💼 客服'],
              ],
              resize_keyboard: true,
            },
          }
        );
      }

      const parsed = await bridgeService.parseDeepLink(token);

      if (!parsed.valid) {
        return rainbowBot.sendMessage(chatId, '链接已失效，请重新进入。');
      }

      const profile = await identityService.getProfile(parsed.global_user_id);

      let text = '🌈 欢迎来到 RainbowPaw\n\n';
      if (parsed.scene === 'memorial') {
        text += '这里可以创建纪念页、了解纪念商品与相关服务。';
      } else if (parsed.scene === 'store') {
        text += '这里可以浏览更多宠物商品与纪念商品。';
      } else if (parsed.scene === 'aftercare') {
        text += '这里可以了解善终服务与长期纪念服务。';
      } else {
        text += '请选择你要探索的服务。';
      }

      if (profile && profile.pet_type) {
         text += `\n\n你的宠物类型：${profile.pet_type}`;
      }

      rainbowBot.sendMessage(chatId, text, {
        reply_markup: {
          keyboard: [
            ['🛍 商城', '🕊 善终服务'],
            ['📸 纪念页', '👩‍💼 客服'],
          ],
          resize_keyboard: true,
        },
      });
    } catch (error) {
      rainbowBot.sendMessage(chatId, '系统繁忙，请稍后再试。');
    }
  });
}

module.exports = registerRainbowStartRoute;
