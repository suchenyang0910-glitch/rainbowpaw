const clawBot = require('../../bots/clawBot');
const identityService = require('../../services/identityService');
const bridgeService = require('../../services/bridgeService');

function registerGroupBuyRoute() {
  if (!clawBot) return;

  // Simulate joining a group buy via Telegram command
  clawBot.onText(/\/group_join_(.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const groupId = match[1];

    try {
      const linked = await identityService.linkUser({
        source_bot: 'claw_bot',
        source_user_id: String(msg.from.id),
        telegram_id: msg.from.id,
        username: msg.from.username || '',
      });

      await bridgeService.reportEvent({
        event_name: 'group_buy_joined',
        global_user_id: linked.global_user_id,
        source_bot: 'claw_bot',
        source_user_id: String(msg.from.id),
        event_data: { group_id: groupId },
      });

      clawBot.sendMessage(
        chatId,
        `🤝 成功加入拼团 [${groupId}]！\n\n支付完成后，分享给好友即可获得现金返还。`
      );
    } catch (error) {
      clawBot.sendMessage(chatId, '加入拼团失败，请稍后再试。');
    }
  });

  // Start a new group buy
  clawBot.onText(/🔥 发起拼团/, async (msg) => {
    const chatId = msg.chat.id;
    clawBot.sendMessage(
      chatId,
      `🔥 请在 Web App 的商城中选择支持拼团的商品发起拼团。`
    );
  });
}

module.exports = registerGroupBuyRoute;