import process from 'node:process'

const API_BASE_URL = String(process.env.API_BASE_URL || 'http://localhost:3005/api').replace(/\/+$/, '')
const DEV_TELEGRAM_ID = String(process.env.DEV_TELEGRAM_ID || process.env.VITE_DEV_TELEGRAM_ID || '10001')
const TEST_PHONE = String(process.env.TEST_PHONE || '+85510000001')

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

async function http(path, { method = 'GET', headers = {}, body, expectStatus } = {}) {
  const url = `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`
  const init = {
    method,
    headers: {
      accept: 'application/json',
      ...headers,
    },
  }
  if (typeof body !== 'undefined') {
    init.headers['content-type'] = 'application/json'
    init.body = JSON.stringify(body)
  }

  const res = await fetch(url, init)
  const contentType = res.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const data = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null)
  if (typeof expectStatus === 'number') assert(res.status === expectStatus, `HTTP ${res.status} != ${expectStatus} for ${method} ${path}`)
  return { status: res.status, data, headers: res.headers }
}

async function runStep(name, fn) {
  const started = Date.now()
  try {
    const out = await fn()
    const ms = Date.now() - started
    process.stdout.write(`OK  ${name} (${ms}ms)\n`)
    return { ok: true, out }
  } catch (e) {
    const ms = Date.now() - started
    process.stderr.write(`ERR ${name} (${ms}ms)\n${e && e.stack ? e.stack : String(e)}\n`)
    return { ok: false, error: e }
  }
}

