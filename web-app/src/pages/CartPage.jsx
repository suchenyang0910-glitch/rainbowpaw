import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { apiFetch } from '../api/client'
import SafeImage from '../components/SafeImage.jsx'

export default function CartPage() {
  const location = useLocation()
  const query = new URLSearchParams(location.search)
  const initialPhone = query.get('phone') || localStorage.getItem('rp_shop_phone') || ''

  const [phone, setPhone] = useState(initialPhone)
  const [cart, setCart] = useState({ items: [], subtotal_cents: 0, currency: 'USD' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const loadCart = async (targetPhone = phone) => {
    if (!targetPhone.trim()) return
    setLoading(true)
    setError('')
    try {
      const data = await apiFetch(`/cart?phone=${encodeURIComponent(targetPhone.trim())}`)
      setCart(data || { items: [], subtotal_cents: 0, currency: 'USD' })
    } catch (e) {
      setError(e?.message || '加载购物车失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (phone.trim()) {
      localStorage.setItem('rp_shop_phone', phone)
      loadCart(phone)
    }
  }, [phone])

  const patchItem = async (itemId, payload) => {
    setError('')
    try {
      const data = await apiFetch(`/cart/items/${itemId}`, {
        method: 'PATCH',
        body: { phone: phone.trim(), ...payload },
      })
      setCart(data)
    } catch (e) {
      setError(e?.message || '更新失败')
    }
  }

  const deleteItem = async (itemId) => {
    setError('')
    try {
      const data = await apiFetch(`/cart/items/${itemId}?phone=${encodeURIComponent(phone.trim())}`, { method: 'DELETE' })
      setCart(data)
    } catch (e) {
      setError(e?.message || '删除失败')
    }
  }

  const checkout = async () => {
    if (loading) return
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const data = await apiFetch('/marketplace/checkout', {
        method: 'POST',
        body: {
          phone: phone.trim(),
          pickup_address: '待确认地址',
          conversation_channel: 'web',
        },
      })
      setMessage(`下单成功：${data.order_id}`)
      await loadCart(phone)
    } catch (e) {
      setError(e?.message || '结算失败')
    } finally {
      setLoading(false)
    }
  }

  const selectedCount = useMemo(() => (cart.items || []).filter((i) => i.selected).length, [cart.items])

  return (
    <div className="site">
      <section className="section">
        <div className="container">
          <h1 className="section-title">购物车</h1>
          <div className="shop-form">
            <input className="shop-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="手机号" />
            <Link className="btn btn-outline" to="/rainbowpaw/marketplace">
              返回商城
            </Link>
          </div>
          {loading && <p className="shop-hint">加载中...</p>}
          {error && <p className="shop-error">{error}</p>}
          <div className="cards three" style={{ marginTop: '1rem' }}>
            {(cart.items || []).map((item) => (
              <article className="card shop" key={item.id}>
                {item.image_url ? <SafeImage src={item.image_url} alt={item.name || '商品'} /> : <div className="shop-ph">No Image</div>}
                <h3>{item.name || '商品'}</h3>
                <p>数量：{item.quantity}</p>
                <p className="shop-price">${(Number(item.unit_price_cents || 0) / 100).toFixed(2)}</p>
                <div className="shop-actions">
                  <button className="btn btn-outline" onClick={() => patchItem(item.id, { quantity: Math.max(1, Number(item.quantity || 1) - 1) })}>-1</button>
                  <button className="btn btn-outline" onClick={() => patchItem(item.id, { quantity: Number(item.quantity || 1) + 1 })}>+1</button>
                  <button className="btn btn-outline" onClick={() => patchItem(item.id, { selected: !item.selected })}>
                    {item.selected ? '取消勾选' : '勾选'}
                  </button>
                  <button className="btn btn-outline" onClick={() => deleteItem(item.id)}>删除</button>
                </div>
              </article>
            ))}
          </div>
          <div className="card" style={{ marginTop: '1rem' }}>
            <h3>结算摘要</h3>
            <p>已选商品：{selectedCount}</p>
            <p>合计：${(Number(cart.subtotal_cents || 0) / 100).toFixed(2)}</p>
            <div className="shop-actions">
              <button className="btn btn-dark" onClick={checkout} disabled={selectedCount === 0 || loading}>
                提交结算
              </button>
            </div>
            {message && <p className="shop-ok">{message}</p>}
          </div>
        </div>
      </section>
    </div>
  )
}
