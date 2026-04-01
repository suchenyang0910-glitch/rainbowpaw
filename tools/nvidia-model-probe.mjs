const baseUrl = String(process.env.AI_BASE_URL || 'https://integrate.api.nvidia.com')
  .trim()
  .replace(/\/$/, '');
const apiKey = String(process.env.AI_API_KEY || '').trim();

if (!apiKey) {
  console.error('missing AI_API_KEY');
  process.exit(1);
}

const endpoints = {
  chat: String(process.env.AI_CHAT_COMPLETIONS_PATH || '/v1/chat/completions').trim(),
  embeddings: String(process.env.AI_EMBEDDINGS_PATH || '/v1/embeddings').trim(),
  ranking: String(process.env.AI_RERANK_PATH || '/v1/ranking').trim(),
  extract: String(process.env.AI_PII_PATH || '/v1/extract').trim(),
};

const models = {
  default: String(process.env.AI_MODEL || '').trim(),
  support: String(process.env.AI_MODEL_SUPPORT_AI || '').trim(),
  growth: String(process.env.AI_MODEL_GROWTH_AI || '').trim(),
  product: String(process.env.AI_MODEL_PRODUCT_AI || '').trim(),
  ops: String(process.env.AI_MODEL_OPS_AI || '').trim(),
  risk: String(process.env.AI_MODEL_RISK_AI || '').trim(),
  recommend: String(process.env.AI_MODEL_RECOMMEND_AI || '').trim(),
  embed: String(process.env.AI_EMBED_MODEL || '').trim(),
  rerank: String(process.env.AI_RERANK_MODEL || '').trim(),
  pii: String(process.env.AI_PII_MODEL || '').trim(),
};

async function postJson(path, body) {
  const url = baseUrl + (path.startsWith('/') ? path : `/${path}`);
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {}
  return { status: res.status, text, json };
}

async function main() {
  console.log(JSON.stringify({ baseUrl, endpoints, models }, null, 2));

  const chatModel = models.support || models.default;
  if (chatModel) {
    const r = await postJson(endpoints.chat, {
      model: chatModel,
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 16,
      temperature: 0,
    });
    console.log('chat', r.status);
    if (r.status >= 400) console.log(r.text);
  }

  if (models.embed) {
    const r = await postJson(endpoints.embeddings, {
      model: models.embed,
      input: ['ping'],
      input_type: 'query',
    });
    console.log('embeddings', r.status);
    if (r.status >= 400) console.log(r.text);
  }

  if (models.rerank) {
    const r = await postJson(endpoints.ranking, {
      model: models.rerank,
      query: 'ping',
      documents: ['ping'],
      top_n: 1,
    });
    console.log('ranking', r.status);
    if (r.status >= 400) console.log(r.text);
  }

  if (models.pii) {
    const r = await postJson(endpoints.extract, {
      model: models.pii,
      input: 'my phone is 123-456-7890',
    });
    console.log('extract', r.status);
    if (r.status >= 400) console.log(r.text);
  }
}

main().catch((e) => {
  console.error(String(e?.stack || e));
  process.exit(1);
});

