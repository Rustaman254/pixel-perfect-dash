import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowRight, Store, ShieldCheck, CheckCircle2, Building2, User } from 'lucide-react';
import { cn } from '@/lib/utils';

type OnboardingStep = 'store' | 'kyc' | 'success';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<OnboardingStep>('store');
  const [form, setForm] = useState({
    storeName: '',
    industry: '',
    kycType: 'individual' as 'individual' | 'business',
    idNumber: '',
    businessName: '',
  });

  const nextStep = () => {
    if (step === 'store') setStep('kyc');
    else if (step === 'kyc') setStep('success');
  };

  const finish = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans text-black selection:bg-[#D4F655] selection:text-black">
      {/* Header */}
      <header className="h-20 flex items-center justify-between px-8 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#0A0A0A] rounded-lg flex items-center justify-center">
            <ShoppingCart className="w-4 h-4 text-[#D4F655]" />
          </div>
          <span className="text-xl font-bold tracking-tight">Shopalize</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={cn(
                  "w-8 h-1.5 rounded-full transition-all",
                  (step === 'store' && s === 1) || (step === 'kyc' && s <= 2) || (step === 'success')
                    ? "bg-[#D4F655]"
                    : "bg-gray-200"
                )}
              />
            ))}
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Step {step === 'store' ? '1' : step === 'kyc' ? '2' : '3'} of 3</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-xl">
          {step === 'store' && (
            <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-gray-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-16 h-16 bg-[#D4F655]/10 rounded-[1.5rem] flex items-center justify-center mb-8">
                <Store className="w-8 h-8 text-[#0A0A0A]" />
              </div>
              <h1 className="text-3xl font-bold mb-3 tracking-tight">Tell us about your store</h1>
              <p className="text-gray-500 mb-10 text-lg">Let's set the foundation for your new online business.</p>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Store Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Luminary Boutique"
                    value={form.storeName}
                    onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                    className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Industry</label>
                  <select
                    value={form.industry}
                    onChange={(e) => setForm({ ...form, industry: e.target.value })}
                    className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all text-lg appearance-none cursor-pointer"
                  >
                    <option value="">Select an industry</option>
                    <option value="fashion">Fashion & Apparel</option>
                    <option value="electronics">Electronics</option>
                    <option value="home">Home & Decor</option>
                    <option value="beauty">Beauty & Personal Care</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <button
                  onClick={nextStep}
                  disabled={!form.storeName || !form.industry}
                  className="w-full py-5 rounded-[1.5rem] bg-[#0A0A0A] hover:bg-black text-white font-bold text-lg flex items-center justify-center gap-3 mt-10 transition-all disabled:opacity-50"
                >
                  Continue <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {step === 'kyc' && (
            <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-gray-200 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex justify-between items-start mb-8">
                <div className="w-16 h-16 bg-[#D4F655]/10 rounded-[1.5rem] flex items-center justify-center">
                  <ShieldCheck className="w-8 h-8 text-[#0A0A0A]" />
                </div>
                <button onClick={nextStep} className="text-sm font-bold text-gray-400 hover:text-black transition-colors">Skip for now</button>
              </div>
              <h1 className="text-3xl font-bold mb-3 tracking-tight">Verify your identity</h1>
              <p className="text-gray-500 mb-10 text-lg">This helps us keep the platform secure. You can complete this later.</p>

              <div className="flex bg-gray-100 p-1.5 rounded-2xl mb-8">
                <button
                  onClick={() => setForm({ ...form, kycType: 'individual' })}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all",
                    form.kycType === 'individual' ? "bg-white shadow-sm text-black" : "text-gray-500 hover:text-black"
                  )}
                >
                  <User className="w-4 h-4" /> Individual
                </button>
                <button
                  onClick={() => setForm({ ...form, kycType: 'business' })}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all",
                    form.kycType === 'business' ? "bg-white shadow-sm text-black" : "text-gray-500 hover:text-black"
                  )}
                >
                  <Building2 className="w-4 h-4" /> Business
                </button>
              </div>

              <div className="space-y-6">
                {form.kycType === 'individual' ? (
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 uppercase tracking-wide">ID/Passport Number</label>
                    <input
                      type="text"
                      placeholder="Enter ID number"
                      value={form.idNumber}
                      onChange={(e) => setForm({ ...form, idNumber: e.target.value })}
                      className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all text-lg"
                    />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Legal Business Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Luminary LTD"
                        value={form.businessName}
                        onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                        className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all text-lg"
                      />
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Registration Number</label>
                       <input
                         type="text"
                         placeholder="Business reg number"
                         className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all text-lg"
                       />
                    </div>
                  </div>
                )}

                <button
                  onClick={nextStep}
                  className="w-full py-5 rounded-[1.5rem] bg-[#0A0A0A] hover:bg-black text-white font-bold text-lg flex items-center justify-center gap-3 mt-10 transition-all shadow-xl shadow-black/10"
                >
                  Confirm & Continue <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="bg-white rounded-[2.5rem] p-12 shadow-sm border border-gray-200 text-center animate-in zoom-in-95 duration-500">
              <div className="w-24 h-24 bg-[#D4F655] rounded-full flex items-center justify-center mx-auto mb-10 shadow-lg shadow-[#D4F655]/20">
                <CheckCircle2 className="w-12 h-12 text-[#0A0A0A]" />
              </div>
              <h1 className="text-4xl font-bold mb-4 tracking-tight">You're all set!</h1>
              <p className="text-gray-500 mb-10 text-xl max-w-sm mx-auto">Your store is ready. Let's head to your dashboard and start building.</p>

              <button
                onClick={finish}
                className="w-full py-5 rounded-[1.5rem] bg-[#0A0A0A] hover:bg-black text-white font-bold text-lg flex items-center justify-center gap-3 transition-all"
              >
                Go to Dashboard <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </main>

      <footer className="p-8 text-center text-gray-400 text-sm font-medium">
        &copy; 2026 Shopalize. All rights reserved.
      </footer>
    </div>
  );
}
