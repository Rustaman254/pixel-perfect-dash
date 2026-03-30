import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Lock, User, LogIn, Eye, EyeOff, ShoppingCart, ArrowLeft } from 'lucide-react';

export default function SignupPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.fullName) return;
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/onboarding');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-[#F8F9FA] font-sans text-black selection:bg-[#D4F655] selection:text-black">
      {/* Left panel (Image/Brand area) */}
      <div className="hidden lg:flex w-1/2 bg-[#0A0A0A] p-12 text-white flex-col justify-between relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-[#D4F655]/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-8 h-8 flex items-center justify-center relative">
            <ShoppingCart className="w-6 h-6 text-[#D4F655]" />
          </div>
          <span className="text-xl font-bold tracking-tight">Shopalize</span>
        </div>

        <div className="relative z-10 max-w-lg">
          <h2 className="text-[44px] font-medium leading-[1.1] tracking-tight mb-6">
            Start building your dream business today.
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            Get 14 days of full access to all essential ecommerce tools. Start making sales before choosing a plan.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-sm text-gray-500">
           <div className="flex -space-x-2">
             <div className="w-8 h-8 rounded-full bg-gray-500 border-2 border-[#0A0A0A]" />
             <div className="w-8 h-8 rounded-full bg-gray-400 border-2 border-[#0A0A0A]" />
           </div>
           <span>No credit card required for trial</span>
        </div>
      </div>

      {/* Right panel (Form area) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 lg:p-12 relative">
        <button onClick={() => navigate('/')} className="absolute top-8 left-8 lg:left-12 flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-black transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </button>

        <div className="w-full max-w-sm">
          <div className="mb-10 lg:hidden flex items-center gap-2">
            <div className="w-8 h-8 bg-[#0A0A0A] rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-[#D4F655]" />
            </div>
            <span className="text-xl font-bold tracking-tight">Shopalize</span>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-medium tracking-tight mb-2">Create account</h2>
            <p className="text-gray-500">Sign up to launch your new storefront.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-50 text-red-600 border border-red-200 text-sm px-4 py-3 rounded-xl font-medium">{error}</div>}
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                <input type="text" placeholder="Enter your name" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl text-[15px] outline-none transition-all bg-white border border-gray-200 focus:border-black focus:ring-1 focus:ring-black placeholder:text-gray-400"
                  required />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                <input type="email" placeholder="Enter your email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl text-[15px] outline-none transition-all bg-white border border-gray-200 focus:border-black focus:ring-1 focus:ring-black placeholder:text-gray-400"
                  required />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                <input type={showPassword ? 'text' : 'password'} placeholder="Create a password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full pl-11 pr-12 py-3.5 rounded-xl text-[15px] outline-none transition-all bg-white border border-gray-200 focus:border-black focus:ring-1 focus:ring-black placeholder:text-gray-400"
                  required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-gray-400 hover:text-black transition-colors">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-4 rounded-xl font-medium text-white flex items-center justify-center gap-2 mt-6 transition-colors disabled:opacity-70 bg-[#0A0A0A] hover:bg-[#D4F655] hover:text-black group">
              {loading ? 'Creating account...' : 'Create Account'} <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <p className="text-center text-[15px] mt-8 text-gray-600">
            Already have an account? <button onClick={() => navigate('/login')} className="font-semibold text-black hover:underline decoration-2 underline-offset-4">Log in</button>
          </p>
        </div>
      </div>
    </div>
  );
}
