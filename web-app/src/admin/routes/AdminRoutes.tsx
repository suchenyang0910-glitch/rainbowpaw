import { Authenticated } from '@refinedev/core'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { Result } from 'antd'
import { AdminLayout } from '../layouts/AdminLayout'
import { AdminLoginPage } from '../views/login/AdminLoginPage'
import { DashboardPage } from '../views/dashboard/DashboardPage'
import { UserListPage } from '../views/users/UserListPage'
import { UserShowPage } from '../views/users/UserShowPage'
import { BusinessSettingsPage } from '../views/settings/BusinessSettingsPage'
import { PlaceholderPage } from '../views/shared/PlaceholderPage'
import { RequirePermission } from '../views/shared/RequirePermission'
import { WithdrawRequestsPage } from '../views/wallet/WithdrawRequestsPage'
import { WalletOverviewPage } from '../views/wallet/WalletOverviewPage'
import { WalletLogsPage } from '../views/wallet/WalletLogsPage'
import { OrderListPage } from '../views/orders/OrderListPage'
import { ProductListPage } from '../views/store/ProductListPage'
import { ServiceListPage } from '../views/services/ServiceListPage'
import { MerchantListPage } from '../views/merchants/MerchantListPage'
import { BridgeReportsPage } from '../views/ops/BridgeReportsPage'
import { ConsoleOrderPage } from '../views/console/ConsoleOrderPage'
import { ConsoleReportPage } from '../views/console/ConsoleReportPage'
import { ClawPoolsPage } from '../views/claw/ClawPoolsPage'
import { ClawPlaysPage } from '../views/claw/ClawPlaysPage'
import { RiskPage } from '../views/risk/RiskPage'
import { RolesPage } from '../views/settings/RolesPage'
import { AiOpsPage } from '../views/ai/AiOpsPage'
import { AiGrowthPage } from '../views/ai/AiGrowthPage'
import { AiRiskPage } from '../views/ai/AiRiskPage'
import { AiTemplatesPage } from '../views/ai/AiTemplatesPage'
import { CrmLeadsPage } from '../views/crm/CrmLeadsPage'
import { CrmFollowupsPage } from '../views/crm/CrmFollowupsPage'
import { AftercarePricebooksPage } from '../views/crm/AftercarePricebooksPage'
import { AftercareQuotesPage } from '../views/crm/AftercareQuotesPage'

