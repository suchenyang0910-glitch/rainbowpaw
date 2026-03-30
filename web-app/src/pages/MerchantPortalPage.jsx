import { useMemo, useState } from 'react'
import { apiFetch } from '../api/client'
import SafeImage from '../components/SafeImage.jsx'

export default function MerchantPortalPage() {
  const [telegramId, setTelegramId] = useState('')
  const [authToken, setAuthToken] = useState('')
  const [merchant, setMerchant] = useState(null)
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [revenue, setRevenue] = useState({ total_amount_cents: 0, platform_fee_cents: 0, merchant_payout_cents: 0, items: [] })
  const [notifications, setNotifications] = useState([])
  const [reviewHistoryByProduct, setReviewHistoryByProduct] = useState({})
  const [activeTab, setActiveTab] = useState('orders')
  const [form, setForm] = useState({
    name: '',
    category: 'urn',
    price_cents: 0,
    stock: 0,
    description: '',
  })
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [loading, setLoading] = useState(false)
  const [imageUrlDrafts, setImageUrlDrafts] = useState({})

  const loggedIn = useMemo(() => Boolean(authToken), [authToken])

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
      const data = await apiFetch('/api/v1/merchant/orders', {
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
      const data = await apiFetch('/api/v1/merchant/products', {
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
      await apiFetch('/api/v1/merchant/products', {
        method: 'POST',
        headers: { authorization: `Bearer ${authToken}` },
        body: {
          name: form.name,
          category: form.category,
          description: form.description || null,
          price_cents: Number(form.price_cents || 0),
          stock: Number(form.stock || 0),
          currency: 'USD',
          delivery_type: 'shipment',
          production_time_days: 3,
          customizable: false,
        },
      })
      setOk('商品创建成功')
      setForm({ name: '', category: 'urn', price_cents: 0, stock: 0, description: '' })
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
      const data = await apiFetch('/api/v1/merchant/revenue', {
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
      const data = await apiFetch('/api/v1/merchant/notifications?limit=100', {
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
      const data = await apiFetch(`/api/v1/merchant/products/${productId}/review-history`, {
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
      await apiFetch(`/api/v1/merchant/products/${productId}/status`, {
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
      await apiFetch(`/api/v1/merchant/products/${productId}/stock`, {
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
      await apiFetch(`/api/v1/merchant/products/${productId}`, {
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
      await apiFetch(`/api/v1/merchant/products/${productId}/images`, {
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
      await apiFetch(`/api/v1/merchant/products/${productId}/images/sort`, {
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
                  <input className="shop-input" placeholder="商品名称" value={form.name} onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))} />
                  <select className="shop-input" value={form.category} onChange={(e) => setForm((v) => ({ ...v, category: e.target.value }))}>
                    <option value="urn">骨灰盒</option>
                    <option value="jewelry">纪念首饰</option>
                    <option value="frame">纪念相框</option>
                    <option value="art">纪念艺术</option>
                    <option value="service">服务</option>
                  </select>
                  <input className="shop-input" placeholder="价格(分)" type="number" value={form.price_cents} onChange={(e) => setForm((v) => ({ ...v, price_cents: Number(e.target.value || 0) }))} />
                  <input className="shop-input" placeholder="库存" type="number" value={form.stock} onChange={(e) => setForm((v) => ({ ...v, stock: Number(e.target.value || 0) }))} />
                  <input className="shop-input" placeholder="描述" value={form.description} onChange={(e) => setForm((v) => ({ ...v, description: e.target.value }))} />
                  <button className="btn btn-dark" onClick={createProduct} disabled={loading || !form.name.trim()}>
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
