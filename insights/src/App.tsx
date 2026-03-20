import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import NotFound from "./pages/NotFound";
import WatchtowerOverview from "./pages/Overview";
import EntityAnalytics from "./pages/EntityAnalytics";
import SessionsPage from "./pages/Sessions";
import SetupPage from "./pages/Setup";
import AdminOverview from "./pages/AdminOverview";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";

import { AppProvider } from "./contexts/AppContext";
import { useAppContext } from "./contexts/useAppContext";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, userProfile } = useAppContext();

  // If not authenticated, always go to login
  if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
  }

  // If profile is missing but authenticated, something is wrong, go to login
  if (!userProfile) {
     return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route path="/watchtower" element={<ProtectedRoute><WatchtowerOverview /></ProtectedRoute>} />
        <Route path="/watchtower/entity/:id" element={<ProtectedRoute><EntityAnalytics /></ProtectedRoute>} />
        <Route path="/watchtower/sessions" element={<ProtectedRoute><SessionsPage /></ProtectedRoute>} />

        {/* Watchtower - Standalone Product (Root) */}
        <Route path="/sessions" element={<ProtectedRoute><SessionsPage /></ProtectedRoute>} />
        <Route path="/entity/:id" element={<ProtectedRoute><EntityAnalytics /></ProtectedRoute>} />
        <Route path="/setup" element={<ProtectedRoute><SetupPage /></ProtectedRoute>} />
        <Route path="/admin/platform" element={<ProtectedRoute><AdminOverview /></ProtectedRoute>} />
        <Route path="/" element={<ProtectedRoute><WatchtowerOverview /></ProtectedRoute>} />

        <Route path="*" element={<RouteComponent />} />
      </Routes>
    </BrowserRouter>
  );
};

// Error boundary fallback component
const RouteComponent = () => <NotFound />;

const App = () => (
  <React.Suspense fallback={<div className="h-screen w-screen flex items-center justify-center">Loading...</div>}>
    <AppProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppRoutes />
        </TooltipProvider>
      </QueryClientProvider>
    </AppProvider>
  </React.Suspense>
);

export default App;
