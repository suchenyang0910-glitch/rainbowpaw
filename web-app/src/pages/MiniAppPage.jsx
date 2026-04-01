import { useEffect } from 'react'
import RainbowPawMiniApp from '../products/RainbowPawMiniApp.jsx'
import { applySeo } from '../seo.js'

function resolveLangId() {
  try {
    const saved = localStorage.getItem('rp_miniapp_lang')
    if (saved) return String(saved).toUpperCase()
  } catch {
    void 0
  }
  const raw = typeof navigator !== 'undefined' ? String(navigator.language || '').toLowerCase() : ''
  if (raw === 'zh' || raw === 'zh-cn') return 'ZH'
  if (raw === 'km' || raw === 'km-kh') return 'KM'
  return 'EN'
}

export default function MiniAppPage() {
  useEffect(() => {
    const lang = resolveLangId()
    const seo =
      lang === 'ZH'
        ? {
            title: 'RainbowPaw 小程序 | 善终服务、纪念馆与商城',
            description:
              '一站式小程序：善终服务预约、线上纪念馆、纪念品与周边商品——温柔陪伴每一次告别。',
            keywords:
              'RainbowPaw 小程序, Telegram WebApp, 宠物善终, 宠物火化, 宠物纪念, 纪念品, 善终服务, 线上纪念馆',
          }
        : {
            title: 'RainbowPaw Mini App | Aftercare, Memorial & Shop',
            description:
              'One-stop mini app for aftercare services, online memorial, and memorial keepsakes — gentle support for every goodbye.',
            keywords:
              'RainbowPaw Mini App, Telegram WebApp, pet memorial, pet cremation, memorial keepsakes, aftercare, 宠物善终, 宠物纪念, 小程序',
          }
    applySeo({
      ...seo,
      canonicalPath: '/rainbowpaw',
      ogType: 'website',
      ogImagePath: '/logo.png',
    })
  }, [])
  return (
    <RainbowPawMiniApp />
  )
}
