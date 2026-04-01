const clawBot = require('../../bots/clawBot');
const identityService = require('../../services/identityService');
const config = require('../../config');

function webUrl(pathname) {
  const base = String(config.publicWebBaseUrl || '').trim().replace(/\/+$/, '');
  if (!base) return '';
  const p = String(pathname || '').trim();
  if (!p) return base;
  return `${base}${p.startsWith('/') ? '' : '/'}${p}`;
}

function webAppButton(text, url) {
  return {
    text: String(text || '').trim() || '打开',
    web_app: { url: String(url || '').trim() },
  };
}

function registerClawStartRoute() {
  if (!clawBot) return;

  clawBot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const token = match && match[1] ? String(match[1] || '').trim() : '';

    try {
      if (token === 'open_webapp') {
        const url = webUrl('/rainbowpawclaw');
        const text = url
          ? '🎮 点击按钮打开 Open Claw Mini App'
          : '🎮 Mini App 未配置（缺少 PUBLIC_WEB_BASE_URL）';
        const opts = url
          ? { reply_markup: { inline_keyboard: [[webAppButton('打开 Mini App', url)]] } }
          : undefined;
        return await clawBot.sendMessage(chatId, text, opts);
      }

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
              ['🤖 下一步推荐'],
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
