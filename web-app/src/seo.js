function ensureMeta(selector, createAttrs) {
  const head = document && document.head ? document.head : null
  if (!head) return null
  const found = document.querySelector(selector)
  if (found) return found
  const meta = document.createElement('meta')
  for (const [k, v] of Object.entries(createAttrs || {})) meta.setAttribute(k, String(v))
  head.appendChild(meta)
  return meta
}

function setMetaName(name, content) {
  if (!name) return
  const meta = ensureMeta(`meta[name="${CSS.escape(String(name))}"]`, { name })
  if (meta) meta.setAttribute('content', String(content || ''))
}

function setMetaProperty(property, content) {
  if (!property) return
  const meta = ensureMeta(`meta[property="${CSS.escape(String(property))}"]`, { property })
  if (meta) meta.setAttribute('content', String(content || ''))
}

function setLinkRel(rel, href) {
  const head = document && document.head ? document.head : null
  if (!head) return
  const r = String(rel || '').trim()
  if (!r) return
  let link = document.querySelector(`link[rel="${CSS.escape(r)}"]`)
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', r)
    head.appendChild(link)
  }
  link.setAttribute('href', String(href || ''))
}

function resolveAbsoluteUrl(origin, href) {
  const h = String(href || '').trim()
  if (!h) return ''
  if (h.startsWith('http://') || h.startsWith('https://')) return h
  if (!origin) return h
  return `${origin}${h.startsWith('/') ? '' : '/'}${h}`
}

function setAlternateLinks(origin, alternates) {
  const head = document && document.head ? document.head : null
  if (!head) return
  const prev = head.querySelectorAll('link[data-rp-alt="1"]')
  prev.forEach((n) => n.remove())

  const list = Array.isArray(alternates) ? alternates : []
  for (const item of list) {
    const hreflang = String(item && item.hreflang ? item.hreflang : '').trim()
    const href = resolveAbsoluteUrl(origin, item && item.href ? item.href : '')
    if (!hreflang || !href) continue
    const link = document.createElement('link')
    link.setAttribute('rel', 'alternate')
    link.setAttribute('hreflang', hreflang)
    link.setAttribute('href', href)
    link.setAttribute('data-rp-alt', '1')
    head.appendChild(link)
  }
}

export function applySeo(opts = {}) {
  const title = String(opts.title || '').trim()
  const description = String(opts.description || '').trim()
  const keywords = String(opts.keywords || '').trim()
  const robots = String(opts.robots || '').trim()
  const canonicalPath = String(opts.canonicalPath || '').trim()
  const ogType = String(opts.ogType || 'website').trim()
  const ogImagePath = String(opts.ogImagePath || '/logo.png').trim()
  const htmlLang = String(opts.htmlLang || '').trim()
  const ogLocale = String(opts.ogLocale || '').trim()
  const alternates = Array.isArray(opts.alternates) ? opts.alternates : []

  const origin = window && window.location ? window.location.origin : ''
  const canonicalUrl = origin ? `${origin}${canonicalPath || (window.location ? window.location.pathname : '/')}` : ''
  const ogImage = origin ? `${origin}${ogImagePath.startsWith('/') ? '' : '/'}${ogImagePath}` : ogImagePath

  if (htmlLang) {
    try {
      document.documentElement.lang = htmlLang
    } catch {
      void 0
    }
  }

  if (title) document.title = title
  if (description) setMetaName('description', description)
  if (keywords) setMetaName('keywords', keywords)
  if (robots) setMetaName('robots', robots)
  if (canonicalUrl) setLinkRel('canonical', canonicalUrl)

  if (title) setMetaProperty('og:title', title)
  if (description) setMetaProperty('og:description', description)
  if (canonicalUrl) setMetaProperty('og:url', canonicalUrl)
  if (ogType) setMetaProperty('og:type', ogType)
  if (ogImage) setMetaProperty('og:image', ogImage)
  if (ogLocale) setMetaProperty('og:locale', ogLocale)

  if (alternates.length) setAlternateLinks(origin, alternates)

  setMetaName('twitter:card', 'summary_large_image')
  if (title) setMetaName('twitter:title', title)
  if (description) setMetaName('twitter:description', description)
  if (ogImage) setMetaName('twitter:image', ogImage)
}
