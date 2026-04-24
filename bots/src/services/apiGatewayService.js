const axios = require('axios');
const config = require('../config');

const client = axios.create({
  baseURL: String(config.apiGatewayBaseUrl || '').trim(),
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${config.internalToken}`,
  },
  timeout: 15000,
});

async function marketplaceProducts(opts) {
  const category = String(opts?.category || '').trim();
  const lang = String(opts?.lang || '').trim();
  const { data } = await client.get('/marketplace/products', {
    params: {
      ...(category ? { category } : {}),
      ...(lang ? { lang } : {}),
    },
  });
  return data?.data?.items || [];
}

async function clawPlay(globalUserId) {
  const idem = `claw_play_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const { data } = await client.post(
    '/claw/play',
    { global_user_id: globalUserId },
    { headers: { 'x-idempotency-key': idem } },
  );
  return data;
}

async function clawRecycle(globalUserId, playId) {
  const idem = `claw_recycle_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const { data } = await client.post(
    '/claw/recycle',
    { global_user_id: globalUserId, play_id: playId },
    { headers: { 'x-idempotency-key': idem } },
  );
  return data;
}

async function getCarePlan(globalUserId) {
  const { data } = await client.post('/care/plan', { global_user_id: globalUserId });
  return data;
}

async function chatSupport(globalUserId, question) {
  const { data } = await client.post('/support/chat', { global_user_id: globalUserId, question });
  return data;
}

async function createBridgeLink(globalUserId, opts = {}) {
  const toBot = String(opts.to_bot || opts.target_bot || 'rainbowpaw_bot');
  const scene = String(opts.scene || 'aftercare');
  const extraData = opts.extra_data && typeof opts.extra_data === 'object' ? opts.extra_data : undefined;
  const { data } = await client.post('/bridge/create', {
    global_user_id: globalUserId,
    to_bot: toBot,
    scene,
    ...(extraData ? { extra_data: extraData } : {}),
  });
  return data;
}

module.exports = {
  marketplaceProducts,
  clawPlay,
  clawRecycle,
  getCarePlan,
  chatSupport,
  createBridgeLink
};
