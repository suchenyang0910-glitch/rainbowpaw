import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
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
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  getLocaleNativeName,
  getMessages,
  localeToApiLang,
  localeToHreflang,
  localeToOgLocale,
  replaceLocaleInPath,
  setLocalePreference,
  t,
} from '../i18n/index.js'

const TELEGRAM_URL = 'https://t.me/RainbowPawBot'
const SERVICE_CITY_QUERY = 'Phnom Penh'
const LOGO_SRC = '/logo.png'

export default function HomePage({ locale: localeProp }) {
  const location = useLocation()
  const navigate = useNavigate()
  const locale = SUPPORTED_LOCALES.includes(localeProp) ? localeProp : DEFAULT_LOCALE
  const msg = useMemo(() => getMessages(locale), [locale])

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
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
    setLocalePreference(locale)

    const alternates = SUPPORTED_LOCALES.map((l) => ({
      hreflang: localeToHreflang(l),
      href: `/${l}`,
    }))
    alternates.push({ hreflang: 'x-default', href: `/${DEFAULT_LOCALE}` })

    applySeo({
      title: t(locale, 'seo.title'),
      description: t(locale, 'seo.description'),
      keywords: t(locale, 'seo.keywords'),
      canonicalPath: `/${locale}`,
      ogType: 'website',
      ogImagePath: '/logo.png',
      htmlLang: localeToHreflang(locale),
      ogLocale: localeToOgLocale(locale),
      alternates,
    })
  }, [locale])

  useEffect(() => {
    const items = Array.isArray(msg?.memorial?.items) ? msg.memorial.items : []
    setMemorialItems(items)
  }, [msg])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [locale])

  useEffect(() => {
    let cancelled = false
    async function loadShop() {
      setShopLoading(true)
      setShopError('')
      try {
        const [products, services] = await Promise.all([
          apiFetch('/marketplace/products'),
          apiFetch(`/marketplace/services?city=${encodeURIComponent(SERVICE_CITY_QUERY)}&category=${encodeURIComponent('cremation')}`),
        ])
        if (cancelled) return
        setShopProducts(Array.isArray(products?.items) ? products.items.slice(0, 6) : [])
        setShopServices(Array.isArray(services?.items) ? services.items.slice(0, 3) : [])
      } catch (e) {
        if (cancelled) return
        setShopError(e?.message || t(locale, 'shop.errors.loadFailed'))
      } finally {
        if (!cancelled) setShopLoading(false)
      }
    }
    loadShop()
    return () => {
      cancelled = true
    }
  }, [locale])

  const createProductOrder = async (productId) => {
    if (submitting) return
    setSubmitting(true)
    setShopOrderMsg('')
    setShopError('')
    const phone = shopPhone.trim()
    if (!phone) {
      setShopError(t(locale, 'shop.errors.phoneRequired'))
      setSubmitting(false)
      return
    }
    try {
      const created = await apiFetch('/marketplace/orders', {
        method: 'POST',
        body: {
          order_type: 'product',
          phone,
          city: SERVICE_CITY_QUERY,
          conversation_channel: 'web',
          product_items: [{ product_id: productId, quantity: 1 }],
        },
      })
      setShopOrderMsg(t(locale, 'shop.messages.orderCreated', { orderId: created.order_id }))
    } catch (e) {
      setShopError(e?.message || t(locale, 'shop.errors.orderFailed'))
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
      setShopError(t(locale, 'shop.errors.phoneRequired'))
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
          city: SERVICE_CITY_QUERY,
          pickup_address: SERVICE_CITY_QUERY,
          conversation_channel: 'web',
        },
      })
      setShopOrderMsg(t(locale, 'shop.messages.matchCreated', { orderId: created.order_id }))
    } catch (e) {
      setShopError(e?.message || t(locale, 'shop.errors.submitFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  const loginWithTelegram = async () => {
    setShopError('')
    setShopOrderMsg('')
    if (!telegramUser.telegram_id.trim()) {
      setShopError(t(locale, 'telegramAuth.errors.telegramIdRequired'))
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
          language: localeToApiLang(locale),
        },
      })
      setAuthInfo(result)
      setShopOrderMsg(result.pending_approval ? t(locale, 'telegramAuth.messages.pending') : t(locale, 'telegramAuth.messages.approved'))
    } catch (e) {
      setShopError(e?.message || t(locale, 'telegramAuth.errors.authFailed'))
    }
  }

  const packages = useMemo(() => (Array.isArray(msg?.packages?.items) ? msg.packages.items : []), [msg])
  const memorialPets = useMemo(() => (Array.isArray(msg?.memorial?.pets) ? msg.memorial.pets : []), [msg])

  const onSwitchLocale = (nextLocale) => {
    const next = replaceLocaleInPath(location.pathname, nextLocale)
    setLocalePreference(nextLocale)
    navigate(`${next}${location.hash || ''}`)
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
            <a href="#top">{t(locale, 'nav.home')}</a>
            <a href="#services">{t(locale, 'nav.services')}</a>
            <a href="#packages">{t(locale, 'nav.packages')}</a>
            <a href="#shop">{t(locale, 'nav.shop')}</a>
            <a href="#memorial">{t(locale, 'nav.memorial')}</a>
            <a href="#contact">{t(locale, 'nav.contact')}</a>
            <div className="lang-switch" role="group" aria-label={t(locale, 'lang.label')}>
              {SUPPORTED_LOCALES.map((l) => (
                <button
                  key={l}
                  type="button"
                  className={`lang-btn ${locale === l ? 'active' : ''}`}
                  onClick={() => onSwitchLocale(l)}
                >
                  {getLocaleNativeName(l)}
                </button>
              ))}
            </div>
            <a className="btn btn-primary" href={TELEGRAM_URL} target="_blank" rel="noreferrer">
              {t(locale, 'nav.chatTelegram')}
            </a>
          </div>

          <button className="menu-btn mobile-only" onClick={() => setIsMenuOpen((v) => !v)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="mobile-menu mobile-only">
            <a href="#top" onClick={() => setIsMenuOpen(false)}>
              {t(locale, 'nav.home')}
            </a>
            <a href="#services" onClick={() => setIsMenuOpen(false)}>
              {t(locale, 'nav.services')}
            </a>
            <a href="#packages" onClick={() => setIsMenuOpen(false)}>
              {t(locale, 'nav.packages')}
            </a>
            <a href="#shop" onClick={() => setIsMenuOpen(false)}>
              {t(locale, 'nav.shop')}
            </a>
            <a href="#memorial" onClick={() => setIsMenuOpen(false)}>
              {t(locale, 'nav.memorial')}
            </a>
            <a href="#contact" onClick={() => setIsMenuOpen(false)}>
              {t(locale, 'nav.contact')}
            </a>
            <div className="lang-switch">
              {SUPPORTED_LOCALES.map((l) => (
                <button
                  key={l}
                  type="button"
                  className={`lang-btn ${locale === l ? 'active' : ''}`}
                  onClick={() => {
                    onSwitchLocale(l)
                    setIsMenuOpen(false)
                  }}
                >
                  {getLocaleNativeName(l)}
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
              {t(locale, 'nav.chatTelegram')}
            </a>
          </div>
        )}
      </nav>

      <header id="top" className="hero">
        <div className="container hero-grid">
          <div>
            <p className="pill">{t(locale, 'hero.pill')}</p>
            <h1>{t(locale, 'hero.title')}</h1>
            <p className="lead">{t(locale, 'hero.lead')}</p>
            <p className="micro-trust">{t(locale, 'hero.microTrust', { city: msg.site.serviceCity })}</p>
            <div className="hero-actions">
              <a className="btn btn-dark" href="#packages">
                <span>{t(locale, 'hero.bookService')}</span>
                <ChevronRight size={18} />
              </a>
              <a className="btn btn-outline" href={TELEGRAM_URL} target="_blank" rel="noreferrer">
                <MessageCircle size={18} />
                <span>{t(locale, 'nav.chatTelegram')}</span>
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
                <strong>{t(locale, 'hero.compassionateTitle')}</strong>
                <p>{t(locale, 'hero.compassionateDesc')}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section id="services" className="section muted">
        <div className="container">
          <h2 className="section-title">{t(locale, 'services.title')}</h2>
          <div className="cards three">
            <article className="card">
              <MapPin className="icon" />
              <h3>{t(locale, 'services.pickupTitle')}</h3>
              <p>{t(locale, 'services.pickupDesc')}</p>
            </article>
            <article className="card">
              <ShieldCheck className="icon" />
              <h3>{t(locale, 'services.cremationTitle')}</h3>
              <p>{t(locale, 'services.cremationDesc')}</p>
            </article>
            <article className="card">
              <Star className="icon" />
              <h3>{t(locale, 'services.keepsakesTitle')}</h3>
              <p>{t(locale, 'services.keepsakesDesc')}</p>
            </article>
          </div>
        </div>
      </section>

      <section id="packages" className="section">
        <div className="container">
          <h2 className="section-title">{t(locale, 'packages.title')}</h2>
          <p className="section-sub">{t(locale, 'packages.subtitle')}</p>
          <div className="cards four">
            {packages.map((pkg) => (
              <article key={pkg.name} className={`card package ${pkg.highlight ? 'highlight' : ''}`}>
                {pkg.highlight && <span className="badge">{t(locale, 'packages.badgePopular')}</span>}
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
                  {t(locale, 'packages.selectPlan')}
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="why-us" className="section dark">
        <div className="container split">
          <div>
            <h2>{t(locale, 'why.title')}</h2>
            <p>{t(locale, 'why.desc')}</p>
            <div className="reasons">
              {(Array.isArray(msg?.why?.reasons) ? msg.why.reasons : []).map((item) => (
                <div key={item}>{item}</div>
              ))}
            </div>
          </div>
          <div className="stat">{t(locale, 'why.stat')}</div>
        </div>
      </section>

      <section id="shop" className="section muted">
        <div className="container">
          <h2 className="section-title">{t(locale, 'shop.title')}</h2>
          <p className="section-sub">{t(locale, 'shop.subtitle')}</p>

          <div className="shop-form">
            <input
              className="shop-input"
              placeholder={t(locale, 'shop.phonePlaceholder')}
              value={shopPhone}
              onChange={(e) => setShopPhone(e.target.value)}
            />
            <a className="btn btn-outline" href="/rainbowpaw">
              {t(locale, 'shop.openMiniApp')}
            </a>
          </div>

          {shopLoading && <p className="shop-hint">{t(locale, 'shop.loading')}</p>}
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
                  {t(locale, 'shop.serviceMatch')}
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
                  {t(locale, 'shop.orderNow')}
                </button>
              </article>
            ))}
          </div>

          <div className="shop-actions">
            <a className="btn btn-outline" href="/rainbowpaw/marketplace">
              {t(locale, 'shop.enterMarketplace')}
            </a>
            <a className="btn btn-dark" href={TELEGRAM_URL} target="_blank" rel="noreferrer">
              {t(locale, 'shop.askCatalog')}
            </a>
          </div>
        </div>
      </section>

      <section id="memorial" className="section">
        <div className="container">
          <h2 className="section-title with-icon">
            <Camera size={24} />
            <span>{t(locale, 'memorial.title')}</span>
          </h2>
          <p className="section-sub">{t(locale, 'memorial.subtitle')}</p>
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
            {memorialPets.map((pet) => (
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
          <h2 className="section-title">{t(locale, 'telegramAuth.title')}</h2>
          <p className="section-sub">{t(locale, 'telegramAuth.subtitle')}</p>
          <div className="shop-form">
            <input
              className="shop-input"
              placeholder={t(locale, 'telegramAuth.telegramId')}
              value={telegramUser.telegram_id}
              onChange={(e) => setTelegramUser((prev) => ({ ...prev, telegram_id: e.target.value }))}
            />
            <input
              className="shop-input"
              placeholder={t(locale, 'telegramAuth.nicknameOptional')}
              value={telegramUser.name}
              onChange={(e) => setTelegramUser((prev) => ({ ...prev, name: e.target.value }))}
            />
            <select
              className="shop-input"
              value={telegramUser.role}
              onChange={(e) => setTelegramUser((prev) => ({ ...prev, role: e.target.value }))}
            >
              <option value="owner">{t(locale, 'telegramAuth.roleOwner')}</option>
              <option value="merchant">{t(locale, 'telegramAuth.roleMerchant')}</option>
            </select>
            <button className="btn btn-dark" onClick={loginWithTelegram}>
              {t(locale, 'telegramAuth.authorize')}
            </button>
          </div>
          {authInfo?.role === 'merchant' && (
            <div className="shop-actions">
              <a className="btn btn-outline" href="/rainbowpaw/merchant">
                {t(locale, 'telegramAuth.enterMerchant')}
              </a>
            </div>
          )}
        </div>
      </section>

      <section id="contact" className="section">
        <div className="container cta">
          <h2>{t(locale, 'contact.title')}</h2>
          <p>{t(locale, 'contact.desc')}</p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#packages">
              {t(locale, 'contact.bookService')}
            </a>
            <a className="btn btn-outline" href={TELEGRAM_URL} target="_blank" rel="noreferrer">
              <MessageCircle size={18} />
              <span>{t(locale, 'contact.chatTelegram')}</span>
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
                {t(locale, 'footer.telegram')}
              </a>
              <span>{t(locale, 'footer.phone')}</span>
              <span>{t(locale, 'footer.email')}</span>
            </div>
            <div className="footer-row">
              <span>{t(locale, 'footer.serviceArea', { city: msg.site.serviceCity })}</span>
              <span>{t(locale, 'footer.languageNote', { lang: getLocaleNativeName(locale) })}</span>
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
        aria-label={t(locale, 'nav.chatTelegram')}
      >
        <MessageCircle size={22} />
      </a>
    </div>
  )
}
