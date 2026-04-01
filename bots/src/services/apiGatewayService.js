const axios = require('axios');
const config = require('../config');

const client = axios.create({
  baseURL: String(config.apiGatewayBaseUrl || '').trim(),
  headers: {
    'Content-Type': 'application/json',
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

module.exports = {
  marketplaceProducts,
};

