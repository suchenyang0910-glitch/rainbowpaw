import type { IResourceItem } from '@refinedev/core'
import {
  BarChart3,
  Brain,
  ClipboardList,
  CreditCard,
  Gift,
  Link2,
  MonitorCog,
  Package,
  Settings,
  ShieldAlert,
  ShoppingBag,
  Store,
  Ticket,
  Users,
} from 'lucide-react'

const BASE = '/console'

export const resources: IResourceItem[] = [
  {
    name: 'dashboard',
    list: `${BASE}/dashboard`,
    meta: { label: '仪表盘', icon: <BarChart3 size={18} /> },
  },
  {
    name: 'dashboardAlerts',
    list: `${BASE}/dashboard/alerts`,
    meta: { label: '实时警报', parent: 'dashboard' },
  },
  {
    name: 'users',
    list: `${BASE}/users`,
    show: `${BASE}/users/:id`,
    meta: { label: '用户中心', icon: <Users size={18} /> },
  },
  {
    name: 'userTags',
    list: `${BASE}/users/tags`,
    meta: { label: '标签管理', parent: 'users' },
  },
  {
    name: 'wallet',
    list: `${BASE}/wallet`,
    meta: { label: '钱包与资金', icon: <CreditCard size={18} /> },
  },
  {
    name: 'withdrawRequests',
    list: `${BASE}/wallet/withdraw-requests`,
    meta: { label: '提现审核', parent: 'wallet' },
  },
  {
    name: 'walletLogs',
    list: `${BASE}/wallet/logs`,
    meta: { label: '钱包流水', parent: 'wallet' },
  },
  {
    name: 'claw',
    list: `${BASE}/claw`,
    meta: { label: '抽奖系统', icon: <Gift size={18} /> },
  },
  {
    name: 'clawPools',
    list: `${BASE}/claw/pools`,
    meta: { label: '奖池管理', parent: 'claw' },
  },
  {
    name: 'clawPlays',
    list: `${BASE}/claw/plays`,
    meta: { label: '抽奖记录', parent: 'claw' },
  },
  {
    name: 'clawRecycles',
    list: `${BASE}/claw/recycles`,
    meta: { label: '回收记录', parent: 'claw' },
  },

  {
    name: 'groups',
    list: `${BASE}/groups`,
    meta: { label: '拼团与分销', icon: <Ticket size={18} /> },
  },
  {
    name: 'referrals',
    list: `${BASE}/referrals`,
    meta: { label: '分销管理', parent: 'groups' },
  },
  {
    name: 'rewards',
    list: `${BASE}/rewards`,
    meta: { label: '奖励发放', parent: 'groups' },
  },

  {
    name: 'orders',
    list: `${BASE}/orders`,
    show: `${BASE}/orders/:id`,
    meta: { label: '订单中心', icon: <ShoppingBag size={18} /> },
  },

  {
    name: 'console',
    list: `${BASE}/console`,
    meta: { label: '业务控制台', icon: <MonitorCog size={18} /> },
  },
  {
    name: 'consoleOrder',
    list: `${BASE}/order`,
    meta: { label: '订单（统一）', parent: 'console' },
  },
  {
    name: 'consoleReport',
    list: `${BASE}/report`,
    meta: { label: '经营报表', parent: 'console' },
  },

  {
    name: 'store',
    list: `${BASE}/store`,
    meta: { label: '商城与服务', icon: <Store size={18} /> },
  },
  {
    name: 'products',
    list: `${BASE}/store/products`,
    meta: { label: '商品管理', parent: 'store' },
  },
  {
    name: 'services',
    list: `${BASE}/services`,
    meta: { label: '服务管理', parent: 'store' },
  },
  {
    name: 'cemetery',
    list: `${BASE}/services/cemetery`,
    meta: { label: '墓位/年费管理', parent: 'store' },
  },

  {
    name: 'merchants',
    list: `${BASE}/merchants`,
    meta: { label: '商家管理', icon: <Package size={18} /> },
  },
  {
    name: 'merchantOrders',
    list: `${BASE}/merchants/orders`,
    meta: { label: '商家订单', parent: 'merchants' },
  },
  {
    name: 'merchantSettlements',
    list: `${BASE}/merchants/settlements`,
    meta: { label: '商家收益', parent: 'merchants' },
  },

  {
    name: 'ops',
    list: `${BASE}/ops`,
    meta: { label: '运营中心', icon: <Link2 size={18} /> },
  },
  {
    name: 'campaigns',
    list: `${BASE}/ops/campaigns`,
    meta: { label: '活动配置', parent: 'ops' },
  },
  {
    name: 'reactivation',
    list: `${BASE}/ops/reactivation`,
    meta: { label: '用户激活', parent: 'ops' },
  },
  {
    name: 'bridgeReports',
    list: `${BASE}/ops/bridge`,
    meta: { label: '导流管理', parent: 'ops' },
  },

  {
    name: 'crm',
    list: `${BASE}/crm`,
    meta: { label: 'CRM与报价', icon: <ClipboardList size={18} /> },
  },
  {
    name: 'crmLeads',
    list: `${BASE}/crm/leads`,
    meta: { label: '线索列表', parent: 'crm' },
  },
  {
    name: 'crmFollowups',
    list: `${BASE}/crm/followups`,
    meta: { label: '待跟进任务', parent: 'crm' },
  },
  {
    name: 'aftercareQuotes',
    list: `${BASE}/crm/aftercare-quotes`,
    meta: { label: '善终报价单', parent: 'crm' },
  },
  {
    name: 'aftercarePricebooks',
    list: `${BASE}/crm/aftercare-pricebooks`,
    meta: { label: '价目表（Pricebook）', parent: 'crm' },
  },

  {
    name: 'ai',
    list: `${BASE}/ai`,
    meta: { label: 'AI 中枢', icon: <Brain size={18} /> },
  },
  {
    name: 'aiOps',
    list: `${BASE}/ai/ops`,
    meta: { label: 'AI 日报建议', parent: 'ai' },
  },
  {
    name: 'aiGrowth',
    list: `${BASE}/ai/growth`,
    meta: { label: 'AI 文案中心', parent: 'ai' },
  },
  {
    name: 'aiTemplates',
    list: `${BASE}/ai/templates`,
    meta: { label: 'AI 文案模板', parent: 'ai' },
  },
  {
    name: 'aiRisk',
    list: `${BASE}/ai/risk`,
    meta: { label: 'AI 风控摘要', parent: 'ai' },
  },

  {
    name: 'risk',
    list: `${BASE}/risk`,
    meta: { label: '风控中心', icon: <ShieldAlert size={18} /> },
  },
  {
    name: 'riskBlacklist',
    list: `${BASE}/risk/blacklist`,
    meta: { label: '冻结/黑名单', parent: 'risk' },
  },

  {
    name: 'settings',
    list: `${BASE}/settings`,
    meta: { label: '系统设置', icon: <Settings size={18} /> },
  },
  {
    name: 'businessSettings',
    list: `${BASE}/settings/business`,
    meta: { label: '业务参数', parent: 'settings' },
  },
  {
    name: 'roles',
    list: `${BASE}/settings/roles`,
    meta: { label: '角色与权限', parent: 'settings' },
  },
]

const enablePlaceholders = String((import.meta as any)?.env?.VITE_ENABLE_ADMIN_PLACEHOLDERS || '').trim() === 'true'

const PLACEHOLDER_NAMES = new Set([
  'dashboardAlerts',
  'userTags',
  'clawRecycles',
  'groups',
  'referrals',
  'rewards',
  'cemetery',
  'merchantOrders',
  'merchantSettlements',
  'campaigns',
  'reactivation',
  'riskBlacklist',
])

export const resourcesResolved: IResourceItem[] = enablePlaceholders
  ? resources
  : resources
      .filter((r) => !PLACEHOLDER_NAMES.has(String(r.name)))
      .map((r) => (r.name === 'orders' ? { ...r, show: undefined } : r))
