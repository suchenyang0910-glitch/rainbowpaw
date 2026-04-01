import { performance } from 'node:perf_hooks'

function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i]
    if (!a.startsWith('--')) continue
    const k = a.slice(2)
    const v = argv[i + 1]
    if (!v || v.startsWith('--')) {
      out[k] = true
      continue
    }
    out[k] = v
    i += 1
  }
  return out
}

function ms(n) {
  return `${Math.round(n)}ms`
}

function pct(a, b) {
  if (!b) return '0%'
  return `${((a / b) * 100).toFixed(2)}%`
}

function quantile(sorted, q) {
  if (!sorted.length) return 0
  const pos = (sorted.length - 1) * q
  const base = Math.floor(pos)
  const rest = pos - base
  const v0 = sorted[base]
  const v1 = sorted[Math.min(base + 1, sorted.length - 1)]
  return v0 + (v1 - v0) * rest
}

function normalizeBase(base) {
  const b = String(base || '').trim().replace(/\/+$/, '')
  if (!b) throw new Error('missing --base')
  if (!/^https?:\/\//i.test(b)) throw new Error('base must start with http(s)://')
  return b
}

function toUrl(base, path) {
  const p = String(path || '')
  if (!p) return base
  if (p.startsWith('http://') || p.startsWith('https://')) return p
  return `${base}${p.startsWith('/') ? '' : '/'}${p}`
}

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms))
}

async function fetchOnce(spec, ctx) {
  const url = toUrl(ctx.base, spec.path)
  const t0 = performance.now()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), ctx.timeoutMs)
  let status = 0
  let ok = false
  let err = ''
  try {
    const hdr = { ...ctx.headers, ...(spec.headers || {}) }
    if (spec.body && !hdr['content-type'] && !hdr['Content-Type']) {
      hdr['content-type'] = 'application/json'
    }
    const res = await fetch(url, {
      method: spec.method || 'GET',
      headers: hdr,
      body: spec.body ? JSON.stringify(spec.body) : undefined,
      signal: controller.signal,
    })
    status = res.status
    ok = res.ok
    if (spec.expectJson) {
      const data = await res.json().catch(() => null)
      if (data && typeof data === 'object' && typeof data.code === 'number') {
        ok = ok && data.code === 0
      }
    } else {
      await res.arrayBuffer().catch(() => null)
    }
  } catch (e) {
    err = e && e.name ? String(e.name) : 'Error'
  } finally {
    clearTimeout(timeout)
  }
  const t1 = performance.now()
  return { url, path: spec.path, ms: t1 - t0, status, ok, err }
}

function buildDefaultTargets(includeWrites) {
  return [
    { name: 'site_home', method: 'GET', path: '/', expectJson: false },
    { name: 'mini_aftercare', method: 'GET', path: '/rainbowpaw', expectJson: false },
    { name: 'mini_claw', method: 'GET', path: '/rainbowpawclaw', expectJson: false },
    { name: 'admin', method: 'GET', path: '/admin/', expectJson: false },

    { name: 'api_products_en', method: 'GET', path: '/api/marketplace/products?lang=en', expectJson: true },
    { name: 'api_products_km', method: 'GET', path: '/api/marketplace/products?lang=km', expectJson: true },
    { name: 'api_product_101_en', method: 'GET', path: '/api/marketplace/products/101?lang=en', expectJson: true },
    { name: 'api_me_dev', method: 'GET', path: '/api/me', headers: { 'x-dev-telegram-id': '123456' }, expectJson: true },
    ...(includeWrites
      ? [
          {
            name: 'api_create_order_idem',
            method: 'POST',
            path: '/api/marketplace/orders',
            headers: { 'x-idempotency-key': 'loadtest-order-1' },
            body: {
              phone: 'lt_1',
              order_type: 'product',
              product_items: [{ product_id: 101, quantity: 1 }],
            },
            expectJson: true,
          },
          {
            name: 'api_pay_plays_idem',
            method: 'POST',
            path: '/api/payments/plays',
            headers: { 'x-idempotency-key': 'loadtest-pay-1' },
            body: { bundle: 1 },
            expectJson: true,
          },
        ]
      : []),
  ]
}

async function runLoad({ base, concurrency, durationSec, timeoutMs, headers, targets }) {
  const startedAt = Date.now()
  const stopAt = startedAt + durationSec * 1000
  const results = []
  const perTarget = new Map()
  for (const t of targets) perTarget.set(t.name, { t, ok: 0, fail: 0, timeouts: 0, statuses: new Map(), lat: [] })

  const ctx = { base, timeoutMs, headers }

  async function worker(workerId) {
    let idx = workerId % targets.length
    while (Date.now() < stopAt) {
      const spec = targets[idx]
      idx = (idx + 1) % targets.length
      const r = await fetchOnce(spec, ctx)
      results.push(r)
      const bucket = perTarget.get(spec.name)
      if (bucket) {
        bucket.lat.push(r.ms)
        if (r.ok) bucket.ok += 1
        else bucket.fail += 1
        if (r.err === 'AbortError') bucket.timeouts += 1
        const k = r.err ? `ERR:${r.err}` : String(r.status)
        bucket.statuses.set(k, (bucket.statuses.get(k) || 0) + 1)
      }
      if (results.length % 200 === 0) await sleep(0)
    }
  }

  const workers = []
  for (let i = 0; i < concurrency; i += 1) workers.push(worker(i))
  await Promise.all(workers)

  const endedAt = Date.now()
  const elapsedMs = endedAt - startedAt
  const total = results.length
  const ok = results.filter((x) => x.ok).length
  const fail = total - ok
  const allLat = results.map((x) => x.ms).sort((a, b) => a - b)
  const rps = elapsedMs > 0 ? (total / (elapsedMs / 1000)) : 0

  const summary = {
    base,
    concurrency,
    durationSec,
    timeoutMs,
    total,
    ok,
    fail,
    okRate: pct(ok, total),
    rps: Number(rps.toFixed(2)),
    p50: quantile(allLat, 0.5),
    p90: quantile(allLat, 0.9),
    p95: quantile(allLat, 0.95),
    p99: quantile(allLat, 0.99),
    max: allLat.length ? allLat[allLat.length - 1] : 0,
  }

  const byTarget = []
  for (const b of perTarget.values()) {
    const lat = b.lat.sort((a, c) => a - c)
    const totalT = b.ok + b.fail
    const statuses = [...b.statuses.entries()].sort((a, c) => c[1] - a[1]).slice(0, 6)
    byTarget.push({
      name: b.t.name,
      path: b.t.path,
      total: totalT,
      ok: b.ok,
      fail: b.fail,
      okRate: pct(b.ok, totalT),
      timeouts: b.timeouts,
      p50: quantile(lat, 0.5),
      p95: quantile(lat, 0.95),
      max: lat.length ? lat[lat.length - 1] : 0,
      topStatuses: statuses,
    })
  }
  byTarget.sort((a, b) => b.fail - a.fail || b.max - a.max)

  return { summary, byTarget }
}

function printReport(report) {
  const s = report.summary
  process.stdout.write(`\nBase: ${s.base}\n`)
  process.stdout.write(`Concurrency: ${s.concurrency}, Duration: ${s.durationSec}s, Timeout: ${s.timeoutMs}ms\n`)
  process.stdout.write(`Total: ${s.total}, OK: ${s.ok}, Fail: ${s.fail}, OK%: ${s.okRate}, RPS: ${s.rps}\n`)
  process.stdout.write(`Latency: p50 ${ms(s.p50)}, p90 ${ms(s.p90)}, p95 ${ms(s.p95)}, p99 ${ms(s.p99)}, max ${ms(s.max)}\n`)
  process.stdout.write(`\nBy target (sorted by fail/max):\n`)
  for (const t of report.byTarget) {
    process.stdout.write(
      `- ${t.name} ${t.path} | total ${t.total} ok ${t.ok} fail ${t.fail} ok% ${t.okRate} timeouts ${t.timeouts} | p50 ${ms(t.p50)} p95 ${ms(t.p95)} max ${ms(t.max)}\n`,
    )
    if (t.fail > 0 && t.topStatuses.length) {
      process.stdout.write(`  statuses: ${t.topStatuses.map(([k, v]) => `${k}:${v}`).join(' ')}\n`)
    }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const base = normalizeBase(args.base)
  const concurrency = Math.max(1, Math.min(500, Number(args.concurrency || 20)))
  const durationSec = Math.max(5, Math.min(600, Number(args.duration || 30)))
  const timeoutMs = Math.max(1000, Math.min(60000, Number(args.timeout || 15000)))
  const headers = { 'user-agent': String(args.ua || 'rainbowpaw-loadtest/1.0'), accept: '*/*' }
  const includeWrites = String(args['include-writes'] || 'false').toLowerCase() === 'true'
  const targets = buildDefaultTargets(includeWrites)
  const report = await runLoad({ base, concurrency, durationSec, timeoutMs, headers, targets })
  printReport(report)

  if (args.json) {
    process.stdout.write(`\nJSON:\n${JSON.stringify(report, null, 2)}\n`)
  }
}

main().catch((e) => {
  process.stderr.write(`${e && e.stack ? e.stack : String(e)}\n`)
  process.exitCode = 1
})
