import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '@/store';
import { templates } from '@/data/templates';
import StorePreview from '@/components/StorePreview';
import { ShoppingCart, ArrowLeft, Download, Monitor, Tablet, Smartphone, Search, Wand2, Loader2 } from 'lucide-react';

export default function TemplatePreviewPage() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const { createProject } = useStore();
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [creating, setCreating] = useState(false);

  const template = templates.find(t => t.id === templateId);

  if (!template) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="text-center p-8 bg-white rounded-3xl border border-gray-200 shadow-xl max-w-sm">
           <Search className="w-10 h-10 text-gray-300 mx-auto mb-4" />
           <h3 className="text-xl font-bold text-black mb-2" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>Template Not Found</h3>
           <p className="text-gray-500 text-sm mb-6">The template you are trying to preview does not exist.</p>
           <button onClick={() => navigate('/gallery')} className="w-full bg-[#0A0A0A] hover:bg-black text-white px-4 py-3 rounded-xl font-bold transition-all">Back to Gallery</button>
        </div>
      </div>
    );
  }

  const handleLaunch = async () => {
    setCreating(true);
    const project = await createProject(template);
    setCreating(false);
    if (project) navigate(`/editor/${project.id}`);
  };

  const viewportWidth = viewport === 'desktop' ? '100%' : viewport === 'tablet' ? '768px' : '375px';

  return (
    <div className="h-screen flex flex-col bg-[#F8F9FA] overflow-hidden selection:bg-[#D4F655] selection:text-black">
      {/* Top Navbar */}
      <nav className="fixed top-0 inset-x-0 h-16 bg-[#0A0A0A] text-white flex items-center justify-between px-4 z-50 border-b border-white/10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/gallery')} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 border-l border-white/10 pl-4">
             <div className="flex flex-col">
               <span className="text-[12px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Previewing Theme</span>
               <span className="text-[14px] font-bold leading-none">{template.name}</span>
             </div>
             {template.isPremium && <span className="ml-2 text-[10px] bg-[#D4F655] text-black px-2 py-0.5 rounded font-bold uppercase tracking-widest hidden sm:inline-block">Premium</span>}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Viewport controls */}
          <div className="hidden sm:flex items-center bg-white/10 rounded-xl p-1">
            {[
              { mode: 'desktop' as const, icon: Monitor },
              { mode: 'tablet' as const, icon: Tablet },
              { mode: 'mobile' as const, icon: Smartphone },
            ].map(({ mode, icon: Icon }) => (
              <button
                key={mode}
                className={`w-10 h-8 flex items-center justify-center rounded-lg transition-all ${viewport === mode ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                onClick={() => setViewport(mode)}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
          
          <button 
             onClick={handleLaunch} 
             disabled={creating}
             className="flex items-center gap-2 px-5 py-2.5 bg-[#D4F655] hover:bg-[#c1e247] shadow-[0_0_15px_rgba(212,246,85,0.2)] text-[14px] font-bold text-black rounded-lg transition-all disabled:opacity-70"
          >
            {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Launching...</> : <><Wand2 className="w-4 h-4" /> Use this theme</>}
          </button>
        </div>
      </nav>

      {/* Preview Container */}
      <main className="flex-1 mt-16 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-gray-100/50 flex justify-center items-start pt-6 pb-0 px-4 overflow-y-auto w-full">
        <div 
          className="bg-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] rounded-t-2xl overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] origin-top border border-gray-200/50 ring-1 ring-black/5"
          style={{ width: viewportWidth, minHeight: '100%', maxWidth: '100%' }}
        >
          {/* Browser-like header for mobile/tablet previews */}
          {viewport !== 'desktop' && (
            <div className="h-12 bg-gray-100 border-b border-gray-200 flex items-center justify-center px-4">
               <div className="h-6 bg-white border border-gray-200 rounded-full w-48 mx-auto flex items-center justify-center">
                  <span className="text-[10px] text-gray-400 font-medium font-mono">{template.name.toLowerCase().replace(/\s+/g, '')}.shopalize.com</span>
               </div>
            </div>
          )}
          
          <div className="h-full pointer-events-none">
            {/* Create a mock project object to render the template natively using existing StorePreview */}
            <StorePreview project={{ ...template, templateId: template.id, createdAt: 0, updatedAt: 0 } as any} interactive={false} />
          </div>
        </div>
      </main>
    </div>
  );
}
