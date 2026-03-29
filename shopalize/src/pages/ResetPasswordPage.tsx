import { useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, KeyRound } from 'lucide-react';

export default function ResetPasswordPage() {
  const navigate = useNavigate();

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
            Regain access to your storefront.
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            Follow the instructions sent to your email to securely reset your password and jump right back into managing your business.
          </p>
        </div>

        <div className="relative z-10">
          <span className="text-sm text-gray-500">Secure AES-256 Encryption Standard</span>
        </div>
      </div>

      {/* Right panel (Form area) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 lg:p-12 relative">
        <button onClick={() => navigate('/login')} className="absolute top-8 left-8 lg:left-12 flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-black transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Login
        </button>

        <div className="w-full max-w-sm">
          <div className="mb-10 lg:hidden flex items-center gap-2">
            <div className="w-8 h-8 bg-[#0A0A0A] rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-[#D4F655]" />
            </div>
            <span className="text-xl font-bold tracking-tight">Shopalize</span>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-medium tracking-tight mb-2">Reset Password</h2>
            <p className="text-gray-500">Enter your email to receive a reset link.</p>
          </div>

          <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); alert('Reset link sent to your email.'); navigate('/login'); }}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Email Address</label>
              <div className="relative">
                <KeyRound className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                <input type="email" placeholder="Enter your email" 
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl text-[15px] outline-none transition-all bg-white border border-gray-200 focus:border-black focus:ring-1 focus:ring-black placeholder:text-gray-400"
                  required />
              </div>
            </div>

            <button type="submit"
              className="w-full py-4 rounded-xl font-medium text-white flex items-center justify-center gap-2 mt-6 transition-colors bg-[#0A0A0A] hover:bg-[#D4F655] hover:text-black">
              Send Reset Link
            </button>
          </form>

          <p className="text-center text-[15px] mt-8 text-gray-600">
            Remember your password? <button onClick={() => navigate('/login')} className="font-semibold text-black hover:underline decoration-2 underline-offset-4">Log in</button>
          </p>
        </div>
      </div>
    </div>
  );
}
