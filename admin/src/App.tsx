import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AppProvider, useAppContext } from "@/contexts/AppContext";
import { ProjectProvider } from "@/contexts/ProjectContext";

import AdminLogin from "@/pages/AdminLogin";
import Dashboard from "@/pages/Dashboard";
import AdminAnalyticsPage from "@/pages/AdminAnalyticsPage";
import ManageUsers from "@/pages/ManageUsers";
import ManageCompanies from "@/pages/ManageCompanies";
import ManageRoles from "@/pages/ManageRoles";
import AdminTransactionsPage from "@/pages/AdminTransactionsPage";
import AdminPayoutsPage from "@/pages/AdminPayoutsPage";
import ManageApiKeys from "@/pages/ManageApiKeys";
import ManageReferralCodes from "@/pages/ManageReferralCodes";
import SystemSettings from "@/pages/SystemSettings";
import ManageFeatureFlags from "@/pages/ManageFeatureFlags";
import ManageApps from "@/pages/ManageApps";
import ManageSupport from "@/pages/ManageSupport";
import AdminNotificationsPage from "@/pages/AdminNotificationsPage";
import WatchtowerDashboard from "@/pages/WatchtowerDashboard";
import ShopalizeDashboard from "@/pages/ShopalizeDashboard";
import StoreManagement from "@/pages/StoreManagement";
import OrderManagement from "@/pages/OrderManagement";
import ProductManagement from "@/pages/ProductManagement";
import CustomerManagement from "@/pages/CustomerManagement";
import ShopalizeAnalytics from "@/pages/ShopalizeAnalytics";
import ShopalizeFeatureFlags from "@/pages/ShopalizeFeatureFlags";
import ShopalizeSettings from "@/pages/ShopalizeSettings";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, userProfile } = useAppContext();
  if (!isAuthenticated || !userProfile) return <Navigate to="/login" replace />;
  if (userProfile.role !== "admin") return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AppRoutes = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<AdminLogin />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><AdminAnalyticsPage /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute><ManageUsers /></ProtectedRoute>} />
      <Route path="/companies" element={<ProtectedRoute><ManageCompanies /></ProtectedRoute>} />
      <Route path="/roles" element={<ProtectedRoute><ManageRoles /></ProtectedRoute>} />
      <Route path="/transactions" element={<ProtectedRoute><AdminTransactionsPage /></ProtectedRoute>} />
      <Route path="/payouts" element={<ProtectedRoute><AdminPayoutsPage /></ProtectedRoute>} />
      <Route path="/api-keys" element={<ProtectedRoute><ManageApiKeys /></ProtectedRoute>} />
      <Route path="/referrals" element={<ProtectedRoute><ManageReferralCodes /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SystemSettings /></ProtectedRoute>} />
      <Route path="/features" element={<ProtectedRoute><ManageFeatureFlags /></ProtectedRoute>} />
      <Route path="/apps" element={<ProtectedRoute><ManageApps /></ProtectedRoute>} />
      <Route path="/support" element={<ProtectedRoute><ManageSupport /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><AdminNotificationsPage /></ProtectedRoute>} />
      <Route path="/watchtower" element={<ProtectedRoute><WatchtowerDashboard /></ProtectedRoute>} />
      {/* Shopalize Admin Routes */}
      <Route path="/shopalize" element={<ProtectedRoute><ShopalizeDashboard /></ProtectedRoute>} />
      <Route path="/shopalize/stores" element={<ProtectedRoute><StoreManagement /></ProtectedRoute>} />
      <Route path="/shopalize/orders" element={<ProtectedRoute><OrderManagement /></ProtectedRoute>} />
      <Route path="/shopalize/products" element={<ProtectedRoute><ProductManagement /></ProtectedRoute>} />
      <Route path="/shopalize/customers" element={<ProtectedRoute><CustomerManagement /></ProtectedRoute>} />
      <Route path="/shopalize/analytics" element={<ProtectedRoute><ShopalizeAnalytics /></ProtectedRoute>} />
      <Route path="/shopalize/features" element={<ProtectedRoute><ShopalizeFeatureFlags /></ProtectedRoute>} />
      <Route path="/shopalize/settings" element={<ProtectedRoute><ShopalizeSettings /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);

const App = () => (
  <AppProvider>
    <ProjectProvider>
      <QueryClientProvider client={queryClient}>
        <AppRoutes />
        <Toaster position="bottom-right" richColors closeButton />
      </QueryClientProvider>
    </ProjectProvider>
  </AppProvider>
);

export default App;
