const clawBot = require('../../bots/clawBot');
const identityService = require('../../services/identityService');
const bridgeService = require('../../services/bridgeService');
const walletService = require('../../services/walletService');
const aiOrchestratorService = require('../../services/aiOrchestratorService');
const { buildRecommendPayload } = require('../../services/recommendationService');

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

      try {
        const payload = await buildRecommendPayload({
          global_user_id: linked.global_user_id,
          recent_actions: ['play_entry_clicked'],
          last_result: {},
        });
        const out = await aiOrchestratorService.recommendNextWithUser(payload, {
          global_user_id: linked.global_user_id,
        });
        const msgText = String(out?.message || '').trim();
        if (msgText) {
          const next = String(out?.next_action || '').trim();
          const map = {
            claw: '🎮 抽奖',
            shop: '🛍 商城',
            group: '🔥 发起拼团',
            memorial: '🌈 纪念服务',
          };
          const main = String(map[next] || '').trim();
          const rows = [];
          if (main) rows.push([main]);
          rows.push(['🤖 下一步推荐']);
          await clawBot.sendMessage(chatId, msgText, {
            reply_markup: { keyboard: rows, resize_keyboard: true },
          });
        }
      } catch {
      }
    } catch (error) {
      clawBot.sendMessage(chatId, '系统繁忙，请稍后再试。');
    }
  });
}

module.exports = registerClawPlayRoute;
