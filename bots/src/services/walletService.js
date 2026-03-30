const axios = require('axios');
const config = require('../config');
const crypto = require('crypto');

const client = axios.create({
  baseURL: config.walletServiceBaseUrl,
  headers: {
    Authorization: `Bearer ${config.internalToken}`,
    'Content-Type': 'application/json',
  },
});

async function getWallet(globalUserId) {
  try {
    const { data } = await client.get(`/wallet/${globalUserId}`);
    return data.data;
  } catch (error) {
    console.error('walletService.getWallet error:', error.response?.data || error.message);
    throw error;
  }
}

async function earn(payload) {
  try {
    const idem = `bots-earn-${crypto.randomUUID()}`;
    const { data } = await client.post('/wallet/earn', payload, {
      headers: {
        'x-idempotency-key': idem,
      },
    });
    return data.data;
  } catch (error) {
    console.error('walletService.earn error:', error.response?.data || error.message);
    throw error;
  }
}

async function spend(payload) {
  try {
    const idem = `bots-spend-${crypto.randomUUID()}`;
    const { data } = await client.post('/wallet/spend', payload, {
      headers: {
        'x-idempotency-key': idem,
      },
    });
    return data.data;
  } catch (error) {
    console.error('walletService.spend error:', error.response?.data || error.message);
    throw error;
  }
}

async function recycle(payload) {
  try {
    const idem = `bots-recycle-${crypto.randomUUID()}`;
    const { data } = await client.post('/wallet/recycle', payload, {
      headers: {
        'x-idempotency-key': idem,
      },
    });
    return data.data;
  } catch (error) {
    console.error('walletService.recycle error:', error.response?.data || error.message);
    throw error;
  }
}

async function withdraw(payload) {
  try {
    const idem = `bots-withdraw-${crypto.randomUUID()}`;
    const { data } = await client.post('/wallet/withdraw', payload, {
      headers: {
        'x-idempotency-key': idem,
      },
    });
    return data.data;
  } catch (error) {
    console.error('walletService.withdraw error:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = {
  getWallet,
  earn,
  spend,
  recycle,
  withdraw,
};
