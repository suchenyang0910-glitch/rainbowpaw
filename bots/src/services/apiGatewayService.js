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
  const { data } = await client.post('/claw/play', { global_user_id: globalUserId });
  return data;
}

async function clawRecycle(globalUserId, playId) {
  const { data } = await client.post('/claw/recycle', { global_user_id: globalUserId, playId });
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

async function createBridgeLink(globalUserId, targetBot = 'rainbowpaw_bot') {
  const { data } = await client.post('/bridge/create', { global_user_id: globalUserId, target_bot: targetBot });
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

