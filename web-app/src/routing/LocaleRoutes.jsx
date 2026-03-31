import { useEffect } from 'react'
import { Navigate, useLocation, useParams } from 'react-router-dom'
import HomePage from '../pages/HomePage.jsx'
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, getPreferredLocale, normalizeLocale, setLocalePreference } from '../i18n/index.js'

export function RootRedirect() {
  const loc = useLocation()
  const target = getPreferredLocale()
  return <Navigate to={`/${target}${loc.hash || ''}`} replace />
}

export function LocaleHome() {
  const loc = useLocation()
  const params = useParams()
  const raw = params && params.locale ? params.locale : ''
  const locale = normalizeLocale(raw)

  useEffect(() => {
    if (locale && SUPPORTED_LOCALES.includes(locale)) setLocalePreference(locale)
  }, [locale])

  if (!locale) return <Navigate to={`/${getPreferredLocale()}${loc.hash || ''}`} replace />
  if (!SUPPORTED_LOCALES.includes(locale)) return <Navigate to={`/${DEFAULT_LOCALE}${loc.hash || ''}`} replace />
  return <HomePage locale={locale} />
}
