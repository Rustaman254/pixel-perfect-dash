import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store';
import { templates } from '@/data/templates';
import { ShoppingCart, ArrowLeft, Search, Loader2, Eye, Diamond, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import StorePreview from '@/components/StorePreview';

export default function GalleryPage() {
  const navigate = useNavigate();
  const { createProject } = useStore();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [creating, setCreating] = useState<string | null>(null);

  const categories = useMemo(() => {
    const cats = [...new Set(templates.map(t => t.category))];
    return cats.sort();
  }, []);

  const filtered = useMemo(() => {
    return templates.filter(t => {
      const matchesSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !selectedCategory || t.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, selectedCategory]);

  const handleSelect = async (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;
    setCreating(templateId);
    const project = await createProject(template);
    setCreating(null);
    if (project) {
      navigate(`/editor/${project.id}`);
    }
  };

  const handlePreview = (e: React.MouseEvent, templateId: string) => {
    e.stopPropagation();
    navigate(`/preview-template/${templateId}`);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#0A0A0A] font-sans selection:bg-[#D4F655] selection:text-black mt-20">
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-[#F8F9FA]/90 backdrop-blur-md border-b border-gray-200/50">
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-black hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
              <div className="w-8 h-8 bg-[#D4F655] rounded-bl-lg rounded-tr-lg flex items-center justify-center relative shadow-sm">
                <ShoppingCart className="w-4 h-4 text-black absolute top-2 left-2" />
              </div>
              <span className="text-xl font-bold tracking-tight">Theme Library</span>
            </div>
          </div>
          <button onClick={() => navigate('/dashboard')} className="text-[14px] font-bold text-black border-none hover:underline tracking-wide pr-2">
            Return to Dashboard
          </button>
        </div>
      </nav>

      <main className="pt-8 pb-24 max-w-[1600px] mx-auto px-6">
        <div className="bg-[#0A0A0A] text-white py-20 rounded-[3rem] px-8 md:px-16 relative overflow-hidden mb-16 shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
          <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#D4F655]/10 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="max-w-3xl relative z-10 mb-12">
            <h1 className="text-[50px] md:text-[60px] font-black leading-[1.05] tracking-tight mb-6" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>
              Exceptional storefronts,<br/>ready to launch.
            </h1>
            <p className="text-gray-400 text-lg md:text-xl max-w-2xl leading-relaxed font-medium">
              Start with a beautifully crafted theme engineered for high conversions. Choose from our free essentials or our premium, industry-leading layouts.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                placeholder="Search premium & free templates..."
                className="w-full pl-14 pr-6 py-4 bg-white/10 border border-white/10 rounded-2xl text-[15px] font-bold text-white placeholder:text-gray-500 outline-none focus:border-[#D4F655] focus:bg-white/15 transition-all shadow-inner"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button 
                className={`px-6 py-4 rounded-2xl text-[14px] font-bold transition-colors ${selectedCategory === null ? 'bg-[#D4F655] text-black shadow-[0_0_20px_rgba(212,246,85,0.3)]' : 'bg-white/5 border-transparent text-white/80 hover:bg-white/10'}`}
                onClick={() => setSelectedCategory(null)}
              >
                All Architecture
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`px-6 py-4 rounded-2xl text-[14px] font-bold transition-colors ${selectedCategory === cat ? 'bg-[#D4F655] text-black shadow-[0_0_20px_rgba(212,246,85,0.3)]' : 'bg-white/5 border-transparent text-white/80 hover:bg-white/10'}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-10">
          {filtered.map(template => (
            <div key={template.id} className="group flex flex-col">
              <div 
                className={cn(
                  "bg-[#E8E8E8] rounded-[2rem] p-3 aspect-[16/11] relative overflow-hidden mb-6 transition-all duration-500 group-hover:-translate-y-2 border-2",
                  template.isPremium ? "border-[#0A0A0A]/10 group-hover:border-[#D4F655] shadow-sm group-hover:shadow-[0_20px_40px_-15px_rgba(212,246,85,0.3)] bg-gradient-to-b from-gray-100 to-[#e2e2e2]" : "border-gray-200 group-hover:border-black/20 group-hover:shadow-xl"
                )}
              >
                <div className="w-full h-full rounded-[1.5rem] overflow-hidden relative border border-black/5 bg-gray-50">
                   <div className="w-full h-full absolute inset-0 bg-gray-100 transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105 pointer-events-none z-0">
                     <div style={{ width: '1440px', height: '1440px', transform: 'scale(0.333)', transformOrigin: 'top left' }}>
                        <StorePreview project={{ ...template, templateId: template.id, createdAt: 0, updatedAt: 0 } as any} interactive={false} />
                     </div>
                   </div>
                   
                   <div className="absolute inset-0 bg-black/10 group-hover:bg-black/40 transition-colors duration-500 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 gap-3 z-20 backdrop-blur-[2px]">
                     <button
                       className="bg-[#D4F655] text-black font-bold px-8 py-3.5 rounded-xl shadow-xl shadow-[#D4F655]/20 flex items-center gap-2 transform translate-y-8 group-hover:translate-y-0 transition-all duration-300 w-48 justify-center disabled:opacity-70"
                       onClick={() => !creating && handleSelect(template.id)}
                       disabled={!!creating}
                     >
                       {creating === template.id ? <><Loader2 className="w-5 h-5 animate-spin" /> Preparing...</> : 'Use Template'}
                     </button>
                     <button
                       className="bg-white/90 backdrop-blur-md border border-white/20 text-black hover:bg-white font-bold px-8 py-3.5 rounded-xl flex items-center gap-2 transform translate-y-8 group-hover:translate-y-0 transition-all duration-300 delay-75 w-48 justify-center shadow-xl hover:scale-105"
                       onClick={(e) => handlePreview(e, template.id)}
                     >
                       <Eye className="w-5 h-5" /> Live Preview
                     </button>
                   </div>
                </div>
                
                {/* Badges */}
                <div className="absolute top-6 left-6 flex gap-2">
                   {template.isPremium ? (
                     <div className="bg-[#0A0A0A] text-[#D4F655] px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-xl">
                        <Diamond className="w-3.5 h-3.5" /> Premium
                     </div>
                   ) : (
                     <div className="bg-white/90 backdrop-blur text-black px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-md border border-black/5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Free Tier
                     </div>
                   )}
                </div>

                {/* Theme brand dots */}
                <div className="absolute bottom-6 left-6 flex gap-1.5 bg-white/90 backdrop-blur-md px-3 py-2 rounded-xl shadow-lg border border-black/5">
                  {[template.theme.primaryColor, template.theme.secondaryColor, template.theme.accentColor].map((c, i) => (
                    <div key={i} className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-inner" style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              
              <div className="px-2">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[20px] font-bold tracking-tight text-black" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>{template.name}</h3>
                  <span className="text-[12px] font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-1 rounded-md">{template.category}</span>
                </div>
                <p className="text-[14px] text-gray-500 line-clamp-2 leading-relaxed font-medium">{template.description}</p>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="bg-white rounded-[3rem] p-24 text-center border border-gray-200 mt-8 shadow-sm">
            <div className="w-20 h-20 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-2xl font-bold mb-2 text-black" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>No aesthetics found</h3>
            <p className="text-gray-500 text-[15px] font-medium">Try adjusting your search criteria or browsing different tags.</p>
          </div>
        )}
      </main>
    </div>
  );
}
