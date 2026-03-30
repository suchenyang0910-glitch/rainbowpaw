# Bot 指令路由代码骨架 (Node.js)

基于 Express + node-telegram-bot-api 风格的骨架。

## 1. 项目结构建议

```
src/
├── app.js
├── config/
│   └── index.js
├── bots/
│   ├── clawBot.js
│   └── rainbowBot.js
├── routes/
│   ├── claw/
│   │   ├── start.js
│   │   ├── play.js
│   │   ├── wallet.js
│   │   └── deepLink.js
│   └── rainbow/
│       ├── start.js
│       ├── store.js
│       └── service.js
├── services/
│   ├── identityService.js
│   ├── walletService.js
│   ├── bridgeService.js
│   └── reportService.js
├── utils/
│   ├── reply.js
│   └── logger.js
└── middlewares/
    └── adminOnly.js
```

## 2. config/index.js
```javascript
module.exports = {
  clawBotToken: process.env.CLAW_BOT_TOKEN,
  rainbowBotToken: process.env.RAINBOW_BOT_TOKEN,
  identityServiceBaseUrl: process.env.IDENTITY_SERVICE_URL,
  walletServiceBaseUrl: process.env.WALLET_SERVICE_URL,
  bridgeServiceBaseUrl: process.env.BRIDGE_SERVICE_URL,
  internalToken: process.env.INTERNAL_TOKEN,
  adminTelegramIds: (process.env.ADMIN_TELEGRAM_IDS || '')
    .split(',')
    .filter(Boolean)
    .map((v) => Number(v)),
};
```

## 3. services/identityService.js
```javascript
const axios = require('axios');
const config = require('../config');

const client = axios.create({
  baseURL: config.identityServiceBaseUrl,
  headers: {
    Authorization: `Bearer ${config.internalToken}`,
    'Content-Type': 'application/json',
  },
});

async function linkUser(payload) {
  const { data } = await client.post('/identity/link-user', payload);
  return data.data;
}

async function getProfile(globalUserId) {
  const { data } = await client.get(`/identity/profile/${globalUserId}`);
  return data.data;
}

async function upsertTags(payload) {
  const { data } = await client.post('/identity/tags/upsert', payload);
  return data.data;
}

module.exports = {
  linkUser,
  getProfile,
  upsertTags,
};
```

## 4. services/walletService.js
```javascript
const axios = require('axios');
const config = require('../config');

const client = axios.create({
  baseURL: config.walletServiceBaseUrl,
  headers: {
    Authorization: `Bearer ${config.internalToken}`,
    'Content-Type': 'application/json',
  },
});

async function getWallet(globalUserId) {
  const { data } = await client.get(`/wallet/${globalUserId}`);
  return data.data;
}

async function earn(payload) {
  const { data } = await client.post('/wallet/earn', payload);
  return data.data;
}

async function spend(payload) {
  const { data } = await client.post('/wallet/spend', payload);
  return data.data;
}

async function recycle(payload) {
  const { data } = await client.post('/wallet/recycle', payload);
  return data.data;
}

async function withdraw(payload) {
  const { data } = await client.post('/wallet/withdraw', payload);
  return data.data;
}

module.exports = {
  getWallet,
  earn,
  spend,
  recycle,
  withdraw,
};
```

## 5. services/bridgeService.js
```javascript
const axios = require('axios');
const config = require('../config');

const client = axios.create({
  baseURL: config.bridgeServiceBaseUrl,
  headers: {
    Authorization: `Bearer ${config.internalToken}`,
    'Content-Type': 'application/json',
  },
});

async function reportEvent(payload) {
  const { data } = await client.post('/bridge/events', payload);
  return data.data;
}

async function generateLink(payload) {
  const { data } = await client.post('/bridge/generate-link', payload);
  return data.data;
}

async function parseDeepLink(token) {
  const { data } = await client.get(`/bridge/deep-link/${token}`);
  return data.data;
}

module.exports = {
  reportEvent,
  generateLink,
  parseDeepLink,
};
```

## 6. bots/clawBot.js
```javascript
const TelegramBot = require('node-telegram-bot-api');
const config = require('../config');

const clawBot = new TelegramBot(config.clawBotToken, { polling: true });

module.exports = clawBot;
```

## 7. bots/rainbowBot.js
```javascript
const TelegramBot = require('node-telegram-bot-api');
const config = require('../config');

const rainbowBot = new TelegramBot(config.rainbowBotToken, { polling: true });

module.exports = rainbowBot;
```

## 8. routes/claw/start.js
```javascript
const clawBot = require('../../bots/clawBot');
const identityService = require('../../services/identityService');

function registerClawStartRoute() {
  clawBot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;

    const linked = await identityService.linkUser({
      source_bot: 'claw_bot',
      source_user_id: String(msg.from.id),
      telegram_id: msg.from.id,
      username: msg.from.username || '',
      first_source: 'telegram',
    });

    clawBot.sendMessage(
      chatId,
      `🐾 欢迎来到 Open Claw\n\n你的用户ID已建立：${linked.global_user_id}`,
      {
        reply_markup: {
          keyboard: [
            ['🎮 抽奖', '💰 钱包'],
            ['🛍 商城', '🌈 纪念服务'],
          ],
          resize_keyboard: true,
        },
      }
    );
  });
}

module.exports = registerClawStartRoute;
```

