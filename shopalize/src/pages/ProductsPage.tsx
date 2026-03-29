import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '@/lib/api';
import { Plus, Search, Package, MoreHorizontal, Pencil, Trash2, Eye, EyeOff, Filter, ArrowUpDown, Loader2, Image as ImageIcon, Copy, Tag, ChevronDown, CheckCircle2 } from 'lucide-react';
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
      <div className="flex items-center justify-between mb-8 mt-2">
        <div>
           <h1 className="text-3xl font-bold text-black tracking-tight" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>Products</h1>
           <p className="text-[15px] text-gray-500 mt-1">{products.length} product{products.length !== 1 ? 's' : ''} total</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200/80 bg-white hover:border-black text-[13px] font-bold text-gray-700 rounded-xl shadow-sm transition-all">
             <ArrowUpDown className="w-4 h-4" /> Sort
          </button>
          <button onClick={() => navigate('/products/new')} className="flex items-center gap-2 px-5 py-2.5 bg-[#D4F655] hover:bg-[#c1e247] shadow-lg shadow-[#D4F655]/20 text-[14px] font-bold text-black rounded-xl transition-all">
             <Plus className="w-4 h-4" /> Add product
          </button>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-2 mb-6">
        {[
          { key: 'all', label: `All (${statusCounts.all})` },
          { key: 'active', label: `Active (${statusCounts.active})` },
          { key: 'draft', label: `Draft (${statusCounts.draft})` },
        ].map(tab => (
          <button key={tab.key} onClick={() => setStatusFilter(tab.key)}
            className={cn("px-5 py-2.5 rounded-full text-[13px] font-bold transition-all duration-200",
              statusFilter === tab.key ? "bg-[#0A0A0A] text-white shadow-md shadow-black/10" : "bg-white border border-gray-200 text-gray-500 hover:text-black hover:border-black/20"
            )}>{tab.label}</button>
        ))}
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-200/60 shadow-sm overflow-hidden">
        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4 p-6 border-b border-gray-100 bg-white">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search or filter products..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl text-[14px] outline-none focus:border-black focus:bg-white focus:ring-1 focus:ring-black/10 transition-all font-medium text-black placeholder:text-gray-400 placeholder:font-normal" />
          </div>
          <div className="flex gap-2">
             <button className="flex items-center gap-2 px-5 py-3 border border-gray-200 rounded-xl text-[13px] font-bold text-gray-600 hover:bg-gray-50 hover:text-black transition-colors">
               <Filter className="w-4 h-4" /> Filter <ChevronDown className="w-3 h-3" />
             </button>
          </div>
        </div>

        {selected.length > 0 && (
          <div className="flex items-center gap-4 px-6 py-3 bg-[#D4F655]/10 border-b border-[#D4F655]/20">
            <span className="text-[13px] font-bold text-black border-r border-[#D4F655]/30 pr-4">{selected.length} selected</span>
            <button className="text-[13px] font-bold text-black hover:underline cursor-pointer">Set active</button>
            <button className="text-[13px] font-bold text-black hover:underline cursor-pointer">Set draft</button>
             <button className="text-[13px] font-bold text-red-600 hover:underline cursor-pointer ml-auto" onClick={() => setSelected([])}>Clear selection</button>
          </div>
        )}

        {loading ? (
          <div className="p-20 text-center flex flex-col items-center justify-center">
             <Loader2 className="w-8 h-8 animate-spin text-black mb-4" />
             <p className="text-[15px] font-medium text-gray-500">Loading products...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-24 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-6"><Package className="w-8 h-8 text-gray-300" /></div>
            <h3 className="text-2xl font-medium text-black mb-2 tracking-tight">Create your first product</h3>
            <p className="text-[15px] text-gray-500 mb-6 max-w-sm mx-auto">Add a product to your online store and start selling locally and globally.</p>
            <button onClick={() => navigate('/products/new')} className="bg-[#0A0A0A] hover:bg-black text-white px-6 py-3.5 rounded-xl text-[14px] font-bold inline-flex items-center gap-2 shadow-lg shadow-black/10 transition-all"><Plus className="w-4 h-4" /> Add your first product</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-left w-12"><input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black" onChange={e => setSelected(e.target.checked ? filtered.map(p => p.id) : [])} /></th>
                <th className="text-left px-3 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Product</th>
                <th className="text-left px-3 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Status</th>
                <th className="text-left px-3 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Inventory</th>
                <th className="text-left px-3 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Category</th>
                <th className="text-right px-3 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Price</th>
                <th className="w-12 text-center px-4 py-4"></th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(product => {
                  const images = getImages(product.images);
                  return (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4"><input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black" checked={selected.includes(product.id)} onChange={e => { if (e.target.checked) setSelected([...selected, product.id]); else setSelected(selected.filter(id => id !== product.id)); }} /></td>
                      <td className="px-3 py-4">
                        <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate(`/products/${product.id}`)}>
                          <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0 group-hover:border-[#D4F655] transition-colors">
                            {images.length > 0 ? <img src={images[0]} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-5 h-5 text-gray-400" />}
                          </div>
                          <div><p className="text-[14px] font-bold text-black group-hover:text-gray-600 transition-colors">{product.name}</p></div>
                        </div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap"><span className={cn("text-[11px] px-3 py-1.5 rounded-full font-bold uppercase tracking-wider border", product.isActive ? 'bg-[#D4F655]/20 text-black border-[#D4F655]/50' : 'bg-gray-100 text-gray-500 border-gray-200')}>{product.isActive ? 'Active' : 'Draft'}</span></td>
                      <td className="px-3 py-4 text-[13px] text-gray-500 font-medium whitespace-nowrap">{product.inventory === -1 ? <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded">Unlimited</span> : `${product.inventory} in stock`}</td>
                      <td className="px-3 py-4 text-[13px] text-gray-500 font-medium whitespace-nowrap border-r border-transparent">
                         {product.category ? <span className="bg-gray-100 border border-gray-200 px-2 py-1 rounded text-[12px]">{product.category}</span> : '—'}
                      </td>
                      <td className="px-3 py-4 text-right text-[14px] font-bold text-black whitespace-nowrap">{(product.currency || 'KES')} {Number(product.price).toLocaleString()}</td>
                      <td className="px-4 py-4 text-center relative">
                        <button onClick={() => setActiveMenu(activeMenu === product.id ? null : product.id)} className="p-2 rounded-xl hover:bg-white border border-transparent hover:border-gray-200 text-gray-400 hover:text-black shadow-sm transition-all"><MoreHorizontal className="w-5 h-5" /></button>
                        {activeMenu === product.id && (<><div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)} />
                          <div className="absolute right-8 top-12 w-48 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                            <button onClick={() => { navigate(`/products/${product.id}`); setActiveMenu(null); }} className="w-full px-5 py-3 text-left text-[13px] font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-3"><Pencil className="w-4 h-4 text-gray-400" /> Edit</button>
                            <button onClick={() => { navigator.clipboard.writeText(`Product #${product.id}`); setActiveMenu(null); }} className="w-full px-5 py-3 text-left text-[13px] font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-3"><Copy className="w-4 h-4 text-gray-400" /> Duplicate</button>
                            <button onClick={() => toggleActive(product)} className="w-full px-5 py-3 text-left text-[13px] font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-3">{product.isActive ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />} {product.isActive ? 'Deactivate' : 'Activate'}</button>
                            <div className="h-px bg-gray-100 my-2" />
                            <button onClick={() => deleteProduct(product.id)} className="w-full px-5 py-3 text-left text-[13px] font-bold text-red-600 hover:bg-red-50 flex items-center gap-3"><Trash2 className="w-4 h-4 text-red-400" /> Delete</button>
                          </div></>)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/30">
          <p className="text-[13px] font-semibold text-gray-500">Showing {filtered.length} of {products.length} products</p>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 rounded-xl text-[13px] font-bold text-gray-500 bg-white border border-gray-200 hover:text-black hover:border-black transition-colors disabled:opacity-50 disabled:pointer-events-none">Previous</button>
            <button className="px-4 py-2 rounded-xl text-[13px] font-bold bg-[#0A0A0A] text-white shadow-md">1</button>
            <button className="px-4 py-2 rounded-xl text-[13px] font-bold text-gray-500 bg-white border border-gray-200 hover:text-black hover:border-black transition-colors disabled:opacity-50 disabled:pointer-events-none">Next</button>
          </div>
        </div>
      </div>
    </>
  );
}
