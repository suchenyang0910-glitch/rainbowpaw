const clawBot = require('../../bots/clawBot');
const identityService = require('../../services/identityService');
const aiOrchestratorService = require('../../services/aiOrchestratorService');
const { buildRecommendPayload } = require('../../services/recommendationService');

const ACTION_TO_BUTTON_TEXT = {
  claw: '🎮 抽奖',
  shop: '🛍 商城',
  group: '🔥 发起拼团',
  memorial: '🌈 纪念服务',
};

function toKeyboardByNextAction(nextAction) {
  const main = String(ACTION_TO_BUTTON_TEXT[String(nextAction || '').trim()] || '').trim();
  const fallback = ['🎮 抽奖', '🛍 商城', '🌈 纪念服务'];
  const rows = [];
  if (main) rows.push([main]);
  for (const t of fallback) {
    if (!rows.some((r) => r[0] === t)) rows.push([t]);
  }
  return { keyboard: rows.slice(0, 4), resize_keyboard: true };
}

async function ensureLinked(msg) {
  return identityService.linkUser({
    source_bot: 'claw_bot',
    source_user_id: String(msg.from.id),
    telegram_id: msg.from.id,
    username: msg.from.username || '',
    first_source: 'telegram',
  });
}

function registerClawRecommendRoute() {
  if (!clawBot) return;

  clawBot.onText(/🤖 下一步推荐/, async (msg) => {
    const chatId = msg?.chat?.id;
    if (!chatId) return;

    try {
      const linked = await ensureLinked(msg);
      const payload = await buildRecommendPayload({
        global_user_id: linked.global_user_id,
        recent_actions: ['bot_recommend_clicked'],
        last_result: {},
      });

      const out = await aiOrchestratorService.recommendNextWithUser(payload, {
        global_user_id: linked.global_user_id,
      });

      const text = String(out?.message || '').trim() || '建议你下一步这样做：';
      const kb = toKeyboardByNextAction(out?.next_action);
      await clawBot.sendMessage(chatId, text, { reply_markup: kb });
    } catch {
      await clawBot.sendMessage(chatId, '系统繁忙，请稍后再试。');
    }
  });
}

module.exports = registerClawRecommendRoute;
