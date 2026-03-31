import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../api/client'
import SafeImage from '../components/SafeImage.jsx'
import { RP_MINIAPP_LANGS, rpMiniAppGetLangLabel, rpMiniAppLangToLocale } from '../i18n/rpMiniApp.js'

export default function MerchantPortalPage() {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem('rp_miniapp_lang') || 'ZH'
    } catch {
      return 'ZH'
    }
  })
  const [telegramId, setTelegramId] = useState('')
  const [authToken, setAuthToken] = useState('')
  const [merchant, setMerchant] = useState(null)
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [revenue, setRevenue] = useState({ total_amount_cents: 0, platform_fee_cents: 0, merchant_payout_cents: 0, items: [] })
  const [notifications, setNotifications] = useState([])
  const [reviewHistoryByProduct, setReviewHistoryByProduct] = useState({})
  const [activeTab, setActiveTab] = useState('orders')
  const [editLocale, setEditLocale] = useState(() => rpMiniAppLangToLocale(lang))
  const ensureI18nShape = (i18n) => {
    const next = i18n && typeof i18n === 'object' ? { ...i18n } : {}
    const ensure = (k) => {
      if (!next[k] || typeof next[k] !== 'object') next[k] = {}
      next[k] = {
        name: next[k].name || '',
        category_label: next[k].category_label || '',
        description: next[k].description || '',
      }
    }
    ensure('zh-CN')
    ensure('en')
    ensure('km')
    return next
  }

  const [form, setForm] = useState(() => ({
    category: 'urn',
    price_cents: 0,
    stock: 0,
    default_lang: rpMiniAppLangToLocale(lang),
    i18n: ensureI18nShape(null),
  }))
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [loading, setLoading] = useState(false)
  const [imageUrlDrafts, setImageUrlDrafts] = useState({})

  const loggedIn = useMemo(() => Boolean(authToken), [authToken])
  useEffect(() => {
    try {
      localStorage.setItem('rp_miniapp_lang', String(lang || 'ZH'))
    } catch {
      void 0
    }
  }, [lang])

  useEffect(() => {
    setEditLocale(rpMiniAppLangToLocale(lang))
    setForm((prev) => ({
      ...(prev || {}),
      default_lang: prev && prev.default_lang ? prev.default_lang : rpMiniAppLangToLocale(lang),
      i18n: ensureI18nShape(prev && prev.i18n ? prev.i18n : null),
    }))
  }, [lang])

  const withLang = (path) => {
    const locale = rpMiniAppLangToLocale(lang)
    const s = String(path || '')
    if (!locale) return s
    if (s.includes('lang=')) return s
    const sep = s.includes('?') ? '&' : '?'
    return `${s}${sep}lang=${encodeURIComponent(locale)}`
  }

  const merchantApiFetch = (path, opts) => apiFetch(withLang(path), opts)

  const loginWithTelegram = async () => {
    setError('')
    setLoading(true)
    try {
      const result = await apiFetch('/api/v1/auth/telegram/login', {
        method: 'POST',
        body: {
          telegram_id: telegramId.trim(),
          role: 'merchant',
          name: `商家_${telegramId.trim().slice(-4)}`,
        },
      })
      if (result.pending_approval) {
        setMerchant(result.merchant)
        setAuthToken('')
        return
      }
      setAuthToken(result.token)
      setMerchant(result.merchant)
    } catch (e) {
      setError(e?.message || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  const loadOrders = async () => {
    if (!authToken) return
    setError('')
    setLoading(true)
    try {
      const data = await merchantApiFetch('/api/v1/merchant/orders', {
        headers: { authorization: `Bearer ${authToken}` },
      })
      setOrders(Array.isArray(data?.items) ? data.items : [])
    } catch (e) {
      setError(e?.message || '加载订单失败')
    } finally {
      setLoading(false)
    }
  }

  const loadProducts = async () => {
    if (!authToken) return
    setError('')
    setLoading(true)
    try {
      const data = await merchantApiFetch('/api/v1/merchant/products', {
        headers: { authorization: `Bearer ${authToken}` },
      })
      setProducts(Array.isArray(data?.items) ? data.items : [])
    } catch (e) {
      setError(e?.message || '加载商品失败')
    } finally {
      setLoading(false)
    }
  }

  const createProduct = async () => {
    if (!authToken) return
    setError('')
    setOk('')
    setLoading(true)
    try {
      await merchantApiFetch('/api/v1/merchant/products', {
        method: 'POST',
        headers: { authorization: `Bearer ${authToken}` },
        body: {
          category: form.category,
          default_lang: form.default_lang,
          i18n: form.i18n,
          price_cents: Number(form.price_cents || 0),
          stock: Number(form.stock || 0),
          currency: 'USD',
          delivery_type: 'shipment',
          production_time_days: 3,
          customizable: false,
        },
      })
      setOk('商品创建成功')
      setForm({ category: 'urn', price_cents: 0, stock: 0, default_lang: rpMiniAppLangToLocale(lang), i18n: ensureI18nShape(null) })
      await loadProducts()
    } catch (e) {
      setError(e?.message || '创建商品失败')
    } finally {
      setLoading(false)
    }
  }

  const loadRevenue = async () => {
    if (!authToken) return
    setError('')
    setLoading(true)
    try {
      const data = await merchantApiFetch('/api/v1/merchant/revenue', {
        headers: { authorization: `Bearer ${authToken}` },
      })
      setRevenue(data || { total_amount_cents: 0, platform_fee_cents: 0, merchant_payout_cents: 0, items: [] })
    } catch (e) {
      setError(e?.message || '加载收入统计失败')
    } finally {
      setLoading(false)
    }
  }

  const loadNotifications = async () => {
    if (!authToken) return
    setError('')
    setLoading(true)
    try {
      const data = await merchantApiFetch('/api/v1/merchant/notifications?limit=100', {
        headers: { authorization: `Bearer ${authToken}` },
      })
      setNotifications(Array.isArray(data?.items) ? data.items : [])
    } catch (e) {
      setError(e?.message || '加载审核通知失败')
    } finally {
      setLoading(false)
    }
  }

  const loadProductReviewHistory = async (productId) => {
    if (!authToken) return
    setError('')
    try {
      const data = await merchantApiFetch(`/api/v1/merchant/products/${productId}/review-history`, {
        headers: { authorization: `Bearer ${authToken}` },
      })
      setReviewHistoryByProduct((prev) => ({ ...prev, [productId]: Array.isArray(data?.items) ? data.items : [] }))
    } catch (e) {
      setError(e?.message || '加载审核历史失败')
    }
  }

  const updateProductStatus = async (productId, status) => {
    if (!authToken) return
    setError('')
    try {
      await merchantApiFetch(`/api/v1/merchant/products/${productId}/status`, {
        method: 'POST',
        headers: { authorization: `Bearer ${authToken}` },
        body: { status },
      })
      await loadProducts()
    } catch (e) {
      setError(e?.message || '更新状态失败')
    }
  }

  const updateProductStock = async (productId, stock) => {
    if (!authToken) return
    setError('')
    try {
      await merchantApiFetch(`/api/v1/merchant/products/${productId}/stock`, {
        method: 'POST',
        headers: { authorization: `Bearer ${authToken}` },
        body: { stock: Number(stock || 0) },
      })
      await loadProducts()
    } catch (e) {
      setError(e?.message || '更新库存失败')
    }
  }

  const updateProductPrice = async (productId, priceCents) => {
    if (!authToken) return
    setError('')
    try {
      await merchantApiFetch(`/api/v1/merchant/products/${productId}`, {
        method: 'PATCH',
        headers: { authorization: `Bearer ${authToken}` },
        body: { price_cents: Math.max(0, Number(priceCents || 0)) },
      })
      await loadProducts()
    } catch (e) {
      setError(e?.message || '更新价格失败')
    }
  }

  const addProductImage = async (productId) => {
    const image_url = String(imageUrlDrafts[productId] || '').trim()
    if (!authToken || !image_url) return
    setError('')
    setOk('')
    try {
      await merchantApiFetch(`/api/v1/merchant/products/${productId}/images`, {
        method: 'POST',
        headers: { authorization: `Bearer ${authToken}` },
        body: { image_url },
      })
      setImageUrlDrafts((prev) => ({ ...prev, [productId]: '' }))
      setOk('图片已添加')
      await loadProducts()
    } catch (e) {
      setError(e?.message || '添加图片失败')
    }
  }

  const sortProductImages = async (productId, direction) => {
    const target = products.find((x) => x.id === productId)
    if (!target || !Array.isArray(target.images) || target.images.length < 2) return
    const list = target.images.slice()
    if (direction === 'reverse') list.reverse()
    if (!authToken) return
    setError('')
    try {
      await merchantApiFetch(`/api/v1/merchant/products/${productId}/images/sort`, {
        method: 'PATCH',
        headers: { authorization: `Bearer ${authToken}` },
        body: { image_ids: list.map((x) => x.id) },
      })
      await loadProducts()
    } catch (e) {
      setError(e?.message || '图片排序失败')
    }
  }

  const deleteProductImage = async (productId, imageId) => {
    if (!authToken) return
    setError('')
    try {
      await apiFetch(`/api/v1/merchant/products/${productId}/images/${imageId}`, {
        method: 'DELETE',
        headers: { authorization: `Bearer ${authToken}` },
      })
      await loadProducts()
    } catch (e) {
      setError(e?.message || '删除图片失败')
    }
  }

  return (
    <div className="site">
      <section className="section">
        <div className="container">
          <h1 className="section-title">商家端（Telegram 授权）</h1>
          <p className="section-sub">先用 Telegram 授权进入商家端，再查看待处理订单。</p>
          <div className="tags" style={{ marginBottom: '0.75rem' }}>
            {RP_MINIAPP_LANGS.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setLang(l.id)}
                className={`tag ${String(lang || '').toUpperCase() === String(l.id || '').toUpperCase() ? 'on' : ''}`}
              >
                {rpMiniAppGetLangLabel(l.id)}
              </button>
            ))}
          </div>
          <div className="card" style={{ maxWidth: '680px', margin: '0 auto' }}>
            <div className="shop-form">
              <input className="shop-input" placeholder="输入 Telegram ID" value={telegramId} onChange={(e) => setTelegramId(e.target.value)} />
              <button className="btn btn-dark" onClick={loginWithTelegram} disabled={loading || !telegramId.trim()}>
                {loading ? '登录中...' : 'Telegram 登录'}
              </button>
            </div>
            {merchant && (
              <p className="shop-hint">
                商家：{merchant.name || '-'} | 状态：{merchant.status || '-'}
              </p>
            )}
            {loggedIn && (
              <div className="shop-actions">
                <button className="btn btn-outline" onClick={loadOrders} disabled={loading}>
                  {loading ? '加载中...' : '加载我的订单'}
                </button>
                <button className="btn btn-outline" onClick={loadProducts} disabled={loading}>
                  {loading ? '加载中...' : '加载我的商品'}
                </button>
                <button className="btn btn-outline" onClick={loadRevenue} disabled={loading}>
                  {loading ? '加载中...' : '加载收入统计'}
                </button>
                <button className="btn btn-outline" onClick={loadNotifications} disabled={loading}>
                  {loading ? '加载中...' : '加载审核通知'}
                </button>
              </div>
            )}
            {error && <p className="shop-error">{error}</p>}
            {ok && <p className="shop-ok">{ok}</p>}
            {loggedIn && (
              <div className="shop-actions">
                <button className="btn btn-outline" onClick={() => setActiveTab('orders')}>
                  订单管理
                </button>
                <button className="btn btn-outline" onClick={() => setActiveTab('products')}>
                  商品管理
                </button>
                <button className="btn btn-outline" onClick={() => setActiveTab('revenue')}>
                  收入统计
                </button>
                <button className="btn btn-outline" onClick={() => setActiveTab('notifications')}>
                  审核通知
                </button>
              </div>
            )}
            {activeTab === 'orders' && orders.length > 0 && (
              <div className="cards three" style={{ marginTop: '1rem' }}>
                {orders.map((o) => (
                  <article className="card" key={o.order_code}>
                    <h3>{o.order_code}</h3>
                    <p>状态：{o.status}</p>
                    <p>金额：${Number(o.total_amount_cents || 0) / 100}</p>
                    <p>平台抽成：${Number(o.platform_fee_cents || 0) / 100}</p>
                    <p>商家结算：${Number(o.merchant_payout_cents || 0) / 100}</p>
                  </article>
                ))}
              </div>
            )}
            {activeTab === 'products' && (
              <div style={{ marginTop: '1rem' }}>
                <div className="shop-form">
                  <select className="shop-input" value={form.category} onChange={(e) => setForm((v) => ({ ...v, category: e.target.value }))}>
                    <option value="urn">骨灰盒</option>
                    <option value="jewelry">纪念首饰</option>
                    <option value="frame">纪念相框</option>
                    <option value="art">纪念艺术</option>
                    <option value="service">服务</option>
                  </select>
                  <select className="shop-input" value={form.default_lang} onChange={(e) => setForm((v) => ({ ...v, default_lang: e.target.value }))}>
                    <option value="zh-CN">默认：中文</option>
                    <option value="en">默认：English</option>
                    <option value="km">默认：ខ្មែរ</option>
                  </select>
                  <div className="shop-actions" style={{ margin: 0 }}>
                    {['zh-CN', 'en', 'km'].map((lc) => (
                      <button
                        key={lc}
                        type="button"
                        className={`btn btn-outline ${editLocale === lc ? 'on' : ''}`}
                        onClick={() => setEditLocale(lc)}
                      >
                        {lc === 'zh-CN' ? '中文' : lc === 'en' ? 'English' : 'ខ្មែរ'}
                      </button>
                    ))}
                  </div>
                  <input
                    className="shop-input"
                    placeholder="名称"
                    value={form.i18n && form.i18n[editLocale] ? form.i18n[editLocale].name : ''}
                    onChange={(e) =>
                      setForm((v) => {
                        const nextI18n = ensureI18nShape(v.i18n)
                        nextI18n[editLocale].name = e.target.value
                        return { ...v, i18n: nextI18n }
                      })
                    }
                  />
                  <input
                    className="shop-input"
                    placeholder="分类显示名"
                    value={form.i18n && form.i18n[editLocale] ? form.i18n[editLocale].category_label : ''}
                    onChange={(e) =>
                      setForm((v) => {
                        const nextI18n = ensureI18nShape(v.i18n)
                        nextI18n[editLocale].category_label = e.target.value
                        return { ...v, i18n: nextI18n }
                      })
                    }
                  />
                  <input className="shop-input" placeholder="价格(分)" type="number" value={form.price_cents} onChange={(e) => setForm((v) => ({ ...v, price_cents: Number(e.target.value || 0) }))} />
                  <input className="shop-input" placeholder="库存" type="number" value={form.stock} onChange={(e) => setForm((v) => ({ ...v, stock: Number(e.target.value || 0) }))} />
                  <input
                    className="shop-input"
                    placeholder="详情/描述"
                    value={form.i18n && form.i18n[editLocale] ? form.i18n[editLocale].description : ''}
                    onChange={(e) =>
                      setForm((v) => {
                        const nextI18n = ensureI18nShape(v.i18n)
                        nextI18n[editLocale].description = e.target.value
                        return { ...v, i18n: nextI18n }
                      })
                    }
                  />
                  <button
                    className="btn btn-dark"
                    onClick={createProduct}
                    disabled={
                      loading ||
                      !String(form.category || '').trim() ||
                      !String(form.i18n?.[form.default_lang]?.name || '').trim() ||
                      !String(form.i18n?.[form.default_lang]?.category_label || '').trim()
                    }
                  >
                    新增商品
                  </button>
                </div>
                {products.length > 0 && (
                  <div className="cards three" style={{ marginTop: '1rem' }}>
                    {products.map((p) => (
                      <article className="card" key={p.id}>
                        <h3>{p.name}</h3>
                        <p>分类：{p.category}</p>
                        <p>价格：${Number(p.price_cents || 0) / 100}</p>
                        <p>库存：{p.stock}</p>
                        <p>状态：{p.status}</p>
                        <p>审核：{p.audit_status || 'approved'}</p>
                        {p.reject_reason ? <p>驳回原因：{p.reject_reason}</p> : null}
                        <div className="shop-actions">
                          <button className="btn btn-outline" onClick={() => loadProductReviewHistory(p.id)}>
                            查看审核历史
                          </button>
                        </div>
                        {Array.isArray(reviewHistoryByProduct[p.id]) && reviewHistoryByProduct[p.id].length > 0 && (
                          <div style={{ marginTop: '0.5rem' }}>
                            {reviewHistoryByProduct[p.id].map((h) => (
                              <div key={h.id} className="card" style={{ marginBottom: '0.4rem' }}>
                                <p>决策：{h.decision}</p>
                                <p>备注：{h.note || '无'}</p>
                                <p>自动上架：{h.auto_publish ? '是' : '否'}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="shop-actions">
                          <button className="btn btn-outline" onClick={() => updateProductStatus(p.id, p.status === 'active' ? 'inactive' : 'active')}>
                            {p.status === 'active' ? '下架' : '上架'}
                          </button>
                          <button className="btn btn-outline" onClick={() => updateProductPrice(p.id, Number(p.price_cents || 0) + 100)}>
                            价格+$1
                          </button>
                          <button className="btn btn-outline" onClick={() => updateProductPrice(p.id, Math.max(0, Number(p.price_cents || 0) - 100))}>
                            价格-$1
                          </button>
                          <button className="btn btn-outline" onClick={() => updateProductStock(p.id, Number(p.stock || 0) + 1)}>
                            库存+1
                          </button>
                          <button className="btn btn-outline" onClick={() => updateProductStock(p.id, Math.max(0, Number(p.stock || 0) - 1))}>
                            库存-1
                          </button>
                        </div>
                        <div className="shop-form" style={{ marginTop: '0.75rem' }}>
                          <input
                            className="shop-input"
                            placeholder="图片URL"
                            value={imageUrlDrafts[p.id] || ''}
                            onChange={(e) => setImageUrlDrafts((prev) => ({ ...prev, [p.id]: e.target.value }))}
                          />
                          <button className="btn btn-outline" onClick={() => addProductImage(p.id)}>
                            上传图片
                          </button>
                        </div>
                        {Array.isArray(p.images) && p.images.length > 0 && (
                          <div style={{ marginTop: '0.5rem' }}>
                            <div className="shop-actions">
                              <button className="btn btn-outline" onClick={() => sortProductImages(p.id, 'reverse')}>
                                排序反转
                              </button>
                            </div>
                            <div className="cards three" style={{ marginTop: '0.5rem' }}>
                              {p.images.map((img) => (
                                <article className="card" key={img.id}>
                                  <SafeImage src={img.image_url} alt="商品图" />
                                  <p>序号：{img.sort_order}</p>
                                  <button className="btn btn-outline" onClick={() => deleteProductImage(p.id, img.id)}>
                                    删除图片
                                  </button>
                                </article>
                              ))}
                            </div>
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}
            {activeTab === 'revenue' && (
              <div style={{ marginTop: '1rem' }}>
                <div className="cards three">
                  <article className="card">
                    <h3>GMV</h3>
                    <p>${Number(revenue.total_amount_cents || 0) / 100}</p>
                  </article>
                  <article className="card">
                    <h3>平台抽成</h3>
                    <p>${Number(revenue.platform_fee_cents || 0) / 100}</p>
                  </article>
                  <article className="card">
                    <h3>商家结算</h3>
                    <p>${Number(revenue.merchant_payout_cents || 0) / 100}</p>
                  </article>
                </div>
                {Array.isArray(revenue.items) && revenue.items.length > 0 && (
                  <div className="cards three" style={{ marginTop: '1rem' }}>
                    {revenue.items.map((o) => (
                      <article className="card" key={o.order_code}>
                        <h3>{o.order_code}</h3>
                        <p>状态：{o.status}</p>
                        <p>金额：${Number(o.total_amount_cents || 0) / 100}</p>
                        <p>抽成：${Number(o.platform_fee_cents || 0) / 100}</p>
                        <p>结算：${Number(o.merchant_payout_cents || 0) / 100}</p>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}
            {activeTab === 'notifications' && (
              <div style={{ marginTop: '1rem' }}>
                {notifications.length === 0 ? (
                  <p className="shop-hint">暂无审核通知</p>
                ) : (
                  <div className="cards three">
                    {notifications.map((n) => (
                      <article className="card" key={n.id}>
                        <h3>{n.title}</h3>
                        <p>{n.content}</p>
                        <p>类型：{n.type}</p>
                        <p>时间：{n.created_at}</p>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
