import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Save, Loader2, Store, CreditCard, Shield, Bell, Truck, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { userProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [form, setForm] = useState({
    storeName: userProfile?.businessName || userProfile?.fullName || '',
    email: userProfile?.email || '', phone: userProfile?.phone || '', location: userProfile?.location || '',
    currency: 'KES', timezone: 'Africa/Nairobi',
  });

  const handleSave = async () => { setSaving(true); setTimeout(() => setSaving(false), 800); };

  const tabs = [
    { id: 'general', label: 'Store Details', icon: Store },
    { id: 'billing', label: 'Payments', icon: CreditCard },
    { id: 'shipping', label: 'Shipping', icon: Truck },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="max-w-[1000px] mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 mt-2 gap-4 border-b border-gray-200 pb-6">
        <div>
           <h1 className="text-3xl font-bold text-black tracking-tight" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>Settings</h1>
           <p className="text-[15px] text-gray-500 mt-1">Manage your enterprise preferences and configurations.</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="bg-[#0A0A0A] hover:bg-black text-white px-6 py-3 rounded-xl text-[14px] font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-black/10 disabled:opacity-50 self-start sm:self-auto w-full sm:w-auto">
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Save Changes
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Nav */}
        <div className="lg:w-64 shrink-0">
           <div className="flex lg:flex-col gap-2 overflow-x-auto pb-4 lg:pb-0 scrollbar-hide">
             {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                   className={cn("flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-bold transition-all whitespace-nowrap",
                     activeTab === tab.id ? "bg-[#D4F655] text-black shadow-sm" : "text-gray-500 hover:bg-gray-100 hover:text-black"
                   )}>
                   <tab.icon className={cn("w-5 h-5", activeTab === tab.id ? "text-black" : "text-gray-400")} /> {tab.label}
                </button>
             ))}
           </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-8">
          {activeTab === 'general' && (
             <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-white rounded-[2rem] border border-gray-200/60 p-8 shadow-sm">
                  <h3 className="text-[13px] font-bold text-black tracking-wide uppercase mb-6 flex items-center gap-2"><Store className="w-4 h-4 text-gray-400" /> Store Profile</h3>
                  <div className="space-y-6">
                    <div>
                        <label className="text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Store name</label>
                        <input type="text" value={form.storeName} onChange={e => setForm({ ...form, storeName: e.target.value })} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[15px] font-medium outline-none focus:bg-white focus:border-black transition-all" />
                        <p className="text-[12px] text-gray-400 font-medium mt-2">This name appears on your storefront and emails.</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                          <label className="text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Contact Email</label>
                          <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[15px] font-medium outline-none focus:bg-white focus:border-black transition-all" />
                      </div>
                      <div>
                          <label className="text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Business Phone</label>
                          <input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[15px] font-medium outline-none focus:bg-white focus:border-black transition-all" />
                      </div>
                    </div>
                    
                    <div>
                        <label className="text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Physical Location / Address</label>
                        <input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[15px] font-medium outline-none focus:bg-white focus:border-black transition-all" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-[2rem] border border-gray-200/60 p-8 shadow-sm">
                  <h3 className="text-[13px] font-bold text-black tracking-wide uppercase mb-6 flex items-center gap-2"><Globe className="w-4 h-4 text-gray-400" /> Localization & Formats</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Store Currency</label>
                        <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[14px] font-bold text-black outline-none focus:bg-white focus:border-black transition-all cursor-pointer">
                           <option value="KES">KES - Kenyan Shilling</option>
                           <option value="USD">USD - US Dollar</option>
                           <option value="EUR">EUR - Euro</option>
                           <option value="GBP">GBP - British Pound</option>
                        </select>
                        <p className="text-[12px] text-gray-400 font-medium mt-2">Currency used for product pricing and reports.</p>
                    </div>
                    <div>
                        <label className="text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Timezone</label>
                        <select value={form.timezone} onChange={e => setForm({ ...form, timezone: e.target.value })} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[14px] font-bold text-black outline-none focus:bg-white focus:border-black transition-all cursor-pointer">
                           <option value="Africa/Nairobi">East Africa Time (EAT)</option>
                           <option value="UTC">UTC</option>
                           <option value="America/New_York">Eastern Time (ET)</option>
                           <option value="Europe/London">Greenwich Mean Time (GMT)</option>
                        </select>
                    </div>
                  </div>
                </div>
             </div>
          )}

          {activeTab !== 'general' && (
             <div className="bg-white rounded-[2rem] border border-gray-200/60 p-16 shadow-sm flex flex-col items-center justify-center text-center h-[400px] animate-in fade-in duration-300">
                <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100 shadow-sm mb-6">
                   <Shield className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-black mb-2" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>Configuring {tabs.find(t => t.id === activeTab)?.label}</h3>
                <p className="text-[14px] text-gray-500 max-w-sm">These settings are specifically configured by Shopalize Enterprise support at the moment. Please contact your account manager to change these.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
