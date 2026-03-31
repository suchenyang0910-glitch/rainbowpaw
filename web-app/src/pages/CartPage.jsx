import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { apiFetch } from '../api/client'
import SafeImage from '../components/SafeImage.jsx'
import { RP_MINIAPP_LANGS, rpMiniAppGetLangLabel } from '../i18n/rpMiniApp.js'

export default function CartPage() {
  const location = useLocation()
  const query = new URLSearchParams(location.search)
  const initialPhone = query.get('phone') || localStorage.getItem('rp_shop_phone') || ''

  const [phone, setPhone] = useState(initialPhone)
  const [cart, setCart] = useState({ items: [], subtotal_cents: 0, currency: 'USD' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem('rp_miniapp_lang') || 'ZH'
    } catch {
      return 'ZH'
    }
  })

  const ui = useMemo(() => {
    const id = String(lang || '').toUpperCase()
    if (id === 'ZH')
      return {
        title: '购物车',
        phone: '手机号',
        back: '返回商城',
        qty: '数量',
        unselect: '取消勾选',
        select: '勾选',
        del: '删除',
        summary: '结算摘要',
        selected: '已选商品',
        total: '合计',
        submit: '提交结算',
      }
    if (id === 'KM')
      return {
        title: 'កន្ត្រក',
        phone: 'លេខទូរស័ព្ទ',
        back: 'ត្រឡប់ទៅហាង',
        qty: 'ចំនួន',
        unselect: 'ដកជ្រើស',
        select: 'ជ្រើស',
        del: 'លុប',
        summary: 'សង្ខេបបង់ប្រាក់',
        selected: 'ទំនិញដែលបានជ្រើស',
        total: 'សរុប',
        submit: 'បញ្ជូន',
      }
    return {
      title: 'Cart',
      phone: 'Phone',
      back: 'Back',
      qty: 'Qty',
      unselect: 'Unselect',
      select: 'Select',
      del: 'Remove',
      summary: 'Summary',
      selected: 'Selected',
      total: 'Total',
      submit: 'Checkout',
    }
  }, [lang])

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

  useEffect(() => {
    try {
      localStorage.setItem('rp_miniapp_lang', String(lang || 'ZH'))
    } catch {
      void 0
    }
  }, [lang])

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
          <h1 className="section-title">{ui.title}</h1>
          <div className="tags" style={{ marginTop: '0.75rem' }}>
            {RP_MINIAPP_LANGS.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setLang(l.id)}
                className={`tag ${String(lang || '').toUpperCase() === String(l.id).toUpperCase() ? 'on' : ''}`}
              >
                {rpMiniAppGetLangLabel(l.id)}
              </button>
            ))}
          </div>
          <div className="shop-form">
            <input className="shop-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={ui.phone} />
            <Link className="btn btn-outline" to="/rainbowpaw/marketplace">
              {ui.back}
            </Link>
          </div>
          {loading && <p className="shop-hint">加载中...</p>}
          {error && <p className="shop-error">{error}</p>}
          <div className="cards three" style={{ marginTop: '1rem' }}>
            {(cart.items || []).map((item) => (
              <article className="card shop" key={item.id}>
                {item.image_url ? <SafeImage src={item.image_url} alt={item.name || '商品'} /> : <div className="shop-ph">No Image</div>}
                <h3>{item.name || '商品'}</h3>
                <p>{ui.qty}：{item.quantity}</p>
                <p className="shop-price">${(Number(item.unit_price_cents || 0) / 100).toFixed(2)}</p>
                <div className="shop-actions">
                  <button className="btn btn-outline" onClick={() => patchItem(item.id, { quantity: Math.max(1, Number(item.quantity || 1) - 1) })}>-1</button>
                  <button className="btn btn-outline" onClick={() => patchItem(item.id, { quantity: Number(item.quantity || 1) + 1 })}>+1</button>
                  <button className="btn btn-outline" onClick={() => patchItem(item.id, { selected: !item.selected })}>
                    {item.selected ? ui.unselect : ui.select}
                  </button>
                  <button className="btn btn-outline" onClick={() => deleteItem(item.id)}>{ui.del}</button>
                </div>
              </article>
            ))}
          </div>
          <div className="card" style={{ marginTop: '1rem' }}>
            <h3>{ui.summary}</h3>
            <p>{ui.selected}：{selectedCount}</p>
            <p>{ui.total}：${(Number(cart.subtotal_cents || 0) / 100).toFixed(2)}</p>
            <div className="shop-actions">
              <button className="btn btn-dark" onClick={checkout} disabled={selectedCount === 0 || loading}>
                {ui.submit}
              </button>
            </div>
            {message && <p className="shop-ok">{message}</p>}
          </div>
        </div>
      </section>
    </div>
  )
}
