const clawBot = require('../../bots/clawBot');
const config = require('../../config');
const identityService = require('../../services/identityService');
const walletService = require('../../services/walletService');
const aiOrchestratorService = require('../../services/aiOrchestratorService');

const ACTION_TO_BUTTON_TEXT = {
  claw: '🎮 抽奖',
  recharge: '💰 钱包',
  shop: '🛍 商城',
  group: '🔥 发起拼团',
  memorial: '🌈 纪念服务',
};

const IGNORE_TEXTS = new Set([
  '🎮 抽奖',
  '💰 钱包',
  '🛍 商城',
  '🔥 发起拼团',
  '👥 分销中心',
  '🌈 纪念服务',
  '🤖 下一步推荐',
]);

function toKeyboard(buttons) {
  const rows = (Array.isArray(buttons) ? buttons : [])
    .map((b) => String(ACTION_TO_BUTTON_TEXT[String(b?.action || '').trim()] || '').trim())
    .filter(Boolean)
    .slice(0, 3)
    .map((text) => [text]);

  if (!rows.length) return null;
  return {
    keyboard: rows,
    resize_keyboard: true,
  };
}

function registerClawSupportAIRoute() {
  if (!clawBot) return;
  if (!config.enableSupportAI) return;

  clawBot.on('message', async (msg) => {
    const chatId = msg?.chat?.id;
    const text = String(msg?.text || '').trim();
    const chatType = String(msg?.chat?.type || '').trim();

    if (!chatId) return;
    if (chatType && chatType !== 'private') return;
    if (!text) return;
    if (text.startsWith('/')) return;
    if (IGNORE_TEXTS.has(text)) return;

    try {
      const linked = await identityService.linkUser({
        source_bot: 'claw_bot',
        source_user_id: String(msg.from.id),
        telegram_id: msg.from.id,
        username: msg.from.username || '',
        first_source: 'telegram',
      });

      const profile = await identityService.getProfile(linked.global_user_id);
      const wallet = await walletService.getWallet(linked.global_user_id);

      const out = await aiOrchestratorService.supportReplyWithUser(
        {
        user_message: text,
        user_profile: {
          pet_type: profile?.pet_type || null,
          spend_level: profile?.spend_level || null,
          last_action: null,
          wallet_balance: wallet?.points_total ?? null,
        },
        context: {},
        },
        { global_user_id: linked.global_user_id },
      );

      const replyText = String(out?.reply_text || '').trim() || '你可以选择一个操作：';
      const kb = toKeyboard(out?.buttons);
      const opts = kb ? { reply_markup: kb } : undefined;
      await clawBot.sendMessage(chatId, replyText, opts);
    } catch {
    }
  });
}

module.exports = registerClawSupportAIRoute;
