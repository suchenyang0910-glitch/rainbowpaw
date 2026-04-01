const rainbowBot = require('../bots/rainbowBot');
const config = require('../config');
const aiOrchestratorService = require('../services/aiOrchestratorService');

function fmtPct(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return '0%';
  return `${Math.round(n * 100)}%`;
}

function buildText(s) {
  return (
    `AI告警（最近${s.window_seconds}s）\n` +
    `total=${s.total} ok=${s.ok} error=${s.error} fallback=${s.fallback}\n` +
    `error_rate=${fmtPct(s.error_rate)} fallback_rate=${fmtPct(s.fallback_rate)}\n` +
    `p50=${s.p50_latency_ms ?? '-'}ms p95=${s.p95_latency_ms ?? '-'}ms`
  );
}

function registerAiMonitor() {
  if (!rainbowBot) return;
  const admins = Array.isArray(config.adminTelegramIds)
    ? config.adminTelegramIds.filter((n) => Number.isFinite(n))
    : [];
  if (!admins.length) return;

  const intervalMs = Math.max(60000, Number(config.aiAlertIntervalMs || 300000));
  const minReq = Math.max(1, Number(config.aiAlertMinRequests || 20));
  const thrErr = Math.max(0, Number(config.aiAlertErrorRate || 0.2));
  const thrFb = Math.max(0, Number(config.aiAlertFallbackRate || 0.3));

  let lastSentAt = 0;
  let lastSignature = '';

  async function tick() {
    try {
      const s = await aiOrchestratorService.getMetrics();
      const shouldAlert =
        s &&
        Number(s.total || 0) >= minReq &&
        (Number(s.error_rate || 0) >= thrErr || Number(s.fallback_rate || 0) >= thrFb);
      if (!shouldAlert) return;

      const signature = `${Math.round(Number(s.error_rate || 0) * 100)}-${Math.round(
        Number(s.fallback_rate || 0) * 100,
      )}-${Number(s.total || 0)}`;

      const now = Date.now();
      if (signature === lastSignature && now - lastSentAt < intervalMs) return;
      lastSignature = signature;
      lastSentAt = now;

      const text = buildText(s);
      for (const id of admins) {
        await rainbowBot.sendMessage(id, text);
      }
    } catch {
    }
  }

  setTimeout(tick, 5000);
  setInterval(tick, intervalMs);
}

module.exports = registerAiMonitor;

