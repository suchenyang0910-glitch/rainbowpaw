const rainbowBot = require('../../bots/rainbowBot');
const config = require('../../config');

const BUTTONS = {
  shop: '🛍 商城',
  aftercare: '🕊 善终服务',
  memorial: '📸 纪念页',
  support: '👩‍💼 客服',
};

function webAppButton(text, url) {
  return {
    text: String(text || '').trim() || '打开',
    web_app: { url: String(url || '').trim() },
  };
}

function webUrl(pathname) {
  const base = String(config.publicWebBaseUrl || '').trim().replace(/\/+$/, '');
  if (!base) return '';
  const p = String(pathname || '').trim();
  if (!p) return base;
  return `${base}${p.startsWith('/') ? '' : '/'}${p}`;
}

function registerRainbowMenuRoutes() {
  if (!rainbowBot) return;

  rainbowBot.onText(new RegExp(`^${BUTTONS.shop.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`), async (msg) => {
    const chatId = msg?.chat?.id;
    if (!chatId) return;
    const url = webUrl('/rainbowpaw/marketplace');
    const text = url ? '🛍 进入商城：' : '🛍 商城入口尚未配置（缺少 PUBLIC_WEB_BASE_URL）';
    const opts = url
      ? { reply_markup: { inline_keyboard: [[webAppButton('打开商城', url)]] } }
      : undefined;
    await rainbowBot.sendMessage(chatId, text, opts);
  });

  rainbowBot.onText(new RegExp(`^${BUTTONS.aftercare.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`), async (msg) => {
    const chatId = msg?.chat?.id;
    if (!chatId) return;
    const url = webUrl('/rainbowpaw');
    const text = url ? '🕊 善终服务入口：' : '🕊 善终服务入口尚未配置（缺少 PUBLIC_WEB_BASE_URL）';
    const opts = url
      ? { reply_markup: { inline_keyboard: [[webAppButton('打开服务', url)]] } }
      : undefined;
    await rainbowBot.sendMessage(chatId, text, opts);
  });

  rainbowBot.onText(new RegExp(`^${BUTTONS.memorial.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`), async (msg) => {
    const chatId = msg?.chat?.id;
    if (!chatId) return;
    const url = webUrl('/rainbowpaw');
    const text = url ? '📸 纪念页入口：' : '📸 纪念页入口尚未配置（缺少 PUBLIC_WEB_BASE_URL）';
    const opts = url
      ? { reply_markup: { inline_keyboard: [[webAppButton('打开纪念页', url)]] } }
      : undefined;
    await rainbowBot.sendMessage(chatId, text, opts);
  });

  rainbowBot.onText(new RegExp(`^${BUTTONS.support.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`), async (msg) => {
    const chatId = msg?.chat?.id;
    if (!chatId) return;
    const url = String(config.supportLink || '').trim();
    const text = '👩‍💼 客服入口：';
    const opts = url
      ? { reply_markup: { inline_keyboard: [[{ text: '联系人工', url }]] } }
      : undefined;
    await rainbowBot.sendMessage(chatId, text, opts);
  });
}

module.exports = registerRainbowMenuRoutes;
