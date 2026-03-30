import type { AuthProvider } from '@refinedev/core'
import { buildSession, clearSession, loadSession, saveSession, type AdminRole } from './adminSession'

type LoginParams = {
  role: AdminRole
}

export const authProvider: AuthProvider = {
  login: async (params?: LoginParams) => {
    const role = (params?.role || 'super_admin') as AdminRole
    const session = buildSession(role)
    saveSession(session)
    return { success: true, redirectTo: '/admin/dashboard' }
  },
  logout: async () => {
    clearSession()
    return { success: true, redirectTo: '/admin/login' }
  },
  check: async () => {
    const session = loadSession()
    if (!session) return { authenticated: false, redirectTo: '/admin/login' }
    return { authenticated: true }
  },
  getPermissions: async () => {
    const session = loadSession()
    return session ? [session.role] : []
  },
  getIdentity: async () => {
    const session = loadSession()
    if (!session) return null
    return { id: session.role, name: session.displayName }
  },
  onError: async () => ({ error: undefined }),
}

