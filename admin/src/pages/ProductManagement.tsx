import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { fetchWithAuth, cn } from "@/lib/utils";
import { Package, Search, Loader2, MoreHorizontal, Eye, DollarSign, Tag, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Product {
  id: number;
  projectId: number;
  storeName: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  inventory: number;
  isActive: boolean;
  createdAt: string;
}

const ProductManagement = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [storeFilter, setStoreFilter] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const { toast } = useToast();

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (storeFilter) params.set('storeId', storeFilter);
      const data = await fetchWithAuth(`/admin/shopalize/products?${params.toString()}`);
      setProducts(data.products || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProducts(); }, [storeFilter]);

  const handleToggleActive = async (product: Product) => {
    try {
      await fetchWithAuth(`/admin/shopalize/products/${product.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !product.isActive }),
      });
      setProducts(products.map(p => p.id === product.id ? { ...p, isActive: !p.isActive } : p));
      toast({ title: "Product updated", description: `Product ${!product.isActive ? 'activated' : 'deactivated'}.` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Delete "${product.name}"?`)) return;
    try {
      await fetchWithAuth(`/admin/shopalize/products/${product.id}`, { method: 'DELETE' });
      setProducts(products.filter(p => p.id !== product.id));
      toast({ title: "Product deleted", description: "Product removed." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const filteredProducts = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Product Management</h1>
        <p className="text-sm text-slate-500">Manage products across all stores</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { title: "Total Products", value: products.length, color: "bg-blue-50 text-blue-600" },
          { title: "Active", value: products.filter(p => p.isActive).length, color: "bg-emerald-50 text-emerald-600" },
          { title: "Inactive", value: products.filter(p => !p.isActive).length, color: "bg-slate-50 text-slate-600" },
          { title: "Categories", value: [...new Set(products.map(p => p.category).filter(Boolean))].length, color: "bg-purple-50 text-purple-600" },
        ].map((s) => (
          <div key={s.title} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className={cn("p-1.5 rounded-lg w-fit mb-2", s.color)}><Package className="w-4 h-4" /></div>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{s.title}</p>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">{s.value}</h3>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <input type="text" placeholder="Search products..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && loadProducts()} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Product</th>
                <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Store</th>
                <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Price</th>
                <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Category</th>
                <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Inventory</th>
                <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Status</th>
                <th className="text-right px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={7} className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" /><p className="text-sm text-slate-500">Loading products...</p></td></tr>
              ) : filteredProducts.length === 0 ? (
                <tr><td colSpan={7} className="py-20 text-center"><p className="text-sm text-slate-500">No products found.</p></td></tr>
              ) : filteredProducts.map((product) => (
                <tr key={product.id} className={cn("hover:bg-slate-50/50 transition-colors", !product.isActive && "opacity-60")}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                        <Package className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{product.name}</p>
                        <p className="text-[10px] text-slate-400">ID: {product.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-700">{product.storeName}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-900">{product.currency || '$'}{parseFloat(String(product.price)).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    {product.category ? <span className="text-[10px] font-bold uppercase bg-slate-100 px-2 py-0.5 rounded-full text-slate-600">{product.category}</span> : <span className="text-xs text-slate-400">-</span>}
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-700">{product.inventory === -1 ? 'Unlimited' : product.inventory}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleToggleActive(product)} className="flex items-center gap-1.5">
                      {product.isActive ? (
                        <><ToggleRight className="w-5 h-5 text-emerald-500" /><span className="text-[10px] font-bold text-emerald-600">Active</span></>
                      ) : (
                        <><ToggleLeft className="w-5 h-5 text-slate-300" /><span className="text-[10px] font-bold text-slate-400">Inactive</span></>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><MoreHorizontal className="w-5 h-5 text-slate-400" /></button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => { setSelectedProduct(product); setEditOpen(true); }}>
                          <Eye className="w-4 h-4 mr-2" /> Edit Product
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleActive(product)}>
                          <ToggleRight className="w-4 h-4 mr-2" /> {product.isActive ? 'Deactivate' : 'Activate'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDelete(product)} className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Product Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>{selectedProduct?.name}</DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <EditProductForm product={selectedProduct} onClose={() => setEditOpen(false)} onSaved={loadProducts} />
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

const EditProductForm = ({ product, onClose, onSaved }: { product: Product; onClose: () => void; onSaved: () => void }) => {
  const [form, setForm] = useState({ name: product.name, price: product.price, category: product.category || '', inventory: product.inventory, isActive: product.isActive });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    try {
      setSaving(true);
      await fetchWithAuth(`/admin/shopalize/products/${product.id}`, {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      toast({ title: "Product updated", description: "Changes saved." });
      onSaved();
      onClose();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Name</Label>
        <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Price</Label>
          <Input type="number" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} />
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Inventory</Label>
          <Input type="number" value={form.inventory} onChange={e => setForm({ ...form, inventory: Number(e.target.value) })} />
        </div>
        <div className="space-y-2">
          <Label>Active</Label>
          <button onClick={() => setForm({ ...form, isActive: !form.isActive })} className={cn("w-full py-2 rounded-xl font-bold text-sm", form.isActive ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-600")}>
            {form.isActive ? 'Active' : 'Inactive'}
          </button>
        </div>
      </div>
      <DialogFooter>
        <button onClick={onClose} className="px-4 py-2 text-slate-500 font-medium">Cancel</button>
        <button onClick={handleSave} disabled={saving} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50">
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </DialogFooter>
    </div>
  );
};

export default ProductManagement;
