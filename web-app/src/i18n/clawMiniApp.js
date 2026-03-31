export const CLAW_MINIAPP_LANGS = [
  { id: 'ZH', label: '中文', locale: 'zh-CN' },
  { id: 'EN', label: 'English', locale: 'en' },
  { id: 'KM', label: 'ខ្មែរ', locale: 'km' },
]

export function clawMiniAppGetLangLabel(id) {
  const langId = String(id || '').toUpperCase()
  const hit = CLAW_MINIAPP_LANGS.find((x) => x.id === langId)
  if (hit) return hit.label
  return langId || 'EN'
}

export function clawMiniAppLangToLocale(id) {
  const langId = String(id || '').toUpperCase()
  const hit = CLAW_MINIAPP_LANGS.find((x) => x.id === langId)
  return hit ? hit.locale : 'en'
}

export function clawMiniAppLocaleToLang(locale) {
  const raw = String(locale || '').trim().toLowerCase()
  if (!raw) return 'EN'
  if (raw === 'zh' || raw === 'zh-cn') return 'ZH'
  if (raw === 'en' || raw === 'en-us') return 'EN'
  if (raw === 'km' || raw === 'km-kh') return 'KM'
  return 'EN'
}

const DICT = {
  EN: {
    'tabs.home': 'Home',
    'tabs.store': 'Store',
    'tabs.earn': 'Earn',
    'tabs.wallet': 'Wallet',
    'tabs.profile': 'Profile',
    'common.copied': 'Copied',
    'order.copyId': 'Copy order ID',
    'profile.shippingTitle': 'Default shipping address',
    'profile.notSet': 'Not set',
    'profile.edit': 'Edit',
    'profile.ordersTitle': 'Orders',
    'profile.orderTabs.pending': 'Pending',
    'profile.orderTabs.toShip': 'To Ship',
    'profile.orderTabs.shipped': 'Shipped',
    'profile.noActiveOrders': 'No active orders',
    'profile.proofSubmitted': 'Proof submitted',
    'profile.proofMissing': 'No proof',
    'profile.continuePay': 'Continue',
    'profile.support': 'Support',
    'lang.title': 'Language',
  },
  ZH: {
    'tabs.home': '首页',
    'tabs.store': '商城',
    'tabs.earn': '赚钱',
    'tabs.wallet': '钱包',
    'tabs.profile': '我的',
    'common.copied': '已复制',
    'order.copyId': '复制订单号',
    'profile.shippingTitle': '默认收货地址',
    'profile.notSet': '未设置',
    'profile.edit': '修改',
    'profile.ordersTitle': '订单追踪',
    'profile.orderTabs.pending': '待支付',
    'profile.orderTabs.toShip': '待发货',
    'profile.orderTabs.shipped': '已发货',
    'profile.noActiveOrders': '暂无订单',
    'profile.proofSubmitted': '已提交凭证',
    'profile.proofMissing': '未提交凭证',
    'profile.continuePay': '继续支付',
    'profile.support': '联系客服',
    'lang.title': '语言',
  },
  KM: {
    'tabs.home': 'ទំព័រដើម',
    'tabs.store': 'ហាង',
    'tabs.earn': 'រកប្រាក់',
    'tabs.wallet': 'កាបូប',
    'tabs.profile': 'ខ្ញុំ',
    'common.copied': 'បានចម្លង',
    'order.copyId': 'ចម្លងលេខបញ្ជាទិញ',
    'profile.shippingTitle': 'អាសយដ្ឋានដឹកជញ្ជូនលំនាំដើម',
    'profile.notSet': 'មិនទាន់កំណត់',
    'profile.edit': 'កែប្រែ',
    'profile.ordersTitle': 'ការតាមដានបញ្ជាទិញ',
    'profile.orderTabs.pending': 'កំពុងរង់ចាំបង់',
    'profile.orderTabs.toShip': 'រង់ចាំដឹក',
    'profile.orderTabs.shipped': 'បានដឹក',
    'profile.noActiveOrders': 'មិនមានបញ្ជាទិញ',
    'profile.proofSubmitted': 'បានដាក់ស្នើភស្តុតាង',
    'profile.proofMissing': 'មិនទាន់ដាក់ស្នើភស្តុតាង',
    'profile.continuePay': 'បន្តបង់ប្រាក់',
    'profile.support': 'ជំនួយ',
    'lang.title': 'ភាសា',
  },
}

export function clawMiniAppT(langId, key, vars) {
  const lang = String(langId || '').toUpperCase()
  const dict = DICT[lang] || DICT.EN
  const raw = dict && Object.prototype.hasOwnProperty.call(dict, key) ? dict[key] : ''
  const str = raw ? String(raw) : ''
  if (!vars || typeof vars !== 'object') return str
  return str.replace(/\{(\w+)\}/g, (_m, k) => {
    const v = vars[k]
    return v == null ? '' : String(v)
  })
}

