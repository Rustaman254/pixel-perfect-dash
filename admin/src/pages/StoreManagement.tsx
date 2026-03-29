import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { fetchWithAuth, cn } from "@/lib/utils";
import { ShoppingCart, Package, Store, DollarSign, Clock, CheckCircle, Users, FileText, Loader2, TrendingUp, Eye, Ban, Search, MoreHorizontal, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

interface Store {
  id: number;
  name: string;
  slug: string;
  status: string;
  description: string;
  productCount: number;
  orderCount: number;
  totalRevenue: number;
  customerCount: number;
  createdAt: string;
  userId: number;
}

const StoreManagement = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [storeDetail, setStoreDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const loadStores = async () => {
    try {
      setLoading(true);
      const data = await fetchWithAuth('/admin/shopalize/stores');
      setStores(data.stores || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStores(); }, []);

  const handleDisable = async (store: Store) => {
    const newStatus = store.status === 'published' ? 'disabled' : 'published';
    try {
      await fetchWithAuth(`/admin/shopalize/stores/${store.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      loadStores();
      toast({ title: "Store updated", description: `Store has been ${newStatus === 'disabled' ? 'disabled' : 'enabled'}.` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (store: Store) => {
    if (!confirm(`Delete "${store.name}" and all its data? This cannot be undone.`)) return;
    try {
      await fetchWithAuth(`/admin/shopalize/stores/${store.id}`, { method: 'DELETE' });
      setStores(stores.filter(s => s.id !== store.id));
      toast({ title: "Store deleted", description: "Store and all related data removed." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const viewStoreDetail = async (store: Store) => {
    try {
      setLoadingDetail(true);
      setDetailOpen(true);
      const data = await fetchWithAuth(`/admin/shopalize/stores/${store.id}`);
      setStoreDetail(data);
      setSelectedStore(store);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setDetailOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const filteredStores = stores.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.slug.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published': return <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-600">Published</span>;
      case 'draft': return <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-600">Draft</span>;
      case 'disabled': return <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-red-50 text-red-600">Disabled</span>;
      default: return <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600">{status}</span>;
    }
  };

  const totalRevenue = stores.reduce((s, st) => s + st.totalRevenue, 0);
  const totalOrders = stores.reduce((s, st) => s + st.orderCount, 0);
  const totalProducts = stores.reduce((s, st) => s + st.productCount, 0);
  const publishedCount = stores.filter(s => s.status === 'published').length;

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Store Management</h1>
          <p className="text-sm text-slate-500">Manage all stores on the platform</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { title: "Total Stores", value: stores.length, icon: Store, color: "bg-blue-50 text-blue-600" },
          { title: "Published", value: publishedCount, icon: CheckCircle, color: "bg-emerald-50 text-emerald-600" },
          { title: "Total Products", value: totalProducts, icon: Package, color: "bg-purple-50 text-purple-600" },
          { title: "Total Revenue", value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, color: "bg-emerald-50 text-emerald-600" },
        ].map((stat) => (
          <div key={stat.title} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className={cn("p-1.5 rounded-lg w-fit mb-2", stat.color)}>
              <stat.icon className="w-4 h-4" />
            </div>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{stat.title}</p>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <input type="text" placeholder="Search stores..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 font-medium outline-none">
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Store</th>
                <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Status</th>
                <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Products</th>
                <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Orders</th>
                <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Revenue</th>
                <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Created</th>
                <th className="text-right px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={7} className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" /><p className="text-sm text-slate-500 font-medium">Loading stores...</p></td></tr>
              ) : filteredStores.length === 0 ? (
                <tr><td colSpan={7} className="py-20 text-center"><p className="text-sm text-slate-500 font-medium">No stores found.</p></td></tr>
              ) : filteredStores.map((store) => (
                <tr key={store.id} className={cn("hover:bg-slate-50/50 transition-colors", store.status === 'disabled' && "opacity-60")}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold uppercase">
                        {store.name?.charAt(0) || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{store.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{store.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(store.status)}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-700">{store.productCount}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-700">{store.orderCount}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-900">${store.totalRevenue.toLocaleString()}</td>
                  <td className="px-6 py-4 text-xs text-slate-500">{new Date(store.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                          <MoreHorizontal className="w-5 h-5 text-slate-400" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Store Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => viewStoreDetail(store)}>
                          <Eye className="w-4 h-4 mr-2" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setSelectedStore(store); setEditOpen(true); }}>
                          <Pencil className="w-4 h-4 mr-2" /> Edit Store
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDisable(store)} className={store.status === 'published' ? "text-red-600" : "text-emerald-600"}>
                          {store.status === 'published' ? <Ban className="w-4 h-4 mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                          {store.status === 'published' ? 'Disable Store' : 'Enable Store'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(store)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                          <Trash2 className="w-4 h-4 mr-2" /> Delete Store
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

      {/* Store Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl bg-white max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Store Details</DialogTitle>
          </DialogHeader>
          {loadingDetail ? (
            <div className="py-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" /></div>
          ) : storeDetail ? (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xl uppercase">
                  {storeDetail.name?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{storeDetail.name}</h3>
                  <p className="text-sm text-slate-500">{storeDetail.slug}</p>
                  {getStatusBadge(storeDetail.status)}
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 bg-blue-50 rounded-xl text-center">
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Products</p>
                  <p className="text-lg font-bold text-blue-600">{storeDetail.productCount}</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl text-center">
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Orders</p>
                  <p className="text-lg font-bold text-emerald-600">{storeDetail.orderCount}</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-xl text-center">
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Revenue</p>
                  <p className="text-lg font-bold text-purple-600">${storeDetail.totalRevenue?.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl text-center">
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Customers</p>
                  <p className="text-lg font-bold text-amber-600">{storeDetail.customerCount}</p>
                </div>
              </div>
              {storeDetail.pages?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Pages ({storeDetail.pages.length})</p>
                  <div className="space-y-1">
                    {storeDetail.pages.map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                        <span className="text-xs font-medium text-slate-700">{p.name}</span>
                        <span className="text-[9px] text-slate-400 font-mono">{p.slug}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {storeDetail.recentOrders?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Recent Orders</p>
                  <div className="space-y-1">
                    {storeDetail.recentOrders.slice(0, 5).map((o: any) => (
                      <div key={o.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                        <div>
                          <span className="text-xs font-medium text-slate-700">{o.buyerName || 'Guest'}</span>
                          <span className="text-[9px] text-slate-400 ml-2">{o.status}</span>
                        </div>
                        <span className="text-xs font-bold text-slate-900">${parseFloat(o.amount).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
          <DialogFooter>
            <button onClick={() => setDetailOpen(false)} className="px-4 py-2 text-slate-500 font-medium">Close</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Store Dialog */}
      <EditStoreDialog store={selectedStore} open={editOpen} onOpenChange={setEditOpen} onSaved={loadStores} />
    </AdminLayout>
  );
};

const EditStoreDialog = ({ store, open, onOpenChange, onSaved }: { store: Store | null; open: boolean; onOpenChange: (v: boolean) => void; onSaved: () => void }) => {
  const [form, setForm] = useState({ name: '', description: '', status: 'draft' });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (store && open) {
      setForm({ name: store.name, description: store.description || '', status: store.status });
    }
  }, [store, open]);

  const handleSave = async () => {
    if (!store) return;
    try {
      setSaving(true);
      await fetchWithAuth(`/admin/shopalize/stores/${store.id}`, {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      toast({ title: "Store updated", description: "Changes saved successfully." });
      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>Edit Store</DialogTitle>
          <DialogDescription>Update store information and status.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Store Name</Label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <button onClick={() => onOpenChange(false)} className="px-4 py-2 text-slate-500 font-medium">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StoreManagement;
