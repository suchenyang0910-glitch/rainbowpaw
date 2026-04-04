import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './rainbowpaw.css'
import App from './App.jsx'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
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

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/:locale" element={<LocaleHome />} />

        <Route path="/rainbowpawclaw" element={<App />} />

        <Route path="/rainbowpaw" element={<MiniAppPage />} />
        <Route path="/rainbowpaw/crm" element={<SalesCrmDashboardPage />} />
        <Route path="/rainbowpaw/crm/leads/:leadId" element={<SalesCrmLeadPage />} />
        <Route path="/rainbowpaw/aftercare/quote/:token" element={<AftercareQuoteCustomerPage />} />
        <Route path="/rainbowpaw/merchant" element={<MerchantPortalPage />} />
        <Route path="/rainbowpaw/marketplace" element={<MarketplacePage />} />
        <Route path="/rainbowpaw/marketplace/product/:productId" element={<ProductDetailPage />} />
        <Route path="/rainbowpaw/marketplace/cart" element={<CartPage />} />

        <Route path="/admin/*" element={<AdminApp />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
