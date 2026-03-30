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

export function applySeo(opts = {}) {
  const title = String(opts.title || '').trim()
  const description = String(opts.description || '').trim()
  const keywords = String(opts.keywords || '').trim()
  const robots = String(opts.robots || '').trim()
  const canonicalPath = String(opts.canonicalPath || '').trim()
  const ogType = String(opts.ogType || 'website').trim()
  const ogImagePath = String(opts.ogImagePath || '/logo.png').trim()

  const origin = window && window.location ? window.location.origin : ''
  const canonicalUrl = origin ? `${origin}${canonicalPath || (window.location ? window.location.pathname : '/')}` : ''
  const ogImage = origin ? `${origin}${ogImagePath.startsWith('/') ? '' : '/'}${ogImagePath}` : ogImagePath

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

  setMetaName('twitter:card', 'summary_large_image')
  if (title) setMetaName('twitter:title', title)
  if (description) setMetaName('twitter:description', description)
  if (ogImage) setMetaName('twitter:image', ogImage)
}
