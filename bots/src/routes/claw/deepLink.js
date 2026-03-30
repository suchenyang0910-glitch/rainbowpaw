const clawBot = require('../../bots/clawBot');
const identityService = require('../../services/identityService');
const bridgeService = require('../../services/bridgeService');

function registerClawDeepLinkRoute() {
  if (!clawBot) return;

  clawBot.onText(/🌈 纪念服务/, async (msg) => {
    const chatId = msg.chat.id;

    try {
      const linked = await identityService.linkUser({
        source_bot: 'claw_bot',
        source_user_id: String(msg.from.id),
        telegram_id: msg.from.id,
        username: msg.from.username || '',
        first_source: 'telegram',
      });

      const deepLink = await bridgeService.generateLink({
        global_user_id: linked.global_user_id,
        from_bot: 'claw_bot',
        to_bot: 'rainbowpaw_bot',
        scene: 'memorial',
        extra_data: {
          entry: 'menu_click',
        },
        ttl_minutes: 1440,
      });

      clawBot.sendMessage(
        chatId,
        `🌈 点击进入 RainbowPaw 纪念服务：\n${deepLink.deep_link}`
      );
    } catch (error) {
      clawBot.sendMessage(chatId, '生成链接失败，请稍后再试。');
    }
  });
}

module.exports = registerClawDeepLinkRoute;
