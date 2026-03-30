import type { DataProvider } from '@refinedev/core'
import axios, { type AxiosInstance } from 'axios'

type ApiEnvelope<T> = {
  code?: number
  message?: string
  data?: T
}

function unwrap<T>(value: any): T {
  if (!value) return value as T
  if (typeof value === 'object' && typeof value.code === 'number' && 'data' in value) {
    const env = value as ApiEnvelope<T>
    if (env.code !== 0) throw new Error(env.message || '请求失败')
    return env.data as T
  }
  if (typeof value === 'object' && 'data' in value) return (value as any).data as T
  return value as T
}

function createApi(): AxiosInstance {
  const raw = (import.meta as any)?.env?.VITE_API_BASE_URL || ''
  const base = String(raw).replace(/\/+$/, '')
  const baseURL = (() => {
    if (!base) return '/api/admin'
    if (/\/api\/admin(\/|$)/.test(base)) return base
    if (/\/api(\/|$)/.test(base)) return `${base}/admin`
    return `${base}/api/admin`
  })()

  return axios.create({
    baseURL,
    headers: { 'content-type': 'application/json' },
    timeout: 15000,
  })
}

const api = createApi()

export const dataProvider: DataProvider = {
  getList: async ({ resource, pagination, filters, sorters }) => {
    const current = pagination?.currentPage ?? 1
    const pageSize = pagination?.pageSize ?? 20

    const res = await api.get(`/${resource}`, {
      params: {
        current,
        pageSize,
        filters,
        sorters,
      },
    })

    const payload = unwrap<any>(res.data)
    const items = Array.isArray(payload?.items) ? payload.items : []
    const total = Number.isFinite(Number(payload?.total)) ? Number(payload.total) : items.length
    return { data: items, total }
  },

  getOne: async ({ resource, id }) => {
    const res = await api.get(`/${resource}/${encodeURIComponent(String(id))}`)
    const payload = unwrap<any>(res.data)
    return { data: payload }
  },

  create: async ({ resource, variables }) => {
    const res = await api.post(`/${resource}`, variables)
    const payload = unwrap<any>(res.data)
    return { data: payload }
  },

  update: async ({ resource, id, variables }) => {
    const res = await api.put(`/${resource}/${encodeURIComponent(String(id))}`, variables)
    const payload = unwrap<any>(res.data)
    return { data: payload }
  },

  deleteOne: async ({ resource, id }) => {
    const res = await api.delete(`/${resource}/${encodeURIComponent(String(id))}`)
    const payload = unwrap<any>(res.data)
    return { data: payload }
  },

  custom: async ({ url, method, payload, query }) => {
    const res = await api.request({
      url,
      method,
      data: payload,
      params: query,
    })
    return { data: unwrap<any>(res.data) }
  },

  getApiUrl: () => '/api/admin',
}
