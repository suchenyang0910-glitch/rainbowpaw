const clawBot = require('../../bots/clawBot');
const identityService = require('../../services/identityService');
const bridgeService = require('../../services/bridgeService');
const walletService = require('../../services/walletService');

function registerClawPlayRoute() {
  if (!clawBot) return;

  clawBot.onText(/🎮 抽奖/, async (msg) => {
    const chatId = msg.chat.id;

    try {
      const linked = await identityService.linkUser({
        source_bot: 'claw_bot',
        source_user_id: String(msg.from.id),
        telegram_id: msg.from.id,
        username: msg.from.username || '',
        first_source: 'telegram',
      });

      await bridgeService.reportEvent({
        event_name: 'play_entry_clicked',
        global_user_id: linked.global_user_id,
        source_bot: 'claw_bot',
        source_user_id: String(msg.from.id),
        telegram_id: msg.from.id,
        event_data: {},
      });

      const wallet = await walletService.getWallet(linked.global_user_id);
      
      clawBot.sendMessage(
        chatId,
        `🎮 **Open Claw 盲盒抽奖**\n\n` +
        `单次抽奖消耗：3 积分\n` +
        `您当前总积分：${wallet.points_total}\n\n` +
        `请在 Web App 中点击 PLAY NOW 进行抽取！`,
        { parse_mode: 'Markdown' }
      );
    } catch (error) {
      clawBot.sendMessage(chatId, '系统繁忙，请稍后再试。');
    }
  });
}

module.exports = registerClawPlayRoute;