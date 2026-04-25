import React, { useEffect, useRef, useState } from 'react';
import {
  Home,
  ShoppingBag,
  Shield,
  Wallet,
  User,
  Ticket,
  ChevronRight,
  Copy,
  Search,
  Package,
  Truck,
  CreditCard,
  MapPin,
  Share2,
  ExternalLink,
  Plus,
  Minus,
  X,
  TrendingUp,
  Users,
  DollarSign,
  History,
  ArrowDownLeft,
  ArrowUpRight,
  Clock
} from 'lucide-react';
import { api, getTelegramInitData } from './api';
import { applySeo } from './seo.js'
import { CLAW_MINIAPP_LANGS, clawMiniAppGetLangLabel, clawMiniAppT } from './i18n/clawMiniApp.js'

// --- Mock Data ---
const DROPS = [
  { id: 1, name: '普通宠物', rarity: 'Common', color: 'bg-green-500' },
  { id: 2, name: '稀有玩具', rarity: 'Rare', color: 'bg-blue-500' },
  { id: 3, name: '史诗翅膀', rarity: 'Epic', color: 'bg-purple-500' },
  { id: 4, name: '传说盲盒', rarity: 'Legendary', color: 'bg-red-500' },
];

const PRODUCTS = [
  { id: 101, name: '高级玩具 A', price: 10, groupPrice: 7, category: 'Toys', image: '🧸' },
  { id: 102, name: '纪念金币', price: 25, groupPrice: 18, category: 'Memorial', image: '🪙' },
];

const TRANSACTIONS = [
  { id: 'T1', type: 'Commission', amount: 2.0, status: 'Completed', date: '2023-10-24 14:20', icon: '🎁' },
  { id: 'T2', type: 'Cashback', amount: 3.5, status: 'Pending', date: '2023-10-24 16:45', icon: '🔥' },
  { id: 'T3', type: 'Purchase', amount: -10.0, status: 'Completed', date: '2023-10-23 09:12', icon: '🛍️' },
];

const ACTIVE_GROUPS = [
  { id: 'G1', name: '高级玩具 A', current: 2, total: 3, image: '🧸', timeLeft: '12h 30m' },
];

const DISCOVER_GROUPS = [
  { id: 'G2', leader: 'Lucky_Cat', current: 1, total: 2, image: '🕶️', discount: '30%' },
];

// --- Components ---

function safeCopy(text) {
  const t = String(text || '')
  if (!t) return Promise.resolve(false)
  if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(t).then(() => true).catch(() => false)
  }
  return Promise.resolve(false)
}

function openTelegramLink(url) {
  const u = String(url || '')
  if (!u) return false
  try {
    const tg = window && window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null
    if (tg && typeof tg.openTelegramLink === 'function') {
      tg.openTelegramLink(u)
      return true
    }
  } catch {
    void 0
  }
  window.open(u, '_blank', 'noopener,noreferrer')
  return true
}

function hapticImpact(kind) {
  try {
    const tg = window && window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null
    const hf = tg && tg.HapticFeedback ? tg.HapticFeedback : null
    if (!hf) return false
    if (kind === 'success' && typeof hf.notificationOccurred === 'function') {
      hf.notificationOccurred('success')
      return true
    }
    if (typeof hf.impactOccurred === 'function') {
      hf.impactOccurred(kind === 'heavy' ? 'heavy' : kind === 'medium' ? 'medium' : 'light')
      return true
    }
  } catch {
    void 0
  }
  return false
}

function formatTimeLeft(expireAt, nowMs) {
  const ts = expireAt ? new Date(expireAt).getTime() : NaN
  const now = Number.isFinite(nowMs) ? nowMs : Date.now()
  if (!Number.isFinite(ts)) return ''
  const diff = ts - now
  if (diff <= 0) return '已结束'
  const totalMin = Math.floor(diff / 60000)
  const days = Math.floor(totalMin / 1440)
  const hours = Math.floor((totalMin % 1440) / 60)
  const mins = totalMin % 60
  if (days > 0) return `${days}天${hours}小时`
  if (hours > 0) return `${hours}小时${mins}分`
  return `${mins}分`
}

function makeAftercareStartLink(scene) {
  const u = (import.meta && import.meta.env && import.meta.env.VITE_AFTERCARE_BOT_USERNAME) || 'rainbowpawbot'
  const s = scene ? String(scene) : ''
  return `https://t.me/${String(u).trim()}?start=${encodeURIComponent(s)}`
}

function makeBotStartLink(botUsername, payload) {
  const u = String(botUsername || '').trim()
  if (!u) return ''
  const p = payload ? String(payload) : ''
  return `https://t.me/${u}?start=${encodeURIComponent(p)}`
}

function tierMeta(tier) {
  const t = String(tier || '').toLowerCase()
  if (t === 'legendary') return { label: 'Legendary', pill: 'bg-red-50 text-red-700 border-red-100' }
  if (t === 'epic') return { label: 'Epic', pill: 'bg-purple-50 text-purple-700 border-purple-100' }
  if (t === 'rare') return { label: 'Rare', pill: 'bg-blue-50 text-blue-700 border-blue-100' }
  if (t === 'small') return { label: 'Small', pill: 'bg-orange-50 text-orange-700 border-orange-100' }
  return { label: t ? t : 'Common', pill: 'bg-green-50 text-green-700 border-green-100' }
}

