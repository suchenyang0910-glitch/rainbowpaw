const TelegramBot = require('node-telegram-bot-api');
const config = require('../config');

const rainbowBot = config.rainbowBotToken ? new TelegramBot(config.rainbowBotToken, { polling: true }) : null;

if (!rainbowBot) {
  console.warn('⚠️ RAINBOW_BOT_TOKEN is not set. RainbowPaw Bot will not start.');
}

module.exports = rainbowBot;
