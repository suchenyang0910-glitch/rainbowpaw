import { useEffect } from 'react'
import RainbowPawMiniApp from '../products/RainbowPawMiniApp.jsx'
import { applySeo } from '../seo.js'

export default function MiniAppPage() {
  useEffect(() => {
    applySeo({
      title: 'RainbowPaw Mini App | Aftercare, Memorial & Shop',
      description: 'One-stop mini app for aftercare services, online memorial, and memorial keepsakes — gentle support for every goodbye.',
      keywords: 'RainbowPaw Mini App, Telegram WebApp, pet memorial, pet cremation, memorial keepsakes, aftercare, 宠物善终, 宠物纪念, 小程序',
      canonicalPath: '/rainbowpaw',
      ogType: 'website',
      ogImagePath: '/logo.png',
    })
  }, [])
  return (
    <RainbowPawMiniApp />
  )
}