export function AdminRoutes() {
  return (
    <Routes>
      <Route path="login" element={<AdminLoginPage />} />

      <Route
        element={
          <Authenticated key="admin" redirectOnFail="/console/login">
            <AdminLayout>
              <Outlet />
            </AdminLayout>
          </Authenticated>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />

        <Route
          path="dashboard"
          element={
            <RequirePermission permission="page.dashboard.list">
              <DashboardPage />
            </RequirePermission>
          }
        />

        <Route
          path="dashboard/alerts"
          element={
            <RequirePermission permission="page.dashboardAlerts.list">
              <PlaceholderPage title="实时警报" />
            </RequirePermission>
          }
        />
        <Route
          path="users"
          element={
            <RequirePermission permission="page.users.list">
              <UserListPage />
            </RequirePermission>
          }
        />

        <Route
          path="users/:id"
          element={
            <RequirePermission permission="page.users.show">
              <UserShowPage />
            </RequirePermission>
          }
        />

        <Route
          path="users/tags"
          element={
            <RequirePermission permission="page.userTags.list">
              <PlaceholderPage title="用户标签管理" />
            </RequirePermission>
          }
        />
        <Route
          path="wallet"
          element={
            <RequirePermission permission="page.wallet.list">
              <WalletOverviewPage />
            </RequirePermission>
          }
        />
        <Route
          path="wallet/logs"
          element={
            <RequirePermission permission="page.walletLogs.list">
              <WalletLogsPage />
            </RequirePermission>
          }
        />
        <Route
          path="wallet/withdraw-requests"
          element={
            <RequirePermission permission="page.withdrawRequests.list">
              <WithdrawRequestsPage />
            </RequirePermission>
          }
        />

        <Route
          path="claw/pools"
          element={
            <RequirePermission permission="page.clawPools.list">
              <ClawPoolsPage />
            </RequirePermission>
          }
        />
        <Route
          path="claw/plays"
          element={
            <RequirePermission permission="page.clawPlays.list">
              <ClawPlaysPage />
            </RequirePermission>
          }
        />

        <Route
          path="claw/recycles"
          element={
            <RequirePermission permission="page.clawRecycles.list">
              <PlaceholderPage title="回收记录" />
            </RequirePermission>
          }
        />

        <Route
          path="groups"
          element={
            <RequirePermission permission="page.groups.list">
              <PlaceholderPage title="拼团列表" />
            </RequirePermission>
          }
        />

        <Route
          path="referrals"
          element={
            <RequirePermission permission="page.referrals.list">
              <PlaceholderPage title="分销列表" />
            </RequirePermission>
          }
        />

        <Route
          path="rewards"
          element={
            <RequirePermission permission="page.rewards.list">
              <PlaceholderPage title="奖励发放记录" />
            </RequirePermission>
          }
        />

        <Route
          path="orders"
          element={
            <RequirePermission permission="page.orders.list">
              <OrderListPage />
            </RequirePermission>
          }
        />

        <Route
          path="order"
          element={
            <RequirePermission permission="page.consoleOrder.list">
              <ConsoleOrderPage />
            </RequirePermission>
          }
        />

        <Route
          path="report"
          element={
            <RequirePermission permission="page.consoleReport.list">
              <ConsoleReportPage />
            </RequirePermission>
          }
        />

        <Route
          path="store/products"
          element={
            <RequirePermission permission="page.products.list">
              <ProductListPage />
            </RequirePermission>
          }
        />
        <Route
          path="services"
          element={
            <RequirePermission permission="page.services.list">
              <ServiceListPage />
            </RequirePermission>
          }
        />

        <Route
          path="services/cemetery"
          element={
            <RequirePermission permission="page.cemetery.list">
              <PlaceholderPage title="墓位 / 年费服务管理" />
            </RequirePermission>
          }
        />
        <Route
          path="merchants"
          element={
            <RequirePermission permission="page.merchants.list">
              <MerchantListPage />
            </RequirePermission>
          }
        />

        <Route
          path="merchants/orders"
          element={
            <RequirePermission permission="page.merchantOrders.list">
              <PlaceholderPage title="商家订单" />
            </RequirePermission>
          }
        />

        <Route
          path="merchants/settlements"
          element={
            <RequirePermission permission="page.merchantSettlements.list">
              <PlaceholderPage title="商家收益" />
            </RequirePermission>
          }
        />

        <Route
          path="ops/campaigns"
          element={
            <RequirePermission permission="page.campaigns.list">
              <PlaceholderPage title="活动配置" />
            </RequirePermission>
          }
        />

        <Route
          path="ops/reactivation"
          element={
            <RequirePermission permission="page.reactivation.list">
              <PlaceholderPage title="用户激活" />
            </RequirePermission>
          }
        />
        <Route
          path="ops/bridge"
          element={
            <RequirePermission permission="page.bridgeReports.list">
              <BridgeReportsPage />
            </RequirePermission>
          }
        />

        <Route
          path="crm/leads"
          element={
            <RequirePermission permission="page.crmLeads.list">
              <CrmLeadsPage />
            </RequirePermission>
          }
        />

        <Route
          path="crm/followups"
          element={
            <RequirePermission permission="page.crmFollowups.list">
              <CrmFollowupsPage />
            </RequirePermission>
          }
        />

        <Route
          path="crm/aftercare-quotes"
          element={
            <RequirePermission permission="page.aftercareQuotes.list">
              <AftercareQuotesPage />
            </RequirePermission>
          }
        />

        <Route
          path="crm/aftercare-pricebooks"
          element={
            <RequirePermission permission="page.aftercarePricebooks.list">
              <AftercarePricebooksPage />
            </RequirePermission>
          }
        />

        <Route
          path="ai/ops"
          element={
            <RequirePermission permission="page.aiOps.list">
              <AiOpsPage />
            </RequirePermission>
          }
        />

        <Route
          path="ai/growth"
          element={
            <RequirePermission permission="page.aiGrowth.list">
              <AiGrowthPage />
            </RequirePermission>
          }
        />

        <Route
          path="ai/templates"
          element={
            <RequirePermission permission="page.aiTemplates.list">
              <AiTemplatesPage />
            </RequirePermission>
          }
        />

        <Route
          path="ai/risk"
          element={
            <RequirePermission permission="page.aiRisk.list">
              <AiRiskPage />
            </RequirePermission>
          }
        />
        <Route
          path="risk"
          element={
            <RequirePermission permission="page.risk.list">
              <RiskPage />
            </RequirePermission>
          }
        />

        <Route
          path="risk/blacklist"
          element={
            <RequirePermission permission="page.riskBlacklist.list">
              <PlaceholderPage title="冻结 / 黑名单" />
            </RequirePermission>
          }
        />

        <Route
          path="settings/business"
          element={
            <RequirePermission permission="page.businessSettings.edit">
              <BusinessSettingsPage />
            </RequirePermission>
          }
        />

        <Route
          path="settings/roles"
          element={
            <RequirePermission permission="page.roles.list">
              <RolesPage />
            </RequirePermission>
          }
        />

        <Route path="*" element={<Result status="404" title="404" subTitle="页面不存在" />} />
      </Route>
    </Routes>
  )
}
