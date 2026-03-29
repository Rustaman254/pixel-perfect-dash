import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store';
import { Palette, Eye, ExternalLink, Loader2, Plus, Pencil, Search, Smartphone, Monitor, Layout, Trash2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import StorePreview from '@/components/StorePreview';

export default function OnlineStorePage() {
  const navigate = useNavigate();
  const { projects, loadProjects, publishProject, deleteProject } = useStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadProjects().then(() => setLoading(false)); }, [loadProjects]);

  const togglePublish = async (id: string) => {
     try {
       await publishProject(id);
     } catch (err) {
       console.error(err);
     }
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
                  </div>
                )}
              </div>
              
              {publishedProject && (
                 <div className="flex flex-wrap gap-3 mt-auto relative z-20">
                    <button onClick={() => navigate(`/editor/${publishedProject.id}`)} className="flex items-center gap-2 px-5 py-2.5 bg-[#D4F655] hover:bg-[#c1e247] shadow-lg shadow-[#D4F655]/20 text-[14px] font-bold text-black rounded-xl transition-all">
                       <Pencil className="w-4 h-4" /> Customize
                    </button>
                    <button onClick={() => navigate(`/preview/${publishedProject.id}`)} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 hover:border-black text-[14px] font-bold text-gray-700 rounded-xl transition-all shadow-sm">
                       <Eye className="w-4 h-4" /> Preview
                    </button>
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
                            
                            <div className="mt-auto grid grid-cols-2 gap-2">
                               <button onClick={() => navigate(`/editor/${draft.id}`)} className="py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-black text-[13px] font-bold transition-colors w-full">Customize</button>
                               <button onClick={() => togglePublish(draft.id)} className="py-2.5 rounded-xl bg-[#0A0A0A] hover:bg-black text-white text-[13px] font-bold transition-colors w-full">Publish</button>
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
    </>
  );
}
