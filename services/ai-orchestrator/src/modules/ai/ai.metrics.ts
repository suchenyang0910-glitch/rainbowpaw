import { Injectable } from '@nestjs/common';

type MetricEvent = {
  ts: number;
  role: string;
  status: 'ok' | 'error' | 'fallback';
  latency_ms: number | null;
  model: string | null;
};

@Injectable()
export class AiMetricsStore {
  private events: MetricEvent[] = [];

  record(evt: Omit<MetricEvent, 'ts'>) {
    const e: MetricEvent = { ts: Date.now(), ...evt };
    this.events.push(e);
    if (this.events.length > 5000) this.events.splice(0, this.events.length - 5000);
  }

  snapshot(windowSeconds = 300) {
    const now = Date.now();
    const cutoff = now - Math.max(10, Number(windowSeconds || 300)) * 1000;
    const list = this.events.filter((e) => e.ts >= cutoff);
    const total = list.length;
    const ok = list.filter((e) => e.status === 'ok').length;
    const error = list.filter((e) => e.status === 'error').length;
    const fallback = list.filter((e) => e.status === 'fallback').length;

    const lat = list
      .map((e) => e.latency_ms)
      .filter((n) => typeof n === 'number' && Number.isFinite(n)) as number[];
    lat.sort((a, b) => a - b);
    const p = (q: number) => {
      if (!lat.length) return null;
      const i = Math.min(lat.length - 1, Math.max(0, Math.floor(q * (lat.length - 1))));
      return lat[i];
    };

    const byRole: Record<string, any> = {};
    for (const e of list) {
      if (!byRole[e.role]) byRole[e.role] = { total: 0, ok: 0, error: 0, fallback: 0 };
      byRole[e.role].total += 1;
      byRole[e.role][e.status] += 1;
    }

    return {
      now_ms: now,
      window_seconds: Math.max(10, Number(windowSeconds || 300)),
      total,
      ok,
      error,
      fallback,
      error_rate: total ? error / total : 0,
      fallback_rate: total ? fallback / total : 0,
      p50_latency_ms: p(0.5),
      p95_latency_ms: p(0.95),
      by_role: byRole,
    };
  }
}

