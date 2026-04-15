import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import NotFound from "./pages/NotFound";

// Auth
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ForgotPassword from "./pages/auth/ForgotPassword";

// Forms
import FormsDashboard from "./pages/forms/FormsDashboard";
import FormBuilder from "./pages/forms/FormBuilder";
import FormView from "./pages/forms/FormView";
import FormResponses from "./pages/forms/FormResponses";

import { AppProvider, useAppContext } from "./contexts/AppContext";
import AIAssistant from "./components/ai/AIAssistant";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, userProfile } = useAppContext();

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#025864]"></div>
      </div>
    );
  }

  if (!isAuthenticated || !userProfile) return <Navigate to="/login" replace />;

  if ((userProfile as any).isDisabled || userProfile.accountStatus === 'disabled') {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('ripplify_profile');
    return <Navigate to="/login?error=disabled" replace />;
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

        {/* Forms Dashboard */}
        <Route path="/" element={<ProtectedRoute><FormsDashboard /></ProtectedRoute>} />
        <Route path="/forms" element={<ProtectedRoute><FormsDashboard /></ProtectedRoute>} />
        <Route path="/forms/new" element={<ProtectedRoute><FormBuilder /></ProtectedRoute>} />
        <Route path="/forms/edit/:formId" element={<ProtectedRoute><FormBuilder /></ProtectedRoute>} />
        <Route path="/forms/responses/:formId" element={<ProtectedRoute><FormResponses /></ProtectedRoute>} />

        {/* Public Form View */}
        <Route path="/f/:slug" element={<FormView />} />
        <Route path="/form/:slug" element={<FormView />} />

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
        <AIAssistant productName="Forms" />
      </TooltipProvider>
    </QueryClientProvider>
  </AppProvider>
);

export default App;