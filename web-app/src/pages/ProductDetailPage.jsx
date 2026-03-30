import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { apiFetch } from '../api/client'
import SafeImage from '../components/SafeImage.jsx'

export default function ProductDetailPage() {
  const { productId } = useParams()
  const location = useLocation()
  const query = new URLSearchParams(location.search)
  const initialPhone = query.get('phone') || localStorage.getItem('rp_shop_phone') || ''

  const [phone, setPhone] = useState(initialPhone)
  const [detail, setDetail] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const loadDetail = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await apiFetch(`/marketplace/products/${productId}`)
      setDetail(data)
    } catch (e) {
      setError(e?.message || '加载商品失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDetail()
  }, [productId])

  const priceText = useMemo(() => `$${(Number(detail?.price_cents || 0) / 100).toFixed(2)}`, [detail])

  const addToCart = async () => {
    setMessage('')
    setError('')
    if (!phone.trim()) {
      setError('请先填写手机号')
      return
    }
    localStorage.setItem('rp_shop_phone', phone)
    try {
      await apiFetch('/cart/items', {
        method: 'POST',
        body: {
          phone: phone.trim(),
          product_id: detail.id,
          quantity,
        },
      })
      setMessage('已加入购物车')
    } catch (e) {
      setError(e?.message || '加入购物车失败')
    }
  }

  return (
    <div className="site">
      <section className="section">
        <div className="container">
          <Link className="btn btn-outline" to="/rainbowpaw/marketplace">
            返回商城
          </Link>
          {loading && <p className="shop-hint">加载中...</p>}
          {error && <p className="shop-error">{error}</p>}
          {detail && (
            <article className="card shop" style={{ marginTop: '1rem' }}>
              {detail.images?.[0]?.image_url ? <SafeImage src={detail.images[0].image_url} alt={detail.name} /> : <div className="shop-ph">No Image</div>}
              <h2>{detail.name}</h2>
              <p>{detail.description || '温暖纪念服务'}</p>
              <p className="shop-price">{priceText}</p>
              <p className="shop-hint">制作周期：{detail.production_time_days || 3} 天</p>
              <p className="shop-hint">交付方式：{detail.delivery_type || 'shipment'}</p>
              <p className="shop-hint">商家：{detail.merchant?.name || '平台精选商家'}</p>
              <div className="shop-form">
                <input className="shop-input" placeholder="手机号" value={phone} onChange={(e) => setPhone(e.target.value)} />
                <input
                  className="shop-input"
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value || 1)))}
                />
              </div>
              <div className="shop-actions">
                <button className="btn btn-dark" onClick={addToCart}>
                  Add to Cart
                </button>
                <Link className="btn btn-outline" to={`/rainbowpaw/marketplace/cart?phone=${encodeURIComponent(phone)}`}>
                  Buy Now
                </Link>
              </div>
              {message && <p className="shop-ok">{message}</p>}
            </article>
          )}
        </div>
      </section>
    </div>
  )
}
