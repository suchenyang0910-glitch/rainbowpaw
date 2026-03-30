import type { IResourceItem } from '@refinedev/core'
import {
  BarChart3,
  Brain,
  CreditCard,
  Gift,
  Link2,
  Package,
  Settings,
  ShieldAlert,
  ShoppingBag,
  Store,
  Ticket,
  Users,
} from 'lucide-react'

export const resources: IResourceItem[] = [
  {
    name: 'dashboard',
    list: '/admin/dashboard',
    meta: { label: '仪表盘', icon: <BarChart3 size={18} /> },
  },
  {
    name: 'dashboardAlerts',
    list: '/admin/dashboard/alerts',
    meta: { label: '实时警报', parent: 'dashboard' },
  },
  {
    name: 'users',
    list: '/admin/users',
    show: '/admin/users/:id',
    meta: { label: '用户中心', icon: <Users size={18} /> },
  },
  {
    name: 'userTags',
    list: '/admin/users/tags',
    meta: { label: '标签管理', parent: 'users' },
  },
  {
    name: 'wallet',
    list: '/admin/wallet',
    meta: { label: '钱包与资金', icon: <CreditCard size={18} /> },
  },
  {
    name: 'withdrawRequests',
    list: '/admin/wallet/withdraw-requests',
    meta: { label: '提现审核', parent: 'wallet' },
  },
  {
    name: 'walletLogs',
    list: '/admin/wallet/logs',
    meta: { label: '钱包流水', parent: 'wallet' },
  },
  {
    name: 'claw',
    list: '/admin/claw/pools',
    meta: { label: '抽奖系统', icon: <Gift size={18} /> },
  },
  {
    name: 'clawPools',
    list: '/admin/claw/pools',
    meta: { label: '奖池管理', parent: 'claw' },
  },
  {
    name: 'clawPlays',
    list: '/admin/claw/plays',
    meta: { label: '抽奖记录', parent: 'claw' },
  },
  {
    name: 'clawRecycles',
    list: '/admin/claw/recycles',
    meta: { label: '回收记录', parent: 'claw' },
  },

  {
    name: 'groups',
    list: '/admin/groups',
    meta: { label: '拼团与分销', icon: <Ticket size={18} /> },
  },
  {
    name: 'referrals',
    list: '/admin/referrals',
    meta: { label: '分销管理', parent: 'groups' },
  },
  {
    name: 'rewards',
    list: '/admin/rewards',
    meta: { label: '奖励发放', parent: 'groups' },
  },

  {
    name: 'orders',
    list: '/admin/orders',
    show: '/admin/orders/:id',
    meta: { label: '订单中心', icon: <ShoppingBag size={18} /> },
  },

  {
    name: 'store',
    list: '/admin/store/products',
    meta: { label: '商城与服务', icon: <Store size={18} /> },
  },
  {
    name: 'products',
    list: '/admin/store/products',
    meta: { label: '商品管理', parent: 'store' },
  },
  {
    name: 'services',
    list: '/admin/services',
    meta: { label: '服务管理', parent: 'store' },
  },
  {
    name: 'cemetery',
    list: '/admin/services/cemetery',
    meta: { label: '墓位/年费管理', parent: 'store' },
  },

  {
    name: 'merchants',
    list: '/admin/merchants',
    meta: { label: '商家管理', icon: <Package size={18} /> },
  },
  {
    name: 'merchantOrders',
    list: '/admin/merchants/orders',
    meta: { label: '商家订单', parent: 'merchants' },
  },
  {
    name: 'merchantSettlements',
    list: '/admin/merchants/settlements',
    meta: { label: '商家收益', parent: 'merchants' },
  },

  {
    name: 'ops',
    list: '/admin/ops/campaigns',
    meta: { label: '运营中心', icon: <Link2 size={18} /> },
  },
  {
    name: 'campaigns',
    list: '/admin/ops/campaigns',
    meta: { label: '活动配置', parent: 'ops' },
  },
  {
    name: 'reactivation',
    list: '/admin/ops/reactivation',
    meta: { label: '用户激活', parent: 'ops' },
  },
  {
    name: 'bridgeReports',
    list: '/admin/ops/bridge',
    meta: { label: '导流管理', parent: 'ops' },
  },

  {
    name: 'ai',
    list: '/admin/ai/ops',
    meta: { label: 'AI 中枢', icon: <Brain size={18} /> },
  },
  {
    name: 'aiOps',
    list: '/admin/ai/ops',
    meta: { label: 'AI 日报建议', parent: 'ai' },
  },
  {
    name: 'aiGrowth',
    list: '/admin/ai/growth',
    meta: { label: 'AI 文案中心', parent: 'ai' },
  },
  {
    name: 'aiRisk',
    list: '/admin/ai/risk',
    meta: { label: 'AI 风控摘要', parent: 'ai' },
  },

  {
    name: 'risk',
    list: '/admin/risk',
    meta: { label: '风控中心', icon: <ShieldAlert size={18} /> },
  },
  {
    name: 'riskBlacklist',
    list: '/admin/risk/blacklist',
    meta: { label: '冻结/黑名单', parent: 'risk' },
  },

  {
    name: 'settings',
    list: '/admin/settings/business',
    meta: { label: '系统设置', icon: <Settings size={18} /> },
  },
  {
    name: 'businessSettings',
    list: '/admin/settings/business',
    meta: { label: '业务参数', parent: 'settings' },
  },
  {
    name: 'roles',
    list: '/admin/settings/roles',
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
