import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store';
import { Palette, Eye, ExternalLink, Loader2, Plus, Pencil, Search, Smartphone, Monitor, Layout, Trash2, CheckCircle2, Crown, Zap, ShieldCheck, X, ShoppingCart, CreditCard, Banknote, Smartphone as PhoneIcon, Globe, Link2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import StorePreview from '@/components/StorePreview';
import { fetchWithAuth } from '@/lib/api';

export default function OnlineStorePage() {
  const navigate = useNavigate();
  const { projects, loadProjects, publishProject, deleteProject, upgradeProject, updateProjectTheme } = useStore();
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [upgradeModal, setUpgradeModal] = useState<{ open: boolean; projectId: string | null }>({ open: false, projectId: null });
  const [domainModal, setDomainModal] = useState<{ open: boolean; projectId: string | null; currentDomain: string }>({ open: false, projectId: null, currentDomain: '' });
  const [customDomain, setCustomDomain] = useState('');
  const [domainLoading, setDomainLoading] = useState(false);
  const [domainError, setDomainError] = useState('');

  useEffect(() => { loadProjects().then(() => setLoading(false)); }, [loadProjects]);

  const handleUpgrade = async () => {
    if (!upgradeModal.projectId) return;
    try {
      setUpgrading(upgradeModal.projectId);
      await upgradeProject(upgradeModal.projectId, 'premium');
      setUpgradeModal({ open: false, projectId: null });
    } catch (err) {
      alert('Upgrade failed. Please check your Ripplify balance.');
    } finally {
      setUpgrading(null);
    }
  };

  const togglePublish = async (id: string) => {
      try {
        await publishProject(id);
      } catch (err) {
        console.error(err);
      }
  };

  const handleOpenDomainModal = (projectId: string, currentDomain: string) => {
    setDomainModal({ open: true, projectId, currentDomain: currentDomain || '' });
    setCustomDomain(currentDomain || '');
    setDomainError('');
  };

  const handleSaveDomain = async () => {
    if (!domainModal.projectId) return;
    
    // Validate domain format
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
    if (customDomain && !domainRegex.test(customDomain)) {
      setDomainError('Please enter a valid domain (e.g., mystore.com)');
      return;
    }

    try {
      setDomainLoading(true);
      await fetchWithAuth(`/shopalize/projects/${domainModal.projectId}`, {
        method: 'PUT',
        body: JSON.stringify({ domain: customDomain || null }),
      });
      await loadProjects();
      setDomainModal({ open: false, projectId: null, currentDomain: '' });
    } catch (err: any) {
      setDomainError(err.message || 'Failed to save domain');
    } finally {
      setDomainLoading(false);
    }
  };

  const getStoreUrl = (project: any): string => {
    if (project.domain) return `https://${project.domain}`;
    return `https://${project.subdomain}.sokostack.xyz`;
  };

  const publishedProject = projects.find(p => p.theme.isPublished);
  const draftProjects = projects.filter(p => p.id !== publishedProject?.id);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 mt-2 gap-4">
        <div>
           <h1 className="text-3xl font-bold text-black tracking-tight" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>Themes</h1>
           <p className="text-[15px] text-gray-500 mt-1">Manage your active storefront and draft templates.</p>
        </div>
        <button onClick={() => navigate('/gallery')} className="flex items-center gap-2 px-5 py-2.5 bg-[#0A0A0A] hover:bg-black text-white text-[13px] font-bold rounded-xl shadow-md transition-all self-start sm:self-auto">
           <Plus className="w-4 h-4" /> Add theme
        </button>
      </div>

      {loading ? (
           <div className="p-20 text-center flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-black mb-4" />
              <p className="text-[15px] font-medium text-gray-500">Loading themes...</p>
           </div>
      ) : projects.length === 0 ? (
           <div className="bg-white rounded-[2rem] border border-gray-200/60 shadow-sm overflow-hidden py-32 px-6 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                 <Palette className="w-8 h-8 text-gray-300" />
              </div>
              <h2 className="text-2xl font-bold text-black mb-3">No theme selected</h2>
              <p className="text-gray-500 max-w-md mx-auto mb-8 font-medium">To get your store up and running, select from our free essential templates or our premium luxury architectures.</p>
              <button onClick={() => navigate('/gallery')} className="bg-[#D4F655] hover:bg-[#c1e247] text-black font-bold text-[15px] px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-[#D4F655]/20">
                 Explore Theme Library
              </button>
           </div>
      ) : (
        <div className="space-y-6 max-w-5xl">

          {/* Current Live Theme */}
          <div className="bg-white rounded-[2rem] border border-gray-200/60 shadow-sm overflow-hidden relative">
            {!publishedProject && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-[2rem]">
                 <p className="text-lg font-bold text-black mb-3">No Live Theme Published</p>
                 <p className="text-sm text-gray-500 font-medium mb-6">Publish a theme from your draft library below.</p>
              </div>
            )}
            <div className="p-6 md:p-8 flex flex-col border-b border-gray-100">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-[#D4F655]/20 flex items-center justify-center border border-[#D4F655]/50 shadow-sm">
                      <Palette className="w-6 h-6 text-[#0A0A0A]" />
                   </div>
                   <div>
                      <h2 className="text-[12px] font-bold text-gray-400 uppercase tracking-widest leading-tight mb-1">Live Theme</h2>
                      <h3 className="text-[20px] font-bold text-black" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>{publishedProject?.name || 'Unpublished'}</h3>
                   </div>
                </div>
                {publishedProject && (
                  <div className="flex gap-2">
                     <span className="text-[11px] px-3 py-1.5 rounded-full font-bold uppercase tracking-wider bg-[#D4F655]/20 text-black border border-[#D4F655]/50 flex items-center gap-1.5 hidden sm:flex">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Published
                     </span>
                     {publishedProject.isPremium && (
                        <span className="text-[11px] px-3 py-1.5 rounded-full font-bold uppercase tracking-wider bg-black text-[#D4F655] border border-black flex items-center gap-1.5">
                           <Crown className="w-3.5 h-3.5" /> Premium
                        </span>
                     )}
                  </div>
                )}
              </div>
              
              {publishedProject && (
                 <div className="flex flex-wrap gap-3 mt-auto relative z-20">
                    <button onClick={() => navigate(`/editor/${publishedProject.id}`)} className="flex items-center gap-2 px-5 py-2.5 bg-[#D4F655] hover:bg-[#c1e247] shadow-lg shadow-[#D4F655]/20 text-[14px] font-bold text-black rounded-xl transition-all">
                       <Pencil className="w-4 h-4" /> Customize
                    </button>
                     <a 
                        href={getStoreUrl(publishedProject)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 hover:border-black text-[14px] font-bold text-gray-700 rounded-xl transition-all shadow-sm"
                     >
                        <ExternalLink className="w-4 h-4" /> Visit Store
                     </a>
                     <button onClick={() => navigate(`/preview/${publishedProject.id}`)} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 hover:border-black text-[14px] font-bold text-gray-700 rounded-xl transition-all shadow-sm">
                        <Eye className="w-4 h-4" /> Preview
                     </button>
                  </div>
               )}

               {/* Store URL & Custom Domain */}
               {publishedProject && (
                 <div className="mt-6 pt-6 border-t border-gray-100">
                   <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                     <div className="flex items-center gap-3">
                       <Globe className="w-5 h-5 text-gray-400" />
                       <div>
                         <p className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Your Store</p>
                         <a 
                           href={getStoreUrl(publishedProject)}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="text-[14px] font-medium text-[#0A0A0A] hover:underline"
                         >
                           {publishedProject.domain || `https://${publishedProject.subdomain}.sokostack.xyz`}
                         </a>
                       </div>
                     </div>
                     <button 
                       onClick={() => handleOpenDomainModal(publishedProject.id, publishedProject.domain || '')}
                       className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:border-black text-[13px] font-bold text-gray-700 rounded-xl transition-all"
                     >
                       <Link2 className="w-4 h-4" /> {publishedProject.domain ? 'Change Domain' : 'Add Custom Domain'}
                     </button>
                   </div>
                 </div>
               )}
            </div>
            
            {/* Theme Sneak Peek (Wireframe aesthetic or live preview snippet) */}
            <div className="p-8 bg-gray-50/50 flex flex-col md:flex-row gap-8 items-center justify-center border-t border-gray-100 relative overflow-hidden h-72">
               <div className="absolute top-4 right-4 flex gap-2 z-10">
                 <button className="p-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:text-black hover:bg-gray-50 text-gray-400 transition-colors"><Monitor className="w-4 h-4" /></button>
                 <button className="p-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:text-black hover:bg-gray-50 text-gray-400 transition-colors"><Smartphone className="w-4 h-4" /></button>
               </div>
               
               <div className="bg-white rounded-xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] border border-gray-200 w-full max-w-[800px] h-[600px] overflow-hidden transform md:-rotate-2 transition-transform hover:rotate-0 duration-500 absolute top-10 pointer-events-none">
                  {publishedProject ? (
                     <div style={{ width: '1280px', height: '1000px', transform: 'scale(0.62)', transformOrigin: 'top left' }}>
                        <StorePreview project={publishedProject} interactive={false} />
                     </div>
                  ) : (
                     <div className="h-full w-full bg-gray-50" />
                  )}
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* Theme Library (Drafts) */}
            <div className="bg-white rounded-[2rem] border border-gray-200/60 p-8 shadow-sm">
               <div className="flex items-center justify-between mb-8">
                 <h3 className="text-[15px] font-bold text-black uppercase tracking-widest">Theme Library</h3>
                 <button onClick={() => navigate('/gallery')} className="text-[12px] font-bold text-gray-500 hover:text-black hover:underline uppercase tracking-wider flex items-center gap-1">Browse templates <ExternalLink className="w-3 h-3" /></button>
               </div>
               
               {draftProjects.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {draftProjects.map(draft => (
                      <div key={draft.id} className="border border-gray-200 rounded-2xl flex flex-col overflow-hidden hover:border-black/20 transition-all shadow-sm group">
                         <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden border-b border-gray-100 p-2">
                            <div className="w-full h-full rounded-xl overflow-hidden relative pointer-events-none shadow-sm border border-gray-200/50 bg-white">
                               <div style={{ width: '1440px', height: '1440px', transform: 'scale(0.2)', transformOrigin: 'top left' }}>
                                  <StorePreview project={draft} interactive={false} />
                               </div>
                            </div>
                         </div>
                         <div className="p-5 flex-1 flex flex-col">
                            <h4 className="font-bold text-[15px] text-black mb-1 truncate">{draft.name}</h4>
                            <p className="text-[12px] text-gray-400 mb-5 pb-5 border-b border-gray-100 font-medium">Added {new Date(draft.createdAt).toLocaleDateString()}</p>
                            
                            <div className="mt-auto flex flex-col gap-2">
                                <div className="grid grid-cols-2 gap-2">
                                   <button onClick={() => navigate(`/editor/${draft.id}`)} className="py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-black text-[13px] font-bold transition-colors w-full flex items-center justify-center gap-2">
                                      <Pencil className="w-4 h-4" /> Edit
                                   </button>
                                   <button onClick={() => togglePublish(draft.id)} className="py-2.5 rounded-xl bg-[#0A0A0A] hover:bg-black text-white text-[13px] font-bold transition-colors w-full">Publish</button>
                                </div>
                                 {!draft.isPremium && (
                                    <button 
                                      onClick={() => setUpgradeModal({ open: true, projectId: draft.id })} 
                                      disabled={upgrading === draft.id}
                                      className="py-3 rounded-xl bg-gradient-to-r from-black to-gray-800 text-[#D4F655] text-[13px] font-bold transition-all w-full flex items-center justify-center gap-2 shadow-lg shadow-black/10 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                                    >
                                       {upgrading === draft.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
                                       Upgrade to Premium
                                    </button>
                                 )}
                                {draft.isPremium && (
                                   <div className="py-2.5 rounded-xl border border-[#D4F655] bg-[#D4F655]/5 text-black text-[11px] font-bold uppercase tracking-widest text-center flex items-center justify-center gap-2">
                                      <ShieldCheck className="w-4 h-4 text-black" /> Premium Active
                                   </div>
                                )}
                             </div>
                            <button onClick={() => { if(confirm('Delete theme?')) deleteProject(draft.id); }} className="mt-3 flex items-center justify-center gap-1.5 text-[12px] font-bold text-gray-400 hover:text-red-500 transition-colors py-2">
                               <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                         </div>
                      </div>
                    ))}
                 </div>
               ) : (
                 <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-gray-50/50 h-[200px]">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-200 mb-3"><Layout className="w-5 h-5 text-gray-400" /></div>
                    <p className="text-[14px] font-bold text-black mb-1">No draft themes</p>
                    <p className="text-[13px] text-gray-500 max-w-[250px]">Save backup themes here to work on them before publishing.</p>
                 </div>
               )}
            </div>

          </div>
        </div>
      )}

      {/* Premium Upgrade Modal */}
      {upgradeModal.open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 relative">
            {/* Close button */}
            <button 
              onClick={() => setUpgradeModal({ open: false, projectId: null })}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="bg-[#0A0A0A] text-white p-8 pb-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4F655]/10 rounded-full blur-[60px] pointer-events-none" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-[#D4F655] flex items-center justify-center mb-5 shadow-lg shadow-[#D4F655]/20">
                  <Crown className="w-7 h-7 text-black" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight mb-2" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>Upgrade to Premium</h2>
                <p className="text-gray-400 text-[14px] leading-relaxed">Unlock premium templates, advanced sections, and Ripplify-powered checkout for your store.</p>
              </div>
            </div>

            {/* Features */}
            <div className="p-8 space-y-4">
              {[
                { icon: Palette, title: 'Premium Templates', desc: 'Lumière, Velocity, Aesthetics & more' },
                { icon: Zap, title: 'Advanced Sections', desc: 'Instagram feeds, featured collections, navbars' },
                { icon: ShoppingCart, title: 'Ripplify Checkout', desc: 'Integrated payment processing with Ripplify' },
                { icon: ShieldCheck, title: 'Priority Support', desc: '24/7 dedicated merchant support' },
              ].map((feat, i) => (
                <div key={i} className="flex items-start gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-[#D4F655]/10 flex items-center justify-center shrink-0">
                    <feat.icon className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-black">{feat.title}</p>
                    <p className="text-[12px] text-gray-500 mt-0.5">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Ripplify Payment Widget */}
            <div className="px-8 pb-6">
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <ShoppingCart className="w-4 h-4 text-black" />
                  <span className="text-[12px] font-bold text-black uppercase tracking-wider">Powered by Ripplify</span>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { icon: CreditCard, label: 'Card' },
                    { icon: PhoneIcon, label: 'M-Pesa' },
                    { icon: Banknote, label: 'Bank' },
                  ].map((method, i) => (
                    <div key={i} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white border border-gray-200 shadow-sm">
                      <method.icon className="w-5 h-5 text-gray-600" />
                      <span className="text-[10px] font-bold text-gray-500 uppercase">{method.label}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-gray-500">Premium upgrade</span>
                  <span className="text-[20px] font-bold text-black" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>$50<span className="text-[12px] text-gray-400 font-medium">/one-time</span></span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-8 pb-8 flex gap-3">
              <button 
                onClick={() => setUpgradeModal({ open: false, projectId: null })}
                className="flex-1 py-4 rounded-xl font-bold text-[14px] text-gray-500 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpgrade}
                disabled={upgrading !== null}
                className="flex-1 py-4 rounded-xl bg-[#D4F655] hover:bg-[#c1e247] text-black font-bold text-[14px] transition-all shadow-lg shadow-[#D4F655]/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {upgrading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : <><Crown className="w-4 h-4" /> Upgrade Now</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Domain Modal */}
      {domainModal.open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-6 pb-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-black">Custom Domain</h2>
                <button 
                  onClick={() => setDomainModal({ open: false, projectId: null, currentDomain: '' })}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-2">Connect your own domain to your store.</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-[12px] font-bold text-gray-600 uppercase tracking-wider block mb-2">Your Subdomain</label>
                <div className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-500 text-sm">
                  https://{domainModal.currentDomain || 'yourname'}.sokostack.xyz
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-x-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-400">Or use custom domain</span>
                </div>
              </div>

              <div>
                <label className="text-[12px] font-bold text-gray-600 uppercase tracking-wider block mb-2">Custom Domain</label>
                <input 
                  type="text"
                  value={customDomain}
                  onChange={(e) => { setCustomDomain(e.target.value); setDomainError(''); }}
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
                  <strong>Note:</strong> To use a custom domain, add a CNAME record pointing to <code className="bg-blue-100 px-1 rounded">yourname.sokostack.xyz</code> in your DNS settings.
                </p>
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button 
                onClick={() => setDomainModal({ open: false, projectId: null, currentDomain: '' })}
                className="flex-1 py-3 rounded-xl font-bold text-sm text-gray-500 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveDomain}
                disabled={domainLoading}
                className="flex-1 py-3 rounded-xl bg-[#0A0A0A] hover:bg-black text-white font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {domainLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Domain'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
