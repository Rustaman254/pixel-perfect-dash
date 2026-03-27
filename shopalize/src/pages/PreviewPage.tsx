import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '@/store'
import { Button } from '@/components/ui/button'
import LoginModal from '@/components/LoginModal'
import StorePreview from '@/components/StorePreview'
import { ShoppingCart, ArrowLeft, Download, Pencil, Monitor, Tablet, Smartphone } from 'lucide-react'

export default function PreviewPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { currentProject, loadProject } = useStore();
  const [showLogin, setShowLogin] = useState(false);
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  useEffect(() => {
    if (projectId) loadProject(projectId);
  }, [projectId, loadProject]);

  const handleExport = async () => {
    if (!currentProject) return;
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    zip.file('index.html', '<!DOCTYPE html><html><body><h1>' + currentProject.name + '</h1><p>Export from Shopalize</p></body></html>');
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentProject.name.replace(/\s+/g, '-').toLowerCase()}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!currentProject) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const viewportWidth = viewport === 'desktop' ? '100%' : viewport === 'tablet' ? '768px' : '375px';

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <nav className="bg-background border-b sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/editor/${currentProject.id}`)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" />
              <span className="font-semibold text-sm">{currentProject.name}</span>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Preview</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center border rounded-lg p-0.5 mr-2">
              {[
                { mode: 'desktop' as const, icon: Monitor },
                { mode: 'tablet' as const, icon: Tablet },
                { mode: 'mobile' as const, icon: Smartphone },
              ].map(({ mode, icon: Icon }) => (
                <Button
                  key={mode}
                  variant={viewport === mode ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setViewport(mode)}
                >
                  <Icon className="w-4 h-4" />
                </Button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate(`/editor/${currentProject.id}`)}>
              <Pencil className="w-4 h-4 mr-1" /> Edit
            </Button>
            <Button size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-1" /> Export ZIP
            </Button>
          </div>
        </div>
      </nav>

      <main className="flex-1 overflow-auto flex justify-center py-6 px-4">
        <div
          className="bg-white shadow-xl rounded-xl overflow-hidden transition-all duration-300"
          style={{ width: viewportWidth, maxWidth: '100%' }}
        >
          <StorePreview project={currentProject} interactive />
        </div>
      </main>
    </div>
  );
}
