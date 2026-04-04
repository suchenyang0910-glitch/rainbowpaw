import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CheckCircle2, XCircle } from 'lucide-react'
import { applySeo } from '../seo.js'
import { apiFetch } from '../api/client.js'

function money(currency, cents) {
  const c = Number(cents || 0)
  return `${String(currency || 'USD')} ${(c / 100).toFixed(2)}`
}

export default function AftercareQuoteCustomerPage() {
  const { token } = useParams()
  const [busy, setBusy] = useState(false)
  const [data, setData] = useState(null)
  const [note, setNote] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    applySeo({
      title: '报价确认 | RainbowPaw',
      description: '善终服务报价确认页',
      canonicalPath: `/rainbowpaw/aftercare/quote/${encodeURIComponent(String(token || ''))}`,
      ogType: 'website',
    })
  }, [token])

  const load = async () => {
    const t = String(token || '').trim()
    if (!t) return
    setBusy(true)
    try {
      const res = await apiFetch(`/api/v1/aftercare/quotes/by_token/${encodeURIComponent(t)}`)
      setData(res)
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    load()
  }, [token])

  const decide = async (decision) => {
    const t = String(token || '').trim()
    if (!t) return
    setBusy(true)
    try {
      await apiFetch(`/api/v1/aftercare/quotes/by_token/${encodeURIComponent(t)}/decision`, {
        method: 'POST',
        body: { decision, note: note.trim() || null },
      })
      setDone(true)
      await load()
    } finally {
      setBusy(false)
    }
  }

  const q = data || null

  return (
    <div className="rp-page-bg min-h-screen">
      <div className="max-w-xl mx-auto p-4 pb-24">
        <div className="rp-card p-6">
          <div className="text-lg font-black">善终服务报价</div>
          <div className="mt-1 text-xs text-gray-500">请核对信息后确认</div>

          {q ? (
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">国家/城市</span><span className="font-bold">{String(q.country)} / {String(q.city)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">套餐</span><span className="font-bold">{String(q.package_code)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">重量</span><span className="font-bold">{Number(q.weight_kg || 0)} kg</span></div>
              <div className="border-t border-gray-200 my-2" />
              <div className="flex justify-between"><span className="text-gray-500">基础费</span><span className="font-bold">{money(q.currency, q.base_price_cents)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">上门费</span><span className="font-bold">{money(q.currency, q.pickup_fee_cents)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">重量费</span><span className="font-bold">{money(q.currency, q.weight_fee_cents)}</span></div>
              <div className="border-t border-gray-200 my-2" />
              <div className="flex justify-between text-base"><span className="text-gray-800 font-black">合计</span><span className="text-indigo-600 font-black">{money(q.currency, q.total_cents)}</span></div>
              {q.note ? (
                <div className="mt-2 text-xs text-gray-600 whitespace-pre-wrap">备注：{String(q.note)}</div>
              ) : null}
              <div className="mt-2 text-xs text-gray-500">状态：{String(q.status)}</div>
              {q.decision_note ? (
                <div className="mt-1 text-xs text-gray-600 whitespace-pre-wrap">你的备注：{String(q.decision_note)}</div>
              ) : null}
            </div>
          ) : (
            <div className="mt-4 text-sm text-gray-500">{busy ? '加载中…' : '未找到报价单'}</div>
          )}
        </div>

        {q && !done && String(q.status) !== 'accepted' && String(q.status) !== 'rejected' ? (
          <div className="mt-3 rp-card p-4">
            <div className="text-sm font-black">确认/拒绝</div>
            <div className="mt-2">
              <div className="text-[10px] font-bold text-gray-500 mb-1">备注（可选）</div>
              <textarea className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => decide('accepted')}
                className={`rp-btn-primary py-3 rounded-xl text-sm font-black border-0 ${busy ? 'opacity-70' : ''}`}
              >
                <span className="inline-flex items-center justify-center gap-2"><CheckCircle2 size={18} />确认</span>
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => decide('rejected')}
                className={`py-3 rounded-xl text-sm font-black border border-gray-200 bg-white hover:bg-gray-50 ${busy ? 'opacity-70' : ''}`}
              >
                <span className="inline-flex items-center justify-center gap-2"><XCircle size={18} />拒绝</span>
              </button>
            </div>
          </div>
        ) : null}

        {done ? (
          <div className="mt-3 rp-card p-4 text-sm">
            已提交。你可以关闭本页面。
          </div>
        ) : null}
      </div>
    </div>
  )
}

