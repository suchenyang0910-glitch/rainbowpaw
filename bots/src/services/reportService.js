const axios = require('axios');
const config = require('../config');

const client = axios.create({
  baseURL: config.reportServiceBaseUrl,
  headers: {
    Authorization: `Bearer ${config.internalToken}`,
    'Content-Type': 'application/json',
  },
});

async function getDaily() {
  const { data } = await client.get('/reports/daily');
  return data.data;
}

async function getProfit() {
  const { data } = await client.get('/reports/profit');
  return data.data;
}

module.exports = {
  getDaily,
  getProfit,
};
