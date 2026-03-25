import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Mail, Lock, LogIn, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/contexts/AppContext";
import Logo from "@/components/Logo";
import { BASE_URL } from "@/lib/api";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { login, isAuthenticated, userProfile } = useAppContext();
  const [searchParams] = useSearchParams();

  // If already logged in as admin, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated && userProfile?.role === "admin") {
      navigate("/admin", { replace: true });
    }
  }, [isAuthenticated, userProfile, navigate]);

  useEffect(() => {
    if (searchParams.get('error') === 'disabled') {
      toast({
        title: "Account Disabled",
        description: "Your account has been disabled. Contact support for assistance.",
        variant: "destructive"
      });
    }
  }, [searchParams, toast]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Error", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role: "admin" })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Verify this is actually an admin
      if (data.user?.role !== "admin") {
        throw new Error("Access denied. This login is for administrators only.");
      }

      login(data.user, data.token);
      toast({ title: "Welcome, Admin!", description: "Logged in to the admin panel." });
      navigate("/admin");
    } catch (err: unknown) {
      const error = err as Error;
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800 rounded-3xl shadow-2xl border border-slate-700 overflow-hidden">
        <div className="h-1.5 w-full bg-red-500" />
        <div className="p-8">
          <div className="mb-8 flex justify-center">
            <Logo size={40} textClassName="text-2xl" />
          </div>

          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-400 rounded-full text-xs font-bold mb-4">
              <ShieldAlert className="w-3.5 h-3.5" />
              Admin Access
            </div>
            <h2 className="text-2xl font-bold text-white">Admin Portal</h2>
            <p className="text-slate-400 text-sm mt-1">Sign in to manage the Ripplify platform.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
              <input
                type="email" placeholder="Admin Email"
                className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder:text-slate-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
              <input
                type="password" placeholder="Password"
                className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder:text-slate-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-sm font-medium text-red-400 hover:underline"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70"
            >
              {loading ? "Signing in..." : "Sign In to Admin"} <LogIn className="w-5 h-5" />
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Are you a seller? <button onClick={() => navigate("/login")} className="text-[#00D47E] font-bold hover:underline">Go to Seller Login</button>
          </p>
        </div>
      </div>
      <p className="mt-8 text-slate-600 text-xs">© 2025 Ripplify Inc. All rights reserved.</p>
    </div>
  );
};

export default AdminLogin;