const PaymentModal = ({ data, onClose, onSubmitProof, onSubmitProofFile, onShareLink, onPreviewProof }) => {
  const [proof, setProof] = useState('')
  const [fileBusy, setFileBusy] = useState(false)
  const [proofBusy, setProofBusy] = useState(false)
  if (!data) return null
  const pay = data.pay || {}
  const status = data.payment && data.payment.status ? String(data.payment.status) : ''
  return (
    <div className="fixed inset-0 bg-black/40 z-[70] flex items-end animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white w-full rounded-t-3xl p-6 slide-in-from-bottom duration-300" onClick={(e) => e.stopPropagation()}>
        <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold">{data.title || 'Payment'}</h3>
            <p className="text-xs text-gray-400">ID: {data.display_id}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
        </div>
        <div className="space-y-3">
          {status ? (
            <div className="bg-white p-3 rounded-2xl border border-gray-100 flex justify-between items-center">
              <p className="text-[10px] text-gray-400 uppercase font-bold">Status</p>
              <p className={`text-xs font-bold ${status === 'confirmed' ? 'text-green-600' : status === 'rejected' ? 'text-red-600' : 'text-orange-600'}`}>
                {status}
              </p>
            </div>
          ) : null}
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Amount</p>
            <p className="text-xl font-black text-gray-800">${data.amount}</p>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-gray-100 flex justify-between items-center">
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-bold">USDT (TRC20)</p>
              <p className="text-xs font-mono font-bold break-all">{pay.usdtTrc20Address || '-'}</p>
            </div>
            <button onClick={() => safeCopy(pay.usdtTrc20Address)} className="p-2 text-blue-500 bg-blue-50 rounded-lg"><Copy size={16} /></button>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-gray-100 flex justify-between items-center">
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-bold">ABA</p>
              <p className="text-xs font-mono font-bold">{pay.abaName || '-'}</p>
              <p className="text-xs font-mono font-bold">{pay.abaId || '-'}</p>
            </div>
            <button onClick={() => safeCopy(pay.abaId || '')} className="p-2 text-blue-500 bg-blue-50 rounded-lg"><Copy size={16} /></button>
          </div>
          {data.invite_link ? (
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex justify-between items-center">
              <div className="flex-1 pr-3">
                <p className="text-[10px] text-gray-400 uppercase font-bold">Invite Link</p>
                <p className="text-xs font-mono font-bold break-all">{data.invite_link}</p>
              </div>
              <button onClick={() => safeCopy(data.invite_link)} className="p-2 text-blue-500 bg-blue-50 rounded-lg"><Copy size={16} /></button>
            </div>
          ) : null}
          {data.invite_link ? (
            <button
              onClick={() => onShareLink && onShareLink(data.invite_link)}
              className="w-full bg-gray-900 text-white py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2"
            >
              <Share2 size={14} />
              <span className="flex flex-col items-center leading-tight">
                <span>一键转发邀请链接</span>
                <span className="text-[10px] opacity-80 font-medium">打开 Telegram → 选群/好友 → 发送</span>
              </span>
            </button>
          ) : null}
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-bold">Proof Screenshot</p>
              <p className="text-xs text-gray-500">
                {fileBusy ? 'Uploading...' : data.proof_file ? '已上传截图，可点击查看' : 'Upload an image proof (PNG/JPG/WEBP)'}
              </p>
            </div>
            <div className="flex gap-2">
              {data.proof_file ? (
                <button onClick={() => onPreviewProof && onPreviewProof(data.display_id)} className="px-3 py-2 rounded-xl text-xs font-bold bg-gray-900 text-white">
                  查看
                </button>
              ) : null}
              <label className={`px-3 py-2 rounded-xl text-xs font-bold ${fileBusy ? 'bg-gray-200 text-gray-500' : 'bg-blue-50 text-blue-600'}`}>
                上传
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  disabled={fileBusy}
                  onChange={async (e) => {
                    const f = e.target.files && e.target.files[0] ? e.target.files[0] : null
                    if (!f || !onSubmitProofFile) return
                    setFileBusy(true)
                    try {
                      const b64 = await new Promise((resolve, reject) => {
                        const r = new FileReader()
                        r.onload = () => {
                          const s = String(r.result || '')
                          const idx = s.indexOf('base64,')
                          resolve(idx >= 0 ? s.slice(idx + 'base64,'.length) : '')
                        }
                        r.onerror = () => reject(new Error('read failed'))
                        r.readAsDataURL(f)
                      })
                      await onSubmitProofFile({ id: data.display_id, mime_type: f.type, file_base64: b64 })
                    } finally {
                      setFileBusy(false)
                      e.target.value = ''
                    }
                  }}
                />
              </label>
            </div>
          </div>
          <div className="flex gap-2">
            <input value={proof} onChange={(e) => setProof(e.target.value)} type="text" placeholder="粘贴 TxID / note 提交审核" className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none" />
            <button
              disabled={!proof.trim() || proofBusy}
              onClick={async () => {
                if (!onSubmitProof) return
                setProofBusy(true)
                try {
                  await onSubmitProof({ id: data.display_id, proof_text: proof })
                } finally {
                  setProofBusy(false)
                }
              }}
              className="bg-blue-500 disabled:bg-blue-300 text-white px-4 py-2 rounded-xl text-xs font-bold"
            >
              {proofBusy ? '提交中...' : '提交'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const ActionModal = ({ data, onClose }) => {
  if (!data) return null
  const title = String(data.title || '').trim() || '提示'
  const message = String(data.message || '').trim()
  const actions = Array.isArray(data.actions) ? data.actions : []
  return (
    <div className="fixed inset-0 bg-black/40 z-[85] flex items-end animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white w-full rounded-t-3xl p-6 slide-in-from-bottom duration-300" onClick={(e) => e.stopPropagation()}>
        <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold">{title}</h3>
            {message ? <p className="text-xs text-gray-500 mt-1 whitespace-pre-line">{message}</p> : null}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
        </div>
        <div className="flex flex-col gap-2">
          {actions.map((a, idx) => {
            const label = String(a?.label || '').trim()
            if (!label) return null
            const primary = Boolean(a?.primary)
            return (
              <button
                key={`${label}_${idx}`}
                onClick={() => {
                  try {
                    if (typeof a?.onClick === 'function') a.onClick()
                  } finally {
                    if (!a?.keepOpen) onClose()
                  }
                }}
                className={primary ? 'w-full bg-blue-500 text-white py-3 rounded-2xl text-sm font-black' : 'w-full bg-white border border-gray-200 text-gray-700 py-3 rounded-2xl text-sm font-black'}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const InitDataBanner = ({ t, onOpenBot, onCopyDebug }) => {
  return (
    <div className="px-4 pt-4">
      <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4 shadow-sm">
        <p className="text-xs font-black text-yellow-800">{t('hint.needTelegram.title')}</p>
        <p className="text-[11px] text-yellow-700 mt-1">
          {t('hint.needTelegram.desc')}
        </p>
        <div className="mt-3 flex gap-2">
          <button onClick={onOpenBot} className="flex-1 bg-yellow-500 text-white py-2.5 rounded-xl text-xs font-black">
            {t('hint.needTelegram.openBot')}
          </button>
          <button onClick={onCopyDebug} className="bg-white border border-yellow-200 text-yellow-800 py-2.5 px-4 rounded-xl text-xs font-black">
            {t('hint.needTelegram.copyDebug')}
          </button>
        </div>
      </div>
    </div>
  )
}

const BuyPlaysModal = ({ t, open, pricing, onClose, onChoose }) => {
  if (!open) return null
  const p = pricing || {}
  const items = [
    { bundle: 1, label: '1x', price: Number(p.playUsd || 1.5) },
    { bundle: 3, label: '3x', price: Number(p.bundle3xUsd || 4) },
    { bundle: 10, label: '10x', price: Number(p.bundle10xUsd || 13) }
  ]
  return (
    <div className="fixed inset-0 bg-black/40 z-[75] flex items-end animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white w-full rounded-t-3xl p-6 slide-in-from-bottom duration-300" onClick={(e) => e.stopPropagation()}>
        <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold">{t('wallet.buyPlays.title')}</h3>
            <p className="text-xs text-gray-400">{t('wallet.buyPlays.desc')}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {items.map((it) => (
            <button
              key={it.bundle}
              onClick={() => onChoose && onChoose(it.bundle)}
              className="relative border-2 border-blue-100 bg-blue-50 rounded-2xl p-3 flex flex-col items-center active:scale-95 transition-transform"
            >
              {it.bundle === 3 ? (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-orange-500 text-white text-[8px] font-black rounded-full uppercase">{t('wallet.buyPlays.hot')}</span>
              ) : null}
              <span className="text-xs font-bold mb-1 whitespace-nowrap">{t('wallet.buyPlays.bundle', { n: it.bundle })}</span>
              <span className="text-blue-600 font-black">${it.price}</span>
            </button>
          ))}
        </div>
        <button onClick={onClose} className="w-full mt-4 bg-gray-100 text-gray-700 py-3 rounded-2xl text-xs font-bold">
          {t('wallet.buyPlays.skip')}
        </button>
      </div>
    </div>
  )
}

const ShippingModal = ({ t, open, initial, onClose, onSubmit }) => {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    const i = initial || {}
    setName(String(i.name || ''))
    setPhone(String(i.phone || ''))
    setAddress(String(i.address || ''))
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/40 z-[80] flex items-end animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white w-full rounded-t-3xl p-6 slide-in-from-bottom duration-300" onClick={(e) => e.stopPropagation()}>
        <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold">{t('shipping.title')}</h3>
            <p className="text-xs text-gray-400">{t('shipping.desc')}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
        </div>
        <div className="space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} type="text" placeholder={t('shipping.name')} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} type="text" placeholder={t('shipping.phone')} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} placeholder={t('shipping.address')} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
          <button
            disabled={busy || !name.trim() || !phone.trim() || !address.trim()}
            onClick={async () => {
              if (!onSubmit) return
              setBusy(true)
              try {
                await onSubmit({ name: name.trim(), phone: phone.trim(), address: address.trim() })
              } finally {
                setBusy(false)
              }
            }}
            className="w-full bg-blue-500 disabled:bg-blue-300 text-white py-3 rounded-2xl text-sm font-black"
          >
            {busy ? t('shipping.submitting') : t('shipping.submit')}
          </button>
        </div>
      </div>
    </div>
  )
}

const ProductModal = ({ t, product, onClose, onDirectBuy, onGroupBuy }) => {
  if (!product) return null
  return (
    <div className="fixed inset-0 bg-black/40 z-[70] flex items-end animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white w-full rounded-t-3xl p-6 slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
        <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-3xl">{product.image || (product.image_url ? '🛍️' : '🛍️')}</div>
            <div>
              <h3 className="text-lg font-bold">{product.display_name || product.name}</h3>
              <p className="text-sm text-gray-400">{t('product.modal.subtitle')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed mb-6">{t('product.modal.desc')}</p>
        <div className="grid grid-cols-2 gap-4 mb-8">
          <button
            className="flex flex-col items-center justify-center border-2 border-gray-100 rounded-2xl py-3 active:bg-gray-50"
            onClick={() => {
              if (onClose) onClose()
              if (onDirectBuy) onDirectBuy(product)
            }}
          >
            <span className="text-[10px] font-bold text-gray-400 uppercase">{t('product.modal.direct')}</span>
            <span className="text-lg font-black text-gray-700">${Number(product.direct_buy_price || product.price || 0)}</span>
          </button>
          <button
            className="flex flex-col items-center justify-center bg-blue-500 border-2 border-blue-500 rounded-2xl py-3 shadow-lg shadow-blue-100 active:bg-blue-600"
            onClick={() => {
              if (onClose) onClose()
              if (onGroupBuy) onGroupBuy(product)
            }}
          >
            <span className="text-[10px] font-bold text-blue-100 uppercase">{t('product.modal.group')}</span>
            <span className="text-lg font-black text-white">${Math.round(Number(product.direct_buy_price || product.price || 0) * 70) / 100}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

const PlayResultModal = ({ data, onClose, onGoOrders, onOpenShipping, needShipping, onGoShop, t, api }) => {
  const plays = Array.isArray(data && data.plays) ? data.plays : []
  const total = plays.length
  const title = total > 1 ? `🎉 连抽结果 (${total}x)` : '🎉 抽奖结果'
  const [revealCount, setRevealCount] = useState(0)
  const [tapHint, setTapHint] = useState(false)
  const [popIndex, setPopIndex] = useState(-1)
  const [legendaryFx, setLegendaryFx] = useState(0)
  const [legendaryFxVisible, setLegendaryFxVisible] = useState(false)
  const prevRevealRef = React.useRef(0)
  const bestPick = plays.reduce(
    (acc, x) => {
      const tier = String(x && x.tier ? x.tier : '').toLowerCase()
      const score = tier === 'legendary' ? 5 : tier === 'epic' ? 4 : tier === 'rare' ? 3 : tier === 'small' ? 2 : 1
      return score > acc.score ? { score, play: x } : acc
    },
    { score: 0, play: null }
  )
  const bestScore = bestPick.score || 1
  const bestPlay = bestPick.play
  const bestPrize = bestPlay && bestPlay.prize ? bestPlay.prize : null

  const highlight = bestScore >= 5 ? 'from-red-500 to-orange-500' : bestScore >= 4 ? 'from-purple-500 to-blue-500' : bestScore >= 3 ? 'from-blue-500 to-cyan-500' : 'from-green-500 to-emerald-500'
  const bestTier = bestPlay && bestPlay.tier ? String(bestPlay.tier) : ''
  const bestTierMeta = tierMeta(bestTier)
  const bestName = bestPrize ? (bestPrize.display_name || bestPrize.name) : 'Prize'

  const triggerLegendaryFx = () => {
    setLegendaryFx((k) => k + 1)
    setLegendaryFxVisible(true)
    hapticImpact('success')
    setTimeout(() => setLegendaryFxVisible(false), 900)
  }

  useEffect(() => {
    setRevealCount(0)
    setTapHint(false)
    setPopIndex(-1)
    prevRevealRef.current = 0
    if (!data || !plays.length) return
    let cancelled = false
    let timer = null
    const run = (i) => {
      if (cancelled) return
      setRevealCount((prev) => Math.max(prev, i))
      if (i < plays.length) timer = setTimeout(() => run(i + 1), 520)
    }
    timer = setTimeout(() => run(1), 450)
    const hintTimer = setTimeout(() => { if (!cancelled) setTapHint(true) }, 1400)
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
      clearTimeout(hintTimer)
    }
  }, [data])

  useEffect(() => {
    const prev = prevRevealRef.current || 0
    if (revealCount <= prev) return
    prevRevealRef.current = revealCount
    const idx = revealCount - 1
    if (idx < 0 || idx >= plays.length) return
    setPopIndex(idx)
    const tier = String(plays[idx] && plays[idx].tier ? plays[idx].tier : '').toLowerCase()
    if (tier === 'legendary') {
      hapticImpact('heavy')
      triggerLegendaryFx()
    } else if (tier === 'epic') {
      hapticImpact('medium')
    } else {
      hapticImpact('light')
    }
    const t = setTimeout(() => setPopIndex(-1), 420)
    return () => clearTimeout(t)
  }, [revealCount])

  if (!data) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-[85] flex items-end animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white w-full rounded-t-3xl p-6 slide-in-from-bottom duration-300" onClick={(e) => e.stopPropagation()}>
        {legendaryFxVisible ? (
          <div key={legendaryFx} className="pointer-events-none fixed inset-0 z-[90]">
            <div className="legendary-flash" />
            <div className="confetti-layer">
              {Array.from({ length: 18 }).map((_, i) => (
                <span
                  key={i}
                  className="confetti"
                  style={{
                    left: `${(i * 5.5) % 100}%`,
                    animationDelay: `${(i % 6) * 0.06}s`,
                    backgroundColor:
                      i % 6 === 0 ? '#f59e0b' :
                      i % 6 === 1 ? '#ef4444' :
                      i % 6 === 2 ? '#8b5cf6' :
                      i % 6 === 3 ? '#22c55e' :
                      i % 6 === 4 ? '#3b82f6' :
                      '#eab308'
                  }}
                />
              ))}
            </div>
          </div>
        ) : null}

        <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-black">{title}</h3>
            <p className="text-[10px] text-gray-400 mt-1">剩余次数: {Number.isFinite(Number(data.plays_left)) ? Number(data.plays_left) : '-'}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
        </div>

        <div className={`relative rounded-3xl p-5 text-white bg-gradient-to-r ${highlight} shadow-xl overflow-hidden`}>
          <div className="absolute inset-0 opacity-40">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/30 blur-3xl rounded-full" />
            <div className="absolute -bottom-14 -right-12 w-56 h-56 bg-black/20 blur-3xl rounded-full" />
          </div>
          {bestScore >= 5 ? (
            <div className="absolute inset-0">
              <div className="legendary-aura" />
              <div className="legendary-shine" />
            </div>
          ) : null}
          <div className="relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black">最佳奖品</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${bestTierMeta.pill}`}>{bestTierMeta.label}</span>
              </div>
              <p className="text-[10px] font-bold opacity-90">{total} 次</p>
            </div>
            <div className="mt-4 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-3xl">
                {bestScore >= 5 ? '👑' : bestScore >= 4 ? '✨' : bestScore >= 3 ? '⭐' : '🎁'}
              </div>
              <div className="min-w-0">
                <p className="text-lg font-black truncate">{bestName}</p>
                <p className="text-[10px] opacity-90 mt-1">点击卡牌逐个翻开，Legendary 会触发特效光</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <button onClick={async () => {
            if (!api || !plays.length) return
            try {
              const allRecycled = await Promise.allSettled(
                plays.map((p) => p && p.play_id ? api.recyclePlay(p.play_id, 3).catch(() => null) : Promise.resolve(null))
              )
              const ok = allRecycled.filter((r) => r.status === 'fulfilled' && r.value)
              if (ok.length > 0) {
                alert(`✅ 回收成功！共返还 ${ok.length} 次奖品的积分`)
              } else {
                alert('❌ 回收失败，请重试')
              }
              onClose && onClose()
            } catch (err) {
              alert('回收失败: ' + (err && err.message ? err.message : '未知错误'))
            }
          }} className="bg-green-600 text-white py-3 rounded-2xl text-xs font-black active:bg-green-700">
            🔄 全部回收
          </button>
          <button onClick={() => onGoOrders && onGoOrders()} className="bg-gray-900 text-white py-3 rounded-2xl text-xs font-black">
            去订单
          </button>
          <button onClick={() => needShipping && onOpenShipping && onOpenShipping()} className={`py-3 rounded-2xl text-xs font-black ${needShipping ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
            填写收货
          </button>
        </div>

        <button
          type="button"
          onClick={() => onGoShop && onGoShop()}
          className="mt-3 w-full bg-blue-50 text-blue-700 py-3 rounded-2xl text-xs font-black border border-blue-100 active:scale-[0.99] transition-transform"
        >
          中奖查看更多商品 👉 跳转
        </button>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-[10px] text-gray-400 font-bold">{tapHint && revealCount < plays.length ? '点卡牌可加速翻开' : ' '}</p>
          <button onClick={() => setRevealCount(plays.length)} className="text-[10px] font-black text-blue-600">
            全部揭示
          </button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 max-h-[44vh] overflow-y-auto no-scrollbar pr-1">
          {plays.map((x, idx) => {
            const revealed = idx < revealCount
            const prize = x && x.prize ? x.prize : null
            const meta = tierMeta(x && x.tier ? x.tier : '')
            const isLegendary = String(x && x.tier ? x.tier : '').toLowerCase() === 'legendary'
            return (
              <button
                key={`${x && x.play_id ? x.play_id : idx}`}
                onPointerDown={() => hapticImpact('light')}
                onClick={() => setRevealCount((prev) => Math.max(prev, idx + 1))}
                className="flip-card text-left active:scale-[0.98] transition-transform"
              >
                <div className={`flip-inner ${revealed ? 'is-flipped' : ''} ${revealed && popIndex === idx ? 'is-pop' : ''}`}>
                  <div className="flip-face flip-front">
                    <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-4 h-full border border-gray-800 shadow-sm overflow-hidden">
                      <div className="absolute inset-0 opacity-40">
                        <div className="absolute -top-6 -left-8 w-24 h-24 bg-blue-500/30 blur-2xl rounded-full" />
                        <div className="absolute -bottom-10 -right-8 w-32 h-32 bg-orange-500/20 blur-2xl rounded-full" />
                      </div>
                      <div className="relative flex justify-between items-start">
                        <span className="text-[10px] font-black text-white/80">CARD</span>
                        <span className="text-[10px] font-black text-white/60">#{idx + 1}</span>
                      </div>
                      <div className="relative mt-6 flex items-center justify-center">
                        <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-3xl">?</div>
                      </div>
                      <p className="relative mt-5 text-[10px] text-white/70 font-bold text-center">
                        {revealed ? ' ' : 'Tap to reveal'}
                      </p>
                    </div>
                  </div>

                  <div className="flip-face flip-back">
                    <div className={`relative bg-white border border-gray-100 rounded-2xl p-4 h-full shadow-sm overflow-hidden ${isLegendary ? 'legendary-border' : ''}`}>
                      {isLegendary ? <div className="legendary-aura" /> : null}
                      <div className="relative flex justify-between items-start">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${meta.pill}`}>{meta.label}</span>
                        <span className="text-[10px] text-gray-400 font-bold">#{idx + 1}</span>
                      </div>
                      <div className="relative mt-3 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${isLegendary ? 'bg-red-50' : 'bg-gray-50'}`}>{isLegendary ? '🔥' : '🎁'}</div>
                        <div className="min-w-0">
                          <p className="text-xs font-black truncate">{prize ? (prize.display_name || prize.name) : 'Prize'}</p>
                          <p className="text-[10px] text-gray-400 truncate">order_id: {x && x.order_id ? x.order_id : '-'}</p>
                        </div>
                      </div>
                      <div className="relative mt-3 flex gap-2">
                        <button
                          onClick={async (e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            const ok = await safeCopy(x && x.order_id ? x.order_id : '')
                            if (!ok) return
                          }}
                          className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl text-[10px] font-bold"
                        >
                          {t ? t('order.copyId') : '复制单号'}
                        </button>
                        <button
                          onClick={async (e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            if (!api) return
                            const playId = x && x.play_id ? x.play_id : ''
                            if (!playId) return
                            try {
                              const res = await api.recyclePlay(playId, 3)
                              const pts = res && res.recyclePoints != null ? Number(res.recyclePoints).toFixed(1) : '2.4'
                              alert(`✅ 回购成功！返还 $${pts} 积分`)
                              onClose && onClose()
                            } catch (err) {
                              alert('回购失败: ' + (err && err.message ? err.message : '未知错误'))
                            }
                          }}
                          className="flex-1 bg-green-50 text-green-700 py-2 rounded-xl text-[10px] font-bold border border-green-100"
                        >
                          🔄 回购
                        </button>
                      </div>
                      {isLegendary ? <div className="legendary-shine" /> : null}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const BottomTabNav = ({ activeTab, setActiveTab, t }) => {
  const tabs = [
    { id: 'home', label: t ? t('tabs.home') : '首页', icon: Home },
    { id: 'store', label: t ? t('tabs.store') : '商城', icon: ShoppingBag },
    { id: 'earn', label: t ? t('tabs.earn') : '赚钱', icon: TrendingUp },
    { id: 'wallet', label: t ? t('tabs.wallet') : '钱包', icon: Wallet },
    { id: 'profile', label: t ? t('tabs.profile') : '我的', icon: User },
    { id: 'admin', label: '管理', icon: Shield },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center py-2 px-1 z-50">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex flex-col items-center gap-1 transition-colors min-w-[64px] ${
            activeTab === tab.id ? 'text-blue-500' : 'text-gray-400'
          }`}
        >
          <tab.icon size={18} />
          <span className="text-[10px] font-medium">{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

// 1. Home Page
const HomePage = ({ me, onPlay, products, onSelectProduct, orders, activeGroups, onPayOrder, onInviteGroup, onGoTab, onOpenShipping, playBusy }) => {
  const [isMulti, setIsMulti] = useState(false);
  const [nowTick, setNowTick] = useState(0)
  const telegram = me && me.telegram ? me.telegram : null;
  const user = me && me.user ? me.user : null;
  const list = Array.isArray(orders) ? orders : []
  const pendingOrders = list.filter((o) => o && o.payment_status === 'pending' && Number(o.amount || 0) > 0)
  const groups = Array.isArray(activeGroups) ? activeGroups : []
  const sortedGroups = groups.slice().sort((a, b) => new Date(a.expire_at || 0).getTime() - new Date(b.expire_at || 0).getTime())
  const shipping = me && me.shipping ? me.shipping : null
  const needShipping = user && String(user.state || '') === 'waiting_shipping' && !shipping

  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 30000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="pb-20 animate-in fade-in duration-300">
      <div className="flex justify-between items-center p-4 bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">JD</div>
          <div>
            <h2 className="text-sm font-bold">{telegram && (telegram.first_name || telegram.username) ? (telegram.first_name || telegram.username) : '...'}</h2>
            <p className="text-xs text-gray-400">ID: {telegram && telegram.id ? telegram.id : '...'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
          <Ticket size={16} className="text-blue-500" />
          <button onClick={() => onGoTab && onGoTab('wallet')} className="text-sm font-bold text-blue-600">
            {user ? `${user.plays_left} Plays` : '...'}
          </button>
        </div>
      </div>

      {needShipping ? (
        <div className="px-4 mt-4">
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex items-center justify-between">
            <div className="pr-3">
              <p className="text-xs font-black text-orange-700">{t('shipping.need')}</p>
              <p className="text-[10px] text-orange-600 mt-1">{t('shipping.desc')}</p>
            </div>
            <button onClick={() => onOpenShipping && onOpenShipping()} className="bg-orange-500 text-white px-4 py-2 rounded-xl text-[10px] font-black">
              去填写
            </button>
          </div>
        </div>
      ) : null}

      {/* Plays 不足提醒横幅 */}
      {user && user.plays_left !== undefined && user.plays_left <= 3 ? (
        <div className="px-4 mt-4">
          <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl p-4 shadow-lg flex items-center justify-between">
            <div>
              <p className="text-sm font-black text-white">🎯 抽奖次数不足</p>
              <p className="text-[10px] text-white/80 mt-1">
                {user.plays_left === 0 ? "当前没有免费抽奖次数，购买即可继续" : "还剩 " + user.plays_left + " 次免费抽奖，购买更多继续玩"}
              </p>
            </div>
            <button
              onClick={() => onGoTab && onGoTab("wallet")}
              className="bg-white text-red-600 px-5 py-2.5 rounded-xl text-xs font-black shadow-lg active:scale-95 transition-transform"
            >
              立即购买 »
            </button>
          </div>
        </div>
      ) : null}

      <div className="bg-orange-50 py-1.5 overflow-hidden border-y border-orange-100">
        <div className="whitespace-nowrap flex gap-8 animate-marquee text-xs text-orange-600 font-medium">
          <span>🎉 恭喜 @CryptoKing 抽中了 Legendary 盲盒!</span>
          <span>🔥 抽奖池正在疯狂翻倍中...</span>
          <span>🎉 恭喜 @LuckyMe 抽中了 Epic 翅膀!</span>
        </div>
      </div>

      <div className="flex flex-col items-center py-8 px-4">
        <div className="relative w-64 h-64 rounded-3xl flex items-center justify-center mb-8">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-100 via-white to-orange-100" />
          <div className={`absolute inset-2 rounded-[1.25rem] bg-white shadow-inner border border-gray-100 ${playBusy ? 'claw-panel-loading' : ''}`} />
          {playBusy ? (
            <>
              <div className="absolute inset-2 rounded-[1.25rem] claw-scan pointer-events-none" />
              <div className="absolute inset-0 rounded-3xl claw-sparkles pointer-events-none" />
            </>
          ) : null}
          <div className="absolute -top-6 -right-4 w-20 h-20 rounded-full bg-blue-500/20 blur-2xl" />
          <div className="absolute -bottom-8 -left-6 w-24 h-24 rounded-full bg-orange-500/20 blur-2xl" />
          <div className={`relative text-8xl ${playBusy ? 'claw-gift' : ''}`}>🎁</div>
          <div className="absolute -bottom-4 bg-white px-4 py-1 rounded-full shadow-md text-xs font-bold text-gray-500 border">神秘宠物盲盒</div>
        </div>
        <div className="w-full max-w-sm space-y-6">
          <button
            disabled={Boolean(playBusy)}
            className={`w-full text-white py-4 rounded-2xl font-black text-xl shadow-lg transition-transform ${playBusy ? 'bg-gray-300' : 'bg-gradient-to-r from-blue-500 to-blue-600 active:scale-95'}`}
            onClick={() => onPlay && onPlay({ multi: isMulti ? 10 : 1 })}
          >
            {playBusy ? (
              <span className="inline-flex items-center justify-center gap-2">
                <span className="w-5 h-5 rounded-full border-2 border-white/60 border-t-white animate-spin" />
                抓取中...
              </span>
            ) : (
              'PLAY NOW'
            )}
          </button>
          <div className="flex justify-center">
            <div className="bg-gray-100 border border-gray-200 rounded-full p-1 flex items-center gap-1">
              <button onClick={() => setIsMulti(false)} className={`px-4 py-2 rounded-full text-xs font-black transition-colors ${!isMulti ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                1x 单抽
              </button>
              <button onClick={() => setIsMulti(true)} className={`px-4 py-2 rounded-full text-xs font-black transition-colors ${isMulti ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                10x 连抽
              </button>
            </div>
          </div>
        </div>
      </div>

      {pendingOrders.length ? (
        <div className="px-4 mt-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">待支付订单</h3>
            <button onClick={() => onGoTab && onGoTab('profile')} className="text-[10px] font-bold text-blue-500">查看全部</button>
          </div>
          <div className="space-y-3">
            {pendingOrders.slice(0, 2).map((o) => (
              <div key={o.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold">{o.display_name || o.name}</p>
                    <p className="text-[10px] text-gray-400 mt-1">ID: {o.id}</p>
                  </div>
                  <p className="text-sm font-black text-gray-800">${Number(o.amount || 0).toFixed(2)}</p>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-[10px] text-gray-400">{o.payment_proof_text || o.payment_has_proof_file ? '已提交凭证' : '未提交凭证'}</p>
                  <button onClick={() => onPayOrder && onPayOrder(o)} className="bg-blue-500 text-white px-3 py-2 rounded-xl text-[10px] font-bold">
                    继续支付
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {sortedGroups.length ? (
        <div className="px-4 mt-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">进行中的拼团</h3>
            <button onClick={() => onGoTab && onGoTab('earn')} className="text-[10px] font-bold text-blue-500">去赚钱</button>
          </div>
          <div className="space-y-3">
            {sortedGroups.slice(0, 2).map((g) => (
              <div key={g.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-2xl">{g.image || '🧸'}</div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="text-xs font-bold">{g.display_name || g.name}</p>
                    <p className="text-[10px] text-orange-500 font-bold">{formatTimeLeft(g.expire_at, nowTick)}</p>
                  </div>
                  <div className="mt-2">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-gray-400">进度</span>
                      <span className="text-blue-500">{Number(g.current_count || 0)}/{Number(g.target_count || 0)}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (Number(g.current_count || 0) / Math.max(1, Number(g.target_count || 0))) * 100)}%` }} />
                    </div>
                  </div>
                </div>
                <button onClick={() => onInviteGroup && onInviteGroup(g)} className="bg-blue-50 text-blue-600 px-3 py-2 rounded-xl text-[10px] font-bold">
                  邀请
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="px-4 mt-4">
        <h3 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">Possible Drops</h3>
        <div className="grid grid-cols-4 gap-3 pb-4">
          {DROPS.map(drop => (
            <div key={drop.id} className="bg-white border border-gray-100 rounded-xl p-3 flex flex-col items-center shadow-sm">
              <div className={`w-10 h-10 ${drop.color} rounded-lg mb-2 opacity-80 flex items-center justify-center text-white font-bold`}>?</div>
              <span className="text-[10px] font-bold truncate w-full text-center">{drop.name}</span>
              <span className="text-[8px] text-gray-400 mt-1 uppercase">{drop.rarity}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Hot Selling Products */}
      <div className="px-4 mt-2">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">🔥 热销商品 (Hot Selling)</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 pb-4">
          {(products && products.length ? products.slice(0, 6) : PRODUCTS.slice(0, 6)).map(product => (
            <div key={product.id} onClick={() => onSelectProduct && onSelectProduct(product)} className="bg-white border border-gray-100 rounded-xl p-3 flex flex-col shadow-sm active:scale-95 transition-transform cursor-pointer">
              <div className="aspect-square bg-gray-50 rounded-lg flex items-center justify-center text-3xl mb-2">{product.image || (product.image_url ? '🛍️' : '🛍️')}</div>
              <span className="text-xs font-bold truncate w-full text-center">{product.display_name || product.name}</span>
              {Number.isFinite(Number(product.sales_7d)) ? (
                <span className="text-[10px] text-gray-400 mt-1 text-center">7天已售 {Number(product.sales_7d)}</span>
              ) : Number.isFinite(Number(product.sales)) ? (
                  <span className="text-[10px] text-gray-400 mt-1 text-center">已售 {Number(product.sales)}</span>
                ) : null}
              <div className="flex justify-center items-center mt-1">
                <span className="text-blue-600 font-black text-xs">${Number(product.direct_buy_price || product.price || 0)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 mt-2 pb-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">猜你喜欢 / 纪念品专区</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => openTelegramLink(makeAftercareStartLink('store'))} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm active:scale-95 transition-transform text-left">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-lg">✨</div>
              <span className="text-[10px] font-bold text-blue-600">RainbowPawbot</span>
            </div>
            <p className="text-sm font-black mt-3">猜你喜欢</p>
            <p className="text-[10px] text-gray-400 mt-1">更多精选商品与服务</p>
          </button>
          <button onClick={() => openTelegramLink(makeAftercareStartLink('memorial'))} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm active:scale-95 transition-transform text-left">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-lg">🌈</div>
              <span className="text-[10px] font-bold text-blue-600">RainbowPawbot</span>
            </div>
            <p className="text-sm font-black mt-3">纪念品专区</p>
            <p className="text-[10px] text-gray-400 mt-1">纪念页 / 纪念商品 / 关怀服务</p>
          </button>
        </div>
      </div>
    </div>
  );
};

// 2. Store Page (Updated with Group Buy)
const StorePage = ({ products, onSelectProduct }) => {
  const [activeCategory, setActiveCategory] = useState('All');
  const items = Array.isArray(products) && products.length ? products : PRODUCTS;

  return (
    <div className="pb-20 animate-in fade-in duration-300">
      <div className="p-4 bg-white sticky top-0 z-10 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input type="text" placeholder="搜索商品..." className="w-full bg-gray-100 border-none rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {['All', 'Toys', 'Memorial', 'Accessories'].map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${activeCategory === cat ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 p-4">
        {items.map(product => (
          <div key={product.id} onClick={() => onSelectProduct && onSelectProduct(product)} className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm flex flex-col active:scale-95 transition-transform relative">
            <span className="absolute top-2 right-2 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full z-10 animate-pulse">返现 30%</span>
            <div className="aspect-square bg-gray-50 rounded-xl flex items-center justify-center text-4xl mb-3">{product.image || (product.image_url ? '🛍️' : '🛍️')}</div>
            <h4 className="text-sm font-bold truncate">{product.display_name || product.name}</h4>
            <div className="mt-2 flex flex-col">
              <div className="flex justify-between items-center">
                <span className="text-blue-600 font-black text-lg">${Number(product.direct_buy_price || product.price || 0)}</span>
                <span className="text-[9px] text-gray-400 line-through">原价</span>
              </div>
              <p className="text-[10px] text-orange-500 font-bold mt-1">拼团仅需 ${Math.round(Number(product.direct_buy_price || product.price || 0) * 70) / 100}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 3. Earn Page (New Section)
const EarnPage = ({ me, activeGroups, discoverGroups, onCopyReferral, onForwardReferral, onInviteGroup, onJoinGroupPay }) => {
  const [nowTick, setNowTick] = useState(0)
  const user = me && me.user ? me.user : null;
  const referralCode = user && user.referral_code ? user.referral_code : '...';
  const referralLink = me && me.links && me.links.referral ? me.links.referral : '';

  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 30000)
    return () => clearInterval(t)
  }, [])

  const myGroups = (activeGroups && activeGroups.length ? activeGroups : ACTIVE_GROUPS)
    .slice()
    .sort((a, b) => new Date(a.expire_at || 0).getTime() - new Date(b.expire_at || 0).getTime())
  const discover = (discoverGroups && discoverGroups.length ? discoverGroups : DISCOVER_GROUPS)
    .slice()
    .sort((a, b) => new Date(a.expire_at || 0).getTime() - new Date(b.expire_at || 0).getTime())

  return (
    <div className="pb-20 animate-in fade-in duration-300">
      <div className="p-4 space-y-6">
        {/* Dashboard */}
        <div className="bg-gradient-to-br from-indigo-600 to-blue-500 rounded-[2rem] p-6 text-white shadow-xl">
          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">累计收益 (Total Earned)</p>
              <h3 className="text-4xl font-black">$428.50</h3>
            </div>
            <button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl text-xs font-bold backdrop-blur-md transition-colors">提现</button>
          </div>
          <div className="flex items-center gap-2 bg-black/10 rounded-2xl p-3">
            <Clock size={16} className="text-blue-200" />
            <div className="flex-1">
              <p className="text-[10px] text-blue-100 font-medium">待结算收益 (Pending)</p>
              <p className="text-sm font-bold">$12.40 <span className="text-[10px] font-normal opacity-70">预计 24h 内到账</span></p>
            </div>
          </div>
        </div>

        {/* Elite Referral */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Elite Referral</h3>
            <span className="text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-bold">每单赚 $2</span>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-dashed border-gray-200">
              <code className="text-blue-600 font-black tracking-widest">{referralCode}</code>
              <button onClick={() => onCopyReferral && onCopyReferral(referralLink)} className="text-blue-500 flex items-center gap-1 text-xs font-bold"><Copy size={14}/> 复制链接</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => onForwardReferral && onForwardReferral(referralLink)} className="bg-blue-500 text-white py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-100">
                <Share2 size={14}/>
                <span className="flex flex-col items-center leading-tight">
                  <span>一键转发（发群/好友）</span>
                  <span className="text-[10px] opacity-90 font-medium">对方点开→领次数→抽奖</span>
                </span>
              </button>
              <button className="bg-gray-900 text-white py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                🖼️ 生成海报
              </button>
            </div>
          </div>
        </section>

        {/* Active Groups */}
        <section>
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">进行中的拼团 (My Active Groups)</h3>
          {myGroups.map(group => (
            <div key={group.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex gap-4">
              <div className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center text-3xl">{group.image || '🧸'}</div>
              <div className="flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <h4 className="text-sm font-bold">{group.display_name || group.name}</h4>
                  <span className="text-[10px] text-orange-500 font-bold flex items-center gap-1"><Clock size={10}/> {formatTimeLeft(group.expire_at, nowTick) || '...'}</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-gray-400">当前进度: 👥 {group.current_count || group.current}/{group.target_count || group.total}</span>
                    <span className="text-blue-500">还差 {(group.target_count || group.total) - (group.current_count || group.current)} 人</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (Number(group.current_count || group.current || 0) / Math.max(1, Number(group.target_count || group.total || 1))) * 100)}%` }} />
                  </div>
                </div>
              </div>
              <button onClick={() => onInviteGroup && onInviteGroup(group)} className="self-center bg-blue-50 text-blue-600 p-2 rounded-xl"><Plus size={20}/></button>
            </div>
          ))}
        </section>

        {/* Discover Groups */}
        <section>
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">发现拼团 (Discover Groups)</h3>
          <div className="grid grid-cols-1 gap-3">
            {discover.map(group => (
              <div key={group.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-xl">{group.image || '🕶️'}</div>
                   <div>
                     <p className="text-xs font-bold">团长: @{group.owner_username || group.leader}</p>
                     <p className="text-[10px] text-gray-400">拼团立省 30%</p>
                     <p className="text-[10px] text-orange-500 font-bold mt-0.5">{formatTimeLeft(group.expire_at, nowTick) ? `剩余 ${formatTimeLeft(group.expire_at, nowTick)}` : ''}</p>
                   </div>
                </div>
                <button onClick={() => onJoinGroupPay && onJoinGroupPay(group)} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl text-xs font-bold active:bg-blue-500 active:text-white transition-colors">Pay & Join</button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

// 4. Wallet Page (Updated with History)
const WalletPage = ({ wallet, logs, pricing, pay, onBuyPlays, onSubmitProof, t }) => {
  const [copyStatus, setCopyStatus] = useState(false);
  const [manualId, setManualId] = useState('');
  const [manualTx, setManualTx] = useState('');

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(true);
    setTimeout(() => setCopyStatus(false), 2000);
  };

  const items = Array.isArray(logs) && logs.length
    ? logs.map((l) => {
      const amount = Number(l.amount || 0)
      const status = l.status === 'confirmed' ? 'Completed' : 'Pending'
      const icon = l.type === 'referral' ? '🎁' : l.type === 'group' ? '🔥' : l.type === 'purchase' ? '🛍️' : '📌'
      const date = l.created_at ? String(l.created_at).slice(0, 16).replace('T', ' ') : ''
      const type = l.type === 'referral' ? 'Commission' : l.type === 'group' ? 'Cashback' : 'Purchase'
      return { id: l.id, type, amount, status, date, icon }
    })
    : TRANSACTIONS;

  return (
    <div className="pb-20 animate-in fade-in duration-300">
      <div className="p-4 space-y-6">
        <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">Wallet & Assets</h2>
        
        {/* Modern Assets Card */}
        <div className="bg-gray-900 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-[50px] -mr-10 -mt-10" />
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Current Cash Balance</p>
          <h3 className="text-4xl font-black mb-6">${wallet ? Number(wallet.cash_balance || 0).toFixed(2) : '0.00'}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-2xl p-3 border border-white/10 backdrop-blur-sm">
              <span className="block text-[10px] text-gray-400 font-bold mb-1 uppercase">Credit</span>
              <span className="text-lg font-black text-blue-400">{wallet ? Number(wallet.credit_balance || 0).toFixed(2) : '0.00'}</span>
            </div>
            <div className="bg-white/5 rounded-2xl p-3 border border-white/10 backdrop-blur-sm">
              <span className="block text-[10px] text-gray-400 font-bold mb-1 uppercase">Points</span>
              <span className="text-lg font-black text-orange-400">{wallet ? Number(wallet.points_balance || 0) : 0}</span>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Transaction History</h3>
            <button className="text-[10px] font-bold text-blue-500">查看全部</button>
          </div>
          <div className="space-y-3">
            {items.map(tx => (
              <div key={tx.id} className="bg-white p-3 rounded-2xl border border-gray-100 flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xl">{tx.icon}</div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="text-xs font-bold">{tx.type === 'Commission' ? '分销佣金入账' : tx.type === 'Cashback' ? '拼团返现入账' : '商城消费'}</p>
                    <span className={`text-xs font-black ${tx.amount > 0 ? 'text-green-500' : 'text-gray-800'}`}>
                      {tx.amount > 0 ? `+${tx.amount.toFixed(2)}` : tx.amount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[10px] text-gray-400">{tx.date}</span>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${tx.status === 'Completed' ? 'bg-gray-100 text-gray-500' : 'bg-orange-100 text-orange-600'}`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Get Plays */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Get Plays</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: '1 Play', price: `$${pricing ? pricing.playUsd : '1.5'}`, bundle: 1 },
              { label: '3x Bundle', price: `$${pricing ? pricing.bundle3xUsd : '4'}`, tag: 'Hot', bundle: 3 },
              { label: '10x Bundle', price: `$${pricing ? pricing.bundle10xUsd : '13'}`, tag: 'Best', bundle: 10 }
            ].map((bundle, i) => (
              <div
                key={i}
                onClick={() => onBuyPlays && onBuyPlays(bundle.bundle)}
                className={`relative border-2 ${bundle.tag ? 'border-blue-100 bg-blue-50' : 'border-gray-100'} rounded-2xl p-3 flex flex-col items-center cursor-pointer active:scale-95 transition-transform`}
              >
                {bundle.tag && <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-orange-500 text-white text-[8px] font-black rounded-full uppercase">{bundle.tag}</span>}
                <span className="text-xs font-bold mb-1 whitespace-nowrap">{bundle.label}</span>
                <span className="text-blue-600 font-black">{bundle.price}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Payment Guide */}
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-4">
          <h4 className="text-sm font-bold text-gray-700">充值引导 (Payment)</h4>
          <div className="bg-white p-3 rounded-xl flex justify-between items-center border border-gray-100">
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-bold">ABA Account</p>
              <p className="text-xs font-mono font-bold">{pay && pay.abaName ? pay.abaName : '-'}</p>
              <p className="text-xs font-mono font-bold">{pay && pay.abaId ? pay.abaId : '-'}</p>
            </div>
            <button onClick={() => handleCopy(`${(pay && pay.abaName) || ''} ${(pay && pay.abaId) || ''}`.trim())} className="p-2 text-blue-500 bg-blue-50 rounded-lg"><Copy size={16} /></button>
          </div>
          <div className="bg-white p-3 rounded-xl flex justify-between items-center border border-gray-100">
          <div className="flex-1 pr-3">
              <p className="text-[10px] text-gray-400 uppercase font-bold">USDT (TRC20)</p>
              <p className="text-xs font-mono font-bold break-all">{pay && pay.usdtTrc20Address ? pay.usdtTrc20Address : "-"}</p>
            </div>
            <button onClick={() => handleCopy((pay && pay.usdtTrc20Address) || "")} className="p-2 text-blue-500 bg-blue-50 rounded-lg"><Copy size={16} /></button>
          </div>
          {/* ABA PayLink 按钮 */}
          {pay && pay.payLink ? (
            <a
              href={pay.payLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl p-4 text-center font-bold shadow-lg active:scale-95 transition-transform"
            >
              <span className="block text-sm">🏦 用 ABA App 支付</span>
              <span className="block text-[10px] opacity-80 mt-1">点击跳转 ABA 支付页面</span>
            </a>
          ) : null}
          {/* USDT 二维码 */}
          {pay && pay.usdtTrc20Address ? (
            <div className="bg-white p-3 rounded-xl border border-gray-100 text-center mt-3">
              <p className="text-[10px] text-gray-400 uppercase font-bold mb-2">USDT 收款码</p>
              <img
                src={"https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" + encodeURIComponent(pay.usdtTrc20Address)}
                alt="USDT QR Code"
                className="mx-auto rounded-lg"
                width="150"
                height="150"
                style={{ imageRendering: "pixelated" }}
              />
              <p className="text-[8px] text-gray-400 mt-2">TRC20 网络，扫码或复制地址转账</p>
            </div>
          ) : null}
          <div className="flex gap-2">
            <input value={manualId} onChange={(e) => setManualId(e.target.value)} type="text" placeholder="输入 payment_id / order_id" className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div className="flex gap-2">
            <input value={manualTx} onChange={(e) => setManualTx(e.target.value)} type="text" placeholder="粘贴 TxID / note 提交审核" className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none" />
            <button onClick={() => onSubmitProof && onSubmitProof({ id: manualId, proof_text: manualTx })} className="bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold">提交</button>
          </div>
        </div>
      </div>
      {copyStatus && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-4 py-2 rounded-full animate-in fade-in slide-in-from-bottom duration-300">{t ? t('common.copied') : '已复制'}</div>
      )}
    </div>
  );
};

// 5. Profile Page
const ProfilePage = ({ me, orders, onPayOrder, onEditShipping, onSupport, lang, setLang, t }) => {
  const [activeOrderTab, setActiveOrderTab] = useState('Pending');
  const telegram = me && me.telegram ? me.telegram : null;
  const shipping = me && me.shipping ? me.shipping : null;
  const list = Array.isArray(orders) ? orders : [];
  const filtered = list.filter((o) => {
    if (activeOrderTab === 'Pending') return o.payment_status !== 'paid';
    if (activeOrderTab === 'To Ship') return o.fulfillment_status === 'ready_to_ship';
    return o.fulfillment_status === 'shipped';
  });

  return (
    <div className="pb-20 animate-in fade-in duration-300">
      <div className="bg-white p-6 border-b border-gray-100 flex flex-col items-center">
        <div className="w-20 h-20 rounded-3xl bg-blue-100 mb-4 flex items-center justify-center text-3xl shadow-sm border-4 border-white">👤</div>
        <h2 className="text-lg font-bold">{telegram && (telegram.last_name || telegram.first_name || telegram.username) ? (`${telegram.last_name || ''} ${telegram.first_name || ''}`.trim() || telegram.username) : '...'}</h2>
        <p className="text-sm text-gray-400">@{telegram && telegram.username ? telegram.username : '...'}</p>
      </div>

      <div className="p-4 space-y-6">
        <section>
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">{t ? t('lang.title') : '语言'}</h3>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex gap-2">
            {CLAW_MINIAPP_LANGS.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setLang && setLang(l.id)}
                className={`flex-1 py-2 rounded-xl text-[11px] font-bold border ${String(lang || '').toUpperCase() === String(l.id).toUpperCase() ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-700 border-gray-200'}`}
              >
                {clawMiniAppGetLangLabel(l.id)}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">{t ? t('profile.shippingTitle') : '默认收货地址 (Shipping)'}</h3>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start mb-2">
               <div className="flex items-center gap-2 text-gray-700">
                 <MapPin size={16} className="text-red-500" />
                 <span className="text-sm font-bold">{shipping ? `${shipping.name} ${shipping.phone}` : t ? t('profile.notSet') : '未设置'}</span>
               </div>
               <button onClick={() => onEditShipping && onEditShipping()} className="text-blue-500 text-xs font-bold">{t ? t('profile.edit') : '修改'}</button>
            </div>
            <p className="text-xs text-gray-500">{shipping ? shipping.address : ''}</p>
          </div>
        </section>

        <section>
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">{t ? t('profile.ordersTitle') : '订单追踪 (Orders)'}</h3>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex border-b border-gray-100">
              {['Pending', 'To Ship', 'Shipped'].map(tab => (
                <button key={tab} onClick={() => setActiveOrderTab(tab)} className={`flex-1 py-3 text-[10px] font-bold transition-colors ${activeOrderTab === tab ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400'}`}>
                  {tab === 'Pending' ? (t ? t('profile.orderTabs.pending') : '待支付') : tab === 'To Ship' ? (t ? t('profile.orderTabs.toShip') : '待发货') : (t ? t('profile.orderTabs.shipped') : '已发货')}
                </button>
              ))}
            </div>
            {filtered.length === 0 ? (
              <div className="p-4 flex flex-col items-center justify-center py-12 text-gray-300">
                <Package size={40} strokeWidth={1} />
                <p className="text-[10px] mt-2 font-medium uppercase tracking-widest">{t ? t('profile.noActiveOrders') : 'No active orders'}</p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {filtered.map((o) => (
                  <div key={o.id} className="bg-gray-50 border border-gray-100 rounded-2xl p-3">
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-bold">{o.display_name || o.name}</p>
                      <p className="text-[10px] text-gray-400">{String(o.created_at || '').slice(0, 10)}</p>
                    </div>
                    <div className="mt-1 flex justify-between text-[10px] text-gray-500">
                      <span>{o.payment_status}/{o.fulfillment_status}</span>
                      <span>${Number(o.amount || 0).toFixed(2)}</span>
                    </div>
                    {o.payment_status === 'pending' && Number(o.amount || 0) > 0 ? (
                      <div className="mt-3 flex items-center justify-between">
                        <p className="text-[10px] text-gray-400">
                          {o.payment_proof_text || o.payment_has_proof_file ? (t ? t('profile.proofSubmitted') : '已提交凭证') : (t ? t('profile.proofMissing') : '未提交凭证')}
                        </p>
                        <button onClick={() => onPayOrder && onPayOrder(o)} className="bg-blue-500 text-white px-3 py-2 rounded-xl text-[10px] font-bold">
                          {t ? t('profile.continuePay') : '继续支付'}
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
        
        <button
          onClick={() => onSupport && onSupport()}
          className="w-full bg-white border border-gray-100 py-4 rounded-2xl font-bold text-sm text-gray-600 flex items-center justify-center gap-2"
        >
          <ExternalLink size={16}/> {t ? t('profile.support') : '联系客服 (Support)'}
        </button>
      </div>
    </div>
  );
};

// --- Main App ---

/** 管理员 - 待确认付款页面 */
const AdminPaymentsPage = ({ telegram }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState({});
  const [adminId, setAdminId] = useState(null);
  const [toast, setToast] = useState('');

  const doFetch = async (path, opts) => {
    const base = '/api';
    const origin = window && window.location ? window.location.origin : '';
    const fullUrl = origin.replace(/\/+$/, '') + base + path;
    const initData = getTelegramInitData();
    const headers = { 'content-type': 'application/json' };
    if (initData) headers['x-telegram-init-data'] = initData;
    const devId = (import.meta && import.meta.env && import.meta.env.VITE_DEV_TELEGRAM_ID) || '';
    if (!initData && devId) headers['x-dev-telegram-id'] = devId;
    const res = await fetch(fullUrl, {
      method: opts && opts.method ? opts.method : 'GET',
      headers,
      body: opts && typeof opts.body !== 'undefined' ? JSON.stringify(opts.body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    if (json && json.code === 0) return json.data;
    throw new Error((json && json.message) || '请求失败');
  };

  const loadPending = async () => {
    setLoading(true);
    try {
      const data = await doFetch('/payments/pending');
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (e) {
      setLocalToast(e && e.message ? e.message : '加载失败');
    }
    setLoading(false);
  };
  useState(() => { loadPending(); }, []);

  useEffect(() => {
    const tid = telegram && telegram.id ? Number(telegram.id) : null;
    setAdminId(tid);
  }, [telegram]);

  const confirmPayment = async (displayId) => {
    setBusy((prev) => ({ ...prev, [displayId]: true }));
    try {
      await doFetch('/payments/' + encodeURIComponent(displayId) + '/confirm', { method: 'POST', body: {} });
      setLocalToast('已确认收款');
      loadPending();
    } catch (e) {
      setLocalToast(e && e.message ? e.message : '确认失败');
    }
    setBusy((prev) => ({ ...prev, [displayId]: false }));
  };

  return (
    <div className="pb-20 animate-in fade-in duration-300 px-4 py-6">
      <h2 className="text-lg font-black mb-4">待确认付款</h2>
      {loading ? <p className="text-xs text-gray-400">加载中...</p> : null}
      {localToast ? <p className="text-xs text-blue-500 mb-2">{localToast}</p> : null}
      {!loading && items.length === 0 ? <p className="text-xs text-gray-400">暂无待确认订单</p> : null}
      <div className="space-y-3">
        {items.map((o) => (
          <div key={o.display_id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold">ID: {o.display_id}</p>
                <p className="text-[10px] text-gray-400 mt-1">用户: {o.global_user_id}</p>
                <p className="text-[10px] text-gray-400">凭证: {o.has_proof ? '✅ 已提交' : '❌ 未提交'}</p>
                <p className="text-[10px] text-gray-400">时间: {o.created_at}</p>
              </div>
              <p className="text-sm font-black text-gray-800">${Number(o.amount || 0).toFixed(2)}</p>
            </div>
            <button
              disabled={busy[o.display_id]}
              onClick={() => confirmPayment(o.display_id)}
              className={`mt-3 w-full py-3 rounded-2xl text-xs font-bold ${busy[o.display_id] ? 'bg-gray-200 text-gray-500' : 'bg-green-500 text-white'}`}
            >
              {busy[o.display_id] ? '确认中...' : '✅ 确认已收款'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function App() {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem('claw_miniapp_lang') || 'ZH'
    } catch {
      return 'ZH'
    }
  })
  const [activeTab, setActiveTab] = useState('home');
  const [me, setMe] = useState(null);
  const [products, setProducts] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [walletLogs, setWalletLogs] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeGroups, setActiveGroups] = useState([]);
  const [discoverGroups, setDiscoverGroups] = useState([]);
  const [paymentModal, setPaymentModal] = useState(null);
  const [actionModal, setActionModal] = useState(null)
  const [playResultModal, setPlayResultModal] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [playBusy, setPlayBusy] = useState(false)
  const [shippingModalOpen, setShippingModalOpen] = useState(false)
  const [buyPlaysModalOpen, setBuyPlaysModalOpen] = useState(false)
  const [toast, setToast] = useState('');

  const t = (key, vars) => clawMiniAppT(lang, key, vars)

  const idemRef = useRef({ direct: {}, group: {}, join: {} })
  const busyRef = useRef({ direct: {}, group: {}, join: {} })

  const makeIdemKey = (prefix) => {
    try {
      const rnd = (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function')
        ? globalThis.crypto.randomUUID()
        : `${Date.now()}_${Math.random().toString(16).slice(2)}`
      return `${String(prefix || 'idem')}:${rnd}`
    } catch {
      return `${String(prefix || 'idem')}:${Date.now()}_${Math.random().toString(16).slice(2)}`
    }
  }

  const getIdemKey = (scope, id) => {
    const s = String(scope || '').trim()
    const k = String(id || '').trim()
    if (!s || !k) return ''
    const bag = idemRef.current && idemRef.current[s] ? idemRef.current[s] : null
    if (!bag) return ''
    if (!bag[k]) bag[k] = makeIdemKey(s)
    return String(bag[k])
  }

  const clearIdemKey = (scope, id) => {
    const s = String(scope || '').trim()
    const k = String(id || '').trim()
    const bag = idemRef.current && idemRef.current[s] ? idemRef.current[s] : null
    if (bag && bag[k]) delete bag[k]
  }

  const setBusy = (scope, id, v) => {
    const s = String(scope || '').trim()
    const k = String(id || '').trim()
    if (!s || !k) return
    if (!busyRef.current[s]) busyRef.current[s] = {}
    if (v) busyRef.current[s][k] = true
    else delete busyRef.current[s][k]
  }

  const isBusy = (scope, id) => {
    const s = String(scope || '').trim()
    const k = String(id || '').trim()
    return Boolean(busyRef.current && busyRef.current[s] && busyRef.current[s][k])
  }

  const initData = getTelegramInitData()
  const devId = (import.meta && import.meta.env && import.meta.env.VITE_DEV_TELEGRAM_ID) || ''
  const needTelegram = !String(initData || '').trim() && !String(devId || '').trim()

  const miniSourceBot = (() => {
    const p = window && window.location ? String(window.location.pathname || '') : ''
    return p.includes('rainbowpawclaw') ? 'claw_miniapp' : 'rainbow_miniapp'
  })()

  const hotImpressionSentRef = useRef(false)

  useEffect(() => {
    if (hotImpressionSentRef.current) return
    if (String(activeTab || '') !== 'home') return
    const list = (products && products.length ? products.slice(0, 6) : PRODUCTS.slice(0, 6))
    const ids = list.map((p) => p && p.id).filter((x) => typeof x !== 'undefined' && x !== null)
    if (!ids.length) return
    hotImpressionSentRef.current = true
    const gid = me && me.user ? String(me.user.global_user_id || '').trim() : ''
    api.event('hot_products_impression', { product_ids: ids, count: ids.length }, { source_bot: miniSourceBot, global_user_id: gid }).catch(() => {})
  }, [activeTab, products, me])

  const openProduct = (product, src) => {
    if (!product) return
    setSelectedProduct(product)
    const gid = me && me.user ? String(me.user.global_user_id || '').trim() : ''
    api.event('product_open', { product_id: product.id, source: String(src || '') }, { source_bot: miniSourceBot, global_user_id: gid }).catch(() => {})
  }

  useEffect(() => {
    try {
      localStorage.setItem('claw_miniapp_lang', String(lang || 'ZH'))
    } catch {
      void 0
    }
  }, [lang])

  useEffect(() => {
    applySeo({
      title: 'RainbowPaw Claw | 抽奖 & 盲盒',
      description: 'RainbowPaw Claw 抽奖入口：盲盒抽奖、团购玩法与积分系统。',
      keywords: 'RainbowPaw Claw, 抽奖, 盲盒, 团购, 积分, Telegram WebApp',
      canonicalPath: '/rainbowpawclaw',
      ogType: 'website',
      ogImagePath: '/logo.png',
    })
  }, [])

  useEffect(() => {
    api.me().then(setMe).catch(() => {})
  }, []);

  useEffect(() => {
    if (activeTab === 'home') api.products({ sort: 'hot7d', limit: 6 }).then((d) => setProducts(d.products || [])).catch(() => {})
    if (activeTab === 'store') api.products({ limit: 50 }).then((d) => setProducts(d.products || [])).catch(() => {})
    if (activeTab === 'home') {
      api.orders(10).then((d) => setOrders(d.orders || [])).catch(() => {})
      api.groupsActive({ limit: 5, sort: 'expiring' }).then((d) => setActiveGroups(d.groups || [])).catch(() => {})
    }
    if (activeTab === 'wallet') api.wallet(20).then((d) => { setWallet(d.wallet || null); setWalletLogs(d.logs || []) }).catch(() => {})
    if (activeTab === 'profile') api.orders(30).then((d) => setOrders(d.orders || [])).catch(() => {})
    if (activeTab === 'earn') {
      api.groupsActive({ limit: 20, sort: 'expiring' }).then((d) => setActiveGroups(d.groups || [])).catch(() => {})
      api.groupsDiscover({ limit: 20, sort: 'expiring' }).then((d) => setDiscoverGroups(d.groups || [])).catch(() => {})
    }
  }, [activeTab]);

  const onPlay = async ({ multi } = {}) => {
    if (playBusy) return
    setPlayBusy(true)
    try {
      const m = Number(multi || 1) === 10 ? 10 : 1
      const r = await api.playMulti(m)
      setMe((prev) => prev && prev.user ? { ...prev, user: { ...prev.user, plays_left: r.plays_left } } : prev)
      api.me().then(setMe).catch(() => {})
      api.orders(10).then((d) => setOrders(d.orders || [])).catch(() => {})
      const plays = Array.isArray(r.plays)
        ? r.plays
        : [{ play_id: r.play_id, order_id: r.order_id, tier: r.tier, near_miss_tier: r.near_miss_tier, prize: r.prize }]
      setPlayResultModal({ plays, plays_left: r.plays_left })
    } catch (e) {
      const msg = e && e.message ? String(e.message) : '抽奖失败'
      if (msg.includes('no plays left')) {
        openRecharge()
        return
      }
      const handled = handleApiError({ e, retry: () => onPlay({ multi }), context: 'play' })
      if (!handled) showToast(msg)
    } finally {
      setPlayBusy(false)
    }
  }

  const shareLink = (link, opts = {}) => {
    const url = String(link || '')
    if (!url) return
    const kind = opts && typeof opts.kind === 'string' ? String(opts.kind) : ''
    const title = kind === 'referral' ? '🎁 RainbowPaw 抽奖活动' : '🎯 RainbowPaw 邀请'
    const isTelegramLink = /(^|\/\/)(t\.me|telegram\.me)\//i.test(url)
    const text = kind === 'referral'
      ? `${title}\n\n怎么参与：\n1）点开链接（Telegram 打开）${isTelegramLink ? '，点【Start/开始】' : ''}\n2）进入抽奖页后点【Get Plays】领取/购买次数\n3）点【抽奖】开奖\n4）中奖后点【中奖查看更多商品 👉 跳转】去逛商品\n\n商品入口：https://rainbowpaw.org/rainbowpaw\n\n我邀请你一起玩：`
      : `${title}\n\n点开链接加入即可：`
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
    openTelegramLink(shareUrl)
  }

  const showToast = (text) => {
    setToast(String(text || ''))
    setTimeout(() => setToast(''), 2000)
  }

  const openRecharge = () => {
    setActiveTab('wallet')
    setBuyPlaysModalOpen(true)
  }

  const openTelegramWebApp = () => {
    const clawBot = (import.meta && import.meta.env && import.meta.env.VITE_CLAW_BOT_USERNAME) || ''
    const rainbowBot = (import.meta && import.meta.env && import.meta.env.VITE_AFTERCARE_BOT_USERNAME) || 'RainbowPawbot'
    const p = window && window.location ? String(window.location.pathname || '') : ''
    const prefer = p.includes('rainbowpawclaw') && String(clawBot || '').trim() ? String(clawBot).trim() : String(rainbowBot).trim()
    const url = makeBotStartLink(prefer, 'open_webapp') || makeAftercareStartLink('')
    const ok = openTelegramLink(url)
    if (!ok) openTelegramLink('https://t.me/rainbowpawbot')
  }

  const openSupportLink = () => {
    const raw = (import.meta && import.meta.env && import.meta.env.VITE_SUPPORT_LINK) || ''
    const u = String(raw).trim() || 'https://t.me/rainbowpawbot'
    openTelegramLink(u)
  }

  const openRainbowMiniApp = () => {
    try {
      const base = 'https://rainbowpaw.org/rainbowpaw'
      const q = window && window.location ? String(window.location.search || '') : ''
      const h = window && window.location ? String(window.location.hash || '') : ''
      window.location.assign(`${base}${q}${h}`)
    } catch {
      window.location.assign('/rainbowpaw')
    }
  }

  const copyDebugInfo = ({ e, context }) => {
    const msg = e && e.message ? String(e.message) : ''
    const status = e && typeof e.status !== 'undefined' ? Number(e.status) : null
    const p = window && window.location ? `${window.location.pathname}${window.location.search || ''}` : ''
    const info = {
      ts: new Date().toISOString(),
      context: String(context || ''),
      status,
      message: msg,
      path: p,
      has_init_data: Boolean(String(getTelegramInitData() || '').trim()),
    }
    safeCopy(JSON.stringify(info))
    showToast(t('toast.debugCopied'))
  }

  const handleApiError = ({ e, retry, context }) => {
    const msg = e && e.message ? String(e.message) : ''
    const status = e && typeof e.status !== 'undefined' ? Number(e.status) : null

    if ((status === 400 || status === 401 || status === 403) && msg.includes('missing telegram id')) {
      setActionModal({
        title: t('modal.needTelegram.title'),
        message: t('modal.needTelegram.desc'),
        actions: [
          { label: t('action.openBot'), primary: true, onClick: openTelegramWebApp },
          { label: t('action.reload'), onClick: () => window.location.reload() },
          { label: t('action.copyDebug'), onClick: () => copyDebugInfo({ e, context }) },
        ],
      })
      return true
    }

    if (msg.includes('insufficient points') || msg.includes('no plays left')) {
      const points = wallet && typeof wallet.points_total !== 'undefined' ? Number(wallet.points_total || 0) : null
      setActionModal({
        title: t('modal.pointsLow.title'),
        message: `${t('modal.pointsLow.desc')}\n${points == null ? '' : t('modal.pointsLow.pointsLine', { points })}`.trim(),
        actions: [
          { label: t('action.recharge'), primary: true, onClick: openRecharge },
          { label: t('action.cancel') },
        ],
      })
      return true
    }

    if (status === 502 || status === 503 || status === 504 || msg.includes('wallet service unavailable')) {
      setActionModal({
        title: t('modal.serviceDown.title'),
        message: t('modal.serviceDown.desc'),
        actions: [
          ...(typeof retry === 'function' ? [{ label: t('action.retry'), primary: true, onClick: retry, keepOpen: true }] : []),
          { label: t('action.support'), onClick: openSupportLink },
          { label: t('action.copyDebug'), onClick: () => copyDebugInfo({ e, context }) },
        ],
      })
      return true
    }

    if (status === 408 || msg.includes('请求超时')) {
      setActionModal({
        title: t('modal.timeout.title'),
        message: t('modal.timeout.desc'),
        actions: [
          ...(typeof retry === 'function' ? [{ label: t('action.retry'), primary: true, onClick: retry, keepOpen: true }] : []),
          { label: t('action.cancel') },
          { label: t('action.copyDebug'), onClick: () => copyDebugInfo({ e, context }) },
        ],
      })
      return true
    }

    return false
  }

  const openPayment = async ({ title, display_id, amount, pay, invite_link }) => {
    const did = String(display_id || '')
    setPaymentModal({ title, display_id: did, amount: Number(amount || 0).toFixed(2), pay, invite_link, payment: null, proof_file: null })
    api.payment(did)
      .then((r) => {
        const p = r && r.payment ? r.payment : null
        const pf = r && r.proof_file ? r.proof_file : null
        setPaymentModal((prev) => prev && prev.display_id === did ? { ...prev, payment: p, proof_file: pf } : prev)
      })
      .catch(() => {})
  }

  const submitProof = async ({ id, proof_text }) => {
    try {
      await api.submitPaymentProof(id, proof_text)
      showToast('已提交，等待审核')
      if (paymentModal && paymentModal.display_id) {
        const pid = paymentModal.display_id
        let attempts = 0
        const poll = async () => {
          attempts += 1
          try {
            const r = await api.payment(pid)
            const p = r && r.payment ? r.payment : null
            if (p && p.status && p.status !== 'pending') {
              api.me().then(setMe).catch(() => {})
              api.wallet(20).then((d) => { setWallet(d.wallet || null); setWalletLogs(d.logs || []) }).catch(() => {})
              api.orders(30).then((d) => setOrders(d.orders || [])).catch(() => {})
              setPaymentModal(null)
              showToast(p.status === 'confirmed' ? '已确认到账' : '已拒绝')
              return
            }
          } catch {
            void 0
          }
          if (attempts < 3) setTimeout(poll, 2500)
        }
        setTimeout(poll, 1200)
      }
      setPaymentModal(null)
    } catch (e) {
      showToast(e && e.message ? e.message : '提交失败')
    }
  }

  const submitProofFile = async ({ id, mime_type, file_base64 }) => {
    try {
      await api.submitPaymentProofFile(id, { mime_type, file_base64 })
      showToast('截图已上传，等待审核')
      if (paymentModal) setPaymentModal({ ...paymentModal, proof_file: { payment_id: String(id) } })
      if (paymentModal && paymentModal.display_id) {
        const pid = paymentModal.display_id
        let attempts = 0
        const poll = async () => {
          attempts += 1
          try {
            const r = await api.payment(pid)
            const p = r && r.payment ? r.payment : null
            if (p && p.status && p.status !== 'pending') {
              api.me().then(setMe).catch(() => {})
              api.wallet(20).then((d) => { setWallet(d.wallet || null); setWalletLogs(d.logs || []) }).catch(() => {})
              api.orders(30).then((d) => setOrders(d.orders || [])).catch(() => {})
              setPaymentModal(null)
              showToast(p.status === 'confirmed' ? '已确认到账' : '已拒绝')
              return
            }
            if (paymentModal) setPaymentModal((prev) => prev ? { ...prev, payment: p, proof_file: r && r.proof_file ? r.proof_file : prev.proof_file } : prev)
          } catch {
            void 0
          }
          if (attempts < 3) setTimeout(poll, 2500)
        }
        setTimeout(poll, 1200)
      }
    } catch (e) {
      showToast(e && e.message ? e.message : '上传失败')
    }
  }

  const buyPlays = async (bundle) => {
    try {
      const r = await api.createPlaysPayment(bundle)
      openPayment({ title: `🎮 Get Plays (${bundle}x)`, display_id: r.display_id, amount: r.payment.amount, pay: r.pay })
    } catch (e) {
      showToast(e && e.message ? e.message : '创建支付失败')
    }
  }

  const directBuy = async (product) => {
    const pid = String(product && typeof product.id !== 'undefined' ? product.id : '').trim()
    if (!pid) return
    if (isBusy('direct', pid)) return
    setBusy('direct', pid, true)
    try {
      const gid = me && me.user ? String(me.user.global_user_id || '').trim() : ''
      api.event('purchase_direct_attempt', { product_id: product.id }, { source_bot: miniSourceBot, global_user_id: gid }).catch(() => {})
      const idemKey = getIdemKey('direct', pid)
      const r = await api.purchaseDirect(product.id, { idemKey })
      if (r && r.payment && typeof r.payment.amount !== 'undefined') {
        openPayment({ title: `🛒 Buy - ${(product.display_name || product.name)}`, display_id: r.display_id, amount: r.payment.amount, pay: r.pay })
        clearIdemKey('direct', pid)
        return
      }
      api.me().then(setMe).catch(() => {})
      api.wallet(20).then((d) => { setWallet(d.wallet || null); setWalletLogs(d.logs || []) }).catch(() => {})
      showToast(t('toast.orderCreated'))
      api.event('purchase_direct_ok', { product_id: product.id }, { source_bot: miniSourceBot, global_user_id: gid }).catch(() => {})
      clearIdemKey('direct', pid)
    } catch (e) {
      const msg = e && e.message ? String(e.message) : '创建订单失败'
      const handled = handleApiError({ e, retry: () => directBuy(product), context: 'purchase_direct' })
      if (!handled) showToast(msg)
    } finally {
      setBusy('direct', pid, false)
    }
  }

  const groupBuy = async (product) => {
    const pid = String(product && typeof product.id !== 'undefined' ? product.id : '').trim()
    if (!pid) return
    if (isBusy('group', pid)) return
    setBusy('group', pid, true)
    try {
      const gid = me && me.user ? String(me.user.global_user_id || '').trim() : ''
      api.event('purchase_group_attempt', { product_id: product.id }, { source_bot: miniSourceBot, global_user_id: gid }).catch(() => {})
      const idemKey = getIdemKey('group', pid)
      const r = await api.purchaseGroup(product.id, { idemKey })
      if (r && r.payment && typeof r.payment.amount !== 'undefined') {
        openPayment({ title: `🤝 Group - ${(product.display_name || product.name)}`, display_id: r.display_id, amount: r.payment.amount, pay: r.pay, invite_link: r.invite_link })
        clearIdemKey('group', pid)
        return
      }
      api.me().then(setMe).catch(() => {})
      api.wallet(20).then((d) => { setWallet(d.wallet || null); setWalletLogs(d.logs || []) }).catch(() => {})
      api.groupsActive({ limit: 20, sort: 'recent' }).then((d) => setActiveGroups(d.groups || [])).catch(() => {})
      showToast(t('toast.groupCreated'))
      api.event('purchase_group_ok', { product_id: product.id }, { source_bot: miniSourceBot, global_user_id: gid }).catch(() => {})
      clearIdemKey('group', pid)
    } catch (e) {
      const msg = e && e.message ? String(e.message) : '创建拼团失败'
      const handled = handleApiError({ e, retry: () => groupBuy(product), context: 'purchase_group' })
      if (!handled) showToast(msg)
    } finally {
      setBusy('group', pid, false)
    }
  }

  const payOrder = async (order) => {
    try {
      const r = await api.payment(order.id)
      const p = r && r.payment ? r.payment : null
      if (!p) return showToast('未找到支付单')
      openPayment({
        title: `💰 Pay - ${(order.display_name || order.name)}`,
        display_id: r.display_id || p.id,
        amount: p.amount,
        pay: me ? me.pay : null
      })
    } catch (e) {
      showToast(e && e.message ? e.message : '打开失败')
    }
  }

  const inviteGroup = async (group) => {
    const link = group && group.invite_link ? group.invite_link : ''
    if (!link) return showToast('缺少邀请链接')
    const ok = await safeCopy(link)
    if (ok) showToast('已复制邀请链接')
    else openTelegramLink(link)
  }

  const joinGroupPay = async (group) => {
    const gid = String(group && (group.id || group.group_id || '')).trim()
    if (!gid) return
    if (isBusy('join', gid)) return
    setBusy('join', gid, true)
    try {
      const gid2 = me && me.user ? String(me.user.global_user_id || '').trim() : ''
      api.event('join_group_pay_attempt', { group_id: gid }, { source_bot: miniSourceBot, global_user_id: gid2 }).catch(() => {})
      const idemKey = getIdemKey('join', gid)
      const r = await api.joinGroupPay(group.id, { idemKey })
      if (r && r.payment && typeof r.payment.amount !== 'undefined') {
        openPayment({ title: '💰 Pay & Join', display_id: r.display_id, amount: r.payment.amount, pay: r.pay })
        clearIdemKey('join', gid)
        return
      }
      api.me().then(setMe).catch(() => {})
      api.wallet(20).then((d) => { setWallet(d.wallet || null); setWalletLogs(d.logs || []) }).catch(() => {})
      api.groupsActive({ limit: 20, sort: 'recent' }).then((d) => setActiveGroups(d.groups || [])).catch(() => {})
      showToast(t('toast.joinRequested'))
      api.event('join_group_pay_ok', { group_id: gid }, { source_bot: miniSourceBot, global_user_id: gid2 }).catch(() => {})
      clearIdemKey('join', gid)
    } catch (e) {
      const msg = e && e.message ? String(e.message) : '加入失败'
      const handled = handleApiError({ e, retry: () => joinGroupPay(group), context: 'join_group_pay' })
      if (!handled) showToast(msg)
    } finally {
      setBusy('join', gid, false)
    }
  }

  const copyReferral = async (link) => {
    const ok = await safeCopy(link)
    showToast(ok ? '已复制链接' : '复制失败')
  }

  const forwardReferral = async (link) => {
    if (!link) return showToast('缺少链接')
    shareLink(link, { kind: 'referral' })
  }

  const previewProof = (id) => {
    const url = api.paymentProofFileUrl(id)
    openTelegramLink(url)
  }

  const openShippingModal = () => setShippingModalOpen(true)

  const openSupport = () => {
    const raw = (import.meta && import.meta.env && import.meta.env.VITE_SUPPORT_LINK) || ''
    const u = String(raw).trim()
    const url = u ? u : 'https://t.me/rainbowpawbot'
    openTelegramLink(url)
  }
  const submitShipping = async ({ name, phone, address }) => {
    await api.saveShipping({ name, phone, address })
    api.me().then(setMe).catch(() => {})
    api.orders(30).then((d) => setOrders(d.orders || [])).catch(() => {})
    setShippingModalOpen(false)
    showToast('已保存收货信息')
  }

  const needShipping = me && me.user && String(me.user.state || '') === 'waiting_shipping' && !(me && me.shipping)

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 max-w-md mx-auto shadow-2xl relative overflow-x-hidden">
      <main className="h-full">
        {needTelegram ? (
          <InitDataBanner
            t={t}
            onOpenBot={openTelegramWebApp}
            onCopyDebug={() => copyDebugInfo({ e: null, context: 'initData_missing' })}
          />
        ) : null}
        {activeTab === 'home' && <HomePage me={me} onPlay={onPlay} products={products} onSelectProduct={(p) => openProduct(p, 'home_hot')} orders={orders} activeGroups={activeGroups} onPayOrder={payOrder} onInviteGroup={inviteGroup} onGoTab={setActiveTab} onOpenShipping={openShippingModal} playBusy={playBusy} />}
        {activeTab === 'store' && <StorePage products={products} onSelectProduct={(p) => openProduct(p, 'store_list')} />}
        {activeTab === 'earn' && <EarnPage me={me} activeGroups={activeGroups} discoverGroups={discoverGroups} onCopyReferral={copyReferral} onForwardReferral={forwardReferral} onInviteGroup={inviteGroup} onJoinGroupPay={joinGroupPay} />}
        {activeTab === 'wallet' && <WalletPage t={t} wallet={wallet} logs={walletLogs} pricing={me ? me.pricing : null} pay={me ? me.pay : null} onBuyPlays={buyPlays} onSubmitProof={submitProof} />}
        {activeTab === 'profile' && <ProfilePage t={t} lang={lang} setLang={setLang} me={me} orders={orders} onPayOrder={payOrder} onEditShipping={openShippingModal} onSupport={openSupport} />}
        {activeTab === 'admin' && <AdminPaymentsPage telegram={telegram} />}
      </main>
      
      <BottomTabNav t={t} activeTab={activeTab} setActiveTab={setActiveTab} />
      <PaymentModal data={paymentModal} onClose={() => setPaymentModal(null)} onSubmitProof={submitProof} onSubmitProofFile={submitProofFile} onShareLink={(link) => shareLink(link, { kind: 'invite' })} onPreviewProof={previewProof} />
      <ActionModal data={actionModal} onClose={() => setActionModal(null)} />
      <ProductModal t={t} product={selectedProduct} onClose={() => setSelectedProduct(null)} onDirectBuy={directBuy} onGroupBuy={groupBuy} />
      <ShippingModal t={t} open={shippingModalOpen} initial={me && me.shipping ? me.shipping : null} onClose={() => setShippingModalOpen(false)} onSubmit={submitShipping} />
      <BuyPlaysModal
        t={t}
        open={buyPlaysModalOpen}
        pricing={me ? me.pricing : null}
        onClose={() => setBuyPlaysModalOpen(false)}
        onChoose={(bundle) => {
          setBuyPlaysModalOpen(false)
          buyPlays(bundle)
        }}
      />
      <PlayResultModal t={t} data={playResultModal} onClose={() => setPlayResultModal(null)} onGoOrders={() => { setPlayResultModal(null); setActiveTab('profile') }} onOpenShipping={openShippingModal} needShipping={needShipping} onGoShop={openRainbowMiniApp} api={api} />
      {toast ? (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-4 py-2 rounded-full animate-in fade-in slide-in-from-bottom duration-300">{toast}</div>
      ) : null}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        .animate-marquee { animation: marquee 15s linear infinite; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-in { animation: fade-in 0.3s ease-out; }
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .slide-in-from-bottom { animation: slide-up 0.3s ease-out; }
        .flip-card { perspective: 1200px; }
        .flip-inner { position: relative; width: 100%; height: 100%; transform-style: preserve-3d; transition: transform 650ms cubic-bezier(.2,.8,.2,1); }
        .flip-inner.is-flipped { transform: rotateY(180deg); }
        .flip-inner.is-pop { animation: pop 420ms cubic-bezier(.2,.9,.2,1); }
        .flip-face { position: relative; width: 100%; height: 100%; backface-visibility: hidden; }
        .flip-front { transform: rotateY(0deg); }
        .flip-back { position: absolute; inset: 0; transform: rotateY(180deg); }
        .legendary-border { box-shadow: 0 0 0 1px rgba(239,68,68,0.25), 0 10px 30px rgba(239,68,68,0.15); }
        .legendary-aura { position: absolute; inset: -40px; background: conic-gradient(from 180deg, rgba(255,255,255,0.0), rgba(255,215,0,0.25), rgba(255,80,80,0.25), rgba(255,255,255,0.0)); filter: blur(18px); animation: aura-spin 2.2s linear infinite; }
        @keyframes aura-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .legendary-shine { position: absolute; inset: 0; background: linear-gradient(115deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0) 100%); transform: translateX(-120%); opacity: 0.55; mix-blend-mode: overlay; animation: shine-sweep 1.6s ease-in-out infinite; pointer-events: none; }
        @keyframes shine-sweep { 0% { transform: translateX(-120%); } 55% { transform: translateX(120%); } 100% { transform: translateX(120%); } }
        @keyframes pop { 0% { transform: scale(1); } 40% { transform: scale(1.045); } 100% { transform: scale(1); } }
        .legendary-flash { position: absolute; inset: 0; background: radial-gradient(circle at 50% 40%, rgba(255,255,255,0.9), rgba(255,255,255,0.0) 60%); animation: flash 900ms ease-out forwards; }
        @keyframes flash { 0% { opacity: 0; } 18% { opacity: 1; } 100% { opacity: 0; } }
        .confetti-layer { position: absolute; inset: 0; overflow: hidden; }
        .confetti { position: absolute; top: -12px; width: 8px; height: 14px; border-radius: 2px; opacity: 0.95; transform: translateY(0) rotate(0deg); animation: confetti-fall 900ms ease-out forwards; }
        @keyframes confetti-fall { 0% { transform: translateY(-10px) rotate(0deg); opacity: 0; } 10% { opacity: 1; } 100% { transform: translateY(110vh) rotate(540deg); opacity: 0; } }
        .claw-panel-loading { animation: claw-pulse 900ms ease-in-out infinite; }
        @keyframes claw-pulse { 0% { box-shadow: inset 0 2px 10px rgba(0,0,0,0.06); } 50% { box-shadow: inset 0 2px 18px rgba(59,130,246,0.18); } 100% { box-shadow: inset 0 2px 10px rgba(0,0,0,0.06); } }
        .claw-gift { animation: claw-wiggle 520ms ease-in-out infinite; transform-origin: 50% 70%; }
        @keyframes claw-wiggle { 0% { transform: translateY(0) rotate(0deg) scale(1); } 25% { transform: translateY(-2px) rotate(-2deg) scale(1.02); } 50% { transform: translateY(0) rotate(2deg) scale(1.03); } 75% { transform: translateY(-1px) rotate(-1deg) scale(1.02); } 100% { transform: translateY(0) rotate(0deg) scale(1); } }
        .claw-scan { background: linear-gradient(120deg, rgba(59,130,246,0.0), rgba(59,130,246,0.16), rgba(245,158,11,0.10), rgba(59,130,246,0.0)); mask-image: radial-gradient(circle at 50% 50%, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 78%); -webkit-mask-image: radial-gradient(circle at 50% 50%, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 78%); animation: claw-scan-move 780ms ease-in-out infinite; }
        @keyframes claw-scan-move { 0% { opacity: 0.0; transform: translateX(-14px); } 35% { opacity: 0.9; } 100% { opacity: 0.0; transform: translateX(14px); } }
        .claw-sparkles { background: radial-gradient(circle at 20% 35%, rgba(59,130,246,0.22), rgba(255,255,255,0) 55%), radial-gradient(circle at 75% 30%, rgba(245,158,11,0.18), rgba(255,255,255,0) 60%), radial-gradient(circle at 60% 75%, rgba(34,197,94,0.12), rgba(255,255,255,0) 55%); animation: claw-sparkle 1100ms ease-in-out infinite; }
        @keyframes claw-sparkle { 0% { opacity: 0.25; } 50% { opacity: 0.75; } 100% { opacity: 0.25; } }
      `}</style>
    </div>
  );
}