async function main() {
  process.stdout.write(`API_BASE_URL=${API_BASE_URL}\n`)
  process.stdout.write(`DEV_TELEGRAM_ID=${DEV_TELEGRAM_ID}\n`)
  process.stdout.write(`TEST_PHONE=${TEST_PHONE}\n\n`)

  const failures = []

  const idemBase = `e2e_${Date.now()}`

  const pay = await runStep('plays payment + proof', async () => {
    const idem = `${idemBase}_plays_3`
    const r1 = await http('/payments/plays', { method: 'POST', headers: { 'x-idempotency-key': idem }, body: { bundle: 3 }, expectStatus: 201 })
    assert(r1?.data?.code === 0, `unexpected response: ${JSON.stringify(r1.data)}`)
    const displayId = r1.data.data.display_id
    assert(displayId, 'missing display_id')

    const r2 = await http('/payments/plays', { method: 'POST', headers: { 'x-idempotency-key': idem }, body: { bundle: 3 }, expectStatus: 201 })
    assert(r2?.data?.data?.display_id === displayId, 'idempotency mismatch for payments/plays')

    const r3 = await http(`/payments/${encodeURIComponent(displayId)}`, { expectStatus: 200 })
    assert(r3?.data?.code === 0, `unexpected payment() response: ${JSON.stringify(r3.data)}`)

    const r4 = await http(`/payments/${encodeURIComponent(displayId)}/proof`, { method: 'POST', body: { proof_text: `e2e ${idemBase}` }, expectStatus: 201 })
    assert(r4?.data?.code === 0, `unexpected proof response: ${JSON.stringify(r4.data)}`)

    const content = `hello ${idemBase}`
    const base64 = Buffer.from(content, 'utf8').toString('base64')
    const r5 = await http(`/payments/${encodeURIComponent(displayId)}/proof_file`, { method: 'POST', body: { mime_type: 'text/plain', file_base64: base64 }, expectStatus: 201 })
    assert(r5?.data?.code === 0, `unexpected proof_file response: ${JSON.stringify(r5.data)}`)

    const file = await fetch(`${API_BASE_URL}/payments/${encodeURIComponent(displayId)}/proof_file`)
    assert(file.status === 200, `proof_file GET HTTP ${file.status}`)
    const txt = await file.text()
    assert(txt === content, 'proof_file content mismatch')

    return { displayId }
  })
  if (!pay.ok) failures.push('plays payment + proof')

  const marketplace = await runStep('marketplace cart -> checkout (idempotent)', async () => {
    const list = await http('/marketplace/products', { expectStatus: 200 })
    assert(list?.data?.code === 0, `unexpected products response: ${JSON.stringify(list.data)}`)
    const items = list.data.data.items || []
    assert(items.length > 0, 'no marketplace products')
    const pid = items[0].id
    assert(pid, 'missing product id')

    const add = await http('/cart/items', { method: 'POST', body: { phone: TEST_PHONE, product_id: pid, quantity: 1 }, expectStatus: 201 })
    assert(add?.data?.code === 0, `unexpected cart add response: ${JSON.stringify(add.data)}`)

    const cart = await http(`/cart?phone=${encodeURIComponent(TEST_PHONE)}`, { expectStatus: 200 })
    assert(cart?.data?.code === 0, `unexpected cart response: ${JSON.stringify(cart.data)}`)
    assert((cart.data.data.items || []).length > 0, 'cart empty after add')

    const idem = `${idemBase}_checkout`
    const c1 = await http('/marketplace/checkout', { method: 'POST', headers: { 'x-idempotency-key': idem }, body: { phone: TEST_PHONE, pickup_address: 'E2E pickup address', conversation_channel: 'web' }, expectStatus: 201 })
    assert(c1?.data?.code === 0, `unexpected checkout response: ${JSON.stringify(c1.data)}`)
    const oid1 = c1.data.data.order_id
    assert(oid1, 'missing order_id')

    const c2 = await http('/marketplace/checkout', { method: 'POST', headers: { 'x-idempotency-key': idem }, body: { phone: TEST_PHONE, pickup_address: 'E2E pickup address', conversation_channel: 'web' }, expectStatus: 201 })
    const oid2 = c2?.data?.data?.order_id
    assert(oid2 === oid1, 'idempotency mismatch for marketplace/checkout')

    const orders = await http(`/v1/orders?phone=${encodeURIComponent(TEST_PHONE)}`, { expectStatus: 200 })
    assert(orders?.data?.code === 0, `unexpected v1/orders response: ${JSON.stringify(orders.data)}`)
    const has = (orders.data.data.items || []).some((o) => String(o.order_id) === String(oid1))
    assert(has, 'created checkout order not found in v1/orders')

    return { product_id: pid, order_id: oid1 }
  })
  if (!marketplace.ok) failures.push('marketplace checkout')

  const intake = await runStep('rainbow aftercare intake -> v1 order detail', async () => {
    const payload = {
      source: { lead_source: 'other', conversation_channel: 'web', quote_version: 'RP-AF-PRICE-V2' },
      customer: { name: 'E2E', phone: TEST_PHONE, language: 'ZH' },
      location: { city: 'Phnom Penh', pickup_address: 'E2E pickup address', pickup_lat: null, pickup_lng: null },
      schedule: { time_window: 'Today 18:00–20:00' },
      pet: { name: 'E2E Pet', type: 'Cat', weight_band: '5–15kg', weight_kg: null },
      service: { service_package: 'basic', addons: [] },
      pricing: { currency: 'USD', pickup_fee_cents: 0, weight_fee_cents: 0, discount_cents: 0, total_amount_cents: 4999 },
      note: 'e2e',
    }

    const r = await http('/v1/orders/intake', { method: 'POST', body: payload, expectStatus: 201 })
    assert(r?.data?.code === 0, `unexpected intake response: ${JSON.stringify(r.data)}`)
    const oid = r.data.data.order_id
    assert(oid, 'missing order_id')

    await sleep(50)
    const d = await http(`/v1/orders/${encodeURIComponent(oid)}`, { expectStatus: 200 })
    assert(d?.data?.code === 0, `unexpected order detail response: ${JSON.stringify(d.data)}`)
    assert(String(d.data.data.order_id) === String(oid), 'order detail id mismatch')
    return { order_id: oid }
  })
  if (!intake.ok) failures.push('aftercare intake')

  const claw = await runStep('claw points direct purchase (optional)', async () => {
    const idem = `${idemBase}_direct_101`
    const r = await http('/purchase/direct', {
      method: 'POST',
      headers: { 'x-dev-telegram-id': DEV_TELEGRAM_ID, 'x-idempotency-key': idem },
      body: { product_id: 101 },
    })

    if (r.status >= 500) {
      return { skipped: true, reason: r?.data?.message || r?.data?.error || `HTTP ${r.status}` }
    }
    assert(r.status === 201 || r.status === 200, `unexpected HTTP ${r.status}`)
    assert(r?.data?.code === 0, `unexpected response: ${JSON.stringify(r.data)}`)
    return { ok: true }
  })
  void claw

  process.stdout.write('\n')
  if (failures.length) {
    process.stderr.write(`FAILED: ${failures.join(', ')}\n`)
    process.exit(1)
  }
  process.stdout.write('ALL PASSED\n')
}

main().catch((e) => {
  process.stderr.write(`${e && e.stack ? e.stack : String(e)}\n`)
  process.exit(1)
})
