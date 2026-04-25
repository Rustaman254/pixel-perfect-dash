import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, User, Lock, Bank, Phone, ArrowRight, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/contexts/AppContext";
import Logo from "@/components/Logo";
import { BASE_URL } from "@/lib/api";

const Signup = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    businessName: "",
    idType: "",
    idNumber: "",
    location: "",
    role: "seller"
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAppContext();

  useEffect(() => {
    if (isAuthenticated === null) return;
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.fullName) {
      toast({ title: "Error", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Registration failed");
      }

      toast({ title: "Registration Successful!", description: "Account created successfully. Please login." });
      navigate("/login");
    } catch (err: unknown) {
      const error = err as Error;
      toast({ title: "Registration Failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-emerald-200 overflow-hidden">
        <div className="p-8">
          <div className="mb-8 flex justify-center">
            <Logo size={48} textClassName="text-3xl" />
          </div>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Create Business Account</h2>
            <p className="text-slate-500 text-sm">Join Ripplify SME Platform - Empowering Kenyan MSMEs</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <input
                    name="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition-all"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">ID Type</label>
                <select
                  name="idType"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition-all"
                  value={formData.idType}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select ID Type</option>
                  <option value="National ID">National ID</option>
                  <option value="Passport">Passport</option>
                  <option value="Business License">Business License</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  name="email"
                  type="email"
                  placeholder="Enter your email address"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition-all"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <input
                    name="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition-all"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Business Name</label>
                <div className="relative">
                  <Bank className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <input
                    name="businessName"
                    type="text"
                    placeholder="Enter your business name"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition-all"
                    value={formData.businessName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">ID Number</label>
                <input
                  name="idNumber"
                  type="text"
                  placeholder="Enter ID number"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition-all"
                  value={formData.idNumber}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Location</label>
                <input
                  name="location"
                  type="text"
                  placeholder="Enter your business location (County/City)"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition-all"
                  value={formData.location}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a secure password"
                  className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition-all"
                  value={formData.password}
                  onChange={handleChange}
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

            <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <span className="text-xs text-emerald-700">Sign up as a Seller on Ripplify SME Platform</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70"
            >
              {loading ? "Creating Account..." : "Create Business Account"}
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account? <button onClick={() => navigate("/login")} className="text-emerald-600 font-bold hover:underline">Login here</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;