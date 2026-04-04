import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarPlus, Copy, Send, Sparkles } from 'lucide-react'
import { applySeo } from '../seo.js'
import { apiFetch } from '../api/client.js'

function fmt(ts) {
  if (!ts) return '-'
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return '-'
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${hh}:${mm}`
}

function toIso(localDateTime) {
  const s = String(localDateTime || '').trim()
  if (!s) return null
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

async function safeCopy(text) {
  try {
    await navigator.clipboard.writeText(String(text))
    return true
  } catch {
    return false
  }
}

export default function SalesCrmLeadPage() {
  const { leadId } = useParams()
  const nav = useNavigate()
  const [busy, setBusy] = useState(false)
  const [lead, setLead] = useState(null)
  const [events, setEvents] = useState([])
  const [quotes, setQuotes] = useState([])

  const [owner, setOwner] = useState('')
  const [stage, setStage] = useState('')
  const [intent, setIntent] = useState('')
  const [nextAt, setNextAt] = useState('')

  const [aiPrompt, setAiPrompt] = useState('基于该用户最近事件，生成一段 D1 温柔跟进消息（简短、礼貌、含一个提问）。')
  const [aiOut, setAiOut] = useState('')
  const [sendChatId, setSendChatId] = useState('')

  const [qCountry, setQCountry] = useState('')
  const [qCity, setQCity] = useState('')
  const [qPkg, setQPkg] = useState('')
  const [qWeight, setQWeight] = useState(0)
  const [qNote, setQNote] = useState('')

  useEffect(() => {
    applySeo({
      title: `Lead ${String(leadId || '')} | CRM`,
      description: '线索详情、报价与跟进',
      canonicalPath: `/rainbowpaw/crm/leads/${encodeURIComponent(String(leadId || ''))}`,
      ogType: 'website',
    })
  }, [leadId])

  const load = async () => {
    const id = String(leadId || '').trim()
    if (!id) return
    setBusy(true)
    try {
      const ls = await apiFetch(`/api/admin/crm/leads?q=${encodeURIComponent(id)}&limit=1`)
      const one = Array.isArray(ls?.items) && ls.items.length ? ls.items[0] : null
      setLead(one)
      setOwner(String(one?.owner || ''))
      setStage(String(one?.stage || ''))
      setIntent(String(one?.intent || ''))
      setNextAt(one?.next_followup_at ? String(one.next_followup_at).slice(0, 16) : '')
      setQCountry(String(one?.country || ''))
      setQCity(String(one?.city || ''))

      const ev = await apiFetch(`/api/admin/crm/leads/${encodeURIComponent(id)}/events?limit=100`)
      setEvents(Array.isArray(ev?.items) ? ev.items : [])
      const qs = await apiFetch(`/api/admin/pricing/aftercare/quotes?lead_id=${encodeURIComponent(id)}&limit=20`)
      setQuotes(Array.isArray(qs?.items) ? qs.items : [])
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    load()
  }, [leadId])

  const save = async () => {
    const id = String(leadId || '').trim()
    if (!id) return
    setBusy(true)
    try {
      await apiFetch(`/api/admin/crm/leads/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: {
          owner: owner.trim() || null,
          stage: stage.trim() || null,
          intent: intent.trim() || null,
          next_followup_at: toIso(nextAt),
          reason: 'mini_crm',
        },
      })
      await load()
    } finally {
      setBusy(false)
    }
  }

  const generateAi = async () => {
    const id = String(leadId || '').trim()
    if (!id) return
    setBusy(true)
    try {
      const ctx = {
        lead_id: id,
        lead,
        last_events: events.slice(0, 10),
      }
      const res = await apiFetch('/api/admin/ai/support/reply', {
        method: 'POST',
        body: { user_message: aiPrompt, context: ctx },
      })
      setAiOut(String(res?.reply || ''))
    } finally {
      setBusy(false)
    }
  }

  const sendAi = async () => {
    const id = String(leadId || '').trim()
    if (!id) return
    const chat = sendChatId.trim()
    const msg = aiOut.trim()
    if (!chat || !msg) return
    setBusy(true)
    try {
      await apiFetch('/api/admin/outreach/telegram/send', {
        method: 'POST',
        body: { bot: 'rainbow', chat_id: chat, lead_id: id, template_key: 'ai_followup', message: msg },
      })
      await apiFetch(`/api/admin/crm/leads/${encodeURIComponent(id)}/events`, {
        method: 'POST',
        body: { event_name: 'followup_sent', event_data: { channel: 'telegram', chat_id: chat } },
      })
      await load()
    } finally {
      setBusy(false)
    }
  }

  const createQuote = async () => {
    const id = String(leadId || '').trim()
    if (!id) return
    setBusy(true)
    try {
      const res = await apiFetch('/api/admin/pricing/aftercare/quotes', {
        method: 'POST',
        body: {
          lead_id: id,
          country: qCountry.trim(),
          city: qCity.trim(),
          package_code: qPkg.trim(),
          weight_kg: Number(qWeight || 0),
          note: qNote.trim() || null,
        },
      })
      const share = res?.share_url
      if (share) await safeCopy(share)
      await load()
    } finally {
      setBusy(false)
    }
  }

  const addFollowup = async (days) => {
    const id = String(leadId || '').trim()
    if (!id) return
    setBusy(true)
    try {
      const due = new Date(Date.now() + Math.max(0, Number(days || 0)) * 86400000).toISOString()
      await apiFetch('/api/admin/crm/followups', {
        method: 'POST',
        body: { lead_id: id, channel: 'telegram', due_at: due, template_key: `D${String(days)}` },
      })
      await load()
    } finally {
      setBusy(false)
    }
  }

  const topEvents = useMemo(() => events.slice(0, 20), [events])

  return (
    <div className="rp-page-bg min-h-screen">
      <div className="max-w-3xl mx-auto p-4 pb-24">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => nav(-1)}
            className="px-3 py-2 rounded-xl text-xs font-bold border border-gray-200 bg-white hover:bg-gray-50"
          >
            <span className="inline-flex items-center gap-1"><ArrowLeft size={14} />返回</span>
          </button>
          <Link
            to="/rainbowpaw/crm"
            className="px-3 py-2 rounded-xl text-xs font-bold border border-gray-200 bg-white hover:bg-gray-50"
          >
            工作台
          </Link>
        </div>

        <div className="mt-3 rp-card p-4">
          <div className="text-xs text-gray-500">Lead</div>
          <div className="text-sm font-mono font-black break-all">{String(leadId || '')}</div>
          <div className="mt-2 text-[11px] text-gray-600">
            {String(lead?.country || '-')}-{String(lead?.city || '-')}
            <span className="mx-2">|</span>
            stage: {String(lead?.stage || '-')}
            <span className="mx-2">|</span>
            intent: {String(lead?.intent || '-')}
          </div>
        </div>

        <div className="mt-3 rp-card p-4">
          <div className="text-sm font-black">编辑</div>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] font-bold text-gray-500 mb-1">owner</div>
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white" value={owner} onChange={(e) => setOwner(e.target.value)} />
            </div>
            <div>
              <div className="text-[10px] font-bold text-gray-500 mb-1">stage</div>
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white" value={stage} onChange={(e) => setStage(e.target.value)} />
            </div>
            <div>
              <div className="text-[10px] font-bold text-gray-500 mb-1">intent</div>
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white" value={intent} onChange={(e) => setIntent(e.target.value)} />
            </div>
            <div>
              <div className="text-[10px] font-bold text-gray-500 mb-1">next_followup_at</div>
              <input type="datetime-local" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white" value={nextAt} onChange={(e) => setNextAt(e.target.value)} />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button type="button" disabled={busy} onClick={save} className={`rp-btn-primary px-4 py-2 rounded-xl text-xs font-black border-0 ${busy ? 'opacity-70' : ''}`}>
              保存
            </button>
            <button type="button" disabled={busy} onClick={() => safeCopy(String(leadId || ''))} className="px-4 py-2 rounded-xl text-xs font-bold border border-gray-200 bg-white hover:bg-gray-50">
              <span className="inline-flex items-center gap-1"><Copy size={14} />复制 lead_id</span>
            </button>
          </div>
        </div>

        <div className="mt-3 rp-card p-4">
          <div className="text-sm font-black">快速创建跟进</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {[0, 1, 3, 7].map((d) => (
              <button
                key={d}
                type="button"
                disabled={busy}
                onClick={() => addFollowup(d)}
                className="px-3 py-2 rounded-xl text-xs font-bold border border-gray-200 bg-white hover:bg-gray-50"
              >
                <span className="inline-flex items-center gap-1"><CalendarPlus size={14} />D{d}</span>
              </button>
            ))}
          </div>
          <div className="mt-2 text-[11px] text-gray-500">生成任务后，n8n 会按到期时间自动发送。</div>
        </div>

        <div className="mt-3 rp-card p-4">
          <div className="text-sm font-black">AI 跟进文案</div>
          <div className="mt-3">
            <div className="text-[10px] font-bold text-gray-500 mb-1">提示词</div>
            <textarea className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white" rows={3} value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} />
          </div>
          <div className="mt-3 flex gap-2">
            <button type="button" disabled={busy} onClick={generateAi} className="px-4 py-2 rounded-xl text-xs font-black border-0 rp-btn-primary">
              <span className="inline-flex items-center gap-1"><Sparkles size={14} />生成</span>
            </button>
            <button type="button" disabled={busy || !aiOut.trim()} onClick={() => safeCopy(aiOut)} className="px-4 py-2 rounded-xl text-xs font-bold border border-gray-200 bg-white hover:bg-gray-50">
              <span className="inline-flex items-center gap-1"><Copy size={14} />复制</span>
            </button>
          </div>
          <div className="mt-3">
            <div className="text-[10px] font-bold text-gray-500 mb-1">输出（可编辑）</div>
            <textarea className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white" rows={5} value={aiOut} onChange={(e) => setAiOut(e.target.value)} />
          </div>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] font-bold text-gray-500 mb-1">Telegram chat_id</div>
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white" value={sendChatId} onChange={(e) => setSendChatId(e.target.value)} placeholder="例如：123456789" />
            </div>
            <div className="flex items-end">
              <button type="button" disabled={busy || !sendChatId.trim() || !aiOut.trim()} onClick={sendAi} className={`w-full px-4 py-2 rounded-xl text-xs font-black border-0 rp-btn-primary ${busy ? 'opacity-70' : ''}`}>
                <span className="inline-flex items-center gap-1"><Send size={14} />发送</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-3 rp-card p-4">
          <div className="text-sm font-black">善终报价</div>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] font-bold text-gray-500 mb-1">country</div>
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white" value={qCountry} onChange={(e) => setQCountry(e.target.value)} />
            </div>
            <div>
              <div className="text-[10px] font-bold text-gray-500 mb-1">city</div>
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white" value={qCity} onChange={(e) => setQCity(e.target.value)} />
            </div>
            <div>
              <div className="text-[10px] font-bold text-gray-500 mb-1">package_code</div>
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white" value={qPkg} onChange={(e) => setQPkg(e.target.value)} placeholder="basic" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-gray-500 mb-1">weight_kg</div>
              <input type="number" min={0} step={0.1} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white" value={qWeight} onChange={(e) => setQWeight(Number(e.target.value || 0))} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-[10px] font-bold text-gray-500 mb-1">note</div>
            <textarea className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white" rows={2} value={qNote} onChange={(e) => setQNote(e.target.value)} />
          </div>
          <div className="mt-3 flex gap-2">
            <button type="button" disabled={busy || !qCountry.trim() || !qCity.trim() || !qPkg.trim()} onClick={createQuote} className={`rp-btn-primary px-4 py-2 rounded-xl text-xs font-black border-0 ${busy ? 'opacity-70' : ''}`}>
              创建报价单（复制链接）
            </button>
          </div>
          <div className="mt-3 space-y-2">
            {(quotes || []).length ? (
              quotes.map((q) => (
                <div key={String(q.id)} className="rp-card p-3 bg-white/60">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-mono font-bold">#{String(q.id)}</div>
                    <div className="text-[11px] text-gray-600">{String(q.status)}</div>
                  </div>
                  <div className="mt-1 text-[11px] text-gray-600">
                    {String(q.currency)} {(Number(q.total_cents || 0) / 100).toFixed(2)}
                    <span className="mx-2">|</span>
                    {String(q.package_code)}
                    <span className="mx-2">|</span>
                    {Number(q.weight_kg || 0)}kg
                  </div>
                  {q.share_url ? (
                    <div className="mt-2 flex items-center gap-2">
                      <a className="text-xs text-indigo-600 font-bold" href={String(q.share_url)} target="_blank" rel="noreferrer">
                        打开客户确认页
                      </a>
                      <button type="button" onClick={() => safeCopy(String(q.share_url))} className="text-xs font-bold text-gray-700">
                        复制
                      </button>
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="text-xs text-gray-500">暂无报价单</div>
            )}
          </div>
        </div>

        <div className="mt-3 rp-card p-4">
          <div className="text-sm font-black">事件时间线</div>
          <div className="mt-3 space-y-2">
            {topEvents.length ? (
              topEvents.map((e) => (
                <div key={String(e.id)} className="rp-card p-3 bg-white/60">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold">{String(e.event_name)}</div>
                    <div className="text-[10px] text-gray-500">{fmt(e.created_at)}</div>
                  </div>
                  <div className="mt-1 text-[11px] text-gray-600 break-all">{e.event_data ? JSON.stringify(e.event_data) : '-'}</div>
                </div>
              ))
            ) : (
              <div className="text-xs text-gray-500">暂无</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

