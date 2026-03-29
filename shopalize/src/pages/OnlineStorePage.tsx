import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store';
import { Globe, Palette, Layout, Eye, ExternalLink, Loader2, Plus, Pencil } from 'lucide-react';

export default function OnlineStorePage() {
  const navigate = useNavigate();
  const { projects, loadProjects } = useStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadProjects().then(() => setLoading(false)); }, []);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>Online Store</h1><p className="text-sm text-muted-foreground mt-0.5">Customize your store's appearance and pages.</p></div>
        <button onClick={() => navigate('/gallery')} className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2"><Plus className="w-4 h-4" /> New theme</button>
      </div>
      {loading ? <div className="p-16 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" /></div> : (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(124,58,237,0.08)' }}><Palette className="w-5 h-5 text-primary" /></div>
                <div><h3 className="text-sm font-bold text-foreground" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>Current Theme</h3><p className="text-[11px] text-muted-foreground">{projects[0]?.name || 'Default theme'}</p></div>
              </div>
              <div className="flex gap-2">
                {projects[0] && <button onClick={() => navigate(`/editor/${projects[0].id}`)} className="px-3 py-1.5 border border-border rounded-lg text-sm text-foreground hover:bg-muted flex items-center gap-1.5"><Pencil className="w-3.5 h-3.5" /> Customize</button>}
                <button className="px-3 py-1.5 border border-border rounded-lg text-sm text-foreground hover:bg-muted flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> Preview</button>
              </div>
            </div>
            <div className="p-5" style={{ backgroundColor: '#f5f7f9' }}>
              <div className="bg-white rounded-lg shadow-sm border border-border max-w-2xl mx-auto">
                <div className="h-3 rounded-t-lg" style={{ backgroundColor: '#7C3AED' }} />
                <div className="p-4">
                  <div className="h-24 rounded-lg mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(124,58,237,0.05))' }}>
                    <span className="text-sm text-muted-foreground">Hero section</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">{[1,2,3].map(i => (
                    <div key={i} className="border border-border rounded-lg overflow-hidden"><div className="h-14 bg-muted" /><div className="p-2"><div className="h-2.5 w-12 bg-muted rounded mb-1.5" /><div className="h-2 w-8 bg-muted rounded" /></div></div>
                  ))}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
            <h3 className="text-sm font-bold text-foreground mb-4" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>Pages</h3>
            <div className="divide-y divide-border">
              {['Home', 'Products', 'About', 'Contact'].map(page => (
                <div key={page} className="flex items-center justify-between py-3 hover:bg-secondary/30 px-2 rounded-lg">
                  <div className="flex items-center gap-3"><Layout className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-medium text-foreground">{page}</span></div>
                  <button className="text-sm text-primary hover:underline">Edit</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
