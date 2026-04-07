import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../api/client'
import SafeImage from '../components/SafeImage.jsx'
import { RP_MINIAPP_LANGS, rpMiniAppGetLangLabel, rpMiniAppLangToLocale } from '../i18n/rpMiniApp.js'

const CATEGORY_OPTIONS = [
  { key: '', label: '全部' },
  { key: 'senior_care', label: '老年护理' },
  { key: 'care_pack', label: '护理套餐' },
  { key: 'memory', label: '情感纪念' },
  { key: 'urn', label: '骨灰盒' },
]

export default function MarketplacePage() {
  const [category, setCategory] = useState('')
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [phone, setPhone] = useState(localStorage.getItem('rp_shop_phone') || '')
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem('rp_miniapp_lang') || 'ZH'
    } catch {
      return 'ZH'
    }
  })

  const loadProducts = async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (category) params.set('category', category)
      params.set('lang', rpMiniAppLangToLocale(lang))
      const query = params.toString() ? `?${params.toString()}` : ''
      const data = await apiFetch(`/marketplace/products${query}`)
      setProducts(Array.isArray(data?.items) ? data.items : [])
    } catch (e) {
      setError(e?.message || '加载商品失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [category, lang])

  useEffect(() => {
    try {
      localStorage.setItem('rp_miniapp_lang', String(lang || 'ZH'))
    } catch {
      void 0
    }
  }, [lang])

  const priceFormatter = useMemo(
    () => new Intl.NumberFormat('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 }),
    [],
  )

  return (
    <div className="site">
      <section className="section">
        <div className="container">
          <h1 className="section-title">纪念商城</h1>
          <p className="section-sub">线上纪念 + 商品服务交易，支持平台化扩展。</p>
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
            <input
              className="shop-input"
              placeholder="下单手机号"
              value={phone}
              onChange={(e) => {
                const v = e.target.value
                setPhone(v)
                localStorage.setItem('rp_shop_phone', v)
              }}
            />
            <Link className="btn btn-outline" to={`/rainbowpaw/marketplace/cart?phone=${encodeURIComponent(phone || '')}`}>
              购物车
            </Link>
          </div>
          <div className="tags">
            {CATEGORY_OPTIONS.map((option) => (
              <button
                key={option.key || 'all'}
                onClick={() => setCategory(option.key)}
                className={`tag ${category === option.key ? 'on' : ''}`}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
          {loading && <p className="shop-hint">加载中...</p>}
          {error && <p className="shop-error">{error}</p>}
          <div className="cards three" style={{ marginTop: '1rem' }}>
            {products.map((product) => (
              <article key={product.id} className="card shop">
                {product.image_url ? <SafeImage src={product.image_url} alt={product.name} /> : <div className="shop-ph">No Image</div>}
                <h3>{product.name}</h3>
                <p>{product.description || '温暖纪念，体面告别。'}</p>
                <p className="shop-price">${priceFormatter.format(Number(product.price_cents || 0) / 100)}</p>
                <div className="shop-actions">
                  <Link className="btn btn-outline" to={`/rainbowpaw/marketplace/product/${product.id}?phone=${encodeURIComponent(phone || '')}`}>
                    查看详情
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
