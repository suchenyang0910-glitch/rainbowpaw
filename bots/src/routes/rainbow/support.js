const rainbowBot = require('../../bots/rainbowBot');
const identityService = require('../../services/identityService');
const apiGatewayService = require('../../services/apiGatewayService');
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

function registerRainbowSupportRoute() {
  if (!rainbowBot) return;

  const userSessions = new Map();

  rainbowBot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;

    if (data === 'action_support') {
      userSessions.set(chatId, { mode: 'support' });
      await rainbowBot.sendMessage(
        chatId,
        `💬 **RainbowPaw Support**\n\nHi there, how can we help you today? You can ask me anything about our services, care plans, or memorial options.`,
        { parse_mode: 'Markdown' }
      );
      await rainbowBot.answerCallbackQuery(query.id);
    }
  });

  rainbowBot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // Skip commands
    if (!text || text.startsWith('/')) return;

    const session = userSessions.get(chatId);
    if (session && session.mode === 'support') {
      try {
        const linked = await identityService.linkUser({
          source_bot: 'rainbowpaw_bot',
          source_user_id: String(msg.from.id),
        });

        // Send a typing indicator
        await rainbowBot.sendChatAction(chatId, 'typing');

        const supportRes = await apiGatewayService.chatSupport(linked.global_user_id, text);
        
        if (supportRes.code === 0 && supportRes.data) {
          const { response_text, suggested_buttons } = supportRes.data;
          
          let opts = { parse_mode: 'Markdown' };
          
          if (suggested_buttons && suggested_buttons.length > 0) {
            const inline_keyboard = suggested_buttons.map(btn => {
              if (btn.callback_data) {
                return [{ text: btn.text, callback_data: btn.callback_data }];
              } else if (btn.url) {
                return [{ text: btn.text, url: btn.url }];
              }
              return [];
            });
            opts.reply_markup = { inline_keyboard };
          }

          await rainbowBot.sendMessage(chatId, response_text, opts);
        } else {
          await rainbowBot.sendMessage(chatId, 'Sorry, I am having trouble connecting to my brain right now. Please try again later.');
        }
      } catch (error) {
        console.error('Support chat error:', error?.message);
        await rainbowBot.sendMessage(chatId, 'Sorry, I encountered an error. Please try again.');
      }
    }
  });
}

module.exports = registerRainbowSupportRoute;
