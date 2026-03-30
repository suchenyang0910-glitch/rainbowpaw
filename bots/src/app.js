const registerClawStartRoute = require('./routes/claw/start');
const registerClawDeepLinkRoute = require('./routes/claw/deepLink');
const registerClawPlayRoute = require('./routes/claw/play');
const registerClawWalletRoute = require('./routes/claw/wallet');
const registerGroupBuyRoute = require('./routes/claw/groupBuy');
const registerReferralRoute = require('./routes/claw/referral');
const registerStoreRoute = require('./routes/claw/store');
const registerClawSupportAIRoute = require('./routes/claw/supportAI');

const registerAdminReportRoute = require('./routes/admin/report');

const registerRainbowStartRoute = require('./routes/rainbow/start');
const registerRainbowMenuRoutes = require('./routes/rainbow/menu');

function bootstrap() {
  // Initialize Claw Bot Routes
  registerClawStartRoute();
  registerClawDeepLinkRoute();
  registerClawPlayRoute();
  registerClawWalletRoute();
  registerGroupBuyRoute();
  registerReferralRoute();
  registerStoreRoute();

  registerClawSupportAIRoute();

  registerAdminReportRoute();

  // Initialize RainbowPaw Bot Routes
  registerRainbowStartRoute();
  registerRainbowMenuRoutes();

  console.log('Bots started (Polling mode)');
}

bootstrap();
