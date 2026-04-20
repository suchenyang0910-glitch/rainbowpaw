import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './rainbowpaw.css'
import App from './App.jsx'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import MiniAppPage from './pages/MiniAppPage.jsx'
import MerchantPortalPage from './pages/MerchantPortalPage.jsx'
import MarketplacePage from './pages/MarketplacePage.jsx'
import ProductDetailPage from './pages/ProductDetailPage.jsx'
import CartPage from './pages/CartPage.jsx'
import SalesCrmDashboardPage from './pages/SalesCrmDashboardPage.jsx'
import SalesCrmLeadPage from './pages/SalesCrmLeadPage.jsx'
import AftercareQuoteCustomerPage from './pages/AftercareQuoteCustomerPage.jsx'
import AdminApp from './admin/AdminApp'
import { LocaleHome, RootRedirect } from './routing/LocaleRoutes.jsx'

import CarePlanPage from './pages/CarePlanPage.jsx'
import ServicesPage from './pages/ServicesPage.jsx'
import MemorialPage from './pages/MemorialPage.jsx'

function AdminLegacyRedirect() {
  const location = useLocation()
  const nextPathname = String(location.pathname || '').replace(/^\/admin(\/|$)/, '/console$1')
  const next = `${nextPathname}${location.search || ''}${location.hash || ''}`
  return <Navigate to={next} replace />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/:locale" element={<LocaleHome />} />

        <Route path="/rainbowpawclaw" element={<App />} />
        <Route path="/rainbowpawclaw/*" element={<App />} />
        
        <Route path="/care" element={<CarePlanPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/memorial" element={<MemorialPage />} />

        <Route path="/rainbowpaw" element={<MiniAppPage />} />
        <Route path="/rainbowpaw/crm" element={<SalesCrmDashboardPage />} />
        <Route path="/rainbowpaw/crm/leads/:leadId" element={<SalesCrmLeadPage />} />
        <Route path="/rainbowpaw/aftercare/quote/:token" element={<AftercareQuoteCustomerPage />} />
        <Route path="/rainbowpaw/merchant" element={<MerchantPortalPage />} />
        <Route path="/rainbowpaw/marketplace" element={<MarketplacePage />} />
        <Route path="/rainbowpaw/marketplace/product/:productId" element={<ProductDetailPage />} />
        <Route path="/rainbowpaw/marketplace/cart" element={<CartPage />} />

        <Route path="/console/*" element={<AdminApp />} />
        <Route path="/admin/*" element={<AdminLegacyRedirect />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
