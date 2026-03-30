const clawBot = require('../../bots/clawBot');
const identityService = require('../../services/identityService');
const bridgeService = require('../../services/bridgeService');

function registerStoreRoute() {
  if (!clawBot) return;

  // Store browsing redirect
  clawBot.onText(/🛍 商城/, async (msg) => {
    const chatId = msg.chat.id;

    try {
      const linked = await identityService.linkUser({
        source_bot: 'claw_bot',
        source_user_id: String(msg.from.id),
        telegram_id: msg.from.id,
        username: msg.from.username || '',
      });

      const deepLink = await bridgeService.generateLink({
        global_user_id: linked.global_user_id,
        from_bot: 'claw_bot',
        to_bot: 'rainbowpaw_bot',
        scene: 'store',
        extra_data: { entry: 'menu_click' },
        ttl_minutes: 1440,
      });

      clawBot.sendMessage(
        chatId,
        `🛍️ 发现更多精美宠物商品和纪念品，请前往我们的专属商城！\n\n👉 点击进入: ${deepLink.deep_link}`
      );
    } catch (error) {
      clawBot.sendMessage(chatId, '生成商城链接失败，请稍后再试。');
    }
  });
}

module.exports = registerStoreRoute;