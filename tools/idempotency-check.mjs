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

function normalizeBase(base) {
  const b = String(base || '').trim().replace(/\/+$/, '')
  if (!b) throw new Error('missing --base')
  if (!/^https?:\/\//i.test(b)) throw new Error('base must start with http(s)://')
  return b
}

function nowId() {
  return `t_${Date.now()}_${Math.floor(Math.random() * 1e6)}`
}

async function fetchJson(url, init) {
  const res = await fetch(url, init)
  const txt = await res.text()
  let json = null
  try {
    json = JSON.parse(txt)
  } catch {
    json = null
  }
  return { status: res.status, ok: res.ok, json, text: txt }
}

async function burst({ name, url, method, headers, body, concurrency, timeoutMs }) {
  const results = []
  const controller = new AbortController()
  const started = performance.now()

  const init = {
    method,
    headers: { ...headers },
    body: body ? JSON.stringify(body) : undefined,
    signal: controller.signal,
  }
  if (body && !init.headers['content-type'] && !init.headers['Content-Type']) {
    init.headers['content-type'] = 'application/json'
  }

  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    await Promise.all(
      Array.from({ length: concurrency }).map(async () => {
        const r = await fetchJson(url, init).catch((e) => ({ status: 0, ok: false, json: null, text: String(e && e.name ? e.name : 'Error') }))
        results.push(r)
      }),
    )
  } finally {
    clearTimeout(timer)
  }

  const ended = performance.now()
  const ok = results.filter((r) => r.json && r.json.code === 0).length
  const fail = results.length - ok
  return { name, ms: ended - started, ok, fail, results }
}

function uniq(values) {
  const s = new Set()
  for (const v of values) s.add(v)
  return [...s]
}

async function getWallet(base, devTelegramId) {
  const r = await fetchJson(`${base}/api/me`, { headers: { 'x-dev-telegram-id': devTelegramId } })
  if (!r.json || r.json.code !== 0) return null
  return r.json.data && r.json.data.wallet ? r.json.data.wallet : null
}

async function addPlays(base, devTelegramId, count) {
  return fetchJson(`${base}/api/dev/plays/add`, {
    method: 'POST',
    headers: { 'x-dev-telegram-id': devTelegramId, 'content-type': 'application/json', 'x-idempotency-key': `devAdd:${devTelegramId}:${nowId()}` },
    body: JSON.stringify({ count }),
  })
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const base = normalizeBase(args.base)
  const concurrency = Math.max(2, Math.min(500, Number(args.concurrency || 50)))
  const timeoutMs = Math.max(3000, Math.min(60000, Number(args.timeout || 15000)))
  const includeWallet = String(args['include-wallet'] || 'false').toLowerCase() === 'true'
  const devTelegramId = String(args.telegram || '999001')

  const orderIdem = String(args['order-key'] || `idem-order-${nowId()}`)
  const payIdem = String(args['pay-key'] || `idem-pay-${nowId()}`)
  const purchaseIdem = String(args['purchase-key'] || `idem-purchase-${nowId()}`)

  const orderBurst = await burst({
    name: 'marketplace/orders idempotency',
    url: `${base}/api/marketplace/orders`,
    method: 'POST',
    headers: { 'x-idempotency-key': orderIdem },
    body: { phone: 'idem_phone', order_type: 'product', product_items: [{ product_id: 101, quantity: 1 }] },
    concurrency,
    timeoutMs,
  })

  const orderIds = uniq(
    orderBurst.results
      .map((r) => (r && r.json && r.json.data ? r.json.data.order_id : null))
      .filter((x) => x),
  )

  const payBurst = await burst({
    name: 'payments/plays idempotency',
    url: `${base}/api/payments/plays`,
    method: 'POST',
    headers: { 'x-idempotency-key': payIdem },
    body: { bundle: 1 },
    concurrency,
    timeoutMs,
  })

  const payIds = uniq(
    payBurst.results
      .map((r) => (r && r.json && r.json.data ? r.json.data.display_id : null))
      .filter((x) => x),
  )

  const report = {
    base,
    concurrency,
    timeoutMs,
    order: { ok: orderBurst.ok, fail: orderBurst.fail, unique_order_ids: orderIds.length, order_id: orderIds[0] || null },
    pay: { ok: payBurst.ok, fail: payBurst.fail, unique_display_ids: payIds.length, display_id: payIds[0] || null },
    wallet: null,
  }

  if (includeWallet) {
    const before = await getWallet(base, devTelegramId)
    await addPlays(base, devTelegramId, 10)
    const mid = await getWallet(base, devTelegramId)
    const pBurst = await burst({
      name: 'purchase/direct idempotency',
      url: `${base}/api/purchase/direct`,
      method: 'POST',
      headers: { 'x-dev-telegram-id': devTelegramId, 'x-idempotency-key': purchaseIdem },
      body: { product_id: 101 },
      concurrency,
      timeoutMs,
    })
    const after = await getWallet(base, devTelegramId)
    const purchaseOrderIds = uniq(
      pBurst.results
        .map((r) => (r && r.json && r.json.data ? r.json.data.order_id : null))
        .filter((x) => x),
    )
    report.wallet = {
      devTelegramId,
      before,
      after,
      purchase: { ok: pBurst.ok, fail: pBurst.fail, unique_order_ids: purchaseOrderIds.length, order_id: purchaseOrderIds[0] || null },
      points_total_delta:
        before && after && typeof before.points_total === 'number' && typeof after.points_total === 'number'
          ? after.points_total - before.points_total
          : null,
      points_locked_delta:
        before && after && typeof before.points_locked === 'number' && typeof after.points_locked === 'number'
          ? after.points_locked - before.points_locked
          : null,
    }
  }

  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)

  if (report.order.unique_order_ids !== 1 || report.pay.unique_display_ids !== 1) {
    process.exitCode = 2
  }
  if (includeWallet && report.wallet && report.wallet.purchase.unique_order_ids !== 1) {
    process.exitCode = 2
  }
}

main().catch((e) => {
  process.stderr.write(`${e && e.stack ? e.stack : String(e)}\n`)
  process.exitCode = 1
})
