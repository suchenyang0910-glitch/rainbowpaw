const clawBot = require('../../bots/clawBot');
const identityService = require('../../services/identityService');

function registerClawStartRoute() {
  if (!clawBot) return;

  clawBot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;

    try {
      const linked = await identityService.linkUser({
        source_bot: 'claw_bot',
        source_user_id: String(msg.from.id),
        telegram_id: msg.from.id,
        username: msg.from.username || '',
        first_source: 'telegram',
      });

      clawBot.sendMessage(
        chatId,
        `🐾 欢迎来到 Open Claw\n\n你的统一用户ID：${linked.global_user_id}`,
        {
          reply_markup: {
            keyboard: [
              ['🎮 抽奖', '💰 钱包'],
              ['🛍 商城', '🔥 发起拼团'],
              ['👥 分销中心', '🌈 纪念服务'],
            ],
            resize_keyboard: true,
          },
        }
      );
    } catch (error) {
      clawBot.sendMessage(chatId, '系统繁忙，请稍后再试。');
    }
  });
}

module.exports = registerClawStartRoute;
