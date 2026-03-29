import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import AdminLayout from '@/components/AdminLayout'
import HomePage from '@/pages/HomePage'
import GalleryPage from '@/pages/GalleryPage'
import EditorPage from '@/pages/EditorPage'
import PreviewPage from '@/pages/PreviewPage'
import TemplatePreviewPage from '@/pages/TemplatePreviewPage'
import DashboardPage from '@/pages/DashboardPage'
import ProductsPage from '@/pages/ProductsPage'
import ProductEditPage from '@/pages/ProductEditPage'
import OrdersPage from '@/pages/OrdersPage'
import CustomersPage from '@/pages/CustomersPage'
import SettingsPage from '@/pages/SettingsPage'
import OnlineStorePage from '@/pages/OnlineStorePage'
import AnalyticsPage from '@/pages/AnalyticsPage'
import MarketingPage from '@/pages/MarketingPage'
import DiscountsPage from '@/pages/DiscountsPage'
import LoginPage from '@/pages/LoginPage'
import SignupPage from '@/pages/SignupPage'

import IntegrationsPage from '@/pages/IntegrationsPage'
import ResetPasswordPage from '@/pages/ResetPasswordPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#f5f7f9' }}><div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" /></div>
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/gallery" element={<GalleryPage />} />
      <Route path="/integrations" element={<IntegrationsPage />} />
      <Route path="/editor/:projectId" element={<EditorPage />} />
      <Route path="/preview/:projectId" element={<PreviewPage />} />
      <Route path="/preview-template/:templateId" element={<TemplatePreviewPage />} />

      {/* Admin (protected with sidebar layout) */}
      <Route path="/" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/:id" element={<ProductEditPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="marketing" element={<MarketingPage />} />
        <Route path="discounts" element={<DiscountsPage />} />
        <Route path="online-store" element={<OnlineStorePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
