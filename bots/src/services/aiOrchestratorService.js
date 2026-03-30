const axios = require('axios');
const config = require('../config');

const client = axios.create({
  baseURL: config.aiOrchestratorServiceBaseUrl,
  headers: {
    Authorization: `Bearer ${config.internalToken}`,
    'Content-Type': 'application/json',
  },
  timeout: Number(process.env.AI_ORCHESTRATOR_HTTP_TIMEOUT_MS || 15000),
});

async function supportReply(payload) {
  try {
    const { data } = await client.post('/ai/support/reply', payload);
    return data.data;
  } catch (error) {
    console.error('aiOrchestratorService.supportReply error:', error.response?.data || error.message);
    throw error;
  }
}

async function supportReplyWithUser(payload, opts) {
  try {
    const gid = String(opts?.global_user_id || '').trim();
    const { data } = await client.post('/ai/support/reply', payload, {
      headers: gid ? { 'x-global-user-id': gid } : {},
    });
    return data.data;
  } catch (error) {
    console.error('aiOrchestratorService.supportReply error:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = {
  supportReply,
  supportReplyWithUser,
};
