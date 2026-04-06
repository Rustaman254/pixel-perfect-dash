import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '@/store';
import StorePreview from '@/components/StorePreview';
import { ShoppingCart, ArrowLeft, Eye, Download, GripVertical, Trash2, Palette, FileText, ChevronDown, Plus, Monitor, Tablet, Smartphone, Loader2, Save, Undo, Redo, LayoutTemplate, MoreHorizontal, Settings, ChevronRight, CheckCircle2, ExternalLink, GripVertical as GripIcon, Link2, Image, Type, Box, Maximize2, X } from 'lucide-react';
import type { StoreSection, StoreBlock, Product, Project, AnimationStyle, SectionStyleConfig, SectionStyle } from '@/types';
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
  const { currentProject, loadProject, updateProjectTheme, updateProjectPages, updateProjectName } = useStore();
  
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

  const handleUpdateSectionStyle = useCallback((sectionId: string, styleConfig: Partial<SectionStyleConfig>) => {
    if (!currentProject || !currentPage) return;
    const updatedPages = currentProject.pages.map(p => 
      p.id === currentPage.id ? {
        ...p,
        sections: p.sections.map(s => s.id === sectionId ? { 
          ...s, 
          styleConfig: { ...s.styleConfig, ...styleConfig } 
        } : s)
      } : p
    );
    updateProjectPages(updatedPages);
  }, [currentProject, currentPage, updateProjectPages]);

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
     <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]"><Loader2 className="w-10 h-10 animate-spin text-[#0A0A0A]" /></div>
  );

  const activeSection = view.type === 'section' || view.type === 'block' ? currentPage?.sections.find(s => s.id === (view.type === 'section' ? view.id : view.sectionId)) : null;
  const activeBlock = view.type === 'block' ? activeSection?.blocks?.find(b => b.id === view.blockId) : null;

  return (
    <div className="h-screen flex flex-col bg-[#F8F9FA] overflow-hidden selection:bg-[#D4F655] selection:text-black font-sans text-[#0A0A0A]">
      
      {/* Onboarding Overlay */}
      {showOnboarding && (
        <OnboardingOverlay 
          tasks={getOnboardingTasks()}
          onComplete={handleOnboardingComplete}
          onClose={() => setShowOnboarding(false)}
        />
      )}

      {/* TOP NAVBAR - Context & Document Actions */}
      <nav className="fixed top-0 inset-x-0 h-14 bg-white text-[#0A0A0A] flex items-center justify-between px-4 z-50 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/online-store')} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          {currentProject?.slug && (
            <a href={`/s/${currentProject.slug}`} target="_blank" rel="noopener noreferrer" className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-all" title="View Live Store">
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          
          <div className="h-5 w-px bg-gray-200" />
          
          {/* Page Selector */}
          <div className="relative group/dropdown">
            <button className="flex items-center gap-2 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors">
               <LayoutTemplate className="w-4 h-4 text-gray-500" />
               <span className="text-[13px] font-bold">{currentPage?.name || 'Home page'}</span>
               <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>
            <div className="absolute top-full left-0 mt-1 w-[200px] bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden opacity-0 invisible group-hover/dropdown:opacity-100 group-hover/dropdown:visible transition-all z-[100]">
               <div className="p-2 border-b border-gray-100 bg-gray-50/50">
                   <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2">Pages</span>
               </div>
               <div className="max-h-[300px] overflow-y-auto pt-1 pb-1">
                   {currentProject?.pages.map(page => (
                     <button key={page.id} onClick={() => setActivePageId(page.id)} className={`w-full text-left px-4 py-2 text-[13px] transition-colors flex items-center justify-between ${activePageId === page.id ? 'bg-[#D4F655]/10 text-black font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
                       {page.name}
                       {activePageId === page.id && <CheckCircle2 className="w-3.5 h-3.5" />}
                     </button>
                   ))}
               </div>
            </div>
          </div>

          {/* Onboarding Indicator */}
          {!onboardingComplete && (
            <button 
              onClick={() => setShowOnboarding(true)}
              className="flex items-center gap-1.5 px-2 py-1 bg-[#D4F655]/20 text-[#0A0A0A] rounded-full text-xs font-bold hover:bg-[#D4F655]/30 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Setup Guide
            </button>
          )}
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
          <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-[#D4F655] hover:bg-[#c1e247] shadow-[0_2px_10px_rgba(212,246,85,0.3)] text-[13px] font-black text-black rounded-lg transition-all w-[100px] justify-center">
            {saving === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" /> : saving === 'saved' ? <><CheckCircle2 className="w-4 h-4"/> Saved</> : 'Save'}
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
                             <div className="flex items-center gap-2"><LayoutTemplate className="w-4 h-4" /> Template Sections</div>
                          </div>
                          <div className="space-y-1">
                            {currentPage?.sections.map((section, idx) => (
                              <div 
                                key={section.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, section.id)}
                                onDragOver={(e) => handleDragOver(e, idx)}
                                onDragEnd={handleDragEnd}
                                onDrop={(e) => handleDrop(e, idx)}
                                className={`flex items-center justify-between px-2 py-2.5 rounded-lg hover:bg-gray-100 cursor-pointer group transition-all ${draggedSection === section.id ? 'opacity-50' : ''} ${dragOverIndex === idx ? 'border-t-2 border-t-[#D4F655]' : ''}`}
                                onClick={() => setView({ type: 'section', id: section.id })}
                              >
                                <div className="flex items-center gap-2">
                                  <GripIcon className="w-4 h-4 text-gray-300 cursor-grab hover:text-gray-500" />
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
                                    <input type="color" value={currentProject.theme[key as keyof typeof currentProject.theme] as string} onChange={(e) => updateProjectTheme({ [key]: e.target.value })} className="absolute inset-[-10px] w-20 h-20 opacity-0 cursor-pointer pointer-events-auto z-10" />
                                    <div className="w-full h-full pointer-events-none" style={{ backgroundColor: currentProject.theme[key as keyof typeof currentProject.theme] as string }} />
                                  </div>
                                  <input value={currentProject.theme[key as keyof typeof currentProject.theme] as string} onChange={(e) => updateProjectTheme({ [key]: e.target.value })} className="flex-1 px-3 py-1.5 text-[13px] uppercase font-mono bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-black outline-none transition-colors" />
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
    header: { storeName: 'My Store', navLinks: ['Collections', 'New Arrivals', 'About', 'Contact'], showCart: true, sticky: false, style: 'default', hidden: false },
    navbar: { storeName: 'My Store', style: 'minimal', font: 'editorial', navLinks: ['Collections', 'New Arrivals', 'About', 'Contact'], showCart: true, sticky: true, hidden: false },
    hero: { title: 'Welcome', subtitle: 'Discover amazing products', cta: 'Shop Now', ctaLink: '', style: 'default', images: [] },
    image_with_text: { title: 'Craftsmanship', text: 'Timeless elegance in every detail.', layout: 'split', image: '' },
    products: { title: 'Our Products', columns: 3, style: 'default' },
    featured_collection: { title: 'Featured Collection', columns: 2, spacing: 'loose', style: 'default' },
    features: { title: 'Why Choose Us' },
    testimonials: { title: 'What Our Customers Say' },
    gallery: { title: 'Gallery', columns: 3, images: [] },
    cta: { title: 'Get Started Today', text: 'Join thousands of happy customers', cta: 'Sign Up', ctaLink: '', style: 'default' },
    newsletter: { title: 'Stay Updated', subtitle: 'Subscribe to our newsletter' },
    instagram_feed: { title: '@store', limit: 4, images: [] },
    faq: { title: 'Frequently Asked Questions' },
    checkout: { title: 'Checkout', style: 'default' },
    footer: { storeName: 'My Store', text: '© 2026 My Store', links: ['Privacy', 'Terms', 'Shipping'], style: 'default' },
  };
  return defaults[type] || {};
}

function getDefaultSectionStyle(type: StoreSection['type']): SectionStyleConfig {
  return {
    sectionStyle: 'default',
    sectionPadding: 'md',
    sectionBgColor: undefined,
    sectionTextColor: undefined,
    sectionAccentColor: undefined,
    sectionAnimation: 'none',
    sectionBorderRadius: 0,
  };
}

function getDefaultBlockProps(type: string): Record<string, string> {
   if (['feature', 'advantage'].includes(type.toLowerCase())) return { icon: '✨', title: 'New Feature', text: 'Description text goes here.' };
   if (['testimonial', 'review'].includes(type.toLowerCase())) return { name: 'Customer', text: 'Great experience!', stars: '5' };
   if (['faq', 'question'].includes(type.toLowerCase())) return { question: 'Question here', answer: 'Answer goes here.' };
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
        return `<section id="products" style="padding:3rem 2rem"><h2 style="text-align:center;font-size:1.75rem;margin-bottom:2rem">${String(s.props.title)}</h2><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:1.5rem">${products.map((p: Product) => `<div style="border:1px solid #e5e7eb;border-radius:0.75rem;overflow:hidden"><img src="${p.image}" alt="${p.name}" style="width:100%;height:200px;object-fit:cover"/><div style="padding:1rem"><h3>${p.name}</h3><p style="color:${theme.primaryColor};font-weight:600">$${p.price.toFixed(2)}</p><p style="color:#6b7280;font-size:0.875rem">${p.description}</p></div></div>`).join('')}</div></section>`;
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
