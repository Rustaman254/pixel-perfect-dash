import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store';
import { Globe, Palette, Layout, Eye, ExternalLink, Loader2, Plus, Pencil, Search, Smartphone, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function OnlineStorePage() {
  const navigate = useNavigate();
  const { projects, loadProjects } = useStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadProjects().then(() => setLoading(false)); }, []);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 mt-2 gap-4">
        <div>
           <h1 className="text-3xl font-bold text-black tracking-tight" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>Themes</h1>
           <p className="text-[15px] text-gray-500 mt-1">Customize the appearance of your storefront.</p>
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
      ) : (
        <div className="space-y-6 max-w-5xl">
          {/* Current Theme */}
          <div className="bg-white rounded-[2rem] border border-gray-200/60 shadow-sm overflow-hidden">
            <div className="p-6 md:p-8 flex flex-col border-b border-gray-100">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-[#D4F655]/20 flex items-center justify-center border border-[#D4F655]/50 shadow-sm">
                      <Palette className="w-6 h-6 text-[#0A0A0A]" />
                   </div>
                   <div>
                      <h2 className="text-[12px] font-bold text-gray-400 uppercase tracking-widest leading-tight mb-1">Live Theme</h2>
                      <h3 className="text-[18px] font-bold text-black" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>{projects[0]?.name || 'Shopalize Default'}</h3>
                   </div>
                </div>
                <div className="flex gap-2">
                   <span className="text-[11px] px-3 py-1.5 rounded-full font-bold uppercase tracking-wider bg-[#D4F655]/20 text-black border border-[#D4F655]/50 hidden sm:block">Published</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3 mt-auto">
                 {projects[0] && (
                    <button onClick={() => navigate(`/editor/${projects[0].id}`)} className="flex items-center gap-2 px-5 py-2.5 bg-[#D4F655] hover:bg-[#c1e247] shadow-lg shadow-[#D4F655]/20 text-[14px] font-bold text-black rounded-xl transition-all">
                       <Pencil className="w-4 h-4" /> Customize
                    </button>
                 )}
                 <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 hover:border-black text-[14px] font-bold text-gray-700 rounded-xl transition-all shadow-sm">
                    <Eye className="w-4 h-4" /> Preview
                 </button>
              </div>
            </div>
            
            {/* Theme Sneak Peek (Wireframe aesthetic) */}
            <div className="p-8 bg-gray-50/50 flex flex-col md:flex-row gap-8 items-center justify-center border-t border-gray-100 relative">
               <div className="absolute top-4 right-4 flex gap-2">
                 <button className="p-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:text-black text-gray-400 transition-colors"><Monitor className="w-4 h-4" /></button>
                 <button className="p-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:text-black text-gray-400 transition-colors"><Smartphone className="w-4 h-4" /></button>
               </div>
               
               <div className="bg-white rounded-xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] border border-gray-200 w-full max-w-[600px] overflow-hidden transform md:-rotate-2 transition-transform hover:rotate-0 duration-500">
                  <div className="h-10 bg-gray-50 border-b border-gray-100 flex items-center px-4 gap-2">
                     <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-400" />
                        <div className="w-3 h-3 rounded-full bg-amber-400" />
                        <div className="w-3 h-3 rounded-full bg-green-400" />
                     </div>
                     <div className="mx-auto h-5 w-48 bg-white border border-gray-200 rounded text-center flex items-center justify-center">
                        <span className="text-[9px] text-gray-400 font-medium font-mono">yourstore.shopalize.com</span>
                     </div>
                  </div>
                  <div className="p-6 pointer-events-none">
                     <div className="w-full h-32 rounded-xl mb-4 flex items-center justify-center relative overflow-hidden bg-[#0A0A0A]">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                        <span className="text-white/60 font-medium text-[13px] tracking-widest uppercase relative z-10">Hero Section</span>
                     </div>
                     <div className="grid grid-cols-3 gap-4">
                        {[1,2,3].map(i => (
                           <div key={i} className="border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm">
                              <div className="h-20 bg-gray-100" />
                              <div className="p-3">
                                 <div className="h-2 w-16 bg-gray-200 rounded-full mb-2" />
                                 <div className="h-2 w-10 bg-gray-100 rounded-full" />
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Theme Library Placeholder */}
            <div className="bg-white rounded-[2rem] border border-gray-200/60 p-8 shadow-sm">
               <div className="flex items-center justify-between mb-6">
                 <h3 className="text-[15px] font-bold text-black uppercase tracking-widest">Theme Library</h3>
                 <button onClick={() => navigate('/gallery')} className="text-[12px] font-bold text-gray-500 hover:text-black hover:underline uppercase tracking-wider">Explore themes</button>
               </div>
               
               <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-gray-50/50 h-[200px]">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-200 mb-3"><Layout className="w-5 h-5 text-gray-400" /></div>
                  <p className="text-[14px] font-bold text-black mb-1">No saved themes</p>
                  <p className="text-[13px] text-gray-500 max-w-[200px]">Save backup themes here while you publish a different one.</p>
               </div>
            </div>

            {/* Pages Quick Access */}
            <div className="bg-white rounded-[2rem] border border-gray-200/60 p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                 <h3 className="text-[15px] font-bold text-black uppercase tracking-widest">Online Store Pages</h3>
                 <button className="text-[12px] font-bold text-gray-500 hover:text-black hover:underline uppercase tracking-wider">Add page</button>
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                {['Home', 'Products', 'About Us', 'Contact'].map((page, idx) => (
                  <div key={page} className={cn("flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group", idx !== 0 && "border-t border-gray-100")}>
                    <div className="flex items-center gap-4">
                       <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-[#0A0A0A] group-hover:text-white transition-colors"><Layout className="w-4 h-4" /></div>
                       <div>
                          <span className="text-[14px] font-bold text-black">{page}</span>
                          {idx === 0 && <span className="ml-2 text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-bold uppercase">Index</span>}
                       </div>
                    </div>
                    <button className="text-[13px] font-bold text-[#0A0A0A] opacity-0 group-hover:opacity-100 transition-opacity hover:underline px-3 py-1.5 bg-gray-100 rounded-lg">Edit page</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
