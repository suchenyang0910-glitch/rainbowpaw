const apiGatewayService = require('./apiGatewayService');
const identityService = require('./identityService');
const walletService = require('./walletService');

function normalizeTags(tags) {
  const arr = Array.isArray(tags) ? tags : [];
  return arr
    .map((t) => String(t?.tag_key || t?.tag_value || '').trim())
    .filter(Boolean)
    .slice(0, 20);
}

function normalizeProducts(items) {
  const list = Array.isArray(items) ? items : [];
  return list
    .map((p) => {
      const priceCents = Number(p?.price_cents);
      const price = Number.isFinite(priceCents) ? Math.round(priceCents) / 100 : null;
      return {
        id: p?.id,
        title: String(p?.name || '').trim(),
        category: String(p?.category || '').trim(),
        price,
        sales_7d: Number(p?.sales_7d || 0),
      };
    })
    .filter((p) => p.id != null && p.title)
    .sort((a, b) => Number(b.sales_7d || 0) - Number(a.sales_7d || 0))
    .slice(0, 20);
}

async function buildRecommendPayload(params) {
  const globalUserId = String(params.global_user_id || '').trim();
  const recentActions = Array.isArray(params.recent_actions)
    ? params.recent_actions.map((x) => String(x || '').trim()).filter(Boolean)
    : [];
  const lastResult = params.last_result && typeof params.last_result === 'object' ? params.last_result : {};

  const [profile, wallet, products] = await Promise.all([
    identityService.getProfile(globalUserId).catch(() => null),
    walletService.getWallet(globalUserId).catch(() => null),
    apiGatewayService.marketplaceProducts({}).catch(() => []),
  ]);

  const candidateEntries = ['claw', 'shop', 'group', 'memorial'];

  return {
    user_profile: {
      global_user_id: globalUserId,
      pet_type: profile?.pet_type || null,
      spend_level: profile?.spend_level || null,
      wallet_balance: wallet?.points_total ?? null,
      tags: normalizeTags(profile?.tags),
    },
    recent_actions: recentActions,
    last_result: lastResult,
    candidate_products: normalizeProducts(products),
    candidate_entries: candidateEntries,
  };
}

module.exports = {
  buildRecommendPayload,
};

