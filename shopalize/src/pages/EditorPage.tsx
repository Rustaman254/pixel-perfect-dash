import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '@/store';
import StorePreview from '@/components/StorePreview';
import { ArrowLeft, Eye, Download, Plus, Trash2, Palette, ChevronDown, Loader2, Save, Monitor, Tablet, Smartphone, LayoutTemplate, Settings, X, ChevronRight, GripVertical, GripIcon, MoreHorizontal } from 'lucide-react';
import type { StoreSection, StoreBlock, Project, SectionStyle } from '@/types';
import OnboardingOverlay from '@/components/OnboardingOverlay';

type EditorView = 
  | { type: 'main', tab: 'sections' | 'theme' }
  | { type: 'section', id: string }
  | { type: 'block', sectionId: string, blockId: string };

interface OnboardingTask {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  action?: () => void;
}

export default function EditorPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { currentProject, loadProject, updateProjectTheme, updateProjectPages, updateProjectName, createOrder } = useStore();
  
  const [view, setView] = useState<EditorView>({ type: 'main', tab: 'sections' });
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [saving, setSaving] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [draggedSection, setDraggedSection] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    if (projectId) loadProject(projectId);
  }, [projectId, loadProject]);

  useEffect(() => {
    if (!currentProject && projectId) navigate('/');
    if (currentProject && !activePageId) {
      setActivePageId(currentProject.pages[0]?.id || null);
    }
    if (currentProject) {
      const hasCompletedOnboarding = localStorage.getItem(`onboarding_${projectId}_complete`);
      setOnboardingComplete(hasCompletedOnboarding === 'true');
      if (!hasCompletedOnboarding) {
        setShowOnboarding(true);
      }
    }
  }, [currentProject, projectId, navigate, activePageId, loadProject]);

  const currentPage = currentProject?.pages.find(p => p.id === activePageId) || currentProject?.pages[0];

  const handleOnboardingComplete = useCallback(() => {
    if (projectId) {
      localStorage.setItem(`onboarding_${projectId}_complete`, 'true');
      setOnboardingComplete(true);
    }
    setShowOnboarding(false);
  }, [projectId]);

  const checkOnboardingTask = useCallback((taskId: string): boolean => {
    if (!currentProject || !currentPage) return false;
    switch (taskId) {
      case 'add_product':
        return (currentProject.products?.length || 0) > 0;
      case 'customize_theme':
        const theme = currentProject.theme;
        return theme.primaryColor !== '#000000' || theme.backgroundColor !== '#ffffff' || !!theme.logoUrl;
      case 'add_hero':
        return currentPage.sections.some(s => s.type === 'hero');
      case 'customize_header':
        const headerSection = currentPage.sections.find(s => s.type === 'header' || s.type === 'navbar');
        return headerSection ? !!(headerSection.props.storeName !== 'My Store' || (headerSection.props.navLinks as string[])?.length > 0) : false;
      case 'add_cta':
        return currentPage.sections.some(s => s.type === 'cta');
      case 'publish_store':
        return currentProject.theme.isPublished === true;
      default:
        return false;
    }
  }, [currentProject, currentPage]);

  const getOnboardingTasks = (): OnboardingTask[] => {
    if (!currentProject || !currentPage) return [];
    return [
      {
        id: 'add_product',
        title: 'Add your first product',
        description: 'Add products to sell in your store',
        completed: checkOnboardingTask('add_product'),
        action: () => navigate(`/products`, { state: { from: `/editor/${projectId}` } }),
      },
      {
        id: 'customize_theme',
        title: 'Customize your theme',
        description: 'Set your brand colors and logo',
        completed: checkOnboardingTask('customize_theme'),
        action: () => setView({ type: 'main', tab: 'theme' }),
      },
      {
        id: 'add_hero',
        title: 'Edit your hero section',
        description: 'Customize your store headline',
        completed: checkOnboardingTask('add_hero'),
        action: () => {
          const heroSection = currentPage.sections.find(s => s.type === 'hero');
          if (heroSection) setView({ type: 'section', id: heroSection.id });
        },
      },
      {
        id: 'customize_header',
        title: 'Customize navigation',
        description: 'Add your store name and menu links',
        completed: checkOnboardingTask('customize_header'),
        action: () => {
          const headerSection = currentPage.sections.find(s => s.type === 'header' || s.type === 'navbar');
          if (headerSection) setView({ type: 'section', id: headerSection.id });
        },
      },
      {
        id: 'add_cta',
        title: 'Add a call to action',
        description: 'Encourage visitors to take action',
        completed: checkOnboardingTask('add_cta'),
        action: () => {
          const ctaSection = currentPage.sections.find(s => s.type === 'cta');
          if (ctaSection) setView({ type: 'section', id: ctaSection.id });
        },
      },
      {
        id: 'publish_store',
        title: 'Publish your store',
        description: 'Make your store live',
        completed: checkOnboardingTask('publish_store'),
        action: () => navigate('/online-store'),
      },
    ];
  };

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

  const handleDragStart = useCallback((e: React.DragEvent, sectionId: string) => {
    setDraggedSection(sectionId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedSection(null);
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (!draggedSection || !currentProject || !currentPage) return;
    
    const sections = [...currentPage.sections];
    const draggedIndex = sections.findIndex(s => s.id === draggedSection);
    if (draggedIndex === -1) return;
    
    const [draggedSectionData] = sections.splice(draggedIndex, 1);
    sections.splice(targetIndex, 0, draggedSectionData);
    
    const updatedPages = currentProject.pages.map(p => 
      p.id === currentPage.id ? { ...p, sections } : p
    );
    updateProjectPages(updatedPages);
    setDraggedSection(null);
    setDragOverIndex(null);
  }, [draggedSection, currentProject, currentPage, updateProjectPages]);

  const handleUpdateSectionProps = useCallback((sectionId: string, props: Record<string, unknown>) => {
    if (!currentProject || !currentPage) return;
    const updatedPages = currentProject.pages.map(p => 
      p.id === currentPage.id ? {
        ...p,
        sections: p.sections.map(s => s.id === sectionId ? { ...s, props: { ...s.props, ...props } } : s)
      } : p
    );
    updateProjectPages(updatedPages);
  }, [currentProject, currentPage, updateProjectPages]);

  const handleUpdateSectionStyle = useCallback((sectionId: string, styleConfig: any) => {
    if (!currentProject || !currentPage) return;
    const updatedPages = currentProject.pages.map(p => 
      p.id === currentPage.id ? {
        ...p,
        sections: p.sections.map(s => s.id === sectionId ? { ...s, styleConfig: { ...s.styleConfig, ...styleConfig } } : s)
      } : p
    );
    updateProjectPages(updatedPages);
  }, [currentProject, currentPage, updateProjectPages]);

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
    setSaving('saving');
    setTimeout(() => {
       setSaving('saved');
       setTimeout(() => setSaving('idle'), 2000);
    }, 800);
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
     <div className="min-h-screen flex items-center justify-center bg-[#F6F6F7]"><Loader2 className="w-8 h-8 animate-spin text-[#202223]" /></div>
  );

  const activeSection = view.type === 'section' || view.type === 'block' ? currentPage?.sections.find(s => s.id === (view.type === 'section' ? view.id : view.sectionId)) : null;
  const activeBlock = view.type === 'block' ? activeSection?.blocks?.find(b => b.id === view.blockId) : null;

  return (
    <div className="h-screen flex flex-col bg-[#F6F6F7] overflow-hidden font-sans text-[#202223]">
      
      {/* Onboarding Overlay */}
      {showOnboarding && (
        <OnboardingOverlay 
          tasks={getOnboardingTasks()}
          onComplete={handleOnboardingComplete}
          onClose={() => setShowOnboarding(false)}
        />
      )}

      {/* Top Navbar */}
      <nav className="fixed top-0 inset-x-0 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/online-store')} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div className="h-5 w-px bg-gray-200" />
          
          <div className="relative group/dropdown">
            <button className="flex items-center gap-2 hover:bg-gray-100 px-2 py-1.5 rounded-md transition-colors">
               <LayoutTemplate className="w-4 h-4 text-gray-500" />
               <span className="text-sm font-medium">{currentPage?.name || 'Home'}</span>
               <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>
            <div className="absolute top-full left-0 mt-1 w-[200px] bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden opacity-0 invisible group-hover/dropdown:opacity-100 group-hover/dropdown:visible transition-all z-[100]">
               <div className="p-2 border-b border-gray-100 bg-gray-50">
                   <span className="text-xs font-medium text-gray-500 uppercase">Pages</span>
               </div>
               <div className="max-h-[300px] overflow-y-auto">
                   {currentProject?.pages.map(page => (
                     <button key={page.id} onClick={() => setActivePageId(page.id)} className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between ${activePageId === page.id ? 'bg-[#D4F655]/10 text-black font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                       {page.name}
                       {activePageId === page.id && <ChevronRight className="w-3.5 h-3.5" />}
                     </button>
                   ))}
               </div>
             </div>
          </div>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center bg-gray-100 rounded-md p-0.5">
          {([{ mode: 'desktop', icon: Monitor }, { mode: 'tablet', icon: Tablet }, { mode: 'mobile', icon: Smartphone }]).map(({ mode, icon: Icon }) => (
            <button
              key={mode}
              className={`w-[40px] h-[28px] flex items-center justify-center rounded transition-all ${previewMode === mode ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setPreviewMode(mode as any)}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(`/preview/${currentProject.id}`)} className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-gray-600 hover:bg-gray-100 transition-colors font-medium">
            <Eye className="w-4 h-4" /> Preview
          </button>
          <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-[#202223] hover:bg-[#363738] text-white text-sm font-medium rounded-md transition-colors">
            {saving === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" /> : saving === 'saved' ? 'Saved' : 'Save'}
          </button>
        </div>
      </nav>

      <div className="flex-1 flex mt-14 overflow-hidden">
         
        {/* Left Sidebar */}
        <aside className="w-[280px] bg-white border-r border-gray-200 flex flex-col z-20 flex-shrink-0">
           
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200">
             <button onClick={() => setView({ type: 'main', tab: 'sections' })} className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${view.type === 'main' && view.tab === 'sections' ? 'border-[#202223] text-[#202223]' : 'border-transparent text-gray-500'}`}>Sections</button>
             <button onClick={() => setView({ type: 'main', tab: 'theme' })} className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${view.type === 'main' && view.tab === 'theme' ? 'border-[#202223] text-[#202223]' : 'border-transparent text-gray-500'}`}>Theme</button>
          </div>

          {/* Sections Tab Content */}
          <div className={`flex-1 overflow-y-auto p-3 ${view.type !== 'main' || view.tab !== 'sections' ? 'hidden' : ''}`}>
             <div className="space-y-3">
                {currentPage?.sections.map((section, idx) => (
                  <div 
                    key={section.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, section.id)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                    onDrop={(e) => handleDrop(e, idx)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-md hover:bg-gray-100 cursor-pointer group transition-all ${draggedSection === section.id ? 'opacity-50' : ''} ${dragOverIndex === idx ? 'border-t-2 border-[#202223]' : ''}`}
                    onClick={() => setView({ type: 'section', id: section.id })}
                  >
                    <div className="flex items-center gap-2">
                      <GripIcon className="w-4 h-4 text-gray-300 cursor-grab" />
                      <span className="text-sm font-medium capitalize">{section.type}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </div>
                ))}
                <button onClick={() => setView({ type: 'section', id: 'new' })} className="w-full mt-2 flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#202223] hover:bg-gray-50 rounded-md">
                   <Plus className="w-4 h-4 text-gray-400" /> Add section
                </button>
             </div>
          </div>

          {/* Theme Tab Content */}
          <div className={`flex-1 overflow-y-auto p-3 ${view.type === 'main' && view.tab === 'theme' ? '' : 'hidden'}`}>
             <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2"><Palette className="w-4 h-4" /> Colors</h3>
                  <div className="space-y-3">
                    {['primaryColor', 'secondaryColor', 'accentColor', 'backgroundColor', 'textColor'].map((key) => (
                      <div key={key} className="flex flex-col">
                        <label className="text-xs font-medium text-gray-600 mb-1.5 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                        <div className="flex gap-2">
                           <div className="w-8 h-8 rounded-md border border-gray-200 relative overflow-hidden">
                             <input type="color" value={currentProject.theme[key as keyof typeof currentProject.theme] as string} onChange={(e) => updateProjectTheme({ [key]: e.target.value })} className="absolute inset-[-10px] w-20 h-20 opacity-0 cursor-pointer" />
                             <div className="w-full h-full" style={{ backgroundColor: currentProject.theme[key as keyof typeof currentProject.theme] as string }} />
                           </div>
                           <input value={currentProject.theme[key as keyof typeof currentProject.theme] as string} onChange={(e) => updateProjectTheme({ [key]: e.target.value })} className="flex-1 px-2 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-md focus:bg-white focus:border-[#202223] outline-none" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2"><Settings className="w-4 h-4" /> Typography</h3>
                  <select value={currentProject.theme.fontFamily} onChange={(e) => updateProjectTheme({ fontFamily: e.target.value })} className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-md focus:border-[#202223] outline-none">
                    {['Inter', 'Roboto', 'Playfair Display', 'Montserrat', 'Helvetica', 'Arial'].map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
             </div>
          </div>

          {/* Section Editor */}
          <div className={`flex-1 overflow-y-auto p-3 ${view.type === 'section' ? '' : 'hidden'}`}>
            <div className="flex items-center h-10 border-b border-gray-200 mb-3">
               <button onClick={() => setView({ type: 'main', tab: 'sections' })} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-[#202223] rounded-md hover:bg-gray-100"><ArrowLeft className="w-4 h-4" /></button>
               <span className="text-sm font-medium ml-2 capitalize flex-1">{view.type === 'section' && view.id === 'new' ? 'Add Section' : activeSection?.type || 'Section'}</span>
               {view.type === 'section' && view.id !== 'new' && (
                 <button onClick={() => handleRemoveSection(activeSection!.id)} className="w-8 h-8 flex items-center justify-center text-red-500 hover:text-red-700 rounded-md hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
               )}
            </div>
            
            {view.type === 'section' && view.id === 'new' ? (
              <div className="grid gap-2">
                 {['hero', 'products', 'features', 'testimonials', 'gallery', 'cta', 'newsletter', 'faq'].map(type => (
                   <button key={type} onClick={() => handleAddSection(type as any)} className="w-full text-left px-4 py-3 border border-gray-200 rounded-md hover:border-[#202223] hover:shadow-sm text-sm font-medium capitalize bg-white transition-all flex items-center justify-between group">
                      {type}
                      <Plus className="w-4 h-4 text-gray-300 group-hover:text-[#202223]" />
                   </button>
                 ))}
              </div>
            ) : activeSection ? (
              <div className="space-y-4">
                 {Object.entries(activeSection.props).map(([key, value]) => (
                    <div key={key}>
                       <label className="text-xs font-medium text-gray-600 capitalize block mb-1.5">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                       {typeof value === 'string' && <input value={value} onChange={(e) => handleUpdateSectionProps(activeSection.id, { [key]: e.target.value })} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-sm outline-none focus:border-[#202223] focus:ring-1 focus:ring-[#202223]" />}
                       {typeof value === 'number' && <input type="number" value={value} onChange={(e) => handleUpdateSectionProps(activeSection.id, { [key]: Number(e.target.value) })} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-sm outline-none focus:border-[#202223] focus:ring-1 focus:ring-[#202223]" />}
                    </div>
                 ))}

                 <div className="pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                       <h4 className="text-xs font-medium text-gray-500 uppercase">Blocks</h4>
                    </div>
                    <div className="space-y-2">
                       {activeSection.blocks?.map(block => (
                          <div key={block.id} className="flex items-center justify-between px-3 py-2 rounded-md border border-gray-200 bg-white cursor-pointer group" onClick={() => setView({ type: 'block', sectionId: activeSection.id, blockId: block.id })}>
                             <span className="text-sm font-medium truncate">{String(block.props.title || block.props.text || block.props.question || block.type)}</span>
                             <ChevronRight className="w-4 h-4 text-gray-300" />
                          </div>
                       ))}
                       <button onClick={() => handleAddBlock(activeSection.id, 'block')} className="w-full py-2 border border-dashed border-gray-300 rounded-md text-xs font-medium text-gray-500 hover:border-[#202223] hover:text-[#202223] hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                          <Plus className="w-3.5 h-3.5" /> Add Block
                       </button>
                    </div>
                 </div>
              </div>
            ) : null}
          </div>
        </aside>

        {/* Main Canvas */}
        <main className="flex-1 bg-gray-100 flex justify-center items-start overflow-y-auto">
           <div className={`transition-all duration-300 bg-white shadow-sm ${previewMode === 'desktop' ? 'w-full h-full' : previewMode === 'tablet' ? 'w-[768px] mt-4 mx-4 h-[1024px] rounded-md shadow-lg' : 'w-[375px] mt-4 mx-4 h-[812px] rounded-xl shadow-xl'}`}>
              <div className="w-full h-full overflow-y-auto overflow-x-hidden">
                <StorePreview project={currentProject} interactive={false} />
              </div>
           </div>
        </main>

      </div>
    </div>
  );
}

function getDefaultProps(type: StoreSection['type']): Record<string, unknown> {
  const defaults: Record<string, Record<string, unknown>> = {
    header: { storeName: 'My Store', navLinks: ['Collections', 'New Arrivals', 'About', 'Contact'], showCart: true, sticky: false, style: 'default', hidden: false },
    navbar: { storeName: 'My Store', style: 'minimal', navLinks: ['Collections', 'New Arrivals', 'About', 'Contact'], showCart: true, sticky: true, hidden: false },
    hero: { title: 'Welcome', subtitle: 'Discover amazing products', cta: 'Shop Now', ctaLink: '', style: 'default', images: [] },
    image_with_text: { title: 'Title', text: 'Description', layout: 'split', image: '' },
    products: { title: 'Our Products', columns: 3, style: 'default' },
    featured_collection: { title: 'Featured', columns: 2, style: 'default' },
    features: { title: 'Why Choose Us' },
    testimonials: { title: 'What Our Customers Say' },
    gallery: { title: 'Gallery', columns: 3, images: [] },
    cta: { title: 'Get Started', text: 'Join us today', cta: 'Sign Up', ctaLink: '', style: 'default' },
    newsletter: { title: 'Newsletter', subtitle: 'Stay updated' },
    instagram_feed: { title: '@store', limit: 4, images: [] },
    faq: { title: 'FAQ' },
    checkout: { title: 'Checkout', style: 'default' },
    footer: { storeName: 'My Store', text: '© 2026', links: ['Privacy', 'Terms'], style: 'default' },
  };
  return defaults[type] || {};
}

function getDefaultBlockProps(type: string): Record<string, string> {
   if (['feature', 'advantage'].includes(type.toLowerCase())) return { icon: '✨', title: 'New Feature', text: 'Description' };
   if (['testimonial', 'review'].includes(type.toLowerCase())) return { name: 'Customer', text: 'Great!', stars: '5' };
   if (['faq', 'question'].includes(type.toLowerCase())) return { question: 'Question', answer: 'Answer' };
   return { title: 'New Block', text: 'Edit text' };
}

function generateExportHTML(project: Project): string {
  const theme = project.theme;
  const pages = project.pages;
  const products = project.products;
  const sections: StoreSection[] = pages[0]?.sections || [];

  const sectionHTML = sections.map((s: StoreSection) => {
    switch (s.type) {
      case 'header':
        return `<header style="padding:1rem 2rem;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;justify-content:space-between"><strong style="font-size:1.25rem">${String(s.props.storeName || 'Store')}</strong><nav><a href="#" style="margin-left:1rem;color:${theme.primaryColor}">Shop</a></nav></header>`;
      case 'hero':
        return `<section style="text-align:center;padding:4rem 2rem;background:linear-gradient(135deg,${theme.primaryColor}11,${theme.secondaryColor}11)"><h1 style="font-size:2.5rem;margin-bottom:1rem;color:${theme.textColor}">${String(s.props.title)}</h1><p style="font-size:1.125rem;color:${theme.textColor}88;margin-bottom:2rem">${String(s.props.subtitle)}</p><a href="#products" style="background:${theme.primaryColor};color:#fff;padding:0.75rem 2rem;border-radius:0.5rem;text-decoration:none;display:inline-block">${String(s.props.cta)}</a></section>`;
      case 'products':
        return `<section id="products" style="padding:3rem 2rem"><h2 style="text-align:center;font-size:1.75rem;margin-bottom:2rem">${String(s.props.title)}</h2><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:1.5rem">${products.map((p: any) => `<div style="border:1px solid #e5e7eb;border-radius:0.75rem;overflow:hidden"><img src="${p.image}" alt="${p.name}" style="width:100%;height:200px;object-fit:cover"/><div style="padding:1rem"><h3>${p.name}</h3><p style="color:${theme.primaryColor};font-weight:600">$${p.price.toFixed(2)}</p><p style="color:#6b7280;font-size:0.875rem">${p.description}</p></div></div>`).join('')}</div></section>`;
      case 'footer':
        return `<footer style="padding:2rem;text-align:center;border-top:1px solid #e5e7eb;color:#6b7280">${String(s.props.text || '© 2026')}</footer>`;
      default:
        return `<section style="padding:3rem 2rem;text-align:center"><h2 style="font-size:1.5rem;margin-bottom:1rem">${String(s.props.title || s.type)}</h2></section>`;
    }
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.name}</title>
  <link href="https://fonts.googleapis.com/css2?family=${theme.fontFamily || 'Inter'}:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: '${theme.fontFamily || 'Inter'}', sans-serif; color: ${theme.textColor}; background: ${theme.backgroundColor}; }
    img { max-width: 100%; }
  </style>
</head>
<body>
${sectionHTML}
</body>
</html>`;
}