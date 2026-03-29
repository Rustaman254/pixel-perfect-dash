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

  if (loading) return <div className="p-16 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" /></div>;

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/products')} className="p-2 rounded-lg hover:bg-white text-muted-foreground"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex-1"><h1 className="text-[22px] font-bold text-foreground" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>{isNew ? 'Add product' : 'Edit product'}</h1></div>
        <button onClick={() => navigate('/products')} className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted border border-border">Discard</button>
        <button onClick={handleSave} disabled={saving || !form.name || !form.price}
          className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {isNew ? 'Add product' : 'Save'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title & Description */}
          <div className="bg-white rounded-xl border border-border p-6 shadow-sm space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Title</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Short sleeve t-shirt"
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Description</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Write a description..." rows={6}
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none" />
            </div>
          </div>

          {/* Media */}
          <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
            <h3 className="text-sm font-bold text-foreground mb-4" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>Media</h3>
            <div className="flex flex-wrap gap-3 mb-4">
              {form.images.map((img, i) => (
                <div key={i} className="relative w-20 h-20 rounded-lg border border-border overflow-hidden group">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => removeImage(i)} className="absolute top-1 right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3 text-destructive" /></button>
                </div>
              ))}
              {form.images.length === 0 && <div className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center"><ImageIcon className="w-6 h-6 text-muted-foreground" /></div>}
            </div>
            <div className="flex gap-2">
              <input type="text" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="Paste image URL..." className="flex-1 px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-primary" />
              <button onClick={addImage} disabled={!imageUrl} className="px-3 py-2 bg-muted border border-border rounded-lg text-sm hover:bg-secondary disabled:opacity-50"><Plus className="w-4 h-4" /></button>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
            <h3 className="text-sm font-bold text-foreground mb-4" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>Pricing</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Price</label>
                <div className="flex"><span className="px-3 py-2 bg-muted border border-r-0 border-border rounded-l-lg text-xs text-muted-foreground">{form.currency}</span>
                  <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0.00" className="flex-1 px-3 py-2 border border-border rounded-r-lg text-sm outline-none focus:border-primary" /></div></div>
              <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Compare-at price</label>
                <div className="flex"><span className="px-3 py-2 bg-muted border border-r-0 border-border rounded-l-lg text-xs text-muted-foreground">{form.currency}</span>
                  <input type="number" value={form.compareAtPrice} onChange={e => setForm({ ...form, compareAtPrice: e.target.value })} placeholder="0.00" className="flex-1 px-3 py-2 border border-border rounded-r-lg text-sm outline-none focus:border-primary" /></div></div>
              <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Cost per item</label>
                <div className="flex"><span className="px-3 py-2 bg-muted border border-r-0 border-border rounded-l-lg text-xs text-muted-foreground">{form.currency}</span>
                  <input type="number" value={form.costPerItem} onChange={e => setForm({ ...form, costPerItem: e.target.value })} placeholder="0.00" className="flex-1 px-3 py-2 border border-border rounded-r-lg text-sm outline-none focus:border-primary" /></div></div>
              <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Currency</label>
                <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-primary bg-white">
                  <option value="KES">KES</option><option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option>
                </select></div>
            </div>
          </div>

          {/* Inventory */}
          <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
            <h3 className="text-sm font-bold text-foreground mb-4" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>Inventory</h3>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">SKU</label><input type="text" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="SKU-001" className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-primary" /></div>
              <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Barcode</label><input type="text" value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} placeholder="ISBN, UPC..." className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-primary" /></div>
              <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Quantity</label><input type="number" value={form.inventory} onChange={e => setForm({ ...form, inventory: e.target.value })} placeholder="-1 for unlimited" className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-primary" /></div>
            </div>
          </div>

          {/* Variants */}
          <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
            <h3 className="text-sm font-bold text-foreground mb-4" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>Variants</h3>
            {form.variants.length > 0 && (
              <div className="space-y-3 mb-4">
                {form.variants.map((v, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1"><p className="text-sm font-medium text-foreground">{v.name}</p><p className="text-xs text-muted-foreground">{v.values.join(', ')}</p></div>
                    <button onClick={() => setForm({ ...form, variants: form.variants.filter((_, idx) => idx !== i) })} className="text-muted-foreground hover:text-destructive"><X className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input type="text" value={newVariant.name} onChange={e => setNewVariant({ ...newVariant, name: e.target.value })} placeholder="Option name (e.g. Size)" className="flex-1 px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-primary" />
              <input type="text" value={newVariant.values} onChange={e => setNewVariant({ ...newVariant, values: e.target.value })} placeholder="Values (comma separated)" className="flex-1 px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-primary" />
              <button onClick={addVariant} disabled={!newVariant.name || !newVariant.values} className="px-3 py-2 bg-muted border border-border rounded-lg text-sm hover:bg-secondary disabled:opacity-50"><Plus className="w-4 h-4" /></button>
            </div>
          </div>

          {/* SEO */}
          <div className="bg-white rounded-xl border border-border shadow-sm">
            <button onClick={() => setShowSEO(!showSEO)} className="w-full flex items-center justify-between p-6">
              <div className="flex items-center gap-2"><Search className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-bold text-foreground" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>Search engine listing</span></div>
              <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", showSEO && "rotate-180")} />
            </button>
            {showSEO && (
              <div className="px-6 pb-6 space-y-4 border-t border-border pt-4">
                <p className="text-xs text-muted-foreground">Add a title and description to see how this product might appear in a search engine listing.</p>
                <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Page title</label><input type="text" value={form.seoTitle} onChange={e => setForm({ ...form, seoTitle: e.target.value })} placeholder={form.name || 'Product title'} className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-primary" /><p className="text-[10px] text-muted-foreground mt-1">{form.seoTitle.length}/70</p></div>
                <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Description</label><textarea value={form.seoDesc} onChange={e => setForm({ ...form, seoDesc: e.target.value })} placeholder="Description..." rows={3} className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-primary resize-none" /><p className="text-[10px] text-muted-foreground mt-1">{form.seoDesc.length}/160</p></div>
                <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">URL handle</label><div className="flex"><span className="px-3 py-2 bg-muted border border-r-0 border-border rounded-l-lg text-xs text-muted-foreground">/products/</span><input type="text" value={form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')} readOnly className="flex-1 px-3 py-2 border border-border rounded-r-lg text-sm bg-muted" /></div></div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Status</h3>
            <select value={form.isActive ? 'active' : 'draft'} onChange={e => setForm({ ...form, isActive: e.target.value === 'active' })} className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-primary bg-white">
              <option value="active">Active</option><option value="draft">Draft</option>
            </select>
          </div>
          <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Product organization</h3>
            <div className="space-y-3">
              <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Category</label><input type="text" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g. Clothing" className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-primary" /></div>
              <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Tags</label><input type="text" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="Comma separated" className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-primary" /></div>
              <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Vendor</label><input type="text" value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })} placeholder="Brand name" className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-primary" /></div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Shipping</h3>
            <div className="flex items-center gap-2 mb-3"><input type="checkbox" checked={form.trackQuantity} onChange={e => setForm({ ...form, trackQuantity: e.target.checked })} className="rounded border-border" /><span className="text-sm text-foreground">Track quantity</span></div>
            <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Weight</label><div className="flex"><input type="number" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} placeholder="0.0" className="flex-1 px-3 py-2 border border-border rounded-l-lg text-sm outline-none focus:border-primary" /><span className="px-3 py-2 bg-muted border border-l-0 border-border rounded-r-lg text-xs text-muted-foreground">kg</span></div></div>
          </div>
          {!isNew && (
            <button onClick={() => { if (confirm('Delete this product?')) { fetchWithAuth(`/shopalize/products/${id}`, { method: 'DELETE' }); navigate('/products'); } }}
              className="w-full px-4 py-2.5 border border-destructive/20 text-destructive rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
              <Trash2 className="w-4 h-4" /> Delete product
            </button>
          )}
        </div>
      </div>
    </>
  );
}
