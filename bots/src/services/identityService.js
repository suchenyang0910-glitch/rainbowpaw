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

async function updatePetProfile(globalUserId, payload) {
  try {
    const { data } = await client.post(`/identity/profile/${globalUserId}/pet`, payload);
    
    // Auto tag elder pet logic here (or better, handled in the identity-service backend)
    if (payload.petAgeStage === '7+' || payload.petAgeStage === 'elder') {
      await upsertTags({
        global_user_id: globalUserId,
        tags: [{ tag_key: 'elder_pet', tag_value: 'true' }]
      });
    }
    
    return data.data;
  } catch (error) {
    console.error('identityService.updatePetProfile error:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = {
  linkUser,
  getProfile,
  updatePetProfile,
  upsertTags,
};