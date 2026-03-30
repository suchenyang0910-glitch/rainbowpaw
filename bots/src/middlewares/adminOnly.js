const config = require('../config');

function adminOnly(bot) {
  return (handler) => {
    return async (msg, match) => {
      const chatId = msg && msg.chat ? msg.chat.id : null;
      const tgId = msg && msg.from ? Number(msg.from.id) : NaN;

      if (!Number.isFinite(tgId) || !Array.isArray(config.adminTelegramIds) || !config.adminTelegramIds.includes(tgId)) {
        if (bot && chatId) bot.sendMessage(chatId, '无权限');
        return;
      }

      return handler(msg, match);
    };
  };
}

module.exports = adminOnly;
