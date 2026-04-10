import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../api/client'
import SafeImage from '../components/SafeImage.jsx'

function prettyJson(value) {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return ''
  }
}

export default function AdminPortalPage() {
  const [adminToken, setAdminToken] = useState('')
  const [adminRole, setAdminRole] = useState('')
  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  const [dashboard, setDashboard] = useState(null)
  const [dashboardLoading, setDashboardLoading] = useState(false)

  const [orders, setOrders] = useState([])
  const [orderStatus, setOrderStatus] = useState('')
  const [orderQuery, setOrderQuery] = useState('')
  const [orderStatusPatch, setOrderStatusPatch] = useState('confirmed')
  const [selectedOrderId, setSelectedOrderId] = useState('')
  const [orderDetail, setOrderDetail] = useState(null)
  const [orderDetailLoading, setOrderDetailLoading] = useState(false)
  const [opNewTotalUsd, setOpNewTotalUsd] = useState('')
  const [opOfflineAmountUsd, setOpOfflineAmountUsd] = useState('')
  const [opOfflineMethod, setOpOfflineMethod] = useState('cash')
  const [opOfflineNote, setOpOfflineNote] = useState('')
  const [opRefundAmountUsd, setOpRefundAmountUsd] = useState('')
  const [opRefundReason, setOpRefundReason] = useState('')
  const [opNote, setOpNote] = useState('')
  const [opProofUrl, setOpProofUrl] = useState('')
  const [opProofFile, setOpProofFile] = useState(null)
  const [opAssignMerchantId, setOpAssignMerchantId] = useState('')

  const [merchants, setMerchants] = useState([])
  const [merchantStatus, setMerchantStatus] = useState('pending')

  const [reviewProducts, setReviewProducts] = useState([])
  const [reviewStatus, setReviewStatus] = useState('pending')
  const [reviewReason, setReviewReason] = useState('')

  const [payments, setPayments] = useState([])
  const [paymentStatus, setPaymentStatus] = useState('')
  const [paymentQuery, setPaymentQuery] = useState('')

  const [dispatchOrderId, setDispatchOrderId] = useState('')
  const [dispatchMerchantId, setDispatchMerchantId] = useState('')

  const [settlementMerchantId, setSettlementMerchantId] = useState('')
  const [settlement, setSettlement] = useState(null)
  const [settlementRequests, setSettlementRequests] = useState([])
  const [settlementReqStatus, setSettlementReqStatus] = useState('pending')
  const [settlementReqMerchantId, setSettlementReqMerchantId] = useState('')
  const [settlementReqNextStatus, setSettlementReqNextStatus] = useState('approved')

  const [users, setUsers] = useState([])
  const [userQuery, setUserQuery] = useState('')
  const [userDraft, setUserDraft] = useState(null)

  const [pets, setPets] = useState([])
  const [petPhone, setPetPhone] = useState('')

  const [aftercareOrders, setAftercareOrders] = useState([])
  const [aftercareStatus, setAftercareStatus] = useState('')

  const [categoriesText, setCategoriesText] = useState('')
  const [cemeteryText, setCemeteryText] = useState('')
  const [aliasQuery, setAliasQuery] = useState('')
  const [phoneAliases, setPhoneAliases] = useState([])
  const [cemeteryZones, setCemeteryZones] = useState([])
  const [cemeterySlots, setCemeterySlots] = useState([])
  const [selectedZoneId, setSelectedZoneId] = useState('')
  const [rentDraft, setRentDraft] = useState({ slot_id: '', global_user_id: '', lease_months: 12 })

  const loadCemeteryZones = async () => {
    if (!guard()) return
    setError('')
    setOk('')
    setLoading(true)
    try {
      const data = await apiFetch('/api/v1/cemetery/zones', { headers: authHeaders })
      setCemeteryZones(Array.isArray(data?.items) ? data.items : [])
      setOk('墓区列表已加载')
    } catch (e) {
      setError(e?.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  const loadCemeterySlots = async (zoneId) => {
    if (!guard() || !zoneId) return
    setError('')
    setOk('')
    setLoading(true)
    try {
      const data = await apiFetch(`/api/v1/cemetery/zones/${encodeURIComponent(zoneId)}/slots`, { headers: authHeaders })
      setCemeterySlots(Array.isArray(data?.slots) ? data.slots : [])
      setOk(`已加载 ${data?.zone?.name || '墓区'} 格位数据`)
    } catch (e) {
      setError(e?.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  const rentCemeterySlot = async () => {
    if (!guard()) return
    if (!rentDraft.slot_id || !rentDraft.global_user_id || !rentDraft.lease_months) {
      setError('请填写完整的租用信息')
      return
    }
    setError('')
    setOk('')
    setLoading(true)
    try {
      await apiFetch(`/api/v1/cemetery/slots/${encodeURIComponent(rentDraft.slot_id)}/rent`, {
        method: 'POST',
        headers: authHeaders,
        body: {
          global_user_id: rentDraft.global_user_id,
          lease_months: Number(rentDraft.lease_months),
        }
      })
      setOk(`成功租用格位：${rentDraft.slot_id}`)
      setRentDraft({ slot_id: '', global_user_id: '', lease_months: 12 })
      if (selectedZoneId) {
        await loadCemeterySlots(selectedZoneId)
      }
    } catch (e) {
      setError(e?.message || '租用失败')
    } finally {
      setLoading(false)
    }
  }

  const authHeaders = useMemo(() => {
    const token = adminToken.trim()
    if (!token) return null
    return { authorization: `Bearer ${token}` }
  }, [adminToken])

  useEffect(() => {
    try {
      const cached = localStorage.getItem('rp_admin_bearer') || ''
      if (cached) setAdminToken(cached)
    } catch (e) {
      void e
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('rp_admin_bearer', adminToken)
    } catch (e) {
      void e
    }
  }, [adminToken])

  const guard = useCallback(() => {
    if (!authHeaders) {
      setError('请先填写 Admin Token')
      return false
    }
    return true
  }, [authHeaders])

  const ping = async () => {
    if (!guard()) return
    setError('')
    setOk('')
    setLoading(true)
    try {
      const data = await apiFetch('/api/v1/admin/ping', { headers: authHeaders })
      setAdminRole(String(data?.role || ''))
      setOk(`Token 校验通过${data?.role ? `（${String(data.role)}）` : ''}`)
    } catch (e) {
      setError(e?.message || 'Token 无效或后端不可用')
    } finally {
      setLoading(false)
    }
  }

  const loadDashboard = useCallback(async () => {
    if (!guard()) return
    setError('')
    setOk('')
    setDashboardLoading(true)
    try {
      const data = await apiFetch('/api/v1/admin/dashboard', { headers: authHeaders })
      setDashboard(data || null)
    } catch (e) {
      setError(e?.message || '加载仪表盘失败')
    } finally {
      setDashboardLoading(false)
    }
  }, [authHeaders, guard])

  useEffect(() => {
    if (activeTab !== 'dashboard') return
    if (!authHeaders) return
    loadDashboard()
  }, [activeTab, authHeaders, loadDashboard])

  const loadOrders = async () => {
    if (!guard()) return
    setError('')
    setOk('')
    setLoading(true)
    try {
      const qs = new URLSearchParams()
      if (orderStatus) qs.set('status', orderStatus)
      if (orderQuery) qs.set('q', orderQuery)
      qs.set('limit', '100')
      const data = await apiFetch(`/api/v1/admin/orders?${qs.toString()}`, { headers: authHeaders })
      setOrders(Array.isArray(data?.items) ? data.items : [])
      setOk('订单列表已加载')
    } catch (e) {
      setError(e?.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  const patchOrderStatus = async (orderId, nextStatus) => {
    if (!guard()) return
    setError('')
    setOk('')
    setLoading(true)
    try {
      await apiFetch(`/api/v1/orders/${encodeURIComponent(orderId)}`, {
        method: 'PATCH',
        headers: authHeaders,
        body: { status: nextStatus },
      })
      setOk(`订单状态已更新：${orderId}`)
      await loadOrders()
    } catch (e) {
      setError(e?.message || '更新失败')
    } finally {
      setLoading(false)
    }
  }

  const loadOrderDetail = async (orderId) => {
    if (!orderId) return
    setError('')
    setOk('')
    setOrderDetailLoading(true)
    try {
      const data = await apiFetch(`/api/v1/orders/${encodeURIComponent(orderId)}`, { headers: authHeaders || undefined })
      setOrderDetail(data)
    } catch (e) {
      setOrderDetail(null)
      setError(e?.message || '加载订单详情失败')
    } finally {
      setOrderDetailLoading(false)
    }
  }

  const opAdjustPrice = async () => {
    if (!guard()) return
    const orderId = selectedOrderId.trim()
    const usd = Number(opNewTotalUsd || 0)
    if (!orderId || !Number.isFinite(usd) || usd < 0) {
      setError('请填写正确的订单号与金额')
      return
    }
    setError('')
    setOk('')
    setLoading(true)
    try {
      await apiFetch(`/api/v1/admin/orders/${encodeURIComponent(orderId)}/adjust-price`, {
        method: 'POST',
        headers: authHeaders,
        body: { total_amount_cents: Math.round(usd * 100), note: 'admin_adjust' },
      })
      setOk('已改价')
      await loadOrders()
      await loadOrderDetail(orderId)
    } catch (e) {
      setError(e?.message || '改价失败')
    } finally {
      setLoading(false)
    }
  }

  const opOfflinePay = async () => {
    if (!guard()) return
    const orderId = selectedOrderId.trim()
    const usd = Number(opOfflineAmountUsd || 0)
    if (!orderId || !Number.isFinite(usd) || usd <= 0) {
      setError('请填写正确的订单号与线下收款金额')
      return
    }
    setError('')
    setOk('')
    setLoading(true)
    try {
      await apiFetch(`/api/v1/admin/orders/${encodeURIComponent(orderId)}/offline-payment`, {
        method: 'POST',
        headers: authHeaders,
        body: {
          amount_cents: Math.round(usd * 100),
          currency: 'USD',
          method: opOfflineMethod,
          note: opOfflineNote || null,
          proof_url: opProofUrl || null,
        },
      })
      setOk('已补录线下收款')
      setOpOfflineAmountUsd('')
      setOpOfflineNote('')
      await loadOrders()
      await loadOrderDetail(orderId)
    } catch (e) {
      setError(e?.message || '补录失败')
    } finally {
      setLoading(false)
    }
  }

  const opRefund = async () => {
    if (!guard()) return
    const orderId = selectedOrderId.trim()
    const usd = Number(opRefundAmountUsd || 0)
    if (!orderId || !Number.isFinite(usd) || usd <= 0) {
      setError('请填写正确的订单号与退款金额')
      return
    }
    setError('')
    setOk('')
    setLoading(true)
    try {
      await apiFetch(`/api/v1/admin/orders/${encodeURIComponent(orderId)}/refund`, {
        method: 'POST',
        headers: authHeaders,
        body: { amount_cents: Math.round(usd * 100), currency: 'USD', reason: opRefundReason || null, proof_url: opProofUrl || null },
      })
      setOk('已记录退款')
      setOpRefundAmountUsd('')
      setOpRefundReason('')
      await loadOrderDetail(orderId)
    } catch (e) {
      setError(e?.message || '退款失败')
    } finally {
      setLoading(false)
    }
  }

  const opSaveNote = async () => {
    if (!guard()) return
    const orderId = selectedOrderId.trim()
    const note = opNote.trim()
    if (!orderId || !note) {
      setError('请填写备注')
      return
    }
    setError('')
    setOk('')
    setLoading(true)
    try {
      await apiFetch(`/api/v1/admin/orders/${encodeURIComponent(orderId)}/note`, { method: 'POST', headers: authHeaders, body: { note } })
      setOk('备注已保存')
      setOpNote('')
      await loadOrderDetail(orderId)
    } catch (e) {
      setError(e?.message || '保存失败')
    } finally {
      setLoading(false)
    }
  }

  const opAddProof = async () => {
    if (!guard()) return
    const orderId = selectedOrderId.trim()
    const url = opProofUrl.trim()
    if (!orderId || !url) {
      setError('请填写凭证链接')
      return
    }
    setError('')
    setOk('')
    setLoading(true)
    try {
      await apiFetch(`/api/v1/admin/orders/${encodeURIComponent(orderId)}/proof`, { method: 'POST', headers: authHeaders, body: { url } })
      setOk('凭证已添加')
      setOpProofUrl('')
      await loadOrderDetail(orderId)
    } catch (e) {
      setError(e?.message || '添加失败')
    } finally {
      setLoading(false)
    }
  }

  const opUploadProofFile = async () => {
    if (!guard()) return
    const orderId = selectedOrderId.trim()
    const file = opProofFile
    if (!orderId || !file) {
      setError('请先选择文件')
      return
    }
    setError('')
    setOk('')
    setLoading(true)
    try {
      const apiBase = (import.meta?.env?.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '')
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`${apiBase}/api/v1/admin/orders/${encodeURIComponent(orderId)}/proof-upload`, {
        method: 'POST',
        headers: authHeaders,
        body: fd,
      })
      const text = await res.text()
      let json
      try {
        json = text ? JSON.parse(text) : null
      } catch {
        json = null
      }
      if (!res.ok) {
        const msg = json?.error?.message || `HTTP ${res.status}`
        throw new Error(msg)
      }
      if (json && json.success === false) {
        throw new Error(json.error?.message || '上传失败')
      }
      setOk('凭证已上传')
      setOpProofFile(null)
      await loadOrderDetail(orderId)
    } catch (e) {
      setError(e?.message || '上传失败')
    } finally {
      setLoading(false)
    }
  }

  const opAssign = async () => {
    if (!guard()) return
    const orderId = selectedOrderId.trim()
    const merchantId = opAssignMerchantId.trim()
    if (!orderId || !merchantId) {
      setError('请填写 merchant_id')
      return
    }
    setError('')
    setOk('')
    setLoading(true)
    try {
      await apiFetch('/api/v1/admin/dispatch/assign', { method: 'POST', headers: authHeaders, body: { order_id: orderId, merchant_id: merchantId } })
      setOk('已改派/指派')
      setOpAssignMerchantId('')
      await loadOrders()
      await loadOrderDetail(orderId)
    } catch (e) {
      setError(e?.message || '改派失败')
    } finally {
      setLoading(false)
    }
  }

  const loadMerchants = async () => {
    if (!guard()) return
    setError('')
    setOk('')
    setLoading(true)
    try {
      const qs = merchantStatus ? `?status=${encodeURIComponent(merchantStatus)}` : ''
      const data = await apiFetch(`/api/v1/admin/merchants${qs}`, { headers: authHeaders })
      setMerchants(Array.isArray(data?.items) ? data.items : [])
      setOk('商家列表已加载')
    } catch (e) {
      setError(e?.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  const approveMerchant = async (merchantId) => {
    if (!guard()) return
    setError('')
    setOk('')
    setLoading(true)
    try {
      await apiFetch(`/api/v1/admin/merchants/${encodeURIComponent(merchantId)}/approve`, { method: 'POST', headers: authHeaders })
      setOk(`已通过商家：${merchantId}`)
      await loadMerchants()
    } catch (e) {
      setError(e?.message || '操作失败')
    } finally {
      setLoading(false)
    }
  }

  const rejectMerchant = async (merchantId) => {
    if (!guard()) return
    setError('')
    setOk('')
    setLoading(true)
    try {
      await apiFetch(`/api/v1/admin/merchants/${encodeURIComponent(merchantId)}/reject`, { method: 'POST', headers: authHeaders })
      setOk(`已驳回商家：${merchantId}`)
      await loadMerchants()
    } catch (e) {
      setError(e?.message || '操作失败')
    } finally {
      setLoading(false)
    }
  }

  const loadReviewProducts = async () => {
    if (!guard()) return
    setError('')
    setOk('')
    setLoading(true)
    try {
      const qs = reviewStatus ? `?status=${encodeURIComponent(reviewStatus)}` : ''
      const data = await apiFetch(`/api/v1/admin/products/review${qs}`, { headers: authHeaders })
      setReviewProducts(Array.isArray(data?.items) ? data.items : [])
      setOk('商品审核列表已加载')
    } catch (e) {
      setError(e?.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  const reviewProduct = async (productId, decision) => {
    if (!guard()) return
    setError('')
    setOk('')
    setLoading(true)
    try {
      await apiFetch(`/api/v1/admin/products/${encodeURIComponent(productId)}/review`, {
        method: 'POST',
        headers: authHeaders,
        body: { decision, reason: reviewReason || null },
      })
      setOk(`已${decision === 'approved' ? '通过' : '驳回'}商品：${productId}`)
      setReviewReason('')
      await loadReviewProducts()
    } catch (e) {
      setError(e?.message || '操作失败')
    } finally {
      setLoading(false)
    }
  }

  const loadPayments = async () => {
    if (!guard()) return
    setError('')
    setOk('')
    setLoading(true)
    try {
      const qs = new URLSearchParams()
      if (paymentStatus) qs.set('status', paymentStatus)
      if (paymentQuery) qs.set('q', paymentQuery)
      qs.set('limit', '100')
      const data = await apiFetch(`/api/v1/admin/payments?${qs.toString()}`, { headers: authHeaders })
      setPayments(Array.isArray(data?.items) ? data.items : [])
      setOk('支付列表已加载')
    } catch (e) {
      setError(e?.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  const dispatchAssign = async () => {
    if (!guard()) return
    const orderId = dispatchOrderId.trim()
    const merchantId = dispatchMerchantId.trim()
    if (!orderId || !merchantId) {
      setError('请填写 order_id 与 merchant_id')
      return
    }
    setError('')
    setOk('')
    setLoading(true)
    try {
      await apiFetch('/api/v1/admin/dispatch/assign', {
        method: 'POST',
        headers: authHeaders,
        body: { order_id: orderId, merchant_id: merchantId },
      })
      setOk('派单已执行')
      setDispatchOrderId('')
      setDispatchMerchantId('')
    } catch (e) {
      setError(e?.message || '派单失败')
    } finally {
      setLoading(false)
    }
  }

  const loadSettlement = async () => {
    if (!guard()) return
    const merchantId = settlementMerchantId.trim()
    if (!merchantId) {
      setError('请填写 merchant_id')
      return
    }
    setError('')
    setOk('')
    setLoading(true)
    try {
      const data = await apiFetch(`/api/v1/admin/settlement?merchant_id=${encodeURIComponent(merchantId)}`, { headers: authHeaders })
      setSettlement(data)
      setOk('财务数据已加载')
    } catch (e) {
      setError(e?.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  const loadSettlementRequests = async () => {
    if (!guard()) return
    setError('')
    setOk('')
    setLoading(true)
    try {
      const qs = new URLSearchParams()
      if (settlementReqStatus) qs.set('status', settlementReqStatus)
      if (settlementReqMerchantId) qs.set('merchant_id', settlementReqMerchantId.trim())
      qs.set('limit', '200')
      const data = await apiFetch(`/api/v1/admin/settlement-requests?${qs.toString()}`, { headers: authHeaders })
      setSettlementRequests(Array.isArray(data?.items) ? data.items : [])
      setOk('结算申请已加载')
    } catch (e) {
      setError(e?.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  const updateSettlementRequestStatus = async (id, status) => {
    if (!guard()) return
    setError('')
    setOk('')
    setLoading(true)
    try {
      await apiFetch(`/api/v1/admin/settlement-requests/${encodeURIComponent(id)}/status`, { method: 'POST', headers: authHeaders, body: { status } })
      setOk('状态已更新')
      await loadSettlementRequests()
    } catch (e) {
      setError(e?.message || '更新失败')
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    if (!guard()) return
    setError('')
    setOk('')
    setLoading(true)
    try {
      const qs = new URLSearchParams()
      if (userQuery) qs.set('q', userQuery)
      qs.set('limit', '100')
      const data = await apiFetch(`/api/v1/admin/users?${qs.toString()}`, { headers: authHeaders })
      setUsers(Array.isArray(data?.items) ? data.items : [])
      setOk('用户列表已加载')
    } catch (e) {
      setError(e?.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  const saveUser = async () => {
    if (!guard()) return
    const d = userDraft && typeof userDraft === 'object' ? userDraft : null
    if (!d) return
    const name = String(d.name || '').trim()
    const phone = String(d.phone || '').trim()
    const email = String(d.email || '').trim()
    if (!name || !phone) {
      setError('姓名与手机号必填')
      return
    }
    setError('')
    setOk('')
    setLoading(true)
    try {
      await apiFetch('/api/v1/users', { method: 'POST', body: { name, phone, email: email || null, language: d.language || null, telegram_id: d.telegram_id || null } })
      setOk('用户已保存')
      setUserDraft(null)
      await loadUsers()
    } catch (e) {
      setError(e?.message || '保存失败')
    } finally {
      setLoading(false)
    }
  }

  const loadPetsAdmin = async () => {
    if (!guard()) return
    setError('')
    setOk('')
    setLoading(true)
    try {
      const qs = new URLSearchParams()
      if (petPhone) qs.set('phone', petPhone)
      qs.set('limit', '100')
      const data = await apiFetch(`/api/v1/admin/pets?${qs.toString()}`, { headers: authHeaders })
      setPets(Array.isArray(data?.items) ? data.items : [])
      setOk('宠物列表已加载')
    } catch (e) {
      setError(e?.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  const deletePet = async (pet) => {
    if (!guard()) return
    const petId = String(pet?.id || '').trim()
    const phone = String(pet?.owner_phone || '').trim()
    if (!petId || !phone) {
      setError('缺少 petId 或 owner_phone')
      return
    }
    const okDel = window.confirm('确认删除该宠物档案吗？')
    if (!okDel) return
    setError('')
    setOk('')
    setLoading(true)
    try {
      await apiFetch(`/api/v1/pets/${encodeURIComponent(petId)}?phone=${encodeURIComponent(phone)}`, { method: 'DELETE' })
      setOk('宠物已删除')
      await loadPetsAdmin()
    } catch (e) {
      setError(e?.message || '删除失败')
    } finally {
      setLoading(false)
    }
  }

  const loadAftercareOrders = async () => {
    if (!guard()) return
    setError('')
    setOk('')
    setLoading(true)
    try {
      const qs = new URLSearchParams()
      qs.set('service_category', 'aftercare')
      if (aftercareStatus) qs.set('status', aftercareStatus)
      qs.set('limit', '100')
      const data = await apiFetch(`/api/v1/admin/orders?${qs.toString()}`, { headers: authHeaders })
      setAftercareOrders(Array.isArray(data?.items) ? data.items : [])
      setOk('善终订单已加载')
    } catch (e) {
      setError(e?.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  const loadCategoriesConfig = async () => {
    if (!guard()) return
    setError('')
    setOk('')
    setLoading(true)
    try {
      const data = await apiFetch('/api/v1/admin/categories-config', { headers: authHeaders })
      setCategoriesText(prettyJson(data || {}))
      setOk('分类配置已加载')
    } catch (e) {
      setError(e?.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  const saveCategoriesConfig = async () => {
    if (!guard()) return
    setError('')
    setOk('')
    setLoading(true)
    try {
      const payload = JSON.parse(categoriesText || '{}')
      const data = await apiFetch('/api/v1/admin/categories-config', { method: 'PATCH', headers: authHeaders, body: payload })
      setCategoriesText(prettyJson(data || payload))
      setOk('分类配置已保存')
    } catch (e) {
      setError(e?.message || '保存失败')
    } finally {
      setLoading(false)
    }
  }

  const loadCemeteryLayout = async () => {
    if (!guard()) return
    setError('')
    setOk('')
    setLoading(true)
    try {
      const data = await apiFetch('/api/v1/admin/cemetery-layout-config', { headers: authHeaders })
      setCemeteryText(prettyJson(data || {}))
      setOk('墓园布局已加载')
    } catch (e) {
      setError(e?.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  const saveCemeteryLayout = async () => {
    if (!guard()) return
    setError('')
    setOk('')
    setLoading(true)
    try {
      const payload = JSON.parse(cemeteryText || '{}')
      const data = await apiFetch('/api/v1/admin/cemetery-layout-config', { method: 'PATCH', headers: authHeaders, body: payload })
      setCemeteryText(prettyJson(data || payload))
      setOk('墓园布局已保存')
    } catch (e) {
      setError(e?.message || '保存失败')
    } finally {
      setLoading(false)
    }
  }

  const loadPhoneAliases = async () => {
    if (!guard()) return
    setError('')
    setOk('')
    setLoading(true)
    try {
      const qs = new URLSearchParams()
      if (aliasQuery) qs.set('q', aliasQuery)
      qs.set('limit', '200')
      const data = await apiFetch(`/api/v1/admin/user-phone-aliases?${qs.toString()}`, { headers: authHeaders })
      setPhoneAliases(Array.isArray(data?.items) ? data.items : [])
      setOk('手机号别名已加载')
    } catch (e) {
      setError(e?.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  const savePhoneAlias = async () => {
    if (!guard()) return
    const alias_phone = String(aliasDraft?.alias_phone || '').trim()
    const canonical_phone = String(aliasDraft?.canonical_phone || '').trim()
    if (!alias_phone || !canonical_phone || alias_phone === canonical_phone) {
      setError('请填写 alias_phone 与 canonical_phone（且不能相同）')
      return
    }
    setError('')
    setOk('')
    setLoading(true)
    try {
      await apiFetch('/api/v1/admin/user-phone-aliases', { method: 'POST', headers: authHeaders, body: { alias_phone, canonical_phone } })
      setOk('手机号别名已保存')
      setAliasDraft({ alias_phone: '', canonical_phone: '' })
      await loadPhoneAliases()
    } catch (e) {
      setError(e?.message || '保存失败')
    } finally {
      setLoading(false)
    }
  }

  const canRole = (roles) => {
    const r = String(adminRole || '')
    if (!r) return true
    if (r === 'superadmin') return true
    const allowed = Array.isArray(roles) ? roles : []
    if (!allowed.length) return true
    return allowed.includes(r)
  }

  const tabBtn = (id, label, roles) => (
    <button
      type="button"
      disabled={!canRole(roles)}
      onClick={() => setActiveTab(id)}
      className={`px-3 py-2 rounded-lg text-sm font-bold border ${
        !canRole(roles)
          ? 'bg-gray-100 text-gray-400 border-gray-200'
          : activeTab === id
            ? 'bg-indigo-600 text-white border-indigo-600'
            : 'bg-white text-gray-700 border-gray-200'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl p-4 md:p-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 md:p-6 mb-4">
          <div className="text-lg font-black text-gray-900 mb-1">管理后台{adminRole ? `（${adminRole}）` : ''}</div>
          <div className="text-xs text-gray-500">用于订单/支付/商家审核/派单，以及配置管理。</div>
          <div className="mt-4 flex flex-col md:flex-row gap-3 md:items-center">
            <div className="flex-1">
              <div className="text-xs font-bold text-gray-600 mb-1">Admin Token</div>
              <input
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white"
                placeholder="请输入 Bearer Token（不含 Bearer 前缀）"
                value={adminToken}
                onChange={(e) => setAdminToken(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {tabBtn('dashboard', '首页', ['admin', 'ops', 'support', 'finance'])}
              {tabBtn('orders', '订单', ['admin', 'ops', 'support', 'finance'])}
              {tabBtn('aftercare', '善终', ['admin', 'ops', 'support', 'finance'])}
              {tabBtn('cemetery', '墓位', ['admin', 'ops'])}
              {tabBtn('payments', '支付', ['admin', 'finance'])}
              {tabBtn('finance', '财务', ['admin', 'finance'])}
              {tabBtn('merchants', '商家', ['admin', 'ops'])}
              {tabBtn('products', '商品审核', ['admin', 'ops'])}
              {tabBtn('dispatch', '派单', ['admin', 'ops'])}
              {tabBtn('users', '用户', ['admin', 'ops', 'support', 'finance'])}
              {tabBtn('pets', '宠物', ['admin', 'ops', 'support'])}
              {tabBtn('configs', '配置', ['admin'])}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!authHeaders || loading}
                onClick={ping}
                className={`px-3 py-2 rounded-lg text-sm font-bold border ${!authHeaders || loading ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-white text-gray-700 border-gray-200'}`}
              >
                验证Token
              </button>
            </div>
          </div>
          {error ? <div className="mt-3 text-sm text-red-600">{error}</div> : null}
          {ok ? <div className="mt-3 text-sm text-green-700">{ok}</div> : null}
        </div>

        {activeTab === 'dashboard' ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 md:p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="min-w-0">
                <div className="text-sm font-black text-gray-900">首页仪表盘</div>
                <div className="text-xs text-gray-500 truncate">核心指标、待处理队列、快捷入口</div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!authHeaders || dashboardLoading}
                  onClick={loadDashboard}
                  className={`px-3 py-2 rounded-lg text-sm font-bold border ${!authHeaders || dashboardLoading ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-white text-gray-700 border-gray-200'}`}
                >
                  刷新
                </button>
              </div>
            </div>

            {!authHeaders ? (
              <div className="text-sm text-gray-500 py-10 text-center">请先填写 Admin Token，并点击“验证Token”。</div>
            ) : dashboardLoading ? (
              <div className="text-sm text-gray-500 py-10 text-center">加载中...</div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="border border-gray-200 rounded-2xl p-4">
                    <div className="text-[10px] text-gray-500 font-bold">今日订单</div>
                    <div className="text-2xl font-black text-gray-900 mt-1">{Number(dashboard?.today?.orders_count || 0)}</div>
                    <div className="text-[10px] text-gray-400 mt-1">{String(dashboard?.today?.date || '')}</div>
                  </div>
                  <div className="border border-gray-200 rounded-2xl p-4">
                    <div className="text-[10px] text-gray-500 font-bold">今日 GMV</div>
                    <div className="text-2xl font-black text-gray-900 mt-1">
                      ${(Number(dashboard?.today?.gmv_cents || 0) / 100).toFixed(2)}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1">按订单金额汇总</div>
                  </div>
                  <button
                    type="button"
                    className="border border-gray-200 rounded-2xl p-4 text-left active:bg-gray-50"
                    onClick={() => { setActiveTab('orders'); setOrderStatus(''); }}
                  >
                    <div className="text-[10px] text-gray-500 font-bold">待处理订单</div>
                    <div className="text-2xl font-black text-gray-900 mt-1">{Number(dashboard?.queues?.pending_orders || 0)}</div>
                    <div className="text-[10px] text-gray-400 mt-1">点击进入订单列表</div>
                  </button>
                  <button
                    type="button"
                    className="border border-gray-200 rounded-2xl p-4 text-left active:bg-gray-50"
                    onClick={() => { setActiveTab('finance'); setSettlementReqStatus('pending'); }}
                  >
                    <div className="text-[10px] text-gray-500 font-bold">待结算申请</div>
                    <div className="text-2xl font-black text-gray-900 mt-1">{Number(dashboard?.queues?.pending_settlement_requests || 0)}</div>
                    <div className="text-[10px] text-gray-400 mt-1">点击进入财务</div>
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button
                    type="button"
                    className="border border-gray-200 rounded-2xl p-4 text-left active:bg-gray-50"
                    onClick={() => { setActiveTab('merchants'); setMerchantStatus('pending'); }}
                  >
                    <div className="text-[10px] text-gray-500 font-bold">待审核商家</div>
                    <div className="text-xl font-black text-gray-900 mt-1">{Number(dashboard?.queues?.pending_merchants || 0)}</div>
                    <div className="text-[10px] text-gray-400 mt-1">点击进入商家</div>
                  </button>
                  <button
                    type="button"
                    className="border border-gray-200 rounded-2xl p-4 text-left active:bg-gray-50"
                    onClick={() => { setActiveTab('products'); setReviewStatus('pending'); }}
                  >
                    <div className="text-[10px] text-gray-500 font-bold">待审核商品</div>
                    <div className="text-xl font-black text-gray-900 mt-1">{Number(dashboard?.queues?.pending_products || 0)}</div>
                    <div className="text-[10px] text-gray-400 mt-1">点击进入商品审核</div>
                  </button>
                  <div className="border border-gray-200 rounded-2xl p-4">
                    <div className="text-[10px] text-gray-500 font-bold">累计订单</div>
                    <div className="text-xl font-black text-gray-900 mt-1">{Number(dashboard?.totals?.orders_count || 0)}</div>
                    <div className="text-[10px] text-gray-400 mt-1">历史总量</div>
                  </div>
                  <div className="border border-gray-200 rounded-2xl p-4">
                    <div className="text-[10px] text-gray-500 font-bold">累计 GMV</div>
                    <div className="text-xl font-black text-gray-900 mt-1">${(Number(dashboard?.totals?.gmv_cents || 0) / 100).toFixed(2)}</div>
                    <div className="text-[10px] text-gray-400 mt-1">历史汇总</div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-black text-gray-900">最新订单</div>
                    <button type="button" className="text-xs font-bold border rounded-lg px-3 py-2 active:bg-gray-50" onClick={() => setActiveTab('orders')}>
                      查看全部
                    </button>
                  </div>
                  <div className="overflow-auto border border-gray-200 rounded-2xl">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50 text-gray-600">
                        <tr>
                          <th className="text-left px-3 py-2">订单号</th>
                          <th className="text-left px-3 py-2">手机号</th>
                          <th className="text-left px-3 py-2">状态</th>
                          <th className="text-left px-3 py-2">金额</th>
                          <th className="text-left px-3 py-2">时间</th>
                          <th className="text-left px-3 py-2">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(Array.isArray(dashboard?.recent_orders) ? dashboard.recent_orders : []).length ? (
                          (dashboard.recent_orders || []).map((r) => (
                            <tr key={String(r.order_id || r.order_code || '')} className="border-t">
                              <td className="px-3 py-2 font-mono text-[12px]">{String(r.order_id || r.order_code || '')}</td>
                              <td className="px-3 py-2">{String(r.user_phone || '')}</td>
                              <td className="px-3 py-2">{String(r.status || '')}</td>
                              <td className="px-3 py-2">${(Number(r.total_amount_cents || 0) / 100).toFixed(2)}</td>
                              <td className="px-3 py-2 text-[12px] text-gray-500">{String(r.created_at || '').replace('T', ' ').slice(0, 19)}</td>
                              <td className="px-3 py-2">
                                <button
                                  type="button"
                                  className="text-xs font-bold border rounded-lg px-3 py-2 active:bg-gray-50"
                                  onClick={() => {
                                    const id = String(r.order_id || r.order_code || '').trim()
                                    if (!id) return
                                    setActiveTab('orders')
                                    setSelectedOrderId(id)
                                    loadOrderDetail(id)
                                  }}
                                >
                                  详情
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td className="px-3 py-6 text-center text-gray-500" colSpan="6">
                              暂无数据
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}

        {activeTab === 'orders' ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 md:p-6">
            <div className="flex flex-col md:flex-row md:items-end gap-3 mb-4">
              <div className="flex-1">
                <div className="text-xs font-bold text-gray-600 mb-1">搜索</div>
                <input
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white"
                  placeholder="按订单号/手机号/地址模糊搜索"
                  value={orderQuery}
                  onChange={(e) => setOrderQuery(e.target.value)}
                />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-600 mb-1">状态</div>
                <select
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white"
                  value={orderStatus}
                  onChange={(e) => setOrderStatus(e.target.value)}
                >
                  <option value="">全部</option>
                  <option value="pending">pending</option>
                  <option value="confirmed">confirmed</option>
                  <option value="paid">paid</option>
                  <option value="completed">completed</option>
                  <option value="cancelled">cancelled</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!authHeaders || loading}
                  onClick={loadOrders}
                  className={`px-3 py-2 rounded-lg text-sm font-bold border ${!authHeaders || loading ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-white text-gray-700 border-gray-200'}`}
                >
                  刷新
                </button>
              </div>
            </div>

            <div className="overflow-auto border border-gray-200 rounded-2xl">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-3 py-2">订单号</th>
                    <th className="text-left px-3 py-2">手机号</th>
                    <th className="text-left px-3 py-2">状态</th>
                    <th className="text-left px-3 py-2">服务</th>
                    <th className="text-left px-3 py-2">金额</th>
                    <th className="text-left px-3 py-2">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {(orders || []).map((o) => (
                    <tr key={o.order_id} className="border-t border-gray-100">
                      <td className="px-3 py-2 font-mono text-[12px]">{o.order_id}</td>
                      <td className="px-3 py-2">{o.user_phone || '-'}</td>
                      <td className="px-3 py-2">{o.status}</td>
                      <td className="px-3 py-2">{o.service_package || '-'}</td>
                      <td className="px-3 py-2">${(Number(o.total_amount_cents || 0) / 100).toFixed(2)}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={!authHeaders || loading}
                            onClick={async () => {
                              setSelectedOrderId(String(o.order_id || ''))
                              await loadOrderDetail(String(o.order_id || ''))
                            }}
                            className={`px-2 py-1 rounded-lg text-xs font-bold border ${!authHeaders || loading ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-white text-gray-700 border-gray-200'}`}
                          >
                            详情
                          </button>
                          <select
                            className="border border-gray-200 rounded-lg px-2 py-1 text-xs outline-none focus:border-indigo-400 bg-white"
                            value={orderStatusPatch}
                            onChange={(e) => setOrderStatusPatch(e.target.value)}
                          >
                            <option value="confirmed">confirmed</option>
                            <option value="paid">paid</option>
                            <option value="completed">completed</option>
                            <option value="cancelled">cancelled</option>
                          </select>
                          <button
                            type="button"
                            disabled={!authHeaders || loading}
                            onClick={() => patchOrderStatus(o.order_id, orderStatusPatch)}
                            className={`px-2 py-1 rounded-lg text-xs font-bold border ${!authHeaders || loading ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-indigo-600 text-white border-indigo-600'}`}
                          >
                            更新
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!orders || orders.length === 0 ? (
                    <tr>
                      <td className="px-3 py-6 text-center text-gray-500" colSpan={6}>
                        暂无数据
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            {selectedOrderId ? (
              <div className="mt-6 border border-gray-200 rounded-2xl p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="text-sm font-black text-gray-900">
                    订单详情：<span className="font-mono">{selectedOrderId}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={!authHeaders || loading}
                      onClick={() => loadOrderDetail(selectedOrderId)}
                      className={`px-3 py-2 rounded-lg text-xs font-bold border ${!authHeaders || loading ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-white text-gray-700 border-gray-200'}`}
                    >
                      刷新详情
                    </button>
                    <button
                      type="button"
                      className="px-3 py-2 rounded-lg text-xs font-bold border bg-white text-gray-700 border-gray-200"
                      onClick={() => {
                        setSelectedOrderId('')
                        setOrderDetail(null)
                      }}
                    >
                      关闭
                    </button>
                  </div>
                </div>

                {orderDetailLoading ? <div className="text-xs text-gray-500">加载中...</div> : null}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="border border-gray-200 rounded-2xl p-3">
                    <div className="text-xs font-bold text-gray-600 mb-2">改价（USD）</div>
                    <div className="flex gap-2">
                      <input
                        className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white"
                        placeholder="例如：169"
                        value={opNewTotalUsd}
                        onChange={(e) => setOpNewTotalUsd(e.target.value)}
                      />
                      <button type="button" disabled={!authHeaders || loading} onClick={opAdjustPrice} className={`px-3 py-2 rounded-xl text-sm font-black border ${!authHeaders || loading ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-indigo-600 text-white border-indigo-600'}`}>
                        执行
                      </button>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-2xl p-3">
                    <div className="text-xs font-bold text-gray-600 mb-2">改派/指派（merchant_id）</div>
                    <div className="flex gap-2">
                      <input
                        className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white"
                        placeholder="例如：m_xxx"
                        value={opAssignMerchantId}
                        onChange={(e) => setOpAssignMerchantId(e.target.value)}
                      />
                      <button type="button" disabled={!authHeaders || loading} onClick={opAssign} className={`px-3 py-2 rounded-xl text-sm font-black border ${!authHeaders || loading ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-indigo-600 text-white border-indigo-600'}`}>
                        执行
                      </button>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-2xl p-3">
                    <div className="text-xs font-bold text-gray-600 mb-2">补录线下收款</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <input className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white" placeholder="金额 USD" value={opOfflineAmountUsd} onChange={(e) => setOpOfflineAmountUsd(e.target.value)} />
                      <select className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white" value={opOfflineMethod} onChange={(e) => setOpOfflineMethod(e.target.value)}>
                        <option value="cash">cash</option>
                        <option value="aba">aba</option>
                        <option value="bank_transfer">bank_transfer</option>
                        <option value="usdt">usdt</option>
                      </select>
                      <button type="button" disabled={!authHeaders || loading} onClick={opOfflinePay} className={`px-3 py-2 rounded-xl text-sm font-black border ${!authHeaders || loading ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-indigo-600 text-white border-indigo-600'}`}>
                        记录
                      </button>
                    </div>
                    <input className="mt-2 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white" placeholder="备注（可选）" value={opOfflineNote} onChange={(e) => setOpOfflineNote(e.target.value)} />
                  </div>

                  <div className="border border-gray-200 rounded-2xl p-3">
                    <div className="text-xs font-bold text-gray-600 mb-2">退款记录</div>
                    <div className="flex gap-2">
                      <input className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white" placeholder="金额 USD" value={opRefundAmountUsd} onChange={(e) => setOpRefundAmountUsd(e.target.value)} />
                      <button type="button" disabled={!authHeaders || loading} onClick={opRefund} className={`px-3 py-2 rounded-xl text-sm font-black border ${!authHeaders || loading ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-white text-gray-700 border-gray-200'}`}>
                        记录
                      </button>
                    </div>
                    <input className="mt-2 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white" placeholder="退款原因（可选）" value={opRefundReason} onChange={(e) => setOpRefundReason(e.target.value)} />
                  </div>

                  <div className="border border-gray-200 rounded-2xl p-3 md:col-span-2">
                    <div className="text-xs font-bold text-gray-600 mb-2">备注 / 凭证</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <input className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white" placeholder="运营备注" value={opNote} onChange={(e) => setOpNote(e.target.value)} />
                      <button type="button" disabled={!authHeaders || loading} onClick={opSaveNote} className={`px-3 py-2 rounded-xl text-sm font-black border ${!authHeaders || loading ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-white text-gray-700 border-gray-200'}`}>
                        保存备注
                      </button>
                      <div />
                      <input className="md:col-span-2 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white" placeholder="凭证链接（图片URL/网盘URL）" value={opProofUrl} onChange={(e) => setOpProofUrl(e.target.value)} />
                      <button type="button" disabled={!authHeaders || loading} onClick={opAddProof} className={`px-3 py-2 rounded-xl text-sm font-black border ${!authHeaders || loading ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-white text-gray-700 border-gray-200'}`}>
                        添加凭证
                      </button>
                      <input
                        type="file"
                        className="md:col-span-2 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white"
                        onChange={(e) => setOpProofFile(e.target.files?.[0] || null)}
                      />
                      <button type="button" disabled={!authHeaders || loading || !opProofFile} onClick={opUploadProofFile} className={`px-3 py-2 rounded-xl text-sm font-black border ${!authHeaders || loading || !opProofFile ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-indigo-600 text-white border-indigo-600'}`}>
                        上传文件
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-4 border border-gray-200 rounded-2xl p-4">
                  <div className="text-xs font-bold text-gray-600 mb-3">凭证预览</div>
                  {Array.isArray(orderDetail?.intake_metadata?.proofs) && orderDetail.intake_metadata.proofs.length ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {orderDetail.intake_metadata.proofs.map((p, idx) => {
                        const raw = String(p?.url || '')
                        const apiBase = (import.meta?.env?.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '')
                        const url = raw.startsWith('http') || raw.startsWith('data:') ? raw : `${apiBase}${raw}`
                        const ct = String(p?.content_type || '')
                        const isImg = ct.startsWith('image/') || /\.(png|jpg|jpeg|webp|gif)$/i.test(raw)
                        return (
                          <div key={idx} className="border border-gray-200 rounded-2xl overflow-hidden">
                            {isImg ? <SafeImage src={url} alt="proof" className="w-full h-40 object-cover" /> : null}
                            <div className="p-3">
                              <div className="text-[12px] font-mono text-gray-700 break-all">{raw}</div>
                              <div className="text-[11px] text-gray-500 mt-1">
                                {p?.filename ? `filename: ${String(p.filename)} · ` : ''}
                                {p?.size ? `size: ${Number(p.size)} · ` : ''}
                                {ct ? `type: ${ct}` : ''}
                              </div>
                              <a className="inline-block mt-2 text-xs font-bold text-indigo-700" href={url} target="_blank" rel="noreferrer">
                                打开
                              </a>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500">暂无凭证</div>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="border border-gray-200 rounded-2xl p-3">
                    <div className="text-xs font-bold text-gray-600 mb-2">时间线</div>
                    <div className="space-y-2">
                      {Array.isArray(orderDetail?.intake_metadata?.timeline) && orderDetail.intake_metadata.timeline.length ? (
                        orderDetail.intake_metadata.timeline
                          .slice()
                          .sort((a, b) => String(a.at || '').localeCompare(String(b.at || '')))
                          .map((ev, idx) => (
                            <div key={idx} className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-sm font-bold text-gray-900 truncate">{String(ev.title || ev.type || 'event')}</div>
                                {ev.desc ? <div className="text-[12px] text-gray-500 mt-0.5">{String(ev.desc)}</div> : null}
                              </div>
                              <div className="text-[10px] text-gray-400 shrink-0">{String(ev.at || '')}</div>
                            </div>
                          ))
                      ) : (
                        <div className="text-xs text-gray-500">暂无</div>
                      )}
                    </div>
                  </div>
                  <div className="border border-gray-200 rounded-2xl p-3">
                    <div className="text-xs font-bold text-gray-600 mb-2">原始数据（只读）</div>
                    <pre className="text-[11px] bg-gray-50 border border-gray-200 rounded-xl p-3 overflow-auto max-h-[360px]">{prettyJson(orderDetail)}</pre>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {activeTab === 'aftercare' ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 md:p-6">
            <div className="flex items-end justify-between gap-3 mb-4">
              <div>
                <div className="text-sm font-black text-gray-900">善终业务管理</div>
                <div className="text-xs text-gray-500">预设筛选：service_category = aftercare</div>
              </div>
              <div className="flex items-center gap-2">
                <select className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white" value={aftercareStatus} onChange={(e) => setAftercareStatus(e.target.value)}>
                  <option value="">全部</option>
                  <option value="pending">pending</option>
                  <option value="confirmed">confirmed</option>
                  <option value="paid">paid</option>
                  <option value="completed">completed</option>
                  <option value="cancelled">cancelled</option>
                </select>
                <button type="button" disabled={!authHeaders || loading} onClick={loadAftercareOrders} className={`px-3 py-2 rounded-lg text-sm font-bold border ${!authHeaders || loading ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-white text-gray-700 border-gray-200'}`}>
                  刷新
                </button>
              </div>
            </div>
            <div className="overflow-auto border border-gray-200 rounded-2xl">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-3 py-2">订单号</th>
                    <th className="text-left px-3 py-2">手机号</th>
                    <th className="text-left px-3 py-2">状态</th>
                    <th className="text-left px-3 py-2">套餐</th>
                    <th className="text-left px-3 py-2">金额</th>
                  </tr>
                </thead>
                <tbody>
                  {(aftercareOrders || []).map((o) => (
                    <tr key={o.order_id} className="border-t border-gray-100">
                      <td className="px-3 py-2 font-mono text-[12px]">{o.order_id}</td>
                      <td className="px-3 py-2">{o.user_phone || '-'}</td>
                      <td className="px-3 py-2">{o.status}</td>
                      <td className="px-3 py-2">{o.service_package || '-'}</td>
                      <td className="px-3 py-2">${(Number(o.total_amount_cents || 0) / 100).toFixed(2)}</td>
                    </tr>
                  ))}
                  {!aftercareOrders || aftercareOrders.length === 0 ? (
                    <tr>
                      <td className="px-3 py-6 text-center text-gray-500" colSpan={5}>
                        暂无数据
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {activeTab === 'cemetery' ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 md:p-6">
            <div className="flex items-end justify-between gap-3 mb-4">
              <div>
                <div className="text-sm font-black text-gray-900">墓位管理</div>
                <div className="text-xs text-gray-500">查看墓区、格位状态及手动分配格位给用户。</div>
              </div>
              <button type="button" disabled={!authHeaders || loading} onClick={loadCemeteryZones} className={`px-3 py-2 rounded-lg text-sm font-bold border ${!authHeaders || loading ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-white text-gray-700 border-gray-200'}`}>
                加载墓区
              </button>
            </div>

            {cemeteryZones.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-3 mb-4 border-b border-gray-100">
                {cemeteryZones.map(zone => (
                  <button
                    key={zone.zone_id}
                    className={`shrink-0 px-4 py-2 rounded-xl text-sm font-bold border ${selectedZoneId === zone.zone_id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 text-gray-700 border-gray-200'}`}
                    onClick={() => {
                      setSelectedZoneId(zone.zone_id)
                      loadCemeterySlots(zone.zone_id)
                    }}
                  >
                    {zone.name} <span className="text-xs font-normal ml-1 opacity-80">({zone.occupied}/{zone.capacity})</span>
                  </button>
                ))}
              </div>
            )}

            {selectedZoneId && cemeterySlots.length > 0 && (
              <>
                <div className="border border-gray-200 rounded-2xl p-4 mb-4 bg-gray-50">
                  <div className="text-xs font-bold text-gray-600 mb-3">手动分配格位</div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <input className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white" placeholder="slot_id (例如: A-01)" value={rentDraft.slot_id} onChange={(e) => setRentDraft({ ...rentDraft, slot_id: e.target.value })} />
                    <input className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white" placeholder="global_user_id" value={rentDraft.global_user_id} onChange={(e) => setRentDraft({ ...rentDraft, global_user_id: e.target.value })} />
                    <input className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white" type="number" placeholder="租期(月)" value={rentDraft.lease_months} onChange={(e) => setRentDraft({ ...rentDraft, lease_months: Number(e.target.value) })} />
                    <button type="button" disabled={!authHeaders || loading} onClick={rentCemeterySlot} className={`px-4 py-2 rounded-xl text-sm font-black border ${!authHeaders || loading ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-indigo-600 text-white border-indigo-600'}`}>
                      确认分配
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-3">
                  {cemeterySlots.map(slot => {
                    const isAvailable = slot.status === 'available'
                    return (
                      <div key={slot.slot_id} className={`border rounded-xl p-3 text-center ${isAvailable ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-100'}`}>
                        <div className={`text-sm font-bold ${isAvailable ? 'text-green-700' : 'text-gray-500'}`}>{slot.slot_number}</div>
                        <div className="text-[10px] mt-1 text-gray-400">{slot.status}</div>
                        {!isAvailable && slot.current_occupant_user_id && (
                           <div className="text-[9px] mt-1 text-gray-500 truncate" title={slot.current_occupant_user_id}>{slot.current_occupant_user_id.slice(-6)}</div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        ) : null}

        {activeTab === 'payments' ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 md:p-6">
            <div className="flex flex-col md:flex-row md:items-end gap-3 mb-4">
              <div className="flex-1">
                <div className="text-xs font-bold text-gray-600 mb-1">搜索</div>
                <input
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white"
                  placeholder="按订单号/手机号/支付方式搜索"
                  value={paymentQuery}
                  onChange={(e) => setPaymentQuery(e.target.value)}
                />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-600 mb-1">状态</div>
                <select
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white"
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                >
                  <option value="">全部</option>
                  <option value="unpaid">unpaid</option>
                  <option value="paid">paid</option>
                  <option value="failed">failed</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!authHeaders || loading}
                  onClick={loadPayments}
                  className={`px-3 py-2 rounded-lg text-sm font-bold border ${!authHeaders || loading ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-white text-gray-700 border-gray-200'}`}
                >
                  刷新
                </button>
              </div>
            </div>

            <div className="overflow-auto border border-gray-200 rounded-2xl">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-3 py-2">Payment ID</th>
                    <th className="text-left px-3 py-2">订单号</th>
                    <th className="text-left px-3 py-2">手机号</th>
                    <th className="text-left px-3 py-2">方式</th>
                    <th className="text-left px-3 py-2">状态</th>
                    <th className="text-left px-3 py-2">金额</th>
                  </tr>
                </thead>
                <tbody>
                  {(payments || []).map((p) => (
                    <tr key={p.id} className="border-t border-gray-100">
                      <td className="px-3 py-2 font-mono text-[12px]">{String(p.id)}</td>
                      <td className="px-3 py-2 font-mono text-[12px]">{String(p.order_id)}</td>
                      <td className="px-3 py-2">{p.user_phone || '-'}</td>
                      <td className="px-3 py-2">{p.method}</td>
                      <td className="px-3 py-2">{p.status}</td>
                      <td className="px-3 py-2">${(Number(p.amount_cents || 0) / 100).toFixed(2)}</td>
                    </tr>
                  ))}
                  {!payments || payments.length === 0 ? (
                    <tr>
                      <td className="px-3 py-6 text-center text-gray-500" colSpan={6}>
                        暂无数据（该页需要数据库模式）
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {activeTab === 'finance' ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 md:p-6">
            <div className="text-sm font-black text-gray-900 mb-1">财务板块</div>
            <div className="text-xs text-gray-500 mb-4">按商家维度查看结算汇总与订单明细。</div>
            <div className="flex flex-col md:flex-row gap-2 md:items-end mb-4">
              <div className="flex-1">
                <div className="text-xs font-bold text-gray-600 mb-1">merchant_id</div>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white" value={settlementMerchantId} onChange={(e) => setSettlementMerchantId(e.target.value)} />
              </div>
              <button type="button" disabled={!authHeaders || loading} onClick={loadSettlement} className={`px-4 py-2 rounded-xl text-sm font-black border ${!authHeaders || loading ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-indigo-600 text-white border-indigo-600'}`}>
                加载
              </button>
            </div>
            {settlement ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="border border-gray-200 rounded-2xl p-4">
                  <div className="text-xs text-gray-500">Total Amount</div>
                  <div className="text-2xl font-black text-gray-900">${(Number(settlement.total_amount_cents || 0) / 100).toFixed(2)}</div>
                  <div className="mt-2 text-xs text-gray-500">Platform Fee</div>
                  <div className="text-lg font-black text-gray-900">${(Number(settlement.platform_fee_cents || 0) / 100).toFixed(2)}</div>
                  <div className="mt-2 text-xs text-gray-500">Merchant Payout</div>
                  <div className="text-lg font-black text-gray-900">${(Number(settlement.merchant_payout_cents || 0) / 100).toFixed(2)}</div>
                </div>
                <div className="border border-gray-200 rounded-2xl p-4">
                  <div className="text-xs font-bold text-gray-600 mb-2">订单明细</div>
                  <div className="overflow-auto max-h-[360px]">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50 text-gray-600">
                        <tr>
                          <th className="text-left px-2 py-1">订单号</th>
                          <th className="text-left px-2 py-1">状态</th>
                          <th className="text-left px-2 py-1">金额</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(settlement.items || []).map((it) => (
                          <tr key={it.order_id} className="border-t border-gray-100">
                            <td className="px-2 py-1 font-mono text-[12px]">{it.order_id}</td>
                            <td className="px-2 py-1">{it.status}</td>
                            <td className="px-2 py-1">${(Number(it.total_amount_cents || 0) / 100).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">暂无数据</div>
            )}

            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="text-sm font-black text-gray-900 mb-1">结算申请管理</div>
              <div className="text-xs text-gray-500 mb-4">审核与标记打款，形成完整结算闭环。</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                <input
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white"
                  placeholder="merchant_id（可选）"
                  value={settlementReqMerchantId}
                  onChange={(e) => setSettlementReqMerchantId(e.target.value)}
                />
                <select
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white"
                  value={settlementReqStatus}
                  onChange={(e) => setSettlementReqStatus(e.target.value)}
                >
                  <option value="">全部</option>
                  <option value="pending">pending</option>
                  <option value="approved">approved</option>
                  <option value="paid">paid</option>
                  <option value="rejected">rejected</option>
                </select>
                <button
                  type="button"
                  disabled={!authHeaders || loading}
                  onClick={loadSettlementRequests}
                  className={`px-4 py-2 rounded-xl text-sm font-black border ${!authHeaders || loading ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-white text-gray-700 border-gray-200'}`}
                >
                  刷新
                </button>
              </div>

              <div className="overflow-auto border border-gray-200 rounded-2xl">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="text-left px-3 py-2">ID</th>
                      <th className="text-left px-3 py-2">商家</th>
                      <th className="text-left px-3 py-2">金额</th>
                      <th className="text-left px-3 py-2">状态</th>
                      <th className="text-left px-3 py-2">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(settlementRequests || []).map((r) => (
                      <tr key={r.id} className="border-t border-gray-100">
                        <td className="px-3 py-2 font-mono text-[12px]">{String(r.id)}</td>
                        <td className="px-3 py-2">
                          <div className="text-xs font-bold text-gray-800">{r.merchant_name || '-'}</div>
                          <div className="text-[11px] text-gray-500 font-mono">{String(r.merchant_id || '')}</div>
                        </td>
                        <td className="px-3 py-2">${(Number(r.amount_cents || 0) / 100).toFixed(2)}</td>
                        <td className="px-3 py-2">{String(r.status || '')}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <select
                              className="border border-gray-200 rounded-lg px-2 py-1 text-xs outline-none focus:border-indigo-400 bg-white"
                              value={settlementReqNextStatus}
                              onChange={(e) => setSettlementReqNextStatus(e.target.value)}
                            >
                              <option value="approved">approved</option>
                              <option value="paid">paid</option>
                              <option value="rejected">rejected</option>
                              <option value="pending">pending</option>
                            </select>
                            <button
                              type="button"
                              disabled={!authHeaders || loading}
                              onClick={() => updateSettlementRequestStatus(r.id, settlementReqNextStatus)}
                              className={`px-3 py-2 rounded-lg text-xs font-bold border ${!authHeaders || loading ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-indigo-600 text-white border-indigo-600'}`}
                            >
                              更新
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!settlementRequests || settlementRequests.length === 0 ? (
                      <tr>
                        <td className="px-3 py-6 text-center text-gray-500" colSpan={5}>
                          暂无数据
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === 'merchants' ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 md:p-6">
            <div className="flex items-end justify-between gap-3 mb-4">
              <div>
                <div className="text-sm font-black text-gray-900">商家审核</div>
                <div className="text-xs text-gray-500">审核通过后，商家可被派单/上架商品。</div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white"
                  value={merchantStatus}
                  onChange={(e) => setMerchantStatus(e.target.value)}
                >
                  <option value="pending">pending</option>
                  <option value="approved">approved</option>
                  <option value="rejected">rejected</option>
                  <option value="">全部</option>
                </select>
                <button
                  type="button"
                  disabled={!authHeaders || loading}
                  onClick={loadMerchants}
                  className={`px-3 py-2 rounded-lg text-sm font-bold border ${!authHeaders || loading ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-white text-gray-700 border-gray-200'}`}
                >
                  刷新
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {(merchants || []).map((m) => (
                <div key={m.id} className="border border-gray-200 rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-black text-gray-900 truncate">{m.name}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {m.city || '-'} · {m.phone || '-'} · <span className="font-mono">{m.id}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">status: {m.status}</div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={!authHeaders || loading}
                        onClick={() => approveMerchant(m.id)}
                        className={`px-3 py-2 rounded-lg text-xs font-bold border ${!authHeaders || loading ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-indigo-600 text-white border-indigo-600'}`}
                      >
                        通过
                      </button>
                      <button
                        type="button"
                        disabled={!authHeaders || loading}
                        onClick={() => rejectMerchant(m.id)}
                        className={`px-3 py-2 rounded-lg text-xs font-bold border ${!authHeaders || loading ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-white text-gray-700 border-gray-200'}`}
                      >
                        驳回
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {!merchants || merchants.length === 0 ? <div className="text-sm text-gray-500">暂无数据</div> : null}
            </div>
          </div>
        ) : null}

        {activeTab === 'products' ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 md:p-6">
            <div className="flex flex-col md:flex-row md:items-end gap-3 mb-4">
              <div className="flex-1">
                <div className="text-sm font-black text-gray-900">商品审核</div>
                <div className="text-xs text-gray-500">审批后可自动上架（取决于 review-policy）。</div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white"
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value)}
                >
                  <option value="pending">pending</option>
                  <option value="approved">approved</option>
                  <option value="rejected">rejected</option>
                </select>
                <button
                  type="button"
                  disabled={!authHeaders || loading}
                  onClick={loadReviewProducts}
                  className={`px-3 py-2 rounded-lg text-sm font-bold border ${!authHeaders || loading ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-white text-gray-700 border-gray-200'}`}
                >
                  刷新
                </button>
              </div>
            </div>
            <div className="mb-4">
              <div className="text-xs font-bold text-gray-600 mb-1">审核备注（可选）</div>
              <input
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white"
                placeholder="例如：图片不清晰/类目不匹配/信息缺失"
                value={reviewReason}
                onChange={(e) => setReviewReason(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              {(reviewProducts || []).map((p) => (
                <div key={p.id} className="border border-gray-200 rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-black text-gray-900 truncate">{p.name}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {p.category || '-'} · ${((Number(p.price_cents || 0) || 0) / 100).toFixed(2)} {p.currency || ''}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">audit_status: {p.audit_status || '-'}</div>
                      <div className="text-xs text-gray-500 mt-1 font-mono">{p.id}</div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={!authHeaders || loading}
                        onClick={() => reviewProduct(p.id, 'approved')}
                        className={`px-3 py-2 rounded-lg text-xs font-bold border ${!authHeaders || loading ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-indigo-600 text-white border-indigo-600'}`}
                      >
                        通过
                      </button>
                      <button
                        type="button"
                        disabled={!authHeaders || loading}
                        onClick={() => reviewProduct(p.id, 'rejected')}
                        className={`px-3 py-2 rounded-lg text-xs font-bold border ${!authHeaders || loading ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-white text-gray-700 border-gray-200'}`}
                      >
                        驳回
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {!reviewProducts || reviewProducts.length === 0 ? <div className="text-sm text-gray-500">暂无数据</div> : null}
            </div>
          </div>
        ) : null}

        {activeTab === 'dispatch' ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 md:p-6">
            <div className="text-sm font-black text-gray-900 mb-1">派单</div>
            <div className="text-xs text-gray-500 mb-4">手工将订单指派给某个已审核通过的商家。</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className="text-xs font-bold text-gray-600 mb-1">order_id</div>
                <input
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white"
                  value={dispatchOrderId}
                  onChange={(e) => setDispatchOrderId(e.target.value)}
                />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-600 mb-1">merchant_id</div>
                <input
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white"
                  value={dispatchMerchantId}
                  onChange={(e) => setDispatchMerchantId(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-4">
              <button
                type="button"
                disabled={!authHeaders || loading}
                onClick={dispatchAssign}
                className={`px-4 py-2 rounded-xl text-sm font-black border ${!authHeaders || loading ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-indigo-600 text-white border-indigo-600'}`}
              >
                执行派单
              </button>
            </div>
          </div>
        ) : null}

        {activeTab === 'users' ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 md:p-6">
            <div className="flex flex-col md:flex-row md:items-end gap-3 mb-4">
              <div className="flex-1">
                <div className="text-sm font-black text-gray-900">用户管理</div>
                <div className="text-xs text-gray-500">按手机号/姓名/telegram_id 搜索，支持编辑基础信息。</div>
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-gray-600 mb-1">搜索</div>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white" value={userQuery} onChange={(e) => setUserQuery(e.target.value)} />
              </div>
              <button type="button" disabled={!authHeaders || loading} onClick={loadUsers} className={`px-3 py-2 rounded-lg text-sm font-bold border ${!authHeaders || loading ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-white text-gray-700 border-gray-200'}`}>
                刷新
              </button>
            </div>

            {userDraft ? (
              <div className="border border-gray-200 rounded-2xl p-4 mb-4">
                <div className="text-xs font-bold text-gray-600 mb-3">编辑用户</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <input className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white" placeholder="姓名" value={userDraft.name || ''} onChange={(e) => setUserDraft({ ...userDraft, name: e.target.value })} />
                  <input className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white" placeholder="手机号" value={userDraft.phone || ''} onChange={(e) => setUserDraft({ ...userDraft, phone: e.target.value })} />
                  <input className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white" placeholder="邮箱(可选)" value={userDraft.email || ''} onChange={(e) => setUserDraft({ ...userDraft, email: e.target.value })} />
                  <input className="md:col-span-2 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white" placeholder="telegram_id(可选)" value={userDraft.telegram_id || ''} onChange={(e) => setUserDraft({ ...userDraft, telegram_id: e.target.value })} />
                  <input className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white" placeholder="language(可选)" value={userDraft.language || ''} onChange={(e) => setUserDraft({ ...userDraft, language: e.target.value })} />
                </div>
                <div className="mt-3 flex gap-2">
                  <button type="button" disabled={!authHeaders || loading} onClick={saveUser} className={`px-4 py-2 rounded-xl text-sm font-black border ${!authHeaders || loading ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-indigo-600 text-white border-indigo-600'}`}>
                    保存
                  </button>
                  <button type="button" className="px-4 py-2 rounded-xl text-sm font-black border bg-white text-gray-700 border-gray-200" onClick={() => setUserDraft(null)}>
                    取消
                  </button>
                </div>
              </div>
            ) : null}

            <div className="overflow-auto border border-gray-200 rounded-2xl">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-3 py-2">手机号</th>
                    <th className="text-left px-3 py-2">姓名</th>
                    <th className="text-left px-3 py-2">邮箱</th>
                    <th className="text-left px-3 py-2">telegram_id</th>
                    <th className="text-left px-3 py-2">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {(users || []).map((u) => (
                    <tr key={u.id || u.phone} className="border-t border-gray-100">
                      <td className="px-3 py-2">{u.phone}</td>
                      <td className="px-3 py-2">{u.name}</td>
                      <td className="px-3 py-2">{u.email || '-'}</td>
                      <td className="px-3 py-2">{u.telegram_id || '-'}</td>
                      <td className="px-3 py-2">
                        <button type="button" className="px-3 py-2 rounded-lg text-xs font-bold border bg-white text-gray-700 border-gray-200" onClick={() => setUserDraft({ ...u })}>
                          编辑
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!users || users.length === 0 ? (
                    <tr>
                      <td className="px-3 py-6 text-center text-gray-500" colSpan={5}>
                        暂无数据
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {activeTab === 'pets' ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 md:p-6">
            <div className="flex flex-col md:flex-row md:items-end gap-3 mb-4">
              <div className="flex-1">
                <div className="text-sm font-black text-gray-900">宠物信息</div>
                <div className="text-xs text-gray-500">可按手机号过滤，支持删除宠物档案。</div>
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-gray-600 mb-1">owner_phone（可选）</div>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white" value={petPhone} onChange={(e) => setPetPhone(e.target.value)} />
              </div>
              <button type="button" disabled={!authHeaders || loading} onClick={loadPetsAdmin} className={`px-3 py-2 rounded-lg text-sm font-bold border ${!authHeaders || loading ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-white text-gray-700 border-gray-200'}`}>
                刷新
              </button>
            </div>

            <div className="overflow-auto border border-gray-200 rounded-2xl">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-3 py-2">pet_id</th>
                    <th className="text-left px-3 py-2">owner_phone</th>
                    <th className="text-left px-3 py-2">pet_name</th>
                    <th className="text-left px-3 py-2">pet_type</th>
                    <th className="text-left px-3 py-2">pet_weight</th>
                    <th className="text-left px-3 py-2">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {(pets || []).map((p) => (
                    <tr key={p.id} className="border-t border-gray-100">
                      <td className="px-3 py-2 font-mono text-[12px]">{p.id}</td>
                      <td className="px-3 py-2">{p.owner_phone || '-'}</td>
                      <td className="px-3 py-2">{p.pet_name || '-'}</td>
                      <td className="px-3 py-2">{p.pet_type}</td>
                      <td className="px-3 py-2">{p.pet_weight || '-'}</td>
                      <td className="px-3 py-2">
                        <button type="button" disabled={!authHeaders || loading} onClick={() => deletePet(p)} className={`px-3 py-2 rounded-lg text-xs font-bold border ${!authHeaders || loading ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-white text-red-600 border-gray-200'}`}>
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!pets || pets.length === 0 ? (
                    <tr>
                      <td className="px-3 py-6 text-center text-gray-500" colSpan={6}>
                        暂无数据
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {activeTab === 'configs' ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 md:p-6">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <div className="text-sm font-black text-gray-900">墓园选址布局配置</div>
                <div className="text-xs text-gray-500">支持 rows/cols/zones/zone_by_col/sold/locked/expired（可选），zones 支持 annual_fee_product_id 等扩展字段。</div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!authHeaders || loading}
                  onClick={loadCemeteryLayout}
                  className={`px-3 py-2 rounded-lg text-sm font-bold border ${!authHeaders || loading ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-white text-gray-700 border-gray-200'}`}
                >
                  加载
                </button>
                <button
                  type="button"
                  disabled={!authHeaders || loading}
                  onClick={saveCemeteryLayout}
                  className={`px-3 py-2 rounded-lg text-sm font-bold border ${!authHeaders || loading ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-indigo-600 text-white border-indigo-600'}`}
                >
                  保存
                </button>
              </div>
            </div>
            <textarea
              className="w-full min-h-[520px] font-mono text-[12px] border border-gray-200 rounded-2xl p-4 outline-none focus:border-indigo-400 bg-white"
              value={cemeteryText}
              onChange={(e) => setCemeteryText(e.target.value)}
              placeholder='点击“加载”后会自动填充 JSON。示例字段：{"rows":["A"],"cols":10,"zones":[...],"zone_by_col":["basic"],"sold":[],"locked":[],"expired":[]}'
            />
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <div className="text-sm font-black text-gray-900">商城分类配置</div>
                  <div className="text-xs text-gray-500">支持 items[].labels 多语言、排序 order、enabled、icon，以及 services 的 subs。</div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={!authHeaders || loading}
                    onClick={loadCategoriesConfig}
                    className={`px-3 py-2 rounded-lg text-sm font-bold border ${!authHeaders || loading ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-white text-gray-700 border-gray-200'}`}
                  >
                    加载
                  </button>
                  <button
                    type="button"
                    disabled={!authHeaders || loading}
                    onClick={saveCategoriesConfig}
                    className={`px-3 py-2 rounded-lg text-sm font-bold border ${!authHeaders || loading ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-indigo-600 text-white border-indigo-600'}`}
                  >
                    保存
                  </button>
                </div>
              </div>
              <textarea
                className="w-full min-h-[520px] font-mono text-[12px] border border-gray-200 rounded-2xl p-4 outline-none focus:border-indigo-400 bg-white"
                value={categoriesText}
                onChange={(e) => setCategoriesText(e.target.value)}
                placeholder='点击“加载”后会自动填充 JSON。示例字段：{"items":[{"id":"services","order":1,"labels":{"ZH":"爱心善终"},"subs":[...]}]}'
              />
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <div className="text-sm font-black text-gray-900">手机号别名映射</div>
                  <div className="text-xs text-gray-500">用于兼容 tg_xxx 等历史手机号；查询与写入都会自动走 canonical phone。</div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={!authHeaders || loading}
                    onClick={loadPhoneAliases}
                    className={`px-3 py-2 rounded-lg text-sm font-bold border ${!authHeaders || loading ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-white text-gray-700 border-gray-200'}`}
                  >
                    刷新
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div className="md:col-span-1">
                  <div className="text-xs font-bold text-gray-600 mb-1">搜索</div>
                  <input
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white"
                    placeholder="按 alias/canonical 搜索"
                    value={aliasQuery}
                    onChange={(e) => setAliasQuery(e.target.value)}
                  />
                </div>
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
                  <div>
                    <div className="text-xs font-bold text-gray-600 mb-1">alias_phone</div>
                    <input
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white"
                      placeholder="例如：tg_12345"
                      value={aliasDraft.alias_phone}
                      onChange={(e) => setAliasDraft((p) => ({ ...p, alias_phone: e.target.value }))}
                    />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-600 mb-1">canonical_phone</div>
                    <input
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white"
                      placeholder="例如：+855xxxxxxxxx"
                      value={aliasDraft.canonical_phone}
                      onChange={(e) => setAliasDraft((p) => ({ ...p, canonical_phone: e.target.value }))}
                    />
                  </div>
                  <button
                    type="button"
                    disabled={!authHeaders || loading}
                    onClick={savePhoneAlias}
                    className={`px-3 py-2 rounded-lg text-sm font-bold border ${!authHeaders || loading ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-indigo-600 text-white border-indigo-600'}`}
                  >
                    保存映射
                  </button>
                </div>
              </div>

              <div className="overflow-auto border border-gray-200 rounded-2xl">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="text-left px-3 py-2">alias_phone</th>
                      <th className="text-left px-3 py-2">canonical_phone</th>
                      <th className="text-left px-3 py-2">user_id</th>
                      <th className="text-left px-3 py-2">telegram_id</th>
                      <th className="text-left px-3 py-2">created_at</th>
                    </tr>
                  </thead>
                  <tbody>
                    {phoneAliases.length ? (
                      phoneAliases.map((r) => (
                        <tr key={String(r.alias_phone || '')} className="border-t">
                          <td className="px-3 py-2 font-mono text-[12px]">{String(r.alias_phone || '')}</td>
                          <td className="px-3 py-2 font-mono text-[12px]">{String(r.canonical_phone || '')}</td>
                          <td className="px-3 py-2 font-mono text-[12px]">{String(r.user_id || '')}</td>
                          <td className="px-3 py-2 font-mono text-[12px]">{String(r.telegram_id || '')}</td>
                          <td className="px-3 py-2 text-[12px] text-gray-500">{String(r.created_at || '')}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-3 py-6 text-center text-gray-500" colSpan="5">
                          暂无数据
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
