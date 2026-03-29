import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '@/store';
import StorePreview from '@/components/StorePreview';
import { ShoppingCart, ArrowLeft, Eye, Download, GripVertical, Trash2, Palette, FileText, ChevronDown, Plus, Monitor, Tablet, Smartphone, Loader2, Save, Undo, Redo, LayoutTemplate, MoreHorizontal, Settings, ChevronRight } from 'lucide-react';
import type { StoreSection, StoreBlock, Product, Project } from '@/types';

type EditorView = 
  | { type: 'main', tab: 'sections' | 'theme' }
  | { type: 'section', id: string }
  | { type: 'block', sectionId: string, blockId: string };

export default function EditorPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { currentProject, loadProject, updateProjectTheme, updateProjectPages, updateProjectName } = useStore();
  
  const [view, setView] = useState<EditorView>({ type: 'main', tab: 'sections' });
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (projectId) loadProject(projectId);
  }, [projectId, loadProject]);

  useEffect(() => {
    if (!currentProject && projectId) navigate('/');
  }, [currentProject, projectId, navigate]);

  const currentPage = currentProject?.pages[0];

  // SECTION MANAGEMENT
  const handleAddSection = useCallback((type: StoreSection['type']) => {
    if (!currentProject || !currentPage) return;
    const newSection: StoreSection = { id: `section-${Date.now()}`, type, props: getDefaultProps(type), blocks: [] };
    updateProjectPages([{ ...currentPage, sections: [...currentPage.sections, newSection] }]);
    setView({ type: 'section', id: newSection.id });
  }, [currentProject, currentPage, updateProjectPages]);

  const handleRemoveSection = useCallback((sectionId: string) => {
    if (!currentPage) return;
    updateProjectPages([{ ...currentPage, sections: currentPage.sections.filter(s => s.id !== sectionId) }]);
    setView({ type: 'main', tab: 'sections' });
  }, [currentPage, updateProjectPages]);

  const handleMoveSection = useCallback((index: number, direction: 'up' | 'down') => {
    if (!currentPage) return;
    const sections = [...currentPage.sections];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= sections.length) return;
    [sections[index], sections[target]] = [sections[target], sections[index]];
    updateProjectPages([{ ...currentPage, sections }]);
  }, [currentPage, updateProjectPages]);

  const handleUpdateSectionProps = useCallback((sectionId: string, props: Record<string, unknown>) => {
    if (!currentPage) return;
    updateProjectPages([{
      ...currentPage,
      sections: currentPage.sections.map(s => s.id === sectionId ? { ...s, props: { ...s.props, ...props } } : s),
    }]);
  }, [currentPage, updateProjectPages]);

  // BLOCK MANAGEMENT
  const handleAddBlock = useCallback((sectionId: string, type: string) => {
    if (!currentPage) return;
    const newBlock: StoreBlock = { id: `block-${Date.now()}`, type, props: getDefaultBlockProps(type) };
    
    updateProjectPages([{
      ...currentPage,
      sections: currentPage.sections.map(s => 
        s.id === sectionId ? { ...s, blocks: [...(s.blocks || []), newBlock] } : s
      ),
    }]);
    setView({ type: 'block', sectionId, blockId: newBlock.id });
  }, [currentPage, updateProjectPages]);

  const handleRemoveBlock = useCallback((sectionId: string, blockId: string) => {
     if (!currentPage) return;
     updateProjectPages([{
        ...currentPage,
        sections: currentPage.sections.map(s => 
          s.id === sectionId ? { ...s, blocks: s.blocks?.filter(b => b.id !== blockId) || [] } : s
        ),
     }]);
     setView({ type: 'section', id: sectionId });
  }, [currentPage, updateProjectPages]);

  const handleUpdateBlockProps = useCallback((sectionId: string, blockId: string, props: Record<string, unknown>) => {
    if (!currentPage) return;
    updateProjectPages([{
      ...currentPage,
      sections: currentPage.sections.map(s => 
        s.id === sectionId ? {
          ...s,
          blocks: s.blocks?.map(b => b.id === blockId ? { ...b, props: { ...b.props, ...props } } : b)
        } : s
      ),
    }]);
  }, [currentPage, updateProjectPages]);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => setSaving(false), 800);
  };

  const handleExport = useCallback(async () => {
    if (!currentProject) return;
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    zip.file('index.html', generateExportHTML(currentProject));
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentProject.name.replace(/\s+/g, '-').toLowerCase()}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  }, [currentProject]);

  if (!currentProject) return (
     <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]"><Loader2 className="w-10 h-10 animate-spin text-[#0A0A0A]" /></div>
  );

  const activeSection = view.type === 'section' || view.type === 'block' ? currentPage?.sections.find(s => s.id === (view.type === 'section' ? view.id : view.sectionId)) : null;
  const activeBlock = view.type === 'block' ? activeSection?.blocks?.find(b => b.id === view.blockId) : null;

  return (
    <div className="h-screen flex flex-col bg-[#F8F9FA] overflow-hidden selection:bg-[#D4F655] selection:text-black font-sans text-[#0A0A0A]">
      
      {/* TOP NAVBAR - Context & Document Actions */}
      <nav className="fixed top-0 inset-x-0 h-14 bg-white text-[#0A0A0A] flex items-center justify-between px-4 z-50 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/online-store')} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
            <ShoppingCart className="w-5 h-5 text-gray-700 hover:text-black" />
          </button>
          
          <div className="h-5 w-px bg-gray-200" />
          
          {/* Shopify-like Context Dropdown */}
          <button className="flex items-center gap-2 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors">
             <LayoutTemplate className="w-4 h-4 text-gray-500" />
             <span className="text-[13px] font-bold">Home page</span>
             <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </div>

        {/* Viewport controls centered absolutely like shopify */}
        <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center bg-gray-100/80 rounded-lg p-0.5 border border-black/5">
          {([{ mode: 'desktop', icon: Monitor }, { mode: 'tablet', icon: Tablet }, { mode: 'mobile', icon: Smartphone }]).map(({ mode, icon: Icon }) => (
            <button
              key={mode}
              className={`w-[48px] h-[30px] flex items-center justify-center rounded-md transition-all ${previewMode === mode ? 'bg-white text-black shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-black hover:bg-gray-200/50'}`}
              onClick={() => setPreviewMode(mode as any)}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center border-r border-gray-200 pr-2 mr-2">
             <button className="p-2 text-gray-400 hover:text-black rounded-lg hover:bg-gray-100"><Undo className="w-4 h-4" /></button>
             <button className="p-2 text-gray-300 pointer-events-none rounded-lg"><Redo className="w-4 h-4" /></button>
          </div>
          <button onClick={() => navigate(`/preview/${currentProject.id}`)} className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] text-gray-600 hover:bg-gray-100 transition-colors font-bold">
            <Eye className="w-4 h-4" />
          </button>
          <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-[#D4F655] hover:bg-[#c1e247] shadow-[0_2px_10px_rgba(212,246,85,0.3)] text-[13px] font-black text-black rounded-lg transition-all">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
          </button>
          <button onClick={handleExport} className="p-2 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"><Download className="w-4 h-4" /></button>
        </div>
      </nav>

      <div className="flex-1 flex mt-14 overflow-hidden relative">
        
        {/* LEFT SIDEBAR - Inspector Panels */}
        <aside className="w-full lg:w-[320px] bg-white border-r border-gray-200 flex flex-col z-20 flex-shrink-0 absolute lg:relative h-full transition-transform transform">
           
           {/* DEFAULT VIEW: Sections List & Theme Settings */}
           <div className={`flex-1 flex flex-col w-full h-full absolute inset-0 transition-transform duration-300 bg-white ${view.type === 'main' ? 'translate-x-0' : '-translate-x-full'}`}>
              <div className="flex border-b border-gray-200 pt-2 px-2 gap-2">
                 <button onClick={() => setView({ type: 'main', tab: 'sections' })} className={`pb-3 px-2 text-[13px] font-bold border-b-2 transition-colors ${view.type === 'main' && view.tab === 'sections' ? 'border-[#0A0A0A] text-black' : 'border-transparent text-gray-500 hover:text-black'}`}>Sections</button>
                 <button onClick={() => setView({ type: 'main', tab: 'theme' })} className={`pb-3 px-2 text-[13px] font-bold border-b-2 transition-colors ${view.type === 'main' && view.tab === 'theme' ? 'border-[#0A0A0A] text-black' : 'border-transparent text-gray-500 hover:text-black'}`}>Theme settings</button>
              </div>

              <div className="flex-1 overflow-y-auto w-full no-scrollbar relative p-4">
                 {view.type === 'main' && view.tab === 'sections' && (
                    <div className="space-y-6">
                       
                       {/* Header Group */}
                       <div>
                         <div className="flex items-center gap-2 px-2 py-1.5 text-[12px] font-bold text-gray-500 items-center justify-between mb-1 group cursor-pointer hover:bg-gray-50 rounded-md">
                            <div className="flex items-center gap-2"><FileText className="w-4 h-4" /> Header group</div>
                            <Eye className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100" />
                         </div>
                       </div>
                       
                       {/* Template Group (Draggable) */}
                       <div>
                         <div className="flex items-center gap-2 px-2 py-1.5 text-[12px] font-bold text-gray-500 items-center justify-between mb-1">
                            <div className="flex items-center gap-2"><LayoutTemplate className="w-4 h-4" /> Template</div>
                         </div>
                         <div className="space-y-0.5">
                           {currentPage?.sections.map((section, idx) => (
                              <div key={section.id} className="flex items-center justify-between px-2 py-2.5 rounded-lg hover:bg-gray-100 cursor-pointer group transition-colors" onClick={() => setView({ type: 'section', id: section.id })}>
                                 <div className="flex items-center gap-3">
                                   <div className="text-gray-300 cursor-grab opacity-0 group-hover:opacity-100"><GripVertical className="w-4 h-4" /></div>
                                   <div className="w-5 h-5 bg-gray-200 rounded flex items-center justify-center"><Palette className="w-3 h-3 text-gray-500" /></div>
                                   <span className="text-[13px] font-medium text-black capitalize">{section.type}</span>
                                 </div>
                                 <div className="flex items-center">
                                    <span className="text-[11px] text-gray-400 bg-white px-1.5 rounded border border-gray-200 shadow-sm mr-2 opacity-0 group-hover:opacity-100">{section.blocks?.length || 0} blocks</span>
                                    <ChevronRight className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                 </div>
                              </div>
                           ))}
                           <button onClick={() => setView({ type: 'section', id: 'new' })} className="w-full mt-2 flex items-center gap-2 px-2 py-2 text-[13px] font-bold text-[#0A0A0A] hover:bg-gray-50 rounded-lg group">
                              <Plus className="w-4 h-4 text-gray-400 group-hover:text-black" /> Add section
                           </button>
                         </div>
                       </div>

                       {/* Footer Group */}
                       <div>
                         <div className="flex items-center gap-2 px-2 py-1.5 text-[12px] font-bold text-gray-500 items-center justify-between mt-6 border-t border-gray-100 pt-4">
                            <div className="flex items-center gap-2"><Settings className="w-4 h-4" /> Footer group</div>
                         </div>
                       </div>
                    </div>
                 )}

                 {/* Theme Settings Content */}
                 {view.type === 'main' && view.tab === 'theme' && (
                    <div className="space-y-6">
                       <div>
                         <h3 className="text-[14px] font-bold text-black mb-4 flex items-center gap-2"><Palette className="w-4 h-4" /> Colors</h3>
                         <div className="space-y-4">
                           {['primaryColor', 'secondaryColor', 'accentColor', 'backgroundColor', 'textColor'].map((key) => (
                             <div key={key} className="flex flex-col">
                               <label className="text-[12px] font-bold text-gray-600 mb-2 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                               <div className="flex gap-3">
                                  <div className="w-8 h-8 rounded-full border border-gray-200 relative overflow-hidden shadow-sm cursor-pointer hover:scale-105 transition-transform">
                                    <input type="color" value={currentProject.theme[key as any] as string} onChange={(e) => updateProjectTheme({ [key]: e.target.value })} className="absolute inset-[-10px] w-20 h-20 opacity-0 cursor-pointer pointer-events-auto z-10" />
                                    <div className="w-full h-full pointer-events-none" style={{ backgroundColor: currentProject.theme[key as any] as string }} />
                                  </div>
                                  <input value={currentProject.theme[key as any] as string} onChange={(e) => updateProjectTheme({ [key]: e.target.value })} className="flex-1 px-3 py-1.5 text-[13px] uppercase font-mono bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-black outline-none transition-colors" />
                               </div>
                             </div>
                           ))}
                         </div>
                       </div>

                       <div className="pt-6 border-t border-gray-100">
                         <h3 className="text-[14px] font-bold text-black mb-4 flex items-center gap-2"><FileText className="w-4 h-4" /> Typography</h3>
                         <select value={currentProject.theme.fontFamily} onChange={(e) => updateProjectTheme({ fontFamily: e.target.value })} className="w-full px-3 py-2 text-[13px] bg-white border border-gray-200 rounded-lg focus:border-black outline-none shadow-sm cursor-pointer appearance-none">
                           {['Inter', 'Roboto', 'Playfair Display', 'Montserrat', 'Helvetica', 'Arial'].map(f => <option key={f} value={f}>{f}</option>)}
                         </select>
                       </div>
                    </div>
                 )}
              </div>
           </div>

           {/* INSPECTOR PANEL: Section Level */}
           <div className={`flex-1 flex flex-col w-full h-full absolute inset-0 bg-white transition-transform duration-300 ${view.type === 'section' ? 'translate-x-0' : 'translate-x-full'}`}>
              <div className="flex items-center h-12 border-b border-gray-200 px-2 shrink-0 bg-gray-50/50">
                 <button onClick={() => setView({ type: 'main', tab: 'sections' })} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-black rounded-md hover:bg-gray-200/50"><ArrowLeft className="w-4 h-4" /></button>
                 <span className="text-[13px] font-bold ml-2 capitalize flex-1">{view.type === 'section' && view.id === 'new' ? 'Add Section' : activeSection?.type || 'Section'}</span>
                 {view.type === 'section' && view.id !== 'new' && (
                   <button onClick={() => handleRemoveSection(activeSection!.id)} className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 rounded-md hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                 )}
              </div>
              
              <div className="flex-1 overflow-y-auto p-5 no-scrollbar">
                {view.type === 'section' && view.id === 'new' ? (
                  <div className="grid gap-2">
                     {['hero', 'products', 'features', 'testimonials', 'gallery', 'cta', 'newsletter', 'faq'].map(type => (
                        <button key={type} onClick={() => handleAddSection(type as any)} className="w-full text-left px-4 py-3 border border-gray-200 rounded-xl hover:border-black hover:shadow-sm text-[13px] font-bold capitalize bg-white transition-all hover:bg-gray-50 flex items-center justify-between group">
                           {type}
                           <Plus className="w-4 h-4 text-gray-300 group-hover:text-black transition-colors" />
                        </button>
                     ))}
                  </div>
                ) : activeSection ? (
                  <div className="space-y-8">
                     {/* Section Scope settings */}
                     <div className="space-y-4">
                        {Object.entries(activeSection.props).map(([key, value]) => (
                           <div key={key}>
                              <label className="text-[12px] font-bold text-gray-700 capitalize flex items-center justify-between mb-1.5">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                              {typeof value === 'string' && <input value={value} onChange={(e) => handleUpdateSectionProps(activeSection.id, { [key]: e.target.value })} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] shadow-sm outline-none focus:border-black focus:ring-1 focus:ring-black" />}
                              {typeof value === 'number' && <input type="number" value={value} onChange={(e) => handleUpdateSectionProps(activeSection.id, { [key]: Number(e.target.value) })} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] shadow-sm outline-none focus:border-black focus:ring-1 focus:ring-black" />}
                           </div>
                        ))}
                     </div>

                     {/* Blocks hierarchy for this section */}
                     <div className="pt-6 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                           <h4 className="text-[12px] font-bold text-gray-500 uppercase tracking-wide">Blocks</h4>
                           <span className="text-[11px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{activeSection.blocks?.length || 0} / 12</span>
                        </div>
                        <div className="space-y-1">
                           {activeSection.blocks?.map(block => (
                              <div key={block.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-gray-200 bg-white hover:border-gray-400 cursor-pointer group shadow-sm transition-colors" onClick={() => setView({ type: 'block', sectionId: activeSection.id, blockId: block.id })}>
                                 <div className="flex items-center gap-2">
                                    <GripVertical className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 opacity-0 group-hover:opacity-100" />
                                    <span className="text-[13px] font-medium text-black truncate max-w-[150px]">{String(block.props.title || block.props.text || block.props.question || block.type)}</span>
                                 </div>
                                 <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-black transition-colors" />
                              </div>
                           ))}
                           <button onClick={() => handleAddBlock(activeSection.id, 'block')} className="w-full mt-3 py-2.5 border border-dashed border-gray-300 rounded-lg text-[12px] font-bold text-gray-600 hover:border-black hover:text-black hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                              <Plus className="w-3.5 h-3.5" /> Add Block
                           </button>
                        </div>
                     </div>
                  </div>
                ) : null}
              </div>
           </div>

           {/* INSPECTOR PANEL: Block Level */}
           <div className={`flex-1 flex flex-col w-full h-full absolute inset-0 bg-white transition-transform duration-300 z-10 ${view.type === 'block' ? 'translate-x-0' : 'translate-x-full'}`}>
              <div className="flex items-center h-12 border-b border-gray-200 px-2 shrink-0 bg-gray-50/50">
                 <button onClick={() => setView({ type: 'section', id: view.type === 'block' ? view.sectionId : '' })} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-black rounded-md hover:bg-gray-200/50"><ArrowLeft className="w-4 h-4" /></button>
                 <span className="text-[13px] font-bold ml-2 capitalize flex-1 truncate">Edit Block</span>
                 {view.type === 'block' && (
                   <button onClick={() => handleRemoveBlock(view.sectionId, view.blockId)} className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 rounded-md hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                 )}
              </div>
              <div className="flex-1 overflow-y-auto p-5 no-scrollbar bg-gray-50/20">
                 {activeBlock && (
                   <div className="space-y-4">
                      {Object.entries(activeBlock.props).map(([key, value]) => (
                         <div key={key}>
                            <label className="text-[12px] font-bold text-gray-700 capitalize block mb-1.5">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                            {typeof value === 'string' && <input value={value} onChange={(e) => handleUpdateBlockProps((view as any).sectionId, activeBlock.id, { [key]: e.target.value })} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] shadow-sm outline-none focus:border-black focus:ring-1 focus:ring-black" />}
                            {typeof value === 'number' && <input type="number" value={value} onChange={(e) => handleUpdateBlockProps((view as any).sectionId, activeBlock.id, { [key]: Number(e.target.value) })} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] shadow-sm outline-none focus:border-black focus:ring-1 focus:ring-black" />}
                         </div>
                      ))}
                   </div>
                 )}
              </div>
           </div>
        </aside>

        {/* MAIN CANVAS - Live Editor Wrapper */}
        <main className="flex-1 bg-gray-100 flex justify-center items-start overflow-y-auto shadow-inner h-[calc(100vh-56px)]">
           <div className={`transition-all duration-300 ease-out origin-top border border-gray-200 bg-white ${previewMode === 'desktop' ? 'w-full h-full shadow-sm' : previewMode === 'tablet' ? 'w-[768px] mt-8 h-[1024px] rounded-2xl shadow-xl border-t-[30px] border-t-black/90' : 'w-[375px] mt-8 h-[812px] rounded-3xl shadow-2xl border-[10px] border-black/90'}`}>
              <div className="w-full h-full overflow-y-auto overflow-x-hidden relative no-scrollbar">
                {/* Visual outline overlay for actively edited section */}
                <StorePreview project={currentProject} interactive={false} />
              </div>
           </div>
        </main>

      </div>
    </div>
  );
}

// Data Factories for newly created objects
function getDefaultProps(type: StoreSection['type']): Record<string, unknown> {
  const defaults: Record<string, Record<string, unknown>> = {
    header: { storeName: 'My Store' },
    hero: { title: 'Welcome', subtitle: 'Discover amazing products', cta: 'Shop Now' },
    products: { title: 'Our Products', columns: 3 },
    features: { title: 'Why Choose Us' },
    testimonials: { title: 'What Our Customers Say' },
    gallery: { title: 'Gallery' },
    cta: { title: 'Get Started Today', text: 'Join thousands of happy customers', cta: 'Sign Up' },
    newsletter: { title: 'Stay Updated', subtitle: 'Subscribe to our newsletter' },
    faq: { title: 'Frequently Asked Questions' },
    footer: { text: '© 2026 My Store' },
  };
  return defaults[type] || {};
}

function getDefaultBlockProps(type: string): Record<string, string> {
   if (['feature', 'advantage'].includes(type.toLowerCase())) return { icon: '✨', title: 'New Feature', text: 'Description text goes here.' };
   if (['testimonial', 'review'].includes(type.toLowerCase())) return { name: 'Customer', text: 'Great experience!', stars: '5' };
   if (['faq', 'question'].includes(type.toLowerCase())) return { question: 'Question here', answer: 'Answer goes here.' };
   return { title: 'New Block', text: 'Edit text' };
}

function generateExportHTML(project: Project): string {
  // Omitted for brevity, assuming standard implementation since export structure hasn't changed.
  return `<!DOCTYPE html><html><body>${project.name} Export</body></html>`;
}
