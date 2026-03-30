import { useEffect, useState } from 'react'
import {
  Heart,
  MessageCircle,
  ChevronRight,
  ShieldCheck,
  Star,
  Menu,
  X,
  MapPin,
  Camera,
  CheckCircle2,
} from 'lucide-react'

import { apiFetch } from '../api/client.js'
import SafeImage from '../components/SafeImage.jsx'
import { applySeo } from '../seo.js'

const TELEGRAM_URL = 'https://t.me/RainbowPawBot'
const SERVICE_CITY = 'Phnom Penh'
const LANGUAGES = ['EN', 'KH', 'ZH']
const LOGO_SRC = '/logo.png'

const PACKAGES = [
  {
    name: 'Basic Package',
    price: 'From $49',
    features: ['Drop-off to service point', 'Group cremation', 'Digital memorial'],
    highlight: false,
  },
  {
    name: 'Standard Package',
    price: 'From $129',
    features: ['Pet pickup', 'Private cremation', 'Basic urn', 'Paw print'],
    highlight: true,
  },
  {
    name: 'Premium Package',
    price: 'From $249',
    features: ['Pet pickup', 'Private cremation', 'Memorial ceremony', 'Premium urn', 'Paw print', 'Memorial photo'],
    highlight: false,
  },
  {
    name: 'Ceremony Package',
    price: 'From $399',
    features: ['Pet hearse pickup', 'Memorial ceremony', 'Private cremation', 'Memorial video', 'Ash jewelry'],
    highlight: false,
  },
]

const MEMORIAL_PETS = [
  { name: 'Bella', years: '2015 – 2024', phrase: 'Forever Loved' },
  { name: 'Max', years: '2012 – 2023', phrase: 'Run Free' },
  { name: 'Luna', years: '2018 – 2024', phrase: 'Always in our hearts' },
  { name: 'Cooper', years: '2010 – 2024', phrase: 'Best Friend' },
]

