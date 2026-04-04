export type AdminRole = 'super_admin' | 'ops_manager' | 'finance_manager' | 'merchant' | 'customer_service'

export type PermissionCode = string

export type AdminSession = {
  role: AdminRole
  displayName: string
  permissions: PermissionCode[]
}

const STORAGE_KEY = 'rp_admin_session_v1'

const PERMISSIONS_KEY = 'rp_admin_role_permissions_v1'

const defaultRolePermissions: Record<AdminRole, PermissionCode[]> = {
  super_admin: ['*'],
  ops_manager: [
    'menu.dashboard',
    'menu.users',
    'menu.claw',
    'menu.groups',
    'menu.orders',
    'menu.merchants',
    'menu.store',
    'menu.ops',
    'menu.console',
    'menu.ai',
    'menu.crm',
    'menu.settings',

    'page.dashboard.list',
    'page.users.list',
    'page.users.show',
    'page.userTags.list',
    'page.orders.list',
    'page.orders.show',
    'page.consoleOrder.list',
    'page.consoleReport.list',
    'page.products.list',
    'page.products.edit',
    'page.services.list',
    'page.merchants.list',
    'page.bridgeReports.list',
    'page.businessSettings.edit',

    'page.dashboardAlerts.list',
    'page.groups.list',
    'page.referrals.list',
    'page.rewards.list',
    'page.campaigns.list',
    'page.reactivation.list',
    'page.aiOps.list',
    'page.aiGrowth.list',
    'page.aiRisk.list',
    'page.aiTemplates.list',
    'page.roles.list',

    'page.crmLeads.list',
    'page.crmFollowups.list',
    'page.aftercareQuotes.list',
    'page.aftercarePricebooks.list',

    'page.clawPools.list',
    'page.clawPlays.list',
    'page.clawRecycles.list',

    'page.clawPools.create',
    'page.clawPools.edit',

    'button.bridge.retry',
    'button.clawPools.publish',
    'button.clawPools.delete',

    'button.products.publish',
    'button.products.unpublish',

    'button.merchants.approve',
    'button.merchants.reject',
    'button.merchants.suspend',

    'button.aiModels.updateKey',
    'button.aiModels.testConnection',
    'button.aiModels.publishToOpenClaw',
    'button.aiOps.generate',
    'button.aiOps.publish',
    'button.aiOps.runSmoke',
    'button.aiOps.viewLogs',
    'button.aiRisk.summarize',
    'button.aiGrowth.generate',
    'button.crm.followups.send',
    'button.crm.followups.update',
    'button.crm.leads.edit',
    'button.crm.quotes.create',
    'button.crm.quotes.send',
  ],
  finance_manager: [
    'menu.dashboard',
    'menu.wallet',
    'menu.orders',
    'menu.console',
    'menu.risk',
    'menu.ai',
    'menu.crm',

    'page.dashboard.list',
    'page.wallet.list',
    'page.walletLogs.list',
    'page.withdrawRequests.list',
    'page.orders.list',
    'page.orders.show',
    'page.consoleOrder.list',
    'page.consoleReport.list',
    'page.risk.list',
    'page.riskBlacklist.list',
    'page.aiRisk.list',
    'page.aiTemplates.list',

    'page.crmLeads.list',
    'page.crmFollowups.list',
    'page.aftercareQuotes.list',
    'page.aftercarePricebooks.list',

    'button.wallet.adjust',
    'button.wallet.freeze',
    'button.wallet.unfreeze',
    'button.withdrawRequests.approve',
    'button.withdrawRequests.reject',
    'button.risk.freeze',
    'button.risk.unfreeze',
    'button.aiRisk.summarize',
    'button.crm.followups.send',
    'button.crm.followups.update',
    'button.crm.leads.edit',
    'button.crm.quotes.create',
    'button.crm.quotes.send',
  ],
  merchant: [
    'menu.orders',
    'menu.store',
    'menu.merchants',

    'page.orders.list',
    'page.orders.show',
    'page.products.list',
    'page.products.edit',
    'page.services.list',
    'page.merchants.list',
    'page.merchantOrders.list',
    'page.merchantSettlements.list',
  ],
  customer_service: [
    'menu.dashboard',
    'menu.users',
    'menu.orders',
    'menu.console',
    'menu.claw',
    'menu.crm',

    'page.dashboard.list',
    'page.dashboardAlerts.list',
    'page.users.list',
    'page.users.show',
    'page.orders.list',
    'page.orders.show',
    'page.consoleOrder.list',
    'page.consoleReport.list',
    'page.clawPlays.list',

    'page.crmLeads.list',
    'page.crmFollowups.list',
    'page.aftercareQuotes.list',
    'page.aftercarePricebooks.list',
  ],
}

type RolePermissionsOverride = Partial<Record<AdminRole, PermissionCode[]>>

export function loadRolePermissionsOverride(): RolePermissionsOverride {
  try {
    const raw = localStorage.getItem(PERMISSIONS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed as RolePermissionsOverride
  } catch {
    return {}
  }
}

export function saveRolePermissionsOverride(value: RolePermissionsOverride) {
  localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(value))
}

export function getRolePermissions(role: AdminRole): PermissionCode[] {
  const override = loadRolePermissionsOverride()
  const list = override[role]
  if (Array.isArray(list)) return list
  return defaultRolePermissions[role] || []
}

export function getDefaultRolePermissions(role: AdminRole): PermissionCode[] {
  return defaultRolePermissions[role] || []
}

export function hasPermission(session: AdminSession | null, code: PermissionCode) {
  if (!session) return false
  if (session.permissions.includes('*')) return true
  return session.permissions.includes(code)
}

export function buildSession(role: AdminRole): AdminSession {
  return {
    role,
    displayName: role,
    permissions: getRolePermissions(role),
  }
}

export function loadSession(): AdminSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    if (typeof parsed.role !== 'string' || !Array.isArray(parsed.permissions)) return null
    return parsed as AdminSession
  } catch {
    return null
  }
}

export function saveSession(session: AdminSession) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY)
}
