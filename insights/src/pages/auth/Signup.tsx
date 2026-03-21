import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Check, Phone, Mail, User, Lock, Building, MapPin, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/contexts/useAppContext";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";
import { BASE_URL } from "@/lib/api";

const Signup = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { login } = useAppContext();

  const [formData, setFormData] = useState({
    phone: "",
    email: "",
    fullName: "",
    password: "",
    otp: "",
    idType: "National ID",
    idNumber: "",
    businessName: "",
    location: "",
    payoutMethod: "mpesa",
    payoutDetails: ""
  });

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleSignup = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          role: "seller"
        })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Registration failed");
      }

      login(data.user, data.token);
      toast({
        title: "Account Created!",
        description: "Welcome to Ripplify. Your seller account is ready.",
      });
      navigate("/");
    } catch (err: unknown) {
      const error = err as Error;
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async () => {
    if (!formData.email) {
      toast({ title: "Error", description: "Please enter your email address.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send OTP");

      toast({
        title: "Code Sent",
        description: `Your verification code has been sent to ${formData.email}`,
        duration: 5000
      });
      nextStep();
    } catch (err: unknown) {
      const error = err as Error;
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (formData.otp.length < 4) {
      toast({ title: "Error", description: "Invalid OTP.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, otp: formData.otp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to verify OTP");

      nextStep();
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
        {/* Progress Bar */}
        <div className="flex h-1.5 w-full bg-slate-100">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={cn(
                "flex-1 transition-all duration-500",
                step >= s ? "bg-[#025864]" : "bg-transparent"
              )}
            />
          ))}
        </div>

        <div className="p-8">
          <div className="flex items-center gap-2 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-[#025864] flex items-center justify-center text-white font-bold text-xl">R</div>
            <span className="text-2xl font-bold text-[#025864]">Ripplify</span>
          </div>

          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-900">Create Seller Account</h2>
                <p className="text-slate-500 text-sm mt-1">Join thousands of sellers getting paid safely.</p>
              </div>
              <div className="space-y-4">
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <input
                    type="text" placeholder="Full Name"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#025864]/20 focus:border-[#025864] outline-none transition-all"
                    value={formData.fullName}
                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <input
                    type="email" placeholder="Email Address"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#025864]/20 focus:border-[#025864] outline-none transition-all"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <input
                    type="tel" placeholder="Phone Number"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#025864]/20 focus:border-[#025864] outline-none transition-all"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <input
                    type="password" placeholder="Password"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#025864]/20 focus:border-[#025864] outline-none transition-all"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>
              <button
                onClick={handleSendOTP}
                disabled={loading}
                className="w-full bg-[#025864] text-white py-4 rounded-xl font-bold hover:bg-[#013a42] transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? "Sending OTP..." : "Get Started"} <ArrowRight className="w-5 h-5" />
              </button>
              <p className="text-center text-sm text-slate-500">
                Already have an account? <button onClick={() => navigate("/login")} className="text-[#025864] font-bold">Log in</button>
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-900">Verify Email</h2>
                <p className="text-slate-500 text-sm mt-1">Enter the 4-digit code sent to {formData.email}</p>
              </div>
              <div className="flex justify-center gap-3 my-8 scale-150 transform origin-center">
                <InputOTP 
                  maxLength={4} 
                  value={formData.otp}
                  onChange={(val) => setFormData({ ...formData, otp: val })}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} className="w-12 h-14 text-2xl font-bold" />
                    <InputOTPSlot index={1} className="w-12 h-14 text-2xl font-bold" />
                    <InputOTPSlot index={2} className="w-12 h-14 text-2xl font-bold" />
                    <InputOTPSlot index={3} className="w-12 h-14 text-2xl font-bold" />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <button
                onClick={handleVerifyOTP}
                disabled={loading}
                className="w-full bg-[#025864] text-white py-4 rounded-xl font-bold hover:bg-[#013a42] transition-colors disabled:opacity-70"
              >
                {loading ? "Verifying..." : "Verify & Continue"}
              </button>
              <button onClick={prevStep} className="w-full text-slate-500 font-medium text-sm">Change email address</button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-900">Basic KYC (Optional)</h2>
                <p className="text-slate-500 text-sm mt-1">Help us keep the platform safe for everyone. Skipping this will place limits on your transactions and payouts.</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Identity Type</label>
                  <select
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#025864]/20"
                    value={formData.idType}
                    onChange={e => setFormData({ ...formData, idType: e.target.value })}
                  >
                    <option>National ID</option>
                    <option>Passport</option>
                    <option>Driving License</option>
                  </select>
                </div>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <input
                    type="text" placeholder="ID Number (Optional)"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#025864]/20"
                    value={formData.idNumber}
                    onChange={e => setFormData({ ...formData, idNumber: e.target.value })}
                  />
                </div>
                <div className="relative">
                  <Building className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <input
                    type="text" placeholder="Business Name (Optional)"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#025864]/20"
                    value={formData.businessName}
                    onChange={e => setFormData({ ...formData, businessName: e.target.value })}
                  />
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <input
                    type="text" placeholder="Location"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#025864]/20"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={nextStep}
                  className="w-full bg-slate-100 text-slate-600 py-4 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                >
                  Skip for Now
                </button>
                <button
                  onClick={nextStep}
                  className="w-full bg-[#025864] text-white py-4 rounded-xl font-bold hover:bg-[#013a42] transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-900">Payout Method</h2>
                <p className="text-slate-500 text-sm mt-1">Where should we send your money?</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setFormData({ ...formData, payoutMethod: "mpesa" })}
                  className={cn(
                    "p-4 rounded-2xl border-2 transition-all text-left",
                    formData.payoutMethod === "mpesa" ? "border-[#025864] bg-[#025864]/5" : "border-slate-100 bg-slate-50"
                  )}
                >
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-3">
                    <Smartphone className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="font-bold text-slate-900">M-Pesa</p>
                  <p className="text-[10px] text-slate-500">Mobile Money</p>
                </button>
                <button
                  onClick={() => setFormData({ ...formData, payoutMethod: "bank" })}
                  className={cn(
                    "p-4 rounded-2xl border-2 transition-all text-left",
                    formData.payoutMethod === "bank" ? "border-[#025864] bg-[#025864]/5" : "border-slate-100 bg-slate-50"
                  )}
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                    <Building className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="font-bold text-slate-900">Bank</p>
                  <p className="text-[10px] text-slate-500">Direct Transfer</p>
                </button>
              </div>
              <div className="relative">
                <CreditCard className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder={formData.payoutMethod === "mpesa" ? "M-Pesa Number" : "Account Number"}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#025864]/20"
                  value={formData.payoutDetails}
                  onChange={e => setFormData({ ...formData, payoutDetails: e.target.value })}
                />
              </div>
              <button
                onClick={handleSignup}
                disabled={loading}
                className="w-full bg-[#025864] text-white py-4 rounded-xl font-bold hover:bg-[#013a42] transition-colors disabled:opacity-70"
              >
                {loading ? "Creating Account..." : "Complete Registration"}
              </button>
            </div>
          )}
        </div>
      </div>
      <p className="mt-8 text-slate-400 text-xs">© 2025 Ripplify Inc. All rights reserved.</p>
    </div>
  );
};

export default Signup;

import { Smartphone } from "lucide-react";
