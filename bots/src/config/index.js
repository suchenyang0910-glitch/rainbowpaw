require('dotenv').config({ quiet: true });

module.exports = {
  clawBotToken: process.env.CLAW_BOT_TOKEN,
  rainbowBotToken: process.env.RAINBOW_BOT_TOKEN,
  identityServiceBaseUrl: process.env.IDENTITY_SERVICE_URL || 'http://localhost:3001/api',
  walletServiceBaseUrl: process.env.WALLET_SERVICE_URL || 'http://localhost:3002/api',
  bridgeServiceBaseUrl: process.env.BRIDGE_SERVICE_URL || 'http://localhost:3003/api',
  reportServiceBaseUrl: process.env.REPORT_SERVICE_URL || 'http://localhost:3004/api',
  aiOrchestratorServiceBaseUrl: process.env.AI_ORCHESTRATOR_SERVICE_URL || 'http://localhost:3005/api',
  internalToken: process.env.INTERNAL_TOKEN || 'dev-secret-token',
  enableSupportAI: String(process.env.ENABLE_SUPPORT_AI || '').trim() === 'true',
  publicWebBaseUrl: String(process.env.PUBLIC_WEB_BASE_URL || '').trim(),
  supportLink: String(process.env.SUPPORT_LINK || '').trim() || 'https://t.me/RainbowPawbot',
  adminTelegramIds: (process.env.ADMIN_TELEGRAM_IDS || '')
    .split(',')
    .filter(Boolean)
    .map((v) => Number(v)),
};
