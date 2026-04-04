const axios = require('axios');
const config = require('../config');
const { createHash } = require('crypto');

const client = axios.create({
  baseURL: config.bridgeServiceBaseUrl,
  headers: {
    Authorization: `Bearer ${config.internalToken}`,
    'Content-Type': 'application/json',
  },
});

async function reportEvent(payload) {
  try {
    const raw = payload && typeof payload === 'object' ? payload : {};
    const event_name = String(raw.event_name || '').trim();
    const global_user_id = String(raw.global_user_id || '').trim();
    const source_bot = String(raw.source_bot || '').trim() || 'unknown';
    const telegram_id =
      typeof raw.telegram_id === 'number' ? raw.telegram_id : Number(raw.telegram_id || 0) || null;
    const event_data = raw.event_data && typeof raw.event_data === 'object' ? raw.event_data : {};

    const session_id =
      String(event_data.session_id || '').trim() ||
      (telegram_id ? `tg_${telegram_id}` : null);

    const stable = {
      event_name,
      global_user_id,
      source_bot,
      telegram_id,
      source_user_id: raw.source_user_id || null,
      action_id: event_data.action_id || event_data.message_id || event_data.callback_query_id || event_data.order_id || null,
      country: event_data.country || null,
      city: event_data.city || null,
      language: event_data.language || null,
      session_id,
    };
    const idempotency_key =
      String(raw.idempotency_key || '').trim() ||
      String(event_data.idempotency_key || '').trim() ||
      `evt_${createHash('sha256').update(JSON.stringify(stable)).digest('hex').slice(0, 24)}`;

    const normalized = {
      ...raw,
      event_name,
      global_user_id,
      source_bot,
      telegram_id: telegram_id || undefined,
      idempotency_key,
      event_data: {
        ...event_data,
        session_id: session_id || event_data.session_id || null,
        utm: event_data.utm && typeof event_data.utm === 'object' ? event_data.utm : {},
        ref: event_data.ref && typeof event_data.ref === 'object' ? event_data.ref : {},
        idempotency_key,
      },
    };

    const { data } = await client.post('/bridge/events', normalized);
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

async function parseDeepLink(token, opts) {
  try {
    const rawToken = String(token || '').trim();
    const params = new URLSearchParams();
    if (opts && typeof opts === 'object') {
      if (opts.to_bot) params.set('to_bot', String(opts.to_bot));
      if (typeof opts.consume === 'boolean') params.set('consume', String(opts.consume));
    }

    const qs = params.toString();
    const { data } = await client.get(`/bridge/deep-link/${encodeURIComponent(rawToken)}${qs ? `?${qs}` : ''}`);
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
