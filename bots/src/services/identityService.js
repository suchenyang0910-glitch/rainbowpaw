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
  try {
    const { data } = await client.post('/identity/link-user', payload);
    return data.data;
  } catch (error) {
    console.error('identityService.linkUser error:', error.response?.data || error.message);
    throw error;
  }
}

async function getProfile(globalUserId) {
  try {
    const { data } = await client.get(`/identity/profile/${globalUserId}`);
    return data.data;
  } catch (error) {
    console.error('identityService.getProfile error:', error.response?.data || error.message);
    throw error;
  }
}

async function upsertTags(payload) {
  try {
    const { data } = await client.post('/identity/tags/upsert', payload);
    return data.data;
  } catch (error) {
    console.error('identityService.upsertTags error:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = {
  linkUser,
  getProfile,
  upsertTags,
};