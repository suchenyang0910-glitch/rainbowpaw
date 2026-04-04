const rainbowBot = require('../../bots/rainbowBot');
const bridgeService = require('../../services/bridgeService');
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

function registerRainbowStartRoute() {
  if (!rainbowBot) return;

  rainbowBot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const token = match[1];

    try {
      const linked = await identityService
        .linkUser({
          source_bot: 'rainbowpaw_bot',
          source_user_id: String(msg.from.id),
          telegram_id: msg.from.id,
          username: msg.from.username || '',
          first_source: 'telegram',
        })
        .catch(() => null);

      if (!token) {
        return await rainbowBot.sendMessage(
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

      if (String(token || '').trim() === 'open_webapp') {
        const url = webUrl('/rainbowpaw/marketplace');
        const text = url
          ? '🛍 点击按钮打开 RainbowPaw Mini App'
          : '🛍 Mini App 未配置（缺少 PUBLIC_WEB_BASE_URL）';
        const opts = url
          ? { reply_markup: { inline_keyboard: [[webAppButton('打开 Mini App', url)]] } }
          : undefined;
        return await rainbowBot.sendMessage(chatId, text, opts);
      }

      let parsed = null;
      try {
        parsed = await bridgeService.parseDeepLink(token, { to_bot: 'rainbowpaw_bot', consume: true });
      } catch {
        parsed = null;
      }

      if (!parsed || !parsed.valid) {
        await rainbowBot.sendMessage(chatId, '链接已失效，请重新进入。');
        return await rainbowBot.sendMessage(
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
          },
        );
      }

      const effectiveGlobalUserId = parsed.global_user_id || (linked && linked.global_user_id);
      const profile = await identityService.getProfile(effectiveGlobalUserId).catch(() => null);

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

      await rainbowBot.sendMessage(chatId, text, {
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
