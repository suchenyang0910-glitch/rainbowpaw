const TelegramBot = require('node-telegram-bot-api');
const config = require('../config');

const clawBot = config.clawBotToken ? new TelegramBot(config.clawBotToken, { polling: true }) : null;

if (!clawBot) {
  console.warn('⚠️ CLAW_BOT_TOKEN is not set. Claw Bot will not start.');
}

module.exports = clawBot;
