import type { CSSProperties } from 'react'

type Point = { x: string; y: number }

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function toPath(points: Array<{ x: number; y: number }>) {
  if (!points.length) return ''
  return `M ${points[0].x} ${points[0].y} ` + points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ')
}

export function MultiLineTrendChart({
  series,
  height = 260,
}: {
  series: Array<{ name: string; color: string; points: Point[] }>
  height?: number
}) {
  const width = 720
  const padding = { left: 44, right: 16, top: 18, bottom: 36 }

  const all = series.flatMap((s) => s.points)
  const xs = Array.from(new Set(all.map((p) => p.x)))
  const xIndex = new Map(xs.map((x, i) => [x, i]))

  const values = all.map((p) => p.y)
  const minY = values.length ? Math.min(...values) : 0
  const maxY = values.length ? Math.max(...values) : 1
  const spanY = maxY - minY || 1

  const plotW = width - padding.left - padding.right
  const plotH = height - padding.top - padding.bottom
  const xStep = xs.length > 1 ? plotW / (xs.length - 1) : 0

  const yToPx = (y: number) => padding.top + plotH * (1 - (y - minY) / spanY)
  const xToPx = (x: string) => padding.left + (xIndex.get(x) ?? 0) * xStep

  const yTicks = 4
  const tickVals = Array.from({ length: yTicks + 1 }, (_, i) => minY + (spanY * i) / yTicks)

  const legendStyle: CSSProperties = {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 8,
  }

  return (
    <div>
      <div style={legendStyle}>
        {series.map((s) => (
          <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: s.color, display: 'inline-block' }} />
            <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.65)' }}>{s.name}</span>
          </div>
        ))}
      </div>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="trend">
        {tickVals.map((v, i) => {
          const y = yToPx(v)
          return (
            <g key={i}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#f0f0f0" />
              <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="11" fill="rgba(0,0,0,0.45)">
                {v.toFixed(0)}
              </text>
            </g>
          )
        })}

        <line x1={padding.left} y1={padding.top + plotH} x2={width - padding.right} y2={padding.top + plotH} stroke="#d9d9d9" />
        <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + plotH} stroke="#d9d9d9" />

        {xs.map((x, i) => {
          const xp = xToPx(x)
          const show = xs.length <= 7 || i === 0 || i === xs.length - 1 || i % 2 === 0
          if (!show) return null
          return (
            <text key={x} x={xp} y={height - 12} textAnchor="middle" fontSize="11" fill="rgba(0,0,0,0.45)">
              {x.slice(5)}
            </text>
          )
        })}

        {series.map((s) => {
          const pts = s.points
            .filter((p) => xIndex.has(p.x))
            .map((p) => ({ x: xToPx(p.x), y: yToPx(p.y) }))
          return (
            <g key={s.name}>
              <path d={toPath(pts)} fill="none" stroke={s.color} strokeWidth={2.2} />
              {pts.map((p, idx) => (
                <circle key={idx} cx={p.x} cy={p.y} r={2.6} fill={s.color} />
              ))}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export function SimpleBarChart({
  data,
  height = 220,
}: {
  data: Array<{ label: string; value: number; color?: string }>
  height?: number
}) {
  const width = 720
  const padding = { left: 44, right: 16, top: 18, bottom: 36 }
  const plotW = width - padding.left - padding.right
  const plotH = height - padding.top - padding.bottom

  const max = Math.max(1, ...data.map((d) => Number(d.value || 0)))
  const barW = data.length ? plotW / data.length : plotW
  const gap = Math.min(14, barW * 0.22)
  const innerW = Math.max(6, barW - gap)

  const yTicks = 4
  const tickVals = Array.from({ length: yTicks + 1 }, (_, i) => (max * i) / yTicks)
  const yToPx = (v: number) => padding.top + plotH * (1 - v / max)

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="bar">
      {tickVals.map((v, i) => {
        const y = yToPx(v)
        return (
          <g key={i}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#f0f0f0" />
            <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="11" fill="rgba(0,0,0,0.45)">
              {Math.round(v)}
            </text>
          </g>
        )
      })}
      <line x1={padding.left} y1={padding.top + plotH} x2={width - padding.right} y2={padding.top + plotH} stroke="#d9d9d9" />

      {data.map((d, i) => {
        const v = Number(d.value || 0)
        const h = clamp((v / max) * plotH, 0, plotH)
        const x = padding.left + i * barW + gap / 2
        const y = padding.top + plotH - h
        const color = d.color || '#1677ff'
        return (
          <g key={d.label}>
            <rect x={x} y={y} width={innerW} height={h} rx={4} fill={color} />
            <text x={x + innerW / 2} y={height - 12} textAnchor="middle" fontSize="11" fill="rgba(0,0,0,0.45)">
              {d.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export function SimpleStackBar({
  segments,
}: {
  segments: Array<{ label: string; value: number; color: string }>
}) {
  const total = segments.reduce((s, x) => s + (Number.isFinite(x.value) ? x.value : 0), 0) || 1
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', width: '100%', height: 14, borderRadius: 10, overflow: 'hidden', background: '#f5f5f5' }}>
        {segments.map((s) => (
          <div
            key={s.label}
            style={{ width: `${(s.value / total) * 100}%`, background: s.color, minWidth: s.value > 0 ? 6 : 0 }}
            title={`${s.label}: ${s.value}`}
          />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {segments.map((s) => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: s.color, display: 'inline-block' }} />
            <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.65)' }}>
              {s.label} {((s.value / total) * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

