import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store';
import { useAuth } from '@/contexts/AuthContext';
import { templates } from '@/data/templates';
import { ShoppingCart, ArrowLeft, Search, Loader2, Eye, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import StorePreview from '@/components/StorePreview';

export default function GalleryPage() {
  const navigate = useNavigate();
  const { createProject } = useStore();
  const { isAuthenticated } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [creating, setCreating] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/gallery' } });
    }
  }, [isAuthenticated, navigate]);

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
    try {
      const project = await createProject(template);
      setCreating(null);
      if (project) {
        navigate(`/editor/${project.id}`);
      }
    } catch (err) {
      setCreating(null);
      console.error('Failed to create project:', err);
    }
  };

  const handlePreview = (e: React.MouseEvent, templateId: string) => {
    e.stopPropagation();
    setPreviewTemplate(templateId);
  };

  const closePreview = () => {
    setPreviewTemplate(null);
  };

  return (
    <div className="min-h-screen bg-[#F6F6F7] text-[#0A0A0A] font-sans selection:bg-[#D4F655] selection:text-black">
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </button>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
              <div className="w-8 h-8 bg-[#D4F655] rounded-md flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-black" />
              </div>
              <span className="text-base font-bold tracking-tight">Ripplify</span>
            </div>
          </div>
          <button onClick={() => navigate('/dashboard')} className="text-sm font-medium text-gray-500 hover:text-black transition-colors">
            Back to dashboard
          </button>
        </div>
      </nav>

      <main className="pt-16 pb-24 max-w-[1600px] mx-auto">
        {/* Hero Section */}
        <div className="bg-gradient-to-b from-white to-gray-50 py-16 px-6 border-b border-gray-200">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-[#202223] tracking-tight mb-4">
              Choose a template
            </h1>
            <p className="text-lg text-[#6D6E79] mb-8 max-w-2xl mx-auto">
              Select from our collection of professionally designed templates. Every template is fully customizable so you can make it unique to your brand.
            </p>
            
            {/* Search */}
            <div className="relative max-w-lg mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                placeholder="Search templates..."
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-300 rounded-lg text-base placeholder:text-gray-400 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="px-6 py-6 border-b border-gray-200 bg-white sticky top-16 z-40">
          <div className="max-w-[1600px] mx-auto flex items-center gap-2 overflow-x-auto">
            <button 
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                selectedCategory === null 
                  ? "bg-[#202223] text-white" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
              onClick={() => setSelectedCategory(null)}
            >
              All templates
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                  selectedCategory === cat 
                    ? "bg-[#202223] text-white" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map(template => (
              <div key={template.id} className="group flex flex-col bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all">
                {/* Template Preview */}
                <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden cursor-pointer" onClick={(e) => handlePreview(e, template.id)}>
                  <div className="w-full h-full">
                    <StorePreview project={{ ...template, templateId: template.id, createdAt: 0, updatedAt: 0 } as any} interactive={false} />
                  </div>
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <button
                      className="bg-white text-gray-900 font-medium px-5 py-2.5 rounded-md shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-200 flex items-center gap-2"
                      onClick={(e) => handlePreview(e, template.id)}
                    >
                      <Eye className="w-4 h-4" /> Preview
                    </button>
                  </div>
                </div>
               
                {/* Template Info */}
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base font-bold text-[#202223]">{template.name}</h3>
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">{template.category}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-1">{template.description}</p>
                  <button
                    className={cn(
                      "w-full py-2.5 rounded-md font-medium transition-colors",
                      creating === template.id 
                        ? "bg-gray-100 text-gray-400 cursor-wait" 
                        : "bg-[#202223] text-white hover:bg-[#363738]"
                    )}
                    onClick={() => !creating && handleSelect(template.id)}
                    disabled={!!creating}
                  >
                    {creating === template.id ? <><Loader2 className="w-4 h-4 animate-spin inline" /> Creating...</> : 'Use template'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-16 text-center">
              <Search className="w-10 h-10 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-[#202223] mb-2">No templates found</h3>
              <p className="text-gray-600">Try adjusting your search or filter to find what you're looking for.</p>
            </div>
          )}
        </div>
      </main>

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={closePreview}>
          <div className="bg-white rounded-lg w-full max-w-6xl h-[90vh] overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-bold text-[#202223]">{templates.find(t => t.id === previewTemplate)?.name}</h3>
              <button onClick={closePreview} className="w-8 h-8 rounded-md hover:bg-gray-100 flex items-center justify-center">
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden bg-gray-100">
              <div className="h-full flex items-center justify-center">
                <iframe 
                  src={`/preview-template/${previewTemplate}`}
                  className="w-full max-w-5xl h-full bg-white rounded-lg shadow-xl border"
                  title="Template Preview"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}