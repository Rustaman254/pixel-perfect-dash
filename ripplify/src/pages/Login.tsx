import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Mail, Lock, LogIn, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/contexts/AppContext";
import Logo from "@/components/Logo";
import { BASE_URL } from "@/lib/api";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { login, isAuthenticated, userProfile } = useAppContext();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (isAuthenticated === null) return;
    
    if (isAuthenticated && userProfile?.role === "seller") {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, userProfile, navigate]);

  useEffect(() => {
    if (searchParams.get('error') === 'disabled') {
      setErrorMessage("Your account has been disabled. Contact support for assistance.");
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Error", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role: "seller" })
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.message?.includes("disabled")) {
          setErrorMessage("Your account has been disabled. Contact support for assistance.");
          toast({
            title: "Account Disabled",
            description: "Your account has been disabled. Contact support for assistance.",
            variant: "destructive"
          });
        } else {
          throw new Error(data.message || "Login failed");
        }
      } else {
        login(data.user, data.token);
        toast({ title: "Welcome back!", description: "Logged in to your seller dashboard." });
        navigate("/");
      }
    } catch (err: unknown) {
      const error = err as Error;
      if (!errorMessage) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-blue-200 overflow-hidden">
        <div className="p-8">
          <div className="mb-8 flex justify-center">
            <Logo size={48} textClassName="text-3xl" />
          </div>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Seller Portal</h2>
            <p className="text-slate-500 text-sm">Access your Ripplify business dashboard</p>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  placeholder="Enter your seller email"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70"
            >
              {loading ? "Logging in..." : "Log In"}
              <LogIn className="w-5 h-5" />
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account? <button onClick={() => navigate("/signup")} className="text-blue-600 font-bold hover:underline">Create Business Account</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;