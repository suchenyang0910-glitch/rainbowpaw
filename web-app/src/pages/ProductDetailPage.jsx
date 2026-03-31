import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { apiFetch } from '../api/client'
import SafeImage from '../components/SafeImage.jsx'
import { RP_MINIAPP_LANGS, rpMiniAppGetLangLabel, rpMiniAppLangToLocale } from '../i18n/rpMiniApp.js'

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
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem('rp_miniapp_lang') || 'ZH'
    } catch {
      return 'ZH'
    }
  })

  const ui = useMemo(() => {
    const id = String(lang || '').toUpperCase()
    if (id === 'ZH') return { add: '加入购物车', buy: '立即购买', back: '返回商城' }
    if (id === 'KM') return { add: 'បន្ថែមទៅកន្ត្រក', buy: 'ទិញឥឡូវ', back: 'ត្រឡប់ទៅហាង' }
    return { add: 'Add to Cart', buy: 'Buy Now', back: 'Back' }
  }, [lang])

  const loadDetail = async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      params.set('lang', rpMiniAppLangToLocale(lang))
      const data = await apiFetch(`/marketplace/products/${productId}?${params.toString()}`)
      setDetail(data)
    } catch (e) {
      setError(e?.message || '加载商品失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDetail()
  }, [productId, lang])

  useEffect(() => {
    try {
      localStorage.setItem('rp_miniapp_lang', String(lang || 'ZH'))
    } catch {
      void 0
    }
  }, [lang])

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
            {ui.back}
          </Link>
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
                  {ui.add}
                </button>
                <Link className="btn btn-outline" to={`/rainbowpaw/marketplace/cart?phone=${encodeURIComponent(phone)}`}>
                  {ui.buy}
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
