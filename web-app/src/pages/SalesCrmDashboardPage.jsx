import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Plus, Clock, ArrowRight } from 'lucide-react'
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

export default function SalesCrmDashboardPage() {
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [leads, setLeads] = useState([])
  const [followups, setFollowups] = useState([])

  useEffect(() => {
    applySeo({
      title: 'CRM 工作台 | RainbowPaw',
      description: '线索、报价、AI 文案与跟进',
      canonicalPath: '/rainbowpaw/crm',
      ogType: 'website',
    })
  }, [])

  const load = async () => {
    setBusy(true)
    try {
      const fu = await apiFetch(`/api/admin/crm/followups?due_before=${encodeURIComponent(new Date().toISOString())}&status=pending&limit=50`)
      setFollowups(Array.isArray(fu?.items) ? fu.items : [])
      const leadRes = await apiFetch(`/api/admin/crm/leads?q=${encodeURIComponent(String(q || '').trim())}&limit=50`)
      setLeads(Array.isArray(leadRes?.items) ? leadRes.items : [])
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const groupedFollowups = useMemo(() => {
    return followups
      .slice()
      .sort((a, b) => String(a.due_at || '').localeCompare(String(b.due_at || '')))
      .map((f) => ({
        id: String(f.id),
        lead_id: String(f.lead_id),
        due_at: f.due_at,
        template_key: f.template_key || null,
      }))
  }, [followups])

  return (
    <div className="rp-page-bg min-h-screen">
      <div className="max-w-3xl mx-auto p-4 pb-24">
        <div className="rp-card p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-black">CRM 工作台</div>
              <div className="text-xs text-gray-500">线索 / 报价 / AI / 跟进</div>
            </div>
            <button
              type="button"
              onClick={load}
              className={`px-3 py-2 rounded-xl text-xs font-bold border border-gray-200 bg-white ${busy ? 'opacity-70' : 'hover:bg-gray-50'}`}
              disabled={busy}
            >
              刷新
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white"
                placeholder="搜索 lead_id / global_user / channel"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={load}
              className="rp-btn-primary px-3 py-2 rounded-xl text-xs font-black border-0"
            >
              查询
            </button>
            <button
              type="button"
              onClick={() => window.alert('当前版本：线索通过事件自动生成；如需手动新建请在后台创建')}
              className="px-3 py-2 rounded-xl text-xs font-bold border border-gray-200 bg-white hover:bg-gray-50"
            >
              <span className="inline-flex items-center gap-1"><Plus size={14} />新建</span>
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rp-card p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-black">待跟进</div>
              <div className="text-xs text-gray-500">{groupedFollowups.length} 条</div>
            </div>
            <div className="mt-3 space-y-2">
              {groupedFollowups.length ? (
                groupedFollowups.map((f) => (
                  <Link
                    key={f.id}
                    to={`/rainbowpaw/crm/leads/${encodeURIComponent(f.lead_id)}`}
                    className="block rp-card p-3 bg-white/60 hover:bg-white transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-mono font-bold">{f.lead_id}</div>
                      <div className="text-[10px] text-gray-500 flex items-center gap-1">
                        <Clock size={12} /> {fmt(f.due_at)}
                      </div>
                    </div>
                    <div className="mt-1 text-[11px] text-gray-500">模板：{f.template_key || '-'}</div>
                  </Link>
                ))
              ) : (
                <div className="text-xs text-gray-500">暂无</div>
              )}
            </div>
          </div>

          <div className="rp-card p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-black">线索列表</div>
              <div className="text-xs text-gray-500">{leads.length} 条</div>
            </div>
            <div className="mt-3 space-y-2">
              {leads.length ? (
                leads.map((l) => (
                  <Link
                    key={String(l.lead_id)}
                    to={`/rainbowpaw/crm/leads/${encodeURIComponent(String(l.lead_id))}`}
                    className="block rp-card p-3 bg-white/60 hover:bg-white transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-mono font-bold">{String(l.lead_id)}</div>
                      <ArrowRight size={14} className="text-gray-400" />
                    </div>
                    <div className="mt-1 text-[11px] text-gray-500">
                      {String(l.country || '-')}-{String(l.city || '-')}
                      <span className="mx-2">|</span>
                      stage: {String(l.stage || '-')}
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-xs text-gray-500">暂无</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