## 9. routes/claw/play.js
```javascript
const clawBot = require('../../bots/clawBot');
const identityService = require('../../services/identityService');
const bridgeService = require('../../services/bridgeService');

function registerClawPlayRoute() {
  clawBot.onText(/🎮 抽奖/, async (msg) => {
    const chatId = msg.chat.id;

    const linked = await identityService.linkUser({
      source_bot: 'claw_bot',
      source_user_id: String(msg.from.id),
      telegram_id: msg.from.id,
      username: msg.from.username || '',
      first_source: 'telegram',
    });

    await bridgeService.reportEvent({
      event_name: 'play_entry_clicked',
      global_user_id: linked.global_user_id,
      source_bot: 'claw_bot',
      source_user_id: String(msg.from.id),
      telegram_id: msg.from.id,
      event_data: {},
    });

    clawBot.sendMessage(
      chatId,
      '🎮 1次抽奖 = 3积分\n\n请先完成支付或使用余额。'
    );
  });
}

module.exports = registerClawPlayRoute;
```

## 10. routes/claw/wallet.js
```javascript
const clawBot = require('../../bots/clawBot');
const identityService = require('../../services/identityService');
const walletService = require('../../services/walletService');

function registerClawWalletRoute() {
  clawBot.onText(/💰 钱包/, async (msg) => {
    const chatId = msg.chat.id;

    const linked = await identityService.linkUser({
      source_bot: 'claw_bot',
      source_user_id: String(msg.from.id),
      telegram_id: msg.from.id,
      username: msg.from.username || '',
      first_source: 'telegram',
    });

    const wallet = await walletService.getWallet(linked.global_user_id);

    clawBot.sendMessage(
      chatId,
      `💰 我的钱包

Locked 积分: ${wallet.points_locked}
Cashable 积分: ${wallet.points_cashable}
平台余额: ${wallet.credit_balance}
可提现现金: ${wallet.withdrawable_cash}`
    );
  });
}

module.exports = registerClawWalletRoute;
```

## 11. routes/claw/deepLink.js
```javascript
const clawBot = require('../../bots/clawBot');
const identityService = require('../../services/identityService');
const bridgeService = require('../../services/bridgeService');

function registerClawDeepLinkRoute() {
  clawBot.onText(/🌈 纪念服务/, async (msg) => {
    const chatId = msg.chat.id;

    const linked = await identityService.linkUser({
      source_bot: 'claw_bot',
      source_user_id: String(msg.from.id),
      telegram_id: msg.from.id,
      username: msg.from.username || '',
      first_source: 'telegram',
    });

    const deepLink = await bridgeService.generateLink({
      global_user_id: linked.global_user_id,
      from_bot: 'claw_bot',
      to_bot: 'rainbowpaw_bot',
      scene: 'memorial',
      extra_data: {
        entry: 'menu_click',
      },
      ttl_minutes: 1440,
    });

    clawBot.sendMessage(
      chatId,
      `🌈 点击进入 RainbowPaw 纪念服务：\n${deepLink.deep_link}`
    );
  });
}

module.exports = registerClawDeepLinkRoute;
```

## 12. routes/rainbow/start.js
```javascript
const rainbowBot = require('../../bots/rainbowBot');
const bridgeService = require('../../services/bridgeService');
const identityService = require('../../services/identityService');

function registerRainbowStartRoute() {
  rainbowBot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const token = match[1];

    if (!token) {
      return rainbowBot.sendMessage(
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

    const parsed = await bridgeService.parseDeepLink(token);

    if (!parsed.valid) {
      return rainbowBot.sendMessage(chatId, '链接已失效，请重新进入。');
    }

    const profile = await identityService.getProfile(parsed.global_user_id);

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

    text += `\n\n你的宠物类型：${profile.pet_type || 'unknown'}`;

    rainbowBot.sendMessage(chatId, text, {
      reply_markup: {
        keyboard: [
          ['🛍 商城', '🕊 善终服务'],
          ['📸 纪念页', '👩‍💼 客服'],
        ],
        resize_keyboard: true,
      },
    });
  });
}

module.exports = registerRainbowStartRoute;
```

## 13. app.js
```javascript
const registerClawStartRoute = require('./routes/claw/start');
const registerClawPlayRoute = require('./routes/claw/play');
const registerClawWalletRoute = require('./routes/claw/wallet');
const registerClawDeepLinkRoute = require('./routes/claw/deepLink');

const registerRainbowStartRoute = require('./routes/rainbow/start');

function bootstrap() {
  registerClawStartRoute();
  registerClawPlayRoute();
  registerClawWalletRoute();
  registerClawDeepLinkRoute();

  registerRainbowStartRoute();

  console.log('Bots started');
}

bootstrap();
```
