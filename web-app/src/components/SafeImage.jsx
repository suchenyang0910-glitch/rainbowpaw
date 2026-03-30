import { useMemo, useState } from 'react'

const DEFAULT_FALLBACK_SVG =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#eef2ff"/>
          <stop offset="1" stop-color="#f8fafc"/>
        </linearGradient>
      </defs>
      <rect width="800" height="450" fill="url(#g)"/>
      <rect x="24" y="24" width="752" height="402" rx="24" fill="none" stroke="#c7d2fe" stroke-width="2"/>
      <g fill="#4f46e5" opacity="0.9">
        <circle cx="320" cy="180" r="22"/>
        <circle cx="370" cy="150" r="18"/>
        <circle cx="430" cy="150" r="18"/>
        <circle cx="480" cy="180" r="22"/>
        <path d="M400 220c-54 0-98 32-98 72 0 30 26 54 58 54 16 0 30-7 40-18 10 11 24 18 40 18 32 0 58-24 58-54 0-40-44-72-98-72z"/>
      </g>
      <text x="400" y="360" text-anchor="middle" font-family="ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto" font-size="18" fill="#64748b">
        图片加载失败
      </text>
    </svg>`
  )

export default function SafeImage({ src, alt, className, fallbackSrc, ...props }) {
  const [failedSrc, setFailedSrc] = useState(null)

  const normalizedSrc = useMemo(() => {
    const s = typeof src === 'string' ? src.trim() : ''
    return s || null
  }, [src])

  const finalSrc =
    normalizedSrc && failedSrc !== normalizedSrc ? normalizedSrc : fallbackSrc || DEFAULT_FALLBACK_SVG

  return (
    <img
      {...props}
      src={finalSrc}
      alt={alt}
      className={className}
      onError={(e) => {
        if (normalizedSrc && failedSrc !== normalizedSrc) setFailedSrc(normalizedSrc)
        if (typeof props.onError === 'function') props.onError(e)
      }}
    />
  )
}
