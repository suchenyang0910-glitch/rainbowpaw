import type { AccessControlProvider, CanParams, CanReturnType } from '@refinedev/core'
import { hasPermission, loadSession } from './adminSession'

function buildPermissionCode(params: CanParams): string {
  const resource = String(params.resource || '').trim()
  const action = String(params.action || '').trim()
  const explicit = params.params && typeof (params.params as any).permission === 'string' ? String((params.params as any).permission) : ''
  if (explicit) return explicit

  if (action === 'menu') return `menu.${resource}`

  if (action === 'list' || action === 'show' || action === 'create' || action === 'edit') {
    return `page.${resource}.${action}`
  }

  return `button.${resource}.${action || 'use'}`
}

export const accessControlProvider: AccessControlProvider = {
  can: async (params: CanParams): Promise<CanReturnType> => {
    const session = loadSession()
    const code = buildPermissionCode(params)
    return { can: hasPermission(session, code) }
  },
}

