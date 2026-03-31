function getTelegramInitData() {
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
  const raw = (import.meta && import.meta.env && import.meta.env.VITE_API_BASE_URL) || 'http://localhost:3012/api'
  const base = String(raw).replace(/\/+$/, '')
  if (/\/api(\/|$)/.test(base)) return base
  return `${base}/api`
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
    const msg = (json && json.error && json.error.message) || `HTTP ${res.status}`
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
  purchaseDirect(product_id) {
    return apiFetch('/purchase/direct', { method: 'POST', body: { product_id } })
  },
  purchaseGroup(product_id) {
    return apiFetch('/purchase/group', { method: 'POST', body: { product_id } })
  },
  createGroup({ product_id }) {
    return apiFetch('/groups', { method: 'POST', body: { product_id } })
  },
  joinGroup(groupId) {
    return apiFetch(`/groups/${encodeURIComponent(groupId)}/join`, { method: 'POST', body: {} })
  },
  joinGroupPay(groupId) {
    return apiFetch(`/groups/${encodeURIComponent(groupId)}/join_pay`, { method: 'POST', body: {} })
  }
}
