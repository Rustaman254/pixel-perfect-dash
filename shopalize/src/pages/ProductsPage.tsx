import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '@/lib/api';
import { Plus, Search, Package, MoreHorizontal, Pencil, Trash2, Eye, EyeOff, Filter, ArrowUpDown, Loader2, Image as ImageIcon, Copy, Tag, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Product { id: number; name: string; price: number; currency: string; images: string; category: string; inventory: number; isActive: boolean; createdAt: string; }

export default function ProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeMenu, setActiveMenu] = useState<number | null>(null);
  const [selected, setSelected] = useState<number[]>([]);

  useEffect(() => { fetchWithAuth('/shopalize/products').then(d => setProducts(Array.isArray(d) ? d : [])).catch(() => setProducts([])).finally(() => setLoading(false)); }, []);

  const toggleActive = async (p: Product) => {
    try { await fetchWithAuth(`/shopalize/products/${p.id}`, { method: 'PUT', body: JSON.stringify({ isActive: !p.isActive }) }); setProducts(products.map(x => x.id === p.id ? { ...x, isActive: !x.isActive } : x)); } catch {} setActiveMenu(null);
  };
  const deleteProduct = async (id: number) => { if (!confirm('Delete this product? This can\'t be undone.')) return; try { await fetchWithAuth(`/shopalize/products/${id}`, { method: 'DELETE' }); setProducts(products.filter(p => p.id !== id)); } catch {} setActiveMenu(null); };

  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.category?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' && p.isActive) || (statusFilter === 'draft' && !p.isActive);
    return matchesSearch && matchesStatus;
  });
  const getImages = (s: string): string[] => { try { return JSON.parse(s || '[]'); } catch { return []; } };

  const statusCounts = { all: products.length, active: products.filter(p => p.isActive).length, draft: products.filter(p => !p.isActive).length };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-[22px] font-bold text-foreground" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>Products</h1><p className="text-sm text-muted-foreground">{products.length} product{products.length !== 1 ? 's' : ''}</p></div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted"><ArrowUpDown className="w-4 h-4" /> Sort</button>
          <button onClick={() => navigate('/products/new')} className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2"><Plus className="w-4 h-4" /> Add product</button>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-border">
        {[
          { key: 'all', label: `All (${statusCounts.all})` },
          { key: 'active', label: `Active (${statusCounts.active})` },
          { key: 'draft', label: `Draft (${statusCounts.draft})` },
        ].map(tab => (
          <button key={tab.key} onClick={() => setStatusFilter(tab.key)}
            className={cn("px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
              statusFilter === tab.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}>{tab.label}</button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-border shadow-sm">
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Filter products..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-muted border border-border rounded-lg text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20" />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted"><Filter className="w-4 h-4" /> Filter</button>
          {selected.length > 0 && (
            <>
              <span className="text-xs font-semibold text-primary">{selected.length} selected</span>
              <button className="text-xs text-destructive hover:underline" onClick={() => setSelected([])}>Clear</button>
            </>
          )}
        </div>

        {loading ? (
          <div className="p-16 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4"><Package className="w-8 h-8 text-muted-foreground" /></div>
            <h3 className="text-lg font-bold text-foreground mb-1" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>Create your first product</h3>
            <p className="text-sm text-muted-foreground mb-5">Add products to start selling.</p>
            <button onClick={() => navigate('/products/new')} className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-semibold inline-flex items-center gap-2"><Plus className="w-4 h-4" /> Add product</button>
          </div>
        ) : (
          <table className="w-full">
            <thead><tr className="bg-secondary/50">
              <th className="px-5 py-2.5 text-left"><input type="checkbox" className="rounded border-border" onChange={e => setSelected(e.target.checked ? filtered.map(p => p.id) : [])} /></th>
              <th className="text-left px-2 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase">Product</th>
              <th className="text-left px-2 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase">Status</th>
              <th className="text-left px-2 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase">Inventory</th>
              <th className="text-left px-2 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase">Category</th>
              <th className="text-right px-2 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase">Price</th>
              <th className="w-10"></th>
            </tr></thead>
            <tbody className="divide-y divide-border">
              {filtered.map(product => {
                const images = getImages(product.images);
                return (
                  <tr key={product.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-5 py-3"><input type="checkbox" className="rounded border-border" checked={selected.includes(product.id)} onChange={e => { if (e.target.checked) setSelected([...selected, product.id]); else setSelected(selected.filter(id => id !== product.id)); }} /></td>
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/products/${product.id}`)}>
                        <div className="w-11 h-11 rounded-lg bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0">
                          {images.length > 0 ? <img src={images[0]} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-5 h-5 text-muted-foreground" />}
                        </div>
                        <div><p className="text-sm font-medium text-foreground hover:text-primary">{product.name}</p></div>
                      </div>
                    </td>
                    <td className="px-2 py-3"><span className={cn("text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase", product.isActive ? 'bg-[#D6FAE8] text-success' : 'bg-muted text-muted-foreground')}>{product.isActive ? 'Active' : 'Draft'}</span></td>
                    <td className="px-2 py-3 text-xs text-muted-foreground">{product.inventory === -1 ? <span className="text-success font-medium">{product.inventory === -1 ? '∞' : product.inventory}</span> : `${product.inventory} in stock`}</td>
                    <td className="px-2 py-3 text-xs text-muted-foreground">{product.category || '—'}</td>
                    <td className="px-2 py-3 text-right text-xs font-semibold text-foreground">{(product.currency || 'KES')} {Number(product.price).toLocaleString()}</td>
                    <td className="px-2 py-3 relative">
                      <button onClick={() => setActiveMenu(activeMenu === product.id ? null : product.id)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><MoreHorizontal className="w-4 h-4" /></button>
                      {activeMenu === product.id && (<><div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)} />
                        <div className="absolute right-0 top-10 w-48 bg-white rounded-xl shadow-xl border border-border py-1.5 z-50">
                          <button onClick={() => { navigate(`/products/${product.id}`); setActiveMenu(null); }} className="w-full px-4 py-2 text-left text-xs text-foreground hover:bg-muted flex items-center gap-2"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /> Edit</button>
                          <button onClick={() => { navigator.clipboard.writeText(`Product #${product.id}`); setActiveMenu(null); }} className="w-full px-4 py-2 text-left text-xs text-foreground hover:bg-muted flex items-center gap-2"><Copy className="w-3.5 h-3.5 text-muted-foreground" /> Duplicate</button>
                          <button onClick={() => toggleActive(product)} className="w-full px-4 py-2 text-left text-xs text-foreground hover:bg-muted flex items-center gap-2">{product.isActive ? <EyeOff className="w-3.5 h-3.5 text-muted-foreground" /> : <Eye className="w-3.5 h-3.5 text-muted-foreground" />} {product.isActive ? 'Deactivate' : 'Activate'}</button>
                          <hr className="my-1 border-border" />
                          <button onClick={() => deleteProduct(product.id)} className="w-full px-4 py-2 text-left text-xs text-destructive hover:bg-red-50 flex items-center gap-2"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
                        </div></>)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
