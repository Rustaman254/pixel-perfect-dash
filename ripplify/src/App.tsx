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
import WalletsPage from "./pages/WalletsPage";
import StatisticsPage from "./pages/StatisticsPage";
import CustomersPage from "./pages/CustomersPage";
import SettingsPage from "./pages/SettingsPage";
import HelpCenterPage from "./pages/HelpCenterPage";
import DeveloperDocsPage from "./pages/DeveloperDocsPage";
import PublicPaymentPage from "./pages/PublicPaymentPage";
import DeveloperSettings from "./pages/DeveloperSettings";
import OAuthConsentPage from "./pages/OAuthConsentPage";
import NotificationsPage from "./pages/NotificationsPage";
import TransfersPage from "./pages/TransfersPage";

// Auth
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ForgotPassword from "./pages/auth/ForgotPassword";

import { AppProvider, useAppContext } from "./contexts/AppContext";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, userProfile } = useAppContext();

  if (!isAuthenticated || !userProfile) return <Navigate to="/login" replace />;

  // Check if user account is disabled/suspended
  if ((userProfile as any).isDisabled || userProfile.accountStatus === 'disabled') {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('ripplify_profile');
    return <Navigate to="/login?error=disabled" replace />;
  }

  // Redirect admin users to the admin panel
  if (userProfile.role === "admin") {
    window.location.href = "http://localhost:8083";
    return null;
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
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Seller Dashboard */}
        <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
        <Route path="/payment-links" element={<ProtectedRoute><PaymentLinksPage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
        <Route path="/payment-methods" element={<ProtectedRoute><PaymentMethodsPage /></ProtectedRoute>} />
        <Route path="/currencies" element={<ProtectedRoute><CurrenciesPage /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><StatisticsPage /></ProtectedRoute>} />
        <Route path="/statistics" element={<ProtectedRoute><StatisticsPage /></ProtectedRoute>} />
        <Route path="/payouts" element={<ProtectedRoute><PayoutsPage /></ProtectedRoute>} />
        <Route path="/transfers" element={<ProtectedRoute><TransfersPage /></ProtectedRoute>} />
        <Route path="/wallets" element={<ProtectedRoute><WalletsPage /></ProtectedRoute>} />
        <Route path="/wallet" element={<Navigate to="/wallets" replace />} />
        <Route path="/customers" element={<ProtectedRoute><CustomersPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/help-center" element={<ProtectedRoute><HelpCenterPage /></ProtectedRoute>} />
        <Route path="/developer-docs" element={<ProtectedRoute><DeveloperDocsPage /></ProtectedRoute>} />
        <Route path="/developer/settings" element={<ProtectedRoute><DeveloperSettings /></ProtectedRoute>} />
        <Route path="/oauth/authorize" element={<ProtectedRoute><OAuthConsentPage /></ProtectedRoute>} />

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
