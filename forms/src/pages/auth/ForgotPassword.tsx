import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, KeyRound, ArrowLeft, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";
import { BASE_URL } from "@/lib/api";

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: "Error", description: "Please provide your email address.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      
      // Even if the email doesn't exist, the backend responds successfully for security
      toast({
        title: "Code Sent",
        description: data.message || "If an account exists, a reset code was sent.",
        duration: 5000
      });
      setStep(2);
    } catch (err: unknown) {
      const error = err as Error;
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4 || !newPassword) {
      toast({ title: "Error", description: "Please enter the code and a new password.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp, password: newPassword })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || "Failed to reset password");
      }

      toast({
        title: "Password Reset Complete",
        description: "Your password has been changed successfully. You can now login.",
      });
      navigate("/login");
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
          <div className="mb-8 flex justify-center">
            <Logo size={40} textClassName="text-2xl" />
          </div>

          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900">Forgot Password</h2>
                <p className="text-slate-500 text-sm mt-1">Enter your email and we'll send you a reset code.</p>
              </div>

              <form onSubmit={handleSendResetCode} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <input
                    type="email" placeholder="Email Address"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#025864]/20 focus:border-[#025864] outline-none transition-all"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#025864] text-white py-4 rounded-xl font-bold hover:bg-[#013a42] transition-colors flex items-center justify-center gap-2 mt-4 disabled:opacity-70"
                >
                  {loading ? "Sending Code..." : "Send Reset Code"} <ArrowRight className="w-5 h-5" />
                </button>
              </form>

              <button 
                onClick={() => navigate("/login")}
                className="w-full flex items-center justify-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 mt-6"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Login
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900">Reset Password</h2>
                <p className="text-slate-500 text-sm mt-1">Enter the 4-digit code we sent you and your new password.</p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-6">
                <div className="flex justify-center gap-3 my-4 scale-150 transform origin-center">
                  <InputOTP 
                    maxLength={4} 
                    value={otp}
                    onChange={(val) => setOtp(val)}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className="w-12 h-14 text-2xl font-bold" />
                      <InputOTPSlot index={1} className="w-12 h-14 text-2xl font-bold" />
                      <InputOTPSlot index={2} className="w-12 h-14 text-2xl font-bold" />
                      <InputOTPSlot index={3} className="w-12 h-14 text-2xl font-bold" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <input
                    type="password" placeholder="New Password"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#025864]/20 focus:border-[#025864] outline-none transition-all"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length < 4 || !newPassword}
                  className="w-full bg-[#025864] text-white py-4 rounded-xl font-bold hover:bg-[#013a42] transition-colors flex items-center justify-center gap-2 mt-4 disabled:opacity-70"
                >
                  {loading ? "Resetting..." : "Reset Password"} <KeyRound className="w-5 h-5" />
                </button>
              </form>

              <button 
                onClick={() => setStep(1)}
                className="w-full flex items-center justify-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 mt-6"
              >
                <ArrowLeft className="w-4 h-4" /> Did not receive code?
              </button>
            </div>
          )}

        </div>
      </div>
      <p className="mt-8 text-slate-400 text-xs">© 2025 Sokostack Forms. All rights reserved.</p>
    </div>
  );
};

export default ForgotPassword;
