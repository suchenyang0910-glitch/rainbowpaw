export function getTelegramInitData() {
  try {
    const mock = (import.meta && import.meta.env && import.meta.env.VITE_MOCK_INIT_DATA) || ''
    if (mock) return String(mock)
    const tg = window && window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null
    const initData = tg && typeof tg.initData === 'string' ? tg.initData : ''
    if (initData) return initData

    try {
      const sp = window && window.location ? new URLSearchParams(window.location.search || '') : null
      const fromUrl = sp ? String(sp.get('tgWebAppData') || '').trim() : ''
      if (fromUrl) return fromUrl
    } catch {
      void 0
    }
    return ''
  } catch {
    return ''
  }
}

export function apiBaseUrl() {
  const raw = (import.meta && import.meta.env && import.meta.env.VITE_API_BASE_URL) || ''
  const base = String(raw || '/api').replace(/\/+$/, '')
  if (/\/api(\/|$)/.test(base)) return base
  return `${base}/api`
}

function getOrCreateSessionId() {
  try {
    const key = 'rp_session_id'
    const existed = localStorage.getItem(key)
    if (existed) return String(existed)
    const sid = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
    localStorage.setItem(key, sid)
    return sid
  } catch {
    return `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
  }
}

function getUtmFromUrl() {
  try {
    const sp = window && window.location ? new URLSearchParams(window.location.search || '') : null
    if (!sp) return {}
    const pick = (k) => {
      const v = String(sp.get(k) || '').trim()
      return v ? v : null
    }
    const utm = {
      source: pick('utm_source'),
      medium: pick('utm_medium'),
      campaign: pick('utm_campaign'),
      content: pick('utm_content'),
      term: pick('utm_term'),
    }
    const has = Object.values(utm).some(Boolean)
    return has ? utm : {}
  } catch {
    return {}
  }
}

function getRefFromUrl() {
  try {
    const referrer = typeof document !== 'undefined' ? String(document.referrer || '').trim() : ''
    const landing_url = window && window.location ? String(window.location.href || '').trim() : ''
    const page_path = window && window.location ? String(window.location.pathname || '').trim() : ''
    return {
      referrer: referrer || null,
      landing_url: landing_url || null,
      page_path: page_path || null,
    }
  } catch {
    return {}
  }
}

function fnv1a32(input) {
  const str = String(input || '')
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i)
    h = (h * 0x01000193) >>> 0
  }
  return h >>> 0
}

function makeIdempotencyKey({ event_name, session_id, ts, stable_parts }) {
  const e = String(event_name || '').trim()
  const s = String(session_id || '').trim()
  const t = Number.isFinite(Number(ts)) ? Number(ts) : Date.now()
  const bucket = Math.floor(t / 1000)
  const parts = stable_parts && typeof stable_parts === 'object' ? stable_parts : {}
  const seed = `${e}|${s}|${bucket}|${JSON.stringify(parts)}`
  return `evt_${fnv1a32(seed).toString(16)}`
}

export async function apiFetch(path, opts = {}) {
  const method = opts && typeof opts.method === 'string' ? opts.method : undefined
  const body = opts && typeof opts.body !== 'undefined' ? opts.body : undefined
  const extraHeaders = opts && opts.headers && typeof opts.headers === 'object' ? opts.headers : null
  const timeoutMsRaw = opts && typeof opts.timeoutMs !== 'undefined' ? Number(opts.timeoutMs) : 15000

  const p = String(path || '')
  const base = apiBaseUrl()
  const url = p.startsWith('/api/') && /\/api$/.test(base)
    ? `${base.replace(/\/api$/, '')}${p}`
    : `${base}${p}`
  const headers = { 'content-type': 'application/json' }
  if (extraHeaders) {
    for (const [k, v] of Object.entries(extraHeaders)) {
      if (typeof v === 'undefined' || v === null) continue
      headers[String(k).toLowerCase()] = String(v)
    }
  }
  const initData = getTelegramInitData()
  if (initData) headers['x-telegram-init-data'] = initData

  const devId = (import.meta && import.meta.env && import.meta.env.VITE_DEV_TELEGRAM_ID) || ''
  if (!initData && devId) headers['x-dev-telegram-id'] = String(devId)

  const timeoutMs = Number.isFinite(timeoutMsRaw) ? timeoutMsRaw : 15000
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null

  let res
  try {
    res = await fetch(url, {
      method: method || 'GET',
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller ? controller.signal : undefined
    })
  } catch (err) {
    if (err && (err.name === 'AbortError' || String(err.message || '').includes('aborted'))) {
      const e = new Error('请求超时，请重试')
      e.status = 408
      throw e
    }
    throw err
  } finally {
    if (timer) clearTimeout(timer)
  }
  const json = await res.json().catch(() => ({}))
  if (json && typeof json.code === 'number') {
    if (json.code !== 0) {
      const err = new Error((json && json.message) || '请求失败')
      err.status = res.status
      throw err
    }
    return json.data
  }

  if (!res.ok || json.success === false) {
    const msg = (() => {
      if (json && typeof json.message === 'string' && json.message.trim()) return String(json.message)
      if (json && Array.isArray(json.message) && json.message.length) return json.message.map((x) => String(x)).join('; ')
      if (json && json.error && typeof json.error === 'object' && typeof json.error.message === 'string') return String(json.error.message)
      if (json && typeof json.error === 'string' && json.error.trim()) return String(json.error)
      return `HTTP ${res.status}`
    })()
    const err = new Error(msg)
    err.status = res.status
    throw err
  }
  return json.data
}

export const api = {
  me() {
    return apiFetch('/me')
  },
  wallet(limit = 20) {
    return apiFetch(`/wallet?limit=${encodeURIComponent(String(limit))}`)
  },
  products({ sort, limit } = {}) {
    const qs = []
    if (sort) qs.push(`sort=${encodeURIComponent(String(sort))}`)
    if (limit) qs.push(`limit=${encodeURIComponent(String(limit))}`)
    const q = qs.length ? `?${qs.join('&')}` : ''
    return apiFetch(`/products${q}`)
  },
  event(event_name, event_data = {}, opts = {}) {
    const name = String(event_name || '').trim()
    if (!name) return Promise.resolve({ accepted: false })
    const source = String(opts && (opts.source_bot || opts.source) ? (opts.source_bot || opts.source) : '').trim()
    const global_user_id = String(opts && opts.global_user_id ? opts.global_user_id : '').trim()
    const session_id = getOrCreateSessionId()
    const merged = {
      ...(event_data && typeof event_data === 'object' ? event_data : {}),
      session_id,
      utm: {
        ...getUtmFromUrl(),
        ...(event_data && event_data.utm && typeof event_data.utm === 'object' ? event_data.utm : {}),
      },
      ref: {
        ...getRefFromUrl(),
        ...(event_data && event_data.ref && typeof event_data.ref === 'object' ? event_data.ref : {}),
      },
    }
    const idempotency_key =
      String(opts && opts.idempotency_key ? opts.idempotency_key : '').trim() ||
      String(merged && merged.idempotency_key ? merged.idempotency_key : '').trim() ||
      makeIdempotencyKey({
        event_name: name,
        session_id,
        ts: Date.now(),
        stable_parts: {
          page_path: merged?.ref?.page_path || null,
          utm_campaign: merged?.utm?.campaign || null,
          utm_source: merged?.utm?.source || null,
        },
      })

    const body = {
      event_name: name,
      ...(source ? { source_bot: source } : {}),
      ...(global_user_id ? { global_user_id } : {}),
      idempotency_key,
      event_data: { ...merged, idempotency_key },
    }
    return apiFetch('/events', { method: 'POST', body })
  },
  orders(limit = 30) {
    return apiFetch(`/orders?limit=${encodeURIComponent(String(limit))}`)
  },
  groupsActive(opts = {}) {
    const limit = typeof opts === 'number' ? opts : (opts && opts.limit ? opts.limit : 20)
    const sort = typeof opts === 'object' && opts ? opts.sort : ''
    const qs = [`limit=${encodeURIComponent(String(limit))}`]
    if (sort) qs.push(`sort=${encodeURIComponent(String(sort))}`)
    return apiFetch(`/groups/active?${qs.join('&')}`)
  },
  groupsDiscover(opts = {}) {
    const limit = typeof opts === 'number' ? opts : (opts && opts.limit ? opts.limit : 20)
    const sort = typeof opts === 'object' && opts ? opts.sort : ''
    const qs = [`limit=${encodeURIComponent(String(limit))}`]
    if (sort) qs.push(`sort=${encodeURIComponent(String(sort))}`)
    return apiFetch(`/groups/discover?${qs.join('&')}`)
  },
  play() {
    return apiFetch('/play', { method: 'POST', body: {}, timeoutMs: 25000 })
  },
  playMulti(multi) {
    const m = Number(multi || 1) === 10 ? 10 : 1
    return apiFetch('/play', { method: 'POST', body: { multi: m }, timeoutMs: m === 10 ? 40000 : 25000 })
  },
  devAddPlays(count = 10) {
    const n = Math.min(100, Math.max(1, Number(count || 10)))
    return apiFetch('/dev/plays/add', { method: 'POST', body: { count: n } })
  },
  saveShipping({ name, phone, address }) {
    return apiFetch('/shipping', { method: 'POST', body: { name, phone, address } })
  },
  createPlaysPayment(bundle) {
    return apiFetch('/payments/plays', { method: 'POST', body: { bundle }, timeoutMs: 8000 })
  },
  submitPaymentProof(id, proof_text) {
    return apiFetch(`/payments/${encodeURIComponent(String(id))}/proof`, { method: 'POST', body: { proof_text }, timeoutMs: 8000 })
  },
  submitPaymentProofFile(id, { mime_type, file_base64 }) {
    return apiFetch(`/payments/${encodeURIComponent(String(id))}/proof_file`, { method: 'POST', body: { mime_type, file_base64 }, timeoutMs: 45000 })
  },
  payment(id) {
    return apiFetch(`/payments/${encodeURIComponent(String(id))}`, { timeoutMs: 20000 })
  },
  paymentProofFileUrl(id) {
    const initData = getTelegramInitData()
    const devId = (import.meta && import.meta.env && import.meta.env.VITE_DEV_TELEGRAM_ID) || ''
    const base = `${apiBaseUrl()}/payments/${encodeURIComponent(String(id))}/proof_file`
    const qs = initData ? `tg_data=${encodeURIComponent(initData)}` : (devId ? `dev_id=${encodeURIComponent(devId)}` : '')
    return qs ? `${base}?${qs}` : base
  },
  purchaseDirect(product_id, opts = {}) {
    const idemKey = opts && (opts.idemKey || opts.idempotencyKey) ? String(opts.idemKey || opts.idempotencyKey) : ''
    return apiFetch('/purchase/direct', {
      method: 'POST',
      body: { product_id },
      headers: idemKey ? { 'x-idempotency-key': idemKey } : undefined,
    })
  },
  purchaseGroup(product_id, opts = {}) {
    const idemKey = opts && (opts.idemKey || opts.idempotencyKey) ? String(opts.idemKey || opts.idempotencyKey) : ''
    return apiFetch('/purchase/group', {
      method: 'POST',
      body: { product_id },
      headers: idemKey ? { 'x-idempotency-key': idemKey } : undefined,
    })
  },
  createGroup({ product_id }) {
    return apiFetch('/groups', { method: 'POST', body: { product_id } })
  },
  joinGroup(groupId) {
    return apiFetch(`/groups/${encodeURIComponent(groupId)}/join`, { method: 'POST', body: {} })
  },
  joinGroupPay(groupId, opts = {}) {
    const idemKey = opts && (opts.idemKey || opts.idempotencyKey) ? String(opts.idemKey || opts.idempotencyKey) : ''
    return apiFetch(`/groups/${encodeURIComponent(groupId)}/join_pay`, {
      method: 'POST',
      body: {},
      headers: idemKey ? { 'x-idempotency-key': idemKey } : undefined,
    })
  },
  carePlan() {
    return apiFetch('/care/plan', { method: 'POST', body: {} })
  },
  careSubscribe(planId) {
    return apiFetch('/care/subscribe', { method: 'POST', body: { planId } })
  },
  serviceList() {
    return apiFetch('/service/list', { method: 'GET' })
  },
  serviceBook(serviceType, time) {
    return apiFetch('/service/book', { method: 'POST', body: { serviceType, time } })
  },
  memorialList(globalUserId) {
    return apiFetch(`/memorial/list?globalUserId=${encodeURIComponent(String(globalUserId))}`)
  },
  memorialDetail(id) {
    return apiFetch(`/memorial/${encodeURIComponent(String(id))}`)
  },
  recyclePlay(playId, originPoints) {
    return apiFetch('/claw/recycle', { method: 'POST', body: { play_id: playId, origin_points: originPoints }, timeoutMs: 15000 })
  },
  memorialLightCandle(globalUserId, memorialId) {
    return apiFetch(`/memorial/${encodeURIComponent(String(memorialId))}/candle`, {
      method: 'POST',
      body: { globalUserId }
    })
  }
}

export default api
