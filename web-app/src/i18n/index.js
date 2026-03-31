import enHome from './locales/en/home.json'
import zhHome from './locales/zh-CN/home.json'
import kmHome from './locales/km/home.json'

export const SUPPORTED_LOCALES = ['km', 'zh-CN', 'en']
export const DEFAULT_LOCALE = 'zh-CN'

const MESSAGES = {
  en: enHome,
  'zh-CN': zhHome,
  km: kmHome,
}

function getCookie(name) {
  try {
    const raw = String(document && document.cookie ? document.cookie : '')
    const parts = raw.split(';')
    for (const p of parts) {
      const s = String(p || '').trim()
      if (!s) continue
      const idx = s.indexOf('=')
      if (idx <= 0) continue
      const k = s.slice(0, idx).trim()
      if (k !== name) continue
      return decodeURIComponent(s.slice(idx + 1))
    }
    return ''
  } catch {
    return ''
  }
}

export function normalizeLocale(raw) {
  const v = String(raw || '').trim()
  if (!v) return ''
  if (v === 'zh' || v === 'zh-cn' || v === 'zh_CN') return 'zh-CN'
  if (v === 'km-kh' || v === 'km_KH') return 'km'
  if (v === 'en-us' || v === 'en_US') return 'en'
  if (SUPPORTED_LOCALES.includes(v)) return v
  const lower = v.toLowerCase()
  if (lower.startsWith('zh')) return 'zh-CN'
  if (lower.startsWith('km')) return 'km'
  if (lower.startsWith('en')) return 'en'
  return ''
}

export function getLocaleNativeName(locale) {
  const l = normalizeLocale(locale) || DEFAULT_LOCALE
  if (l === 'km') return 'ខ្មែរ'
  if (l === 'en') return 'English'
  return '中文'
}

export function setLocalePreference(locale) {
  const l = normalizeLocale(locale)
  if (!l) return
  try {
    document.cookie = `site_locale=${encodeURIComponent(l)}; Max-Age=31536000; Path=/; SameSite=Lax`
  } catch {
    void 0
  }
  try {
    window.localStorage.setItem('site_locale', l)
  } catch {
    void 0
  }
}

export function getPreferredLocale() {
  const c = normalizeLocale(getCookie('site_locale'))
  if (c) return c
  try {
    const ls = normalizeLocale(window.localStorage.getItem('site_locale'))
    if (ls) return ls
  } catch {
    void 0
  }
  try {
    const langs = Array.isArray(navigator.languages) ? navigator.languages : [navigator.language]
    for (const lang of langs) {
      const n = normalizeLocale(lang)
      if (n) return n
    }
  } catch {
    void 0
  }
  return DEFAULT_LOCALE
}

export function replaceLocaleInPath(pathname, nextLocale) {
  const l = normalizeLocale(nextLocale) || DEFAULT_LOCALE
  const p = String(pathname || '/')
  const parts = p.split('?')[0].split('#')[0].split('/').filter(Boolean)
  const first = parts.length ? normalizeLocale(parts[0]) : ''
  const rest = first ? parts.slice(1) : parts
  const next = [''].concat([l]).concat(rest).join('/')
  return next || `/${l}`
}

export function getMessages(locale) {
  const l = normalizeLocale(locale) || DEFAULT_LOCALE
  return MESSAGES[l] || MESSAGES[DEFAULT_LOCALE]
}

function getByPath(obj, path) {
  const parts = String(path || '').split('.').filter(Boolean)
  let cur = obj
  for (const p of parts) {
    if (!cur || typeof cur !== 'object') return undefined
    cur = cur[p]
  }
  return cur
}

function format(str, vars) {
  const s = String(str)
  const v = vars && typeof vars === 'object' ? vars : {}
  return s.replace(/\{(\w+)\}/g, (m, k) => {
    if (Object.prototype.hasOwnProperty.call(v, k)) return String(v[k])
    return m
  })
}

export function t(locale, key, vars) {
  const l = normalizeLocale(locale) || DEFAULT_LOCALE
  const primary = getByPath(MESSAGES[l] || {}, key)
  const fallback = getByPath(MESSAGES[DEFAULT_LOCALE] || {}, key)
  const value = typeof primary === 'string' ? primary : typeof fallback === 'string' ? fallback : ''
  return value ? format(value, vars) : String(key || '')
}

export function localeToApiLang(locale) {
  const l = normalizeLocale(locale) || DEFAULT_LOCALE
  if (l === 'en') return 'en'
  if (l === 'km') return 'km'
  return 'zh'
}

export function localeToHreflang(locale) {
  const l = normalizeLocale(locale) || DEFAULT_LOCALE
  if (l === 'km') return 'km'
  if (l === 'en') return 'en'
  return 'zh-CN'
}

export function localeToOgLocale(locale) {
  const l = normalizeLocale(locale) || DEFAULT_LOCALE
  if (l === 'km') return 'km_KH'
  if (l === 'en') return 'en_US'
  return 'zh_CN'
}
