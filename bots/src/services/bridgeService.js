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
  try {
    const { data } = await client.post('/bridge/events', payload);
    return data.data;
  } catch (error) {
    console.error('bridgeService.reportEvent error:', error.response?.data || error.message);
    throw error;
  }
}

async function generateLink(payload) {
  try {
    const { data } = await client.post('/bridge/generate-link', payload);
    return data.data;
  } catch (error) {
    console.error('bridgeService.generateLink error:', error.response?.data || error.message);
    throw error;
  }
}

async function parseDeepLink(token) {
  try {
    const { data } = await client.get(
      `/bridge/deep-link/${encodeURIComponent(String(token || '').trim())}`,
    );
    return data.data;
  } catch (error) {
    console.error('bridgeService.parseDeepLink error:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = {
  reportEvent,
  generateLink,
  parseDeepLink,
};