export default function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [language, setLanguage] = useState('EN')
  const [shopLoading, setShopLoading] = useState(false)
  const [shopError, setShopError] = useState('')
  const [shopProducts, setShopProducts] = useState([])
  const [shopServices, setShopServices] = useState([])
  const [shopPhone, setShopPhone] = useState('')
  const [shopOrderMsg, setShopOrderMsg] = useState('')
  const [memorialItems, setMemorialItems] = useState([])
  const [telegramUser, setTelegramUser] = useState({ telegram_id: '', role: 'owner', name: '' })
  const [authInfo, setAuthInfo] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    applySeo({
      title: 'RainbowPaw | Pet Memorial & Cremation Services',
      description: 'RainbowPaw provides respectful pet memorial and cremation services. We help families say goodbye with dignity and love.',
      keywords: 'RainbowPaw, pet memorial, pet cremation, memorial keepsakes, Phnom Penh, Cambodia, 宠物善终, 宠物火化, 宠物纪念, 金边',
      canonicalPath: '/',
      ogType: 'website',
      ogImagePath: '/logo.png',
    })
  }, [])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadShop() {
      setShopLoading(true)
      setShopError('')
      try {
        const [products, services] = await Promise.all([
          apiFetch('/marketplace/products'),
          apiFetch(`/marketplace/services?city=${encodeURIComponent(SERVICE_CITY)}&category=${encodeURIComponent('cremation')}`),
        ])
        if (cancelled) return
        setShopProducts(Array.isArray(products?.items) ? products.items.slice(0, 6) : [])
        setShopServices(Array.isArray(services?.items) ? services.items.slice(0, 3) : [])
        setMemorialItems([
          { id: 'm1', name: '云端纪念馆（年度）', price: 99, desc: '支持追思页、纪念日提醒、亲友留言。' },
          { id: 'm2', name: '在线祭拜灯牌（30天）', price: 29, desc: '支持点灯祈福与温暖寄语。' },
          { id: 'm3', name: '亲友共创相册', price: 59, desc: '多人上传照片与回忆故事。' },
        ])
      } catch (e) {
        if (cancelled) return
        setShopError(e?.message || '加载失败')
      } finally {
        if (!cancelled) setShopLoading(false)
      }
    }
    loadShop()
    return () => {
      cancelled = true
    }
  }, [])

  const createProductOrder = async (productId) => {
    if (submitting) return
    setSubmitting(true)
    setShopOrderMsg('')
    setShopError('')
    const phone = shopPhone.trim()
    if (!phone) {
      setShopError('请输入手机号')
      setSubmitting(false)
      return
    }
    try {
      const created = await apiFetch('/marketplace/orders', {
        method: 'POST',
        body: {
          order_type: 'product',
          phone,
          city: SERVICE_CITY,
          conversation_channel: 'web',
          product_items: [{ product_id: productId, quantity: 1 }],
        },
      })
      setShopOrderMsg(`下单成功：${created.order_id}`)
    } catch (e) {
      setShopError(e?.message || '下单失败')
    } finally {
      setSubmitting(false)
    }
  }

  const createServiceMatchOrder = async () => {
    if (submitting) return
    setSubmitting(true)
    setShopOrderMsg('')
    setShopError('')
    const phone = shopPhone.trim()
    if (!phone) {
      setShopError('请输入手机号')
      setSubmitting(false)
      return
    }
    try {
      const created = await apiFetch('/marketplace/orders', {
        method: 'POST',
        body: {
          order_type: 'service',
          match_mode: 'platform',
          category: 'cremation',
          phone,
          city: SERVICE_CITY,
          pickup_address: SERVICE_CITY,
          conversation_channel: 'web',
        },
      })
      setShopOrderMsg(`撮合申请已提交：${created.order_id}`)
    } catch (e) {
      setShopError(e?.message || '提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  const loginWithTelegram = async () => {
    setShopError('')
    setShopOrderMsg('')
    if (!telegramUser.telegram_id.trim()) {
      setShopError('请输入 Telegram ID')
      return
    }
    try {
      const result = await apiFetch('/api/v1/auth/telegram/login', {
        method: 'POST',
        body: {
          telegram_id: telegramUser.telegram_id.trim(),
          role: telegramUser.role,
          name: telegramUser.name || undefined,
          phone: shopPhone.trim() || undefined,
          language: 'zh',
        },
      })
      setAuthInfo(result)
      setShopOrderMsg(result.pending_approval ? '商家账号已提交审核，请等待通过。' : 'Telegram 授权成功')
    } catch (e) {
      setShopError(e?.message || '授权失败')
    }
  }

  return (
    <div className="site">
      <nav className={`nav ${scrolled ? 'nav-solid' : ''}`}>
        <div className="container nav-inner">
          <a className="brand" href="#top">
            <img
              src={LOGO_SRC}
              alt="RainbowPaw logo"
              className="logo-mark"
              width="18"
              height="18"
            />
            <span>RainbowPaw</span>
          </a>

          <div className="nav-links desktop-only">
            <a href="#top">Home</a>
            <a href="#services">Services</a>
            <a href="#packages">Packages</a>
            <a href="#shop">Shop</a>
            <a href="#memorial">Memorial</a>
            <a href="#contact">Contact</a>
            <div className="lang-switch" role="group" aria-label="Language switch">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  className={`lang-btn ${language === lang ? 'active' : ''}`}
                  onClick={() => setLanguage(lang)}
                >
                  {lang}
                </button>
              ))}
            </div>
            <a className="btn btn-primary" href={TELEGRAM_URL} target="_blank" rel="noreferrer">
              Chat on Telegram
            </a>
          </div>

          <button className="menu-btn mobile-only" onClick={() => setIsMenuOpen((v) => !v)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="mobile-menu mobile-only">
            <a href="#top" onClick={() => setIsMenuOpen(false)}>
              Home
            </a>
            <a href="#services" onClick={() => setIsMenuOpen(false)}>
              Services
            </a>
            <a href="#packages" onClick={() => setIsMenuOpen(false)}>
              Packages
            </a>
            <a href="#shop" onClick={() => setIsMenuOpen(false)}>
              Shop
            </a>
            <a href="#memorial" onClick={() => setIsMenuOpen(false)}>
              Memorial
            </a>
            <a href="#contact" onClick={() => setIsMenuOpen(false)}>
              Contact
            </a>
            <div className="lang-switch">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  className={`lang-btn ${language === lang ? 'active' : ''}`}
                  onClick={() => setLanguage(lang)}
                >
                  {lang}
                </button>
              ))}
            </div>
            <a
              className="btn btn-primary"
              href={TELEGRAM_URL}
              target="_blank"
              rel="noreferrer"
              onClick={() => setIsMenuOpen(false)}
            >
              Chat on Telegram
            </a>
          </div>
        )}
      </nav>

      <header id="top" className="hero">
        <div className="container hero-grid">
          <div>
            <p className="pill">Every Paw Leaves a Rainbow</p>
            <h1>A Peaceful Farewell for Your Beloved Pet</h1>
            <p className="lead">
              RainbowPaw provides respectful pet memorial and cremation services. We help families
              say goodbye with dignity and love.
            </p>
            <p className="micro-trust">Pickup within 1 hour in {SERVICE_CITY}</p>
            <div className="hero-actions">
              <a className="btn btn-dark" href="#packages">
                <span>Book Service</span>
                <ChevronRight size={18} />
              </a>
              <a className="btn btn-outline" href={TELEGRAM_URL} target="_blank" rel="noreferrer">
                <MessageCircle size={18} />
                <span>Chat on Telegram</span>
              </a>
            </div>
          </div>
          <div className="hero-card">
            <SafeImage
              src="https://images.unsplash.com/photo-1544568100-847a948585b9?auto=format&fit=crop&q=80&w=1200"
              alt="Peaceful pet"
            />
            <div className="hero-note">
              <SafeImage
                src={LOGO_SRC}
                alt="RainbowPaw icon"
                className="logo-inline"
                width="18"
                height="18"
              />
              <div>
                <strong>Compassionate Care</strong>
                <p>Giving them the respect they deserve.</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section id="services" className="section muted">
        <div className="container">
          <h2 className="section-title">Our Services</h2>
          <div className="cards three">
            <article className="card">
              <MapPin className="icon" />
              <h3>Pet Pickup</h3>
              <p>We provide respectful pickup service for your beloved pet.</p>
            </article>
            <article className="card">
              <ShieldCheck className="icon" />
              <h3>Private Cremation</h3>
              <p>Your pet will be cremated individually with dignity and care.</p>
            </article>
            <article className="card">
              <Star className="icon" />
              <h3>Memorial Keepsakes</h3>
              <p>Keep your pet’s memory forever with personalized memorial items.</p>
            </article>
          </div>
        </div>
      </section>

      <section id="packages" className="section">
        <div className="container">
          <h2 className="section-title">Service Packages</h2>
          <p className="section-sub">
            Final pricing may vary by pet weight, pickup location, and special requests.
          </p>
          <div className="cards four">
            {PACKAGES.map((pkg) => (
              <article key={pkg.name} className={`card package ${pkg.highlight ? 'highlight' : ''}`}>
                {pkg.highlight && <span className="badge">Most Popular</span>}
                <h3>{pkg.name}</h3>
                <p className="price">{pkg.price}</p>
                <ul>
                  {pkg.features.map((feature) => (
                    <li key={feature}>
                      <CheckCircle2 size={16} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <a className={`btn ${pkg.highlight ? 'btn-primary' : 'btn-outline'}`} href={TELEGRAM_URL}>
                  Select Plan
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="why-us" className="section dark">
        <div className="container split">
          <div>
            <h2>Why Families Choose RainbowPaw</h2>
            <p>
              We understand pets are family. Our mission is to support people through one of life’s
              hardest moments.
            </p>
            <div className="reasons">
              {[
                'Compassionate care',
                'Transparent process',
                'Respectful farewell',
                'Trusted by pet owners',
              ].map((item) => (
                <div key={item}>{item}</div>
              ))}
            </div>
          </div>
          <div className="stat">Over 5,000+ Pets Honored with Love</div>
        </div>
      </section>

      <section id="shop" className="section muted">
        <div className="container">
          <h2 className="section-title">Memorial Shop</h2>
          <p className="section-sub">商品与服务来自平台供给侧（商家入驻 → 上架 → 用户下单 → 履约 → 评价）。</p>

          <div className="shop-form">
            <input
              className="shop-input"
              placeholder="输入手机号，用于下单与查询"
              value={shopPhone}
              onChange={(e) => setShopPhone(e.target.value)}
            />
            <a className="btn btn-outline" href="/rainbowpaw">
              打开 Mini App
            </a>
          </div>

          {shopLoading && <p className="shop-hint">加载中...</p>}
          {!!shopError && <p className="shop-error">{shopError}</p>}
          {!!shopOrderMsg && <p className="shop-ok">{shopOrderMsg}</p>}

          <div className="cards three">
            {shopServices.map((svc) => (
              <article key={svc.id} className="card">
                <h3>{svc.service_name}</h3>
                <p>{svc.description}</p>
                <p className="price">
                  {(svc.currency || 'USD') + ' ' + ((svc.price_cents || 0) / 100).toFixed(2)}
                </p>
                <button type="button" className="btn btn-dark" onClick={createServiceMatchOrder} disabled={submitting}>
                  一键撮合（平台指派）
                </button>
              </article>
            ))}
            {shopProducts.slice(0, 3).map((p) => (
              <article key={p.id} className="card">
                <h3>{p.name}</h3>
                <p>{p.description}</p>
                <p className="price">
                  {(p.currency || 'USD') + ' ' + ((p.price_cents || 0) / 100).toFixed(2)}
                </p>
                <button type="button" className="btn btn-primary" onClick={() => createProductOrder(p.id)} disabled={submitting}>
                  立即下单
                </button>
              </article>
            ))}
          </div>

          <div className="shop-actions">
            <a className="btn btn-outline" href="/rainbowpaw/marketplace">
              进入商城
            </a>
            <a className="btn btn-dark" href={TELEGRAM_URL} target="_blank" rel="noreferrer">
              Ask for Shop Catalog
            </a>
          </div>
        </div>
      </section>

      <section id="memorial" className="section">
        <div className="container">
          <h2 className="section-title with-icon">
            <Camera size={24} />
            <span>Online Memorial</span>
          </h2>
          <p className="section-sub">在线纪念、在线祭拜、亲友共创，持续陪伴每一次想念。</p>
          <div className="cards three">
            {memorialItems.map((item) => (
              <article key={item.id} className="card memorial">
                <div className="memorial-photo">
                  <Heart size={26} />
                </div>
                <h3>{item.name}</h3>
                <p>{item.desc}</p>
                <p className="price">${item.price}</p>
              </article>
            ))}
          </div>
          <div className="cards four" style={{ marginTop: '1rem' }}>
            {MEMORIAL_PETS.map((pet) => (
              <article key={pet.name} className="card memorial">
                <div className="memorial-photo">
                  <Heart size={30} />
                </div>
                <h3>{pet.name}</h3>
                <small>{pet.years}</small>
                <p>{pet.phrase}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section muted" id="telegram-auth">
        <div className="container">
          <h2 className="section-title">Telegram 授权登录</h2>
          <p className="section-sub">支持宠物主人与商家双身份登录，商家可直接进入商家工作台。</p>
          <div className="shop-form">
            <input
              className="shop-input"
              placeholder="Telegram ID"
              value={telegramUser.telegram_id}
              onChange={(e) => setTelegramUser((prev) => ({ ...prev, telegram_id: e.target.value }))}
            />
            <input
              className="shop-input"
              placeholder="昵称（可选）"
              value={telegramUser.name}
              onChange={(e) => setTelegramUser((prev) => ({ ...prev, name: e.target.value }))}
            />
            <select
              className="shop-input"
              value={telegramUser.role}
              onChange={(e) => setTelegramUser((prev) => ({ ...prev, role: e.target.value }))}
            >
              <option value="owner">宠物主人</option>
              <option value="merchant">宠物商家</option>
            </select>
            <button className="btn btn-dark" onClick={loginWithTelegram}>
              Telegram 授权
            </button>
          </div>
          {authInfo?.role === 'merchant' && (
            <div className="shop-actions">
              <a className="btn btn-outline" href="/rainbowpaw/merchant">
                进入商家端
              </a>
            </div>
          )}
        </div>
      </section>

      <section id="contact" className="section">
        <div className="container cta">
          <h2>Need Help Saying Goodbye?</h2>
          <p>We are here for you 24/7. Contact us anytime for support and service booking.</p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#packages">
              Book a Service
            </a>
            <a className="btn btn-outline" href={TELEGRAM_URL} target="_blank" rel="noreferrer">
              <MessageCircle size={18} />
              <span>Chat on Telegram</span>
            </a>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container footer-inner">
          <div className="brand">
            <img
              src={LOGO_SRC}
              alt="RainbowPaw logo"
              className="logo-mark"
              width="18"
              height="18"
            />
            <span>RainbowPaw</span>
          </div>
          <div className="footer-meta">
            <div className="footer-row">
              <a href={TELEGRAM_URL} target="_blank" rel="noreferrer">
                Telegram: @RainbowPawBot
              </a>
              <span>Phone: +855 00 000 000</span>
              <span>Email: hello@rainbowpaw.com</span>
            </div>
            <div className="footer-row">
              <span>Service area: {SERVICE_CITY}</span>
              <span>Language: {language} (more coming soon)</span>
            </div>
          </div>
          <p>© {new Date().getFullYear()} RainbowPaw</p>
        </div>
      </footer>

      <a
        className="floating-btn"
        href={TELEGRAM_URL}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat on Telegram"
      >
        <MessageCircle size={22} />
      </a>
    </div>
  )
}
