import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import PaymentLinksPage from "./pages/PaymentLinksPage";
import OrdersPage from "./pages/OrdersPage";
import PaymentMethodsPage from "./pages/PaymentMethodsPage";
import CurrenciesPage from "./pages/CurrenciesPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import PayoutsPage from "./pages/PayoutsPage";
import StatisticsPage from "./pages/StatisticsPage";
import CustomersPage from "./pages/CustomersPage";
import SettingsPage from "./pages/SettingsPage";
import HelpCenterPage from "./pages/HelpCenterPage";
import DeveloperDocsPage from "./pages/DeveloperDocsPage";
import PublicPaymentPage from "./pages/PublicPaymentPage";
import DeveloperSettings from "./pages/DeveloperSettings";
import OAuthConsentPage from "./pages/OAuthConsentPage";
import NotificationsPage from "./pages/NotificationsPage";

// Auth & Admin
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageUsers from "./pages/admin/ManageUsers";
import ManageCompanies from "./pages/admin/ManageCompanies";
import ManageApiKeys from "./pages/admin/ManageApiKeys";
import SystemSettings from "./pages/admin/SystemSettings";
import ManageSupport from "./pages/admin/ManageSupport";
import AdminNotificationsPage from "./pages/admin/AdminNotificationsPage";
import ManageReferralCodes from "./pages/admin/ManageReferralCodes";
import ManageApps from "./pages/admin/ManageApps";

import { AppProvider, useAppContext } from "./contexts/AppContext";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, role }: { children: React.ReactNode, role?: "seller" | "admin" }) => {
  const { isAuthenticated, userProfile } = useAppContext();

  if (!isAuthenticated || !userProfile) return <Navigate to="/login" replace />;
  if (role && userProfile.role !== role) {
    if (userProfile.role === "admin") return <Navigate to="/admin" replace />;
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Seller Dashboard */}
        <Route path="/" element={<ProtectedRoute role="seller"><Index /></ProtectedRoute>} />
        <Route path="/payment-links" element={<ProtectedRoute role="seller"><PaymentLinksPage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute role="seller"><NotificationsPage /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute role="seller"><OrdersPage /></ProtectedRoute>} />
        <Route path="/payment-methods" element={<ProtectedRoute role="seller"><PaymentMethodsPage /></ProtectedRoute>} />
        <Route path="/currencies" element={<ProtectedRoute role="seller"><CurrenciesPage /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute role="seller"><StatisticsPage /></ProtectedRoute>} />
        <Route path="/statistics" element={<ProtectedRoute role="seller"><StatisticsPage /></ProtectedRoute>} />
        <Route path="/payouts" element={<ProtectedRoute role="seller"><PayoutsPage /></ProtectedRoute>} />
        <Route path="/customers" element={<ProtectedRoute role="seller"><CustomersPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute role="seller"><SettingsPage /></ProtectedRoute>} />
        <Route path="/help-center" element={<ProtectedRoute role="seller"><HelpCenterPage /></ProtectedRoute>} />
        <Route path="/developer-docs" element={<ProtectedRoute role="seller"><DeveloperDocsPage /></ProtectedRoute>} />
        <Route path="/developer/settings" element={<ProtectedRoute role="seller"><DeveloperSettings /></ProtectedRoute>} />
        <Route path="/oauth/authorize" element={<ProtectedRoute><OAuthConsentPage /></ProtectedRoute>} />


        {/* Admin Dashboard */}
        <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute role="admin"><ManageUsers /></ProtectedRoute>} />
        <Route path="/admin/companies" element={<ProtectedRoute role="admin"><ManageCompanies /></ProtectedRoute>} />
        <Route path="/admin/api-keys" element={<ProtectedRoute role="admin"><ManageApiKeys /></ProtectedRoute>} />
        <Route path="/admin/revenue" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/payouts" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute role="admin"><SystemSettings /></ProtectedRoute>} />
        <Route path="/admin/support" element={<ProtectedRoute role="admin"><ManageSupport /></ProtectedRoute>} />
        <Route path="/admin/notifications" element={<ProtectedRoute role="admin"><AdminNotificationsPage /></ProtectedRoute>} />
        <Route path="/admin/referrals" element={<ProtectedRoute role="admin"><ManageReferralCodes /></ProtectedRoute>} />
        <Route path="/admin/apps" element={<ProtectedRoute role="admin"><ManageApps /></ProtectedRoute>} />

        {/* Public Routes */}
        <Route path="/pay/:slug" element={<PublicPaymentPage />} />
        <Route path="/pay/:slug/callback" element={<PublicPaymentPage />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <AppProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppRoutes />
      </TooltipProvider>
    </QueryClientProvider>
  </AppProvider>
);

export default App;
