import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchWithAuth } from '@/lib/api';
import { ArrowLeft, Save, Trash2, Plus, X, Image as ImageIcon, Loader2, ChevronDown, Globe, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProductEditPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isNew = id === 'new';
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [showSEO, setShowSEO] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', price: '', compareAtPrice: '', costPerItem: '',
    currency: 'KES', category: '', tags: '', vendor: '', weight: '',
    sku: '', barcode: '', inventory: '-1', isActive: true, trackQuantity: true,
    images: [] as string[], seoTitle: '', seoDesc: '', variants: [] as any[]
  });
  const [imageUrl, setImageUrl] = useState('');
  const [newVariant, setNewVariant] = useState({ name: '', values: '' });

  useEffect(() => { if (!isNew) loadProduct(); }, [id]);

  const loadProduct = async () => {
    try {
      const d = await fetchWithAuth(`/shopalize/products/${id}`);
      let images: string[] = []; try { images = JSON.parse(d.images || '[]'); } catch {}
      setForm({ ...form, name: d.name || '', description: d.description || '', price: String(d.price || ''), currency: d.currency || 'KES', category: d.category || '', inventory: String(d.inventory ?? -1), isActive: d.isActive !== false, images });
    } catch { navigate('/products'); }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.name || !form.price) return;
    setSaving(true);
    try {
      const body = { name: form.name, description: form.description, price: parseFloat(form.price), currency: form.currency, category: form.category, inventory: parseInt(form.inventory), isActive: form.isActive, images: JSON.stringify(form.images) };
      if (isNew) await fetchWithAuth('/shopalize/products', { method: 'POST', body: JSON.stringify(body) });
      else await fetchWithAuth(`/shopalize/products/${id}`, { method: 'PUT', body: JSON.stringify(body) });
      navigate('/products');
    } catch {}
    setSaving(false);
  };

  const addImage = () => { if (imageUrl && !form.images.includes(imageUrl)) { setForm({ ...form, images: [...form.images, imageUrl] }); setImageUrl(''); } };
  const removeImage = (i: number) => setForm({ ...form, images: form.images.filter((_, idx) => idx !== i) });

  const addVariant = () => {
    if (newVariant.name && newVariant.values) {
      const vals = newVariant.values.split(',').map(v => v.trim()).filter(Boolean);
      setForm({ ...form, variants: [...form.variants, { name: newVariant.name, values: vals }] });
      setNewVariant({ name: '', values: '' });
    }
  };

  if (loading) return <div className="p-20 text-center flex flex-col items-center justify-center h-[50vh]"><Loader2 className="w-10 h-10 animate-spin text-black mb-4" /><p className="text-[15px] font-medium text-gray-500">Loading product data...</p></div>;

  return (
    <div className="max-w-[1100px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between mb-8 mt-2">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/products')} className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-black hover:text-white transition-colors text-gray-500"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-3xl font-bold text-black tracking-tight" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>{isNew ? 'Add product' : 'Edit product'}</h1>
          {!isNew && <span className={cn("text-[11px] px-3 py-1.5 rounded-full font-bold uppercase tracking-wider border ml-2", form.isActive ? 'bg-[#D4F655]/20 text-black border-[#D4F655]/50' : 'bg-gray-100 text-gray-500 border-gray-200')}>{form.isActive ? 'Active' : 'Draft'}</span>}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/products')} className="px-5 py-2.5 rounded-xl text-[14px] font-bold text-gray-600 bg-white border border-gray-200 hover:text-black hover:border-black transition-colors">Discard</button>
          <button onClick={handleSave} disabled={saving || !form.name || !form.price}
            className="bg-[#0A0A0A] hover:bg-black disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-[14px] font-bold flex items-center gap-2 shadow-lg shadow-black/10 transition-all">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {isNew ? 'Create product' : 'Save changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Title & Description */}
          <div className="bg-white rounded-[2rem] border border-gray-200/60 p-8 shadow-sm">
            <div className="space-y-6">
              <div>
                <label className="text-[13px] font-bold text-black mb-2 block tracking-wide">TITLE</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Short sleeve t-shirt"
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[15px] outline-none focus:bg-white focus:border-black focus:ring-1 focus:ring-black/10 transition-all font-medium text-black placeholder:text-gray-400 placeholder:font-normal" />
              </div>
              <div>
                <label className="text-[13px] font-bold text-black mb-2 block tracking-wide">DESCRIPTION</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Write a description for your product..." rows={8}
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[15px] outline-none focus:bg-white focus:border-black focus:ring-1 focus:ring-black/10 transition-all text-black placeholder:text-gray-400 font-normal resize-none" />
              </div>
            </div>
          </div>

          {/* Media */}
          <div className="bg-white rounded-[2rem] border border-gray-200/60 p-8 shadow-sm">
            <h3 className="text-[13px] font-bold text-black tracking-wide uppercase mb-6">Media</h3>
            <div className="flex flex-wrap gap-4 mb-6">
              {form.images.map((img, i) => (
                <div key={i} className="relative w-32 h-32 rounded-2xl border border-gray-200 overflow-hidden group shadow-sm bg-gray-50">
                  <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <button onClick={() => removeImage(i)} className="absolute top-2 right-2 w-7 h-7 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow hover:bg-red-50 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><X className="w-4 h-4 text-gray-500 group-hover:text-red-500" /></button>
                </div>
              ))}
              {form.images.length === 0 && (
                 <div className="w-full py-12 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center bg-gray-50/50">
                    <div className="w-12 h-12 bg-white rounded-full border border-gray-200 flex items-center justify-center mb-3 shadow-sm"><ImageIcon className="w-5 h-5 text-gray-400" /></div>
                    <p className="text-[14px] font-bold text-black">Add images</p>
                    <p className="text-[13px] text-gray-500 mt-1">Provide a URL to the product image.</p>
                 </div>
              )}
            </div>
            <div className="flex gap-3">
              <input type="text" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="Paste raw image URL..." className="flex-1 px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[14px] outline-none focus:bg-white focus:border-black font-medium" />
              <button onClick={addImage} disabled={!imageUrl} className="px-5 py-3.5 bg-white border border-gray-200 rounded-xl text-[14px] font-bold text-black hover:border-black disabled:opacity-50 shadow-sm"><Plus className="w-4 h-4" /></button>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-[2rem] border border-gray-200/60 p-8 shadow-sm">
            <h3 className="text-[13px] font-bold text-black tracking-wide uppercase mb-6">Pricing</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Price</label>
                <div className="flex relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[14px] font-bold text-gray-400">{form.currency}</span>
                  <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0.00" className="w-full pl-14 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[15px] font-bold text-black outline-none focus:bg-white focus:border-black focus:ring-1 focus:ring-black/10 transition-all" />
                </div>
              </div>
              <div>
                <label className="text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Compare-at price</label>
                <div className="flex relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[14px] font-bold text-gray-400">{form.currency}</span>
                  <input type="number" value={form.compareAtPrice} onChange={e => setForm({ ...form, compareAtPrice: e.target.value })} placeholder="0.00" className="w-full pl-14 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[15px] font-bold text-gray-500 outline-none focus:bg-white focus:border-black focus:ring-1 focus:ring-black/10 transition-all" />
                </div>
              </div>
              <div>
                <label className="text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Cost per item</label>
                <div className="flex relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[14px] font-bold text-gray-400">{form.currency}</span>
                  <input type="number" value={form.costPerItem} onChange={e => setForm({ ...form, costPerItem: e.target.value })} placeholder="0.00" className="w-full pl-14 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[15px] font-medium text-black outline-none focus:bg-white focus:border-black focus:ring-1 focus:ring-black/10 transition-all" />
                </div>
              </div>
              <div>
                <label className="text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Currency</label>
                <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[14px] font-bold text-black outline-none focus:bg-white focus:border-black focus:ring-1 focus:ring-black/10 transition-all cursor-pointer">
                  <option value="KES">KES - Kenyan Shilling</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                </select>
              </div>
            </div>
            <div className="h-px bg-gray-100 my-6" />
            <div className="pt-2">
               <div className="flex items-center gap-3">
                 <input type="checkbox" id="tax" className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black" defaultChecked />
                 <label htmlFor="tax" className="text-[14px] font-medium text-black">Charge tax on this product</label>
               </div>
            </div>
          </div>

          {/* SEO Preview */}
          <div className="bg-white rounded-[2rem] border border-gray-200/60 shadow-sm overflow-hidden">
            <button onClick={() => setShowSEO(!showSEO)} className="w-full flex items-center justify-between p-8 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3"><Globe className="w-5 h-5 text-gray-400" /><span className="text-[15px] font-bold text-black">Search engine listing</span></div>
              <ChevronDown className={cn("w-5 h-5 text-gray-400 transition-transform duration-300", showSEO && "rotate-180")} />
            </button>
            {showSEO && (
              <div className="p-8 space-y-6 border-t border-gray-100 bg-gray-50/50">
                <div className="mb-6">
                   <p className="text-[18px] text-[#1a0dab] font-medium hover:underline cursor-pointer mb-1">{form.seoTitle || form.name || 'Sample Product Title'}</p>
                   <p className="text-[13px] text-[#006621] mb-1">https://yourstore.shopalize.com/products/{form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}</p>
                   <p className="text-[13px] text-gray-600 line-clamp-2 leading-relaxed">{form.seoDesc || form.description || 'This is how your product will appear in search engine results. Write a compelling description to boost click-through rates.'}</p>
                </div>
                
                <div>
                   <div className="flex justify-between mb-2">
                      <label className="text-[12px] font-bold text-gray-500 uppercase tracking-widest">Page title</label>
                      <span className="text-[11px] font-medium text-gray-400">{form.seoTitle.length}/70</span>
                   </div>
                   <input type="text" value={form.seoTitle} onChange={e => setForm({ ...form, seoTitle: e.target.value })} placeholder="Custom SEO Title" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] outline-none focus:border-black transition-all" />
                </div>
                <div>
                   <div className="flex justify-between mb-2">
                      <label className="text-[12px] font-bold text-gray-500 uppercase tracking-widest">Meta description</label>
                      <span className="text-[11px] font-medium text-gray-400">{form.seoDesc.length}/160</span>
                   </div>
                   <textarea value={form.seoDesc} onChange={e => setForm({ ...form, seoDesc: e.target.value })} placeholder="Custom SEO Description..." rows={3} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] outline-none focus:border-black transition-all resize-none" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <div className="bg-white rounded-[2rem] border border-gray-200/60 p-8 shadow-sm">
            <h3 className="text-[13px] font-bold text-black tracking-wide uppercase mb-4">Status</h3>
            <select value={form.isActive ? 'active' : 'draft'} onChange={e => setForm({ ...form, isActive: e.target.value === 'active' })} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[14px] font-bold text-black outline-none focus:bg-white focus:border-black cursor-pointer transition-all">
              <option value="active">Active - Available on store</option>
              <option value="draft">Draft - Hidden from store</option>
            </select>
          </div>
          
          <div className="bg-white rounded-[2rem] border border-gray-200/60 p-8 shadow-sm">
            <h3 className="text-[13px] font-bold text-black tracking-wide uppercase mb-6">Organization</h3>
            <div className="space-y-5">
              <div>
                 <label className="text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Category</label>
                 <input type="text" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g. Clothing, Electronics" className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[14px] outline-none focus:bg-white focus:border-black transition-all" />
              </div>
              <div>
                 <label className="text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Tags</label>
                 <input type="text" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="Summer, Vintage" className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[14px] outline-none focus:bg-white focus:border-black transition-all" />
              </div>
              <div>
                 <label className="text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Vendor / Brand</label>
                 <input type="text" value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })} placeholder="Your brand name" className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[14px] outline-none focus:bg-white focus:border-black transition-all" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-[2rem] border border-gray-200/60 p-8 shadow-sm">
            <h3 className="text-[13px] font-bold text-black tracking-wide uppercase mb-6">Inventory & Shipping</h3>
            <div className="space-y-5">
              <div>
                 <label className="text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">SKU (Stock Keeping Unit)</label>
                 <input type="text" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="SKU-1001" className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[14px] outline-none focus:bg-white focus:border-black transition-all" />
              </div>
              <div>
                 <label className="text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Available Quantity</label>
                 <input type="number" value={form.inventory} onChange={e => setForm({ ...form, inventory: e.target.value })} placeholder="-1 for unlimited" className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[14px] outline-none focus:bg-white focus:border-black transition-all" />
              </div>
              <div className="h-px bg-gray-100 my-2" />
              <div>
                 <div className="flex items-center gap-3 mb-4">
                   <input type="checkbox" id="physical" className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black" defaultChecked />
                   <label htmlFor="physical" className="text-[14px] font-medium text-black">This is a physical product</label>
                 </div>
                 <label className="text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Weight</label>
                 <div className="flex relative">
                   <input type="number" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} placeholder="0.0" className="w-full pl-4 pr-16 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[14px] outline-none focus:bg-white focus:border-black transition-all" />
                   <div className="absolute right-0 top-0 bottom-0 px-4 bg-gray-100 border-l border-gray-200 rounded-r-xl flex items-center justify-center text-[12px] font-bold text-gray-500">kg</div>
                 </div>
              </div>
            </div>
          </div>

          {!isNew && (
            <button onClick={() => { if (confirm('Delete this product? This action cannot be reversed.')) { fetchWithAuth(`/shopalize/products/${id}`, { method: 'DELETE' }); navigate('/products'); } }}
              className="w-full py-4 border border-red-200 text-red-600 bg-white rounded-2xl text-[14px] font-bold hover:bg-red-50 hover:border-red-300 transition-colors flex items-center justify-center gap-2 shadow-sm">
              <Trash2 className="w-4 h-4" /> Delete product
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
