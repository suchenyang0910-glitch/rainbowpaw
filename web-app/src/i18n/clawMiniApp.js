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

    'hint.needTelegram.title': 'Open in Telegram',
    'hint.needTelegram.desc':
      'Telegram WebApp authorization (initData) is missing. Some features may not work.',
    'hint.needTelegram.openBot': 'Open Bot',
    'hint.needTelegram.copyDebug': 'Copy debug',

    'modal.needTelegram.title': 'Open in Telegram',
    'modal.needTelegram.desc':
      'Telegram WebApp authorization (initData) is missing. Please reopen from the Bot or refresh inside Telegram.',
    'modal.pointsLow.title': 'Not enough points',
    'modal.pointsLow.desc': 'Your points are insufficient. Please recharge in Wallet.',
    'modal.pointsLow.pointsLine': 'Current points: {points}',
    'modal.serviceDown.title': 'Service unavailable',
    'modal.serviceDown.desc':
      'Wallet service is temporarily unavailable or network is unstable. Please try again later.',
    'modal.timeout.title': 'Request timeout',
    'modal.timeout.desc': 'Network is unstable or service is busy. Please retry.',

    'action.openBot': 'Open Bot',
    'action.reload': 'Reload',
    'action.copyDebug': 'Copy debug info',
    'action.recharge': 'Recharge',
    'action.cancel': 'Cancel',
    'action.retry': 'Retry',
    'action.support': 'Support',

    'toast.debugCopied': 'Debug info copied',
    'toast.orderCreated': 'Order created',

    'wallet.buyPlays.title': 'Not enough plays',
    'wallet.buyPlays.desc': 'Choose a bundle to continue',
    'wallet.buyPlays.skip': 'Not now',
    'wallet.buyPlays.bundle': '{n}x Bundle',
    'wallet.buyPlays.hot': 'Hot',

    'shipping.title': 'Shipping info',
    'shipping.desc': 'Used for shipping and rewards',
    'shipping.name': 'Full name',
    'shipping.phone': 'Phone number',
    'shipping.address': 'Address',
    'shipping.submit': 'Submit',
    'shipping.submitting': 'Submitting...',
    'shipping.need': 'Shipping info required',
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

    'hint.needTelegram.title': '建议在 Telegram 内打开',
    'hint.needTelegram.desc': '未检测到 Telegram WebApp 授权信息（initData），部分功能可能无法使用。',
    'hint.needTelegram.openBot': '打开 Bot 入口',
    'hint.needTelegram.copyDebug': '复制诊断',

    'modal.needTelegram.title': '需要在 Telegram 内打开',
    'modal.needTelegram.desc': '未检测到 Telegram WebApp 授权信息（initData）。\n请从 Bot 入口重新打开，或在 Telegram 内刷新页面。',
    'modal.pointsLow.title': '积分不足',
    'modal.pointsLow.desc': '当前积分不足以完成操作。\n建议先去钱包充值后再继续。',
    'modal.pointsLow.pointsLine': '当前积分：{points}',
    'modal.serviceDown.title': '服务暂不可用',
    'modal.serviceDown.desc': '钱包服务暂时不可用或网络不稳定。\n请稍后重试。',
    'modal.timeout.title': '请求超时',
    'modal.timeout.desc': '当前网络不稳定或服务繁忙。\n请稍后重试。',

    'action.openBot': '打开 Bot 入口',
    'action.reload': '刷新页面',
    'action.copyDebug': '复制诊断信息',
    'action.recharge': '去钱包充值',
    'action.cancel': '取消',
    'action.retry': '重试',
    'action.support': '联系客服',

    'toast.debugCopied': '已复制诊断信息',
    'toast.orderCreated': '下单成功',

    'wallet.buyPlays.title': '次数不足',
    'wallet.buyPlays.desc': '请选择购买抽奖次数',
    'wallet.buyPlays.skip': '先不买',
    'wallet.buyPlays.bundle': '{n}x 次',
    'wallet.buyPlays.hot': 'Hot',

    'shipping.title': '填写收货信息',
    'shipping.desc': '用于发货与领奖',
    'shipping.name': '联系人姓名',
    'shipping.phone': '手机号',
    'shipping.address': '详细地址',
    'shipping.submit': '提交',
    'shipping.submitting': '提交中...',
    'shipping.need': '需要填写收货信息',
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

    'hint.needTelegram.title': 'Open in Telegram',
    'hint.needTelegram.desc':
      'Telegram WebApp authorization (initData) is missing. Some features may not work.',
    'hint.needTelegram.openBot': 'Open Bot',
    'hint.needTelegram.copyDebug': 'Copy debug',

    'modal.needTelegram.title': 'Open in Telegram',
    'modal.needTelegram.desc':
      'Telegram WebApp authorization (initData) is missing. Please reopen from the Bot or refresh inside Telegram.',
    'modal.pointsLow.title': 'Not enough points',
    'modal.pointsLow.desc': 'Your points are insufficient. Please recharge in Wallet.',
    'modal.pointsLow.pointsLine': 'Current points: {points}',
    'modal.serviceDown.title': 'Service unavailable',
    'modal.serviceDown.desc':
      'Wallet service is temporarily unavailable or network is unstable. Please try again later.',
    'modal.timeout.title': 'Request timeout',
    'modal.timeout.desc': 'Network is unstable or service is busy. Please retry.',

    'action.openBot': 'Open Bot',
    'action.reload': 'Reload',
    'action.copyDebug': 'Copy debug info',
    'action.recharge': 'Recharge',
    'action.cancel': 'Cancel',
    'action.retry': 'Retry',
    'action.support': 'Support',

    'toast.debugCopied': 'Copied',
    'toast.orderCreated': 'Order created',

    'wallet.buyPlays.title': 'Not enough plays',
    'wallet.buyPlays.desc': 'Choose a bundle to continue',
    'wallet.buyPlays.skip': 'Not now',
    'wallet.buyPlays.bundle': '{n}x Bundle',
    'wallet.buyPlays.hot': 'Hot',

    'shipping.title': 'Shipping info',
    'shipping.desc': 'Used for shipping and rewards',
    'shipping.name': 'Full name',
    'shipping.phone': 'Phone number',
    'shipping.address': 'Address',
    'shipping.submit': 'Submit',
    'shipping.submitting': 'Submitting...',
    'shipping.need': 'Shipping info required',
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
