import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Save, Loader2, Store, CreditCard, Shield, Bell, Truck, Globe, Plus, Trash2, RefreshCw, ExternalLink, Lock, LockOpen, CheckCircle, AlertCircle, Link2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchWithAuth } from '@/lib/api';

interface DomainData {
  subdomains: Array<{
    id: number;
    domain: string;
    type: string;
    status: string;
    ssl: { enabled: boolean; valid: boolean; expiresAt?: string };
    createdAt: string;
    isPrimary: boolean;
  }>;
  customDomains: Array<{
    id: number;
    domain: string;
    type: string;
    status: string;
    verificationStatus: string;
    ssl: { enabled: boolean; valid: boolean; expiresAt?: string };
    createdAt: string;
    isPrimary: boolean;
  }>;
}

export default function SettingsPage() {
  const { userProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [form, setForm] = useState({
    storeName: userProfile?.businessName || userProfile?.fullName || '',
    email: userProfile?.email || '', phone: userProfile?.phone || '', location: userProfile?.location || '',
    currency: 'KES', timezone: 'Africa/Nairobi',
  });
  
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [domains, setDomains] = useState<DomainData | null>(null);
  const [domainsLoading, setDomainsLoading] = useState(false);
  const [domainConfig, setDomainConfig] = useState<any>(null);
  const [showAddDomainModal, setShowAddDomainModal] = useState(false);
  const [newCustomDomain, setNewCustomDomain] = useState('');
  const [addingDomain, setAddingDomain] = useState(false);
  const [domainError, setDomainError] = useState('');
  const [verifyingDomain, setVerifyingDomain] = useState<number | null>(null);

  useEffect(() => {
    loadDomainConfig();
  }, []);

  const loadDomainConfig = async () => {
    try {
      const config = await fetchWithAuth('/shopalize/domains/config');
      setDomainConfig(config);
    } catch (err) {
      console.error('Failed to load domain config:', err);
    }
  };

  const loadStoreDomains = async (projectId: string) => {
    setDomainsLoading(true);
    try {
      const data = await fetchWithAuth(`/shopalize/domains/subdomains/${projectId}`);
      setDomains(data);
    } catch (err) {
      console.error('Failed to load domains:', err);
    } finally {
      setDomainsLoading(false);
    }
  };

  const handleAddCustomDomain = async () => {
    if (!currentProjectId || !newCustomDomain) return;
    
    setAddingDomain(true);
    setDomainError('');
    try {
      await fetchWithAuth(`/shopalize/custom-domains/${currentProjectId}`, {
        method: 'POST',
        body: JSON.stringify({ domain: newCustomDomain }),
      });
      setNewCustomDomain('');
      setShowAddDomainModal(false);
      loadStoreDomains(currentProjectId);
    } catch (err: any) {
      setDomainError(err.message || 'Failed to add domain');
    } finally {
      setAddingDomain(false);
    }
  };

  const handleVerifyDomain = async (domainId: number) => {
    setVerifyingDomain(domainId);
    try {
      await fetchWithAuth(`/shopalize/custom-domains/${domainId}/verify`, { method: 'POST' });
      loadStoreDomains(currentProjectId!);
    } catch (err) {
      console.error('Failed to verify domain:', err);
    } finally {
      setVerifyingDomain(null);
    }
  };

  const handleDeleteDomain = async (domainId: number) => {
    if (!confirm('Are you sure you want to delete this domain?')) return;
    try {
      await fetchWithAuth(`/shopalize/subdomains/${currentProjectId}/${domainId}`, { method: 'DELETE' });
      loadStoreDomains(currentProjectId!);
    } catch (err) {
      console.error('Failed to delete domain:', err);
    }
  };

  const handleSave = async () => { setSaving(true); setTimeout(() => setSaving(false), 800); };

  const tabs = [
    { id: 'general', label: 'Store Details', icon: Store },
    { id: 'domains', label: 'Domains', icon: Globe },
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

          {activeTab === 'domains' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                 <div className="bg-white rounded-[2rem] border border-gray-200/60 p-8 shadow-sm">
                   <div className="flex items-center justify-between mb-6">
                     <h3 className="text-[13px] font-bold text-black tracking-wide uppercase flex items-center gap-2"><Globe className="w-4 h-4 text-gray-400" /> Your Domains</h3>
                     <div className="flex gap-2">
                       <button 
                         onClick={() => currentProjectId && loadStoreDomains(currentProjectId)} 
                         disabled={!currentProjectId || domainsLoading}
                         className="flex items-center gap-2 px-3 py-2 text-[12px] font-bold text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
                       >
                         <RefreshCw className={cn("w-4 h-4", domainsLoading && "animate-spin")} /> Refresh
                       </button>
                       <button 
                         onClick={() => setShowAddDomainModal(true)}
                         disabled={!currentProjectId}
                         className="flex items-center gap-2 px-3 py-2 bg-[#0A0A0A] hover:bg-black text-white text-[12px] font-bold rounded-lg transition-colors disabled:opacity-50"
                       >
                         <Plus className="w-4 h-4" /> Add Domain
                       </button>
                     </div>
                   </div>

                   {!currentProjectId ? (
                     <div className="text-center py-12">
                       <Globe className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                       <p className="text-gray-500 text-sm">Select a store to manage its domains</p>
                       <p className="text-gray-400 text-xs mt-1">Go to Online Store to select a store first</p>
                     </div>
                   ) : domainsLoading ? (
                     <div className="flex items-center justify-center py-12">
                       <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                     </div>
                   ) : domains?.subdomains.length === 0 && domains?.customDomains.length === 0 ? (
                     <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
                       <Globe className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                       <p className="text-gray-500 text-sm font-medium">No domains configured</p>
                       <p className="text-gray-400 text-xs mt-1 mb-4">Your store automatically gets a subdomain when created</p>
                       <button 
                         onClick={() => setShowAddDomainModal(true)}
                         className="px-4 py-2 bg-[#0A0A0A] text-white text-xs font-bold rounded-lg"
                       >
                         Add Custom Domain
                       </button>
                     </div>
                   ) : (
                     <div className="space-y-4">
                       {domains?.subdomains.map((sub) => (
                         <div key={sub.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                           <div className="flex items-center gap-3">
                             <Globe className="w-5 h-5 text-gray-400" />
                             <div>
                               <p className="font-bold text-sm text-black">{sub.domain}</p>
                               <p className="text-xs text-gray-400">Free subdomain</p>
                             </div>
                           </div>
                           <div className="flex items-center gap-3">
                             <span className={cn("flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold", sub.ssl?.enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500")}>
                               {sub.ssl?.enabled ? <Lock className="w-3 h-3" /> : <LockOpen className="w-3 h-3" />}
                               {sub.ssl?.enabled ? 'SSL' : 'No SSL'}
                             </span>
                             <span className={cn("px-2 py-1 rounded-full text-xs font-bold uppercase", sub.status === 'active' ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700")}>
                               {sub.status}
                             </span>
                             {sub.isPrimary && <span className="px-2 py-1 bg-[#D4F655] text-black text-xs font-bold rounded-full">Primary</span>}
                           </div>
                         </div>
                       ))}

                       {domains?.customDomains.map((dom) => (
                         <div key={dom.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                           <div className="flex items-center gap-3">
                             <Link2 className="w-5 h-5 text-gray-400" />
                             <div>
                               <p className="font-bold text-sm text-black">{dom.domain}</p>
                               <p className="text-xs text-gray-400">Custom domain</p>
                             </div>
                           </div>
                           <div className="flex items-center gap-2">
                             {dom.verificationStatus !== 'verified' ? (
                               <button 
                                 onClick={() => handleVerifyDomain(dom.id)}
                                 disabled={verifyingDomain === dom.id}
                                 className="flex items-center gap-1 px-3 py-1.5 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-lg hover:bg-yellow-200 transition-colors"
                               >
                                 {verifyingDomain === dom.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <AlertCircle className="w-3 h-3" />}
                                 Verify
                               </button>
                             ) : (
                               <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                                 <CheckCircle className="w-3 h-3" /> Verified
                               </span>
                             )}
                             <span className={cn("flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold", dom.ssl?.enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500")}>
                               {dom.ssl?.enabled ? <Lock className="w-3 h-3" /> : <LockOpen className="w-3 h-3" />}
                               SSL
                             </span>
                             <button 
                               onClick={() => handleDeleteDomain(dom.id)}
                               className="p-1.5 hover:bg-red-100 rounded-lg text-red-400 hover:text-red-600 transition-colors"
                             >
                               <Trash2 className="w-4 h-4" />
                             </button>
                           </div>
                         </div>
                       ))}
                     </div>
                   )}
                 </div>

                 {domainConfig && (
                   <div className="bg-white rounded-[2rem] border border-gray-200/60 p-8 shadow-sm">
                     <h3 className="text-[13px] font-bold text-black tracking-wide uppercase mb-4 flex items-center gap-2"><Shield className="w-4 h-4 text-gray-400" /> DNS Configuration</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="p-4 bg-gray-50 rounded-xl">
                         <p className="text-xs font-bold text-gray-400 uppercase mb-1">Base Domain</p>
                         <p className="font-bold text-black">{domainConfig.baseDomain}</p>
                       </div>
                       <div className="p-4 bg-gray-50 rounded-xl">
                         <p className="text-xs font-bold text-gray-400 uppercase mb-1">Wildcard</p>
                         <p className="font-bold text-black">{domainConfig.wildcard}</p>
                       </div>
                       <div className="p-4 bg-gray-50 rounded-xl">
                         <p className="text-xs font-bold text-gray-400 uppercase mb-1">SSL Provider</p>
                         <p className="font-bold text-black">{domainConfig.ssl?.provider}</p>
                       </div>
                       <div className="p-4 bg-gray-50 rounded-xl">
                         <p className="text-xs font-bold text-gray-400 uppercase mb-1">Auto Renew</p>
                         <p className="font-bold text-black">{domainConfig.ssl?.autoRenew ? 'Yes' : 'No'}</p>
                       </div>
                     </div>
                   </div>
                 )}
              </div>
          )}

          {activeTab !== 'general' && activeTab !== 'domains' && (
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

      {/* Add Custom Domain Modal */}
      {showAddDomainModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-6 pb-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-black">Add Custom Domain</h2>
                <button 
                  onClick={() => { setShowAddDomainModal(false); setNewCustomDomain(''); setDomainError(''); }}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-2">Connect your own domain to your store.</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-[12px] font-bold text-gray-600 uppercase tracking-wider block mb-2">Custom Domain</label>
                <input 
                  type="text"
                  value={newCustomDomain}
                  onChange={(e) => { setNewCustomDomain(e.target.value); setDomainError(''); }}
                  placeholder="e.g., mystore.com"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:border-black outline-none"
                />
                {domainError && (
                  <div className="flex items-center gap-2 mt-2 text-red-500 text-xs">
                    <AlertCircle className="w-4 h-4" />
                    {domainError}
                  </div>
                )}
              </div>

              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-xs text-blue-700">
                  <strong>Note:</strong> To use a custom domain, add a CNAME record pointing to <code className="bg-blue-100 px-1 rounded">{domainConfig?.wildcard || '*.sokostack.xyz'}</code> in your DNS settings.
                </p>
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button 
                onClick={() => { setShowAddDomainModal(false); setNewCustomDomain(''); setDomainError(''); }}
                className="flex-1 py-3 rounded-xl font-bold text-sm text-gray-500 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddCustomDomain}
                disabled={addingDomain || !newCustomDomain}
                className="flex-1 py-3 rounded-xl bg-[#0A0A0A] hover:bg-black text-white font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {addingDomain ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add Domain
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
