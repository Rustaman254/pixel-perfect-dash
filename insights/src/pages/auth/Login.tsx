import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, LogIn, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/contexts/useAppContext";
import { cn } from "@/lib/utils";
import { BASE_URL } from "@/lib/api";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { login } = useAppContext();

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
        body: JSON.stringify({ email, password, role: isAdmin ? "admin" : "seller" })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }

      login(data.user, data.token);
      toast({
        title: "Welcome back!",
        description: `Logged in as ${isAdmin ? "Super Admin" : "Seller"}`,
      });
      navigate(isAdmin ? "/admin" : "/");
    } catch (err: unknown) {
      const error = err as Error;
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="p-8">
          <div className="flex items-center gap-2 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-[#025864] flex items-center justify-center text-white font-bold text-xl">R</div>
            <span className="text-2xl font-bold text-[#025864]">Ripplify</span>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Welcome Back</h2>
            <p className="text-slate-500 text-sm mt-1">Log in to manage your {isAdmin ? "platform" : "business"}.</p>
          </div>

          <div className="flex p-1 bg-slate-100 rounded-xl mb-8">
            <button
              onClick={() => setIsAdmin(false)}
              className={cn(
                "flex-1 py-2 text-sm font-bold rounded-lg transition-all",
                !isAdmin ? "bg-white text-[#025864] shadow-sm" : "text-slate-500"
              )}
            >
              Seller
            </button>
            <button
              onClick={() => setIsAdmin(true)}
              className={cn(
                "flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1",
                isAdmin ? "bg-white text-red-600 shadow-sm" : "text-slate-500"
              )}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Admin
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input
                type="email" placeholder="Email Address"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#025864]/20 focus:border-[#025864] outline-none transition-all"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input
                type="password" placeholder="Password"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#025864]/20 focus:border-[#025864] outline-none transition-all"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 mt-4",
                isAdmin ? "bg-red-600 hover:bg-red-700" : "bg-[#025864] hover:bg-[#013a42]",
                loading && "opacity-70"
              )}
            >
              {loading ? "Logging in..." : "Log In"} <LogIn className="w-5 h-5" />
            </button>
          </form>

          {!isAdmin && (
            <p className="text-center text-sm text-slate-500 mt-6">
              Don't have an account? <button onClick={() => navigate("/signup")} className="text-[#025864] font-bold">Sign up</button>
            </p>
          )}
        </div>
      </div>
      <p className="mt-8 text-slate-400 text-xs">© 2025 Ripplify Inc. All rights reserved.</p>
    </div>
  );
};

export default Login;
