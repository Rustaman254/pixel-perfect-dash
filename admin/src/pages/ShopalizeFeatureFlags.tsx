import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { fetchWithAuth, cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Flag, Loader2, Plus, Trash2, ToggleLeft, ToggleRight, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FeatureFlag {
  id: number;
  key: string;
  name: string;
  description: string;
  category: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

const ShopalizeFeatureFlags = () => {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const { toast } = useToast();

  const [createOpen, setCreateOpen] = useState(false);
  const [newFlag, setNewFlag] = useState({ key: "", name: "", description: "", category: "general" });
  const [creating, setCreating] = useState(false);

  const loadFlags = async () => {
    try {
      setLoading(true);
      const data = await fetchWithAuth('/admin/shopalize/feature-flags');
      setFlags(data);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFlags(); }, []);

  const handleToggle = async (flag: FeatureFlag) => {
    try {
      await fetchWithAuth(`/admin/shopalize/feature-flags/${flag.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isEnabled: !flag.isEnabled }),
      });
      setFlags(flags.map(f => f.id === flag.id ? { ...f, isEnabled: !f.isEnabled } : f));
      toast({ title: "Feature toggled", description: `${flag.name} has been ${!flag.isEnabled ? 'enabled' : 'disabled'}.` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this feature flag?")) return;
    try {
      await fetchWithAuth(`/admin/shopalize/feature-flags/${id}`, { method: 'DELETE' });
      setFlags(flags.filter(f => f.id !== id));
      toast({ title: "Deleted", description: "Feature flag removed." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleCreate = async () => {
    if (!newFlag.key || !newFlag.name) {
      toast({ title: "Validation", description: "Key and Name are required.", variant: "destructive" });
      return;
    }
    try {
      setCreating(true);
      const created = await fetchWithAuth('/admin/shopalize/feature-flags', {
        method: 'POST',
        body: JSON.stringify(newFlag),
      });
      setFlags([...flags, created]);
      setCreateOpen(false);
      setNewFlag({ key: "", name: "", description: "", category: "general" });
      toast({ title: "Success", description: "Feature flag created." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const categories = [...new Set(flags.map(f => f.category))];

  const filteredFlags = flags.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.key.toLowerCase().includes(search.toLowerCase()) ||
      (f.description || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || f.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const enabledCount = flags.filter(f => f.isEnabled).length;
  const disabledCount = flags.filter(f => !f.isEnabled).length;

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Shopalize Feature Flags</h1>
          <p className="text-sm text-slate-500">Control which e-commerce features are available on the platform.</p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Feature
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Total Features</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{flags.length}</h3>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-medium text-emerald-600 uppercase tracking-wider">Enabled</p>
          <h3 className="text-2xl font-bold text-emerald-600 mt-1">{enabledCount}</h3>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-medium text-red-600 uppercase tracking-wider">Disabled</p>
          <h3 className="text-2xl font-bold text-red-600 mt-1">{disabledCount}</h3>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <input type="text" placeholder="Search features..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 font-medium outline-none">
            <option value="all">All Categories</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Feature</th>
                <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Key</th>
                <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Category</th>
                <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Status</th>
                <th className="text-right px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={5} className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" /><p className="text-sm text-slate-500">Loading features...</p></td></tr>
              ) : filteredFlags.length === 0 ? (
                <tr><td colSpan={5} className="py-20 text-center"><p className="text-sm text-slate-500">No features found.</p></td></tr>
              ) : filteredFlags.map((flag) => (
                <tr key={flag.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", flag.isEnabled ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600")}>
                        <Flag className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{flag.name}</p>
                        <p className="text-[10px] text-slate-400">{flag.description || "No description"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">{flag.key}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-bold uppercase bg-slate-100 px-2 py-0.5 rounded-full text-slate-600">{flag.category}</span>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleToggle(flag)} className="flex items-center gap-1.5">
                      {flag.isEnabled ? (
                        <><ToggleRight className="w-6 h-6 text-emerald-500" /><span className="text-[10px] font-bold text-emerald-600">ON</span></>
                      ) : (
                        <><ToggleLeft className="w-6 h-6 text-slate-300" /><span className="text-[10px] font-bold text-slate-400">OFF</span></>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleDelete(flag.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader><DialogTitle>Create Feature Flag</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Key (unique identifier)</Label>
              <Input value={newFlag.key} onChange={e => setNewFlag({ ...newFlag, key: e.target.value.toLowerCase().replace(/\s+/g, '_') })} placeholder="e.g. new_feature" />
            </div>
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input value={newFlag.name} onChange={e => setNewFlag({ ...newFlag, name: e.target.value })} placeholder="e.g. New Feature" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={newFlag.description} onChange={e => setNewFlag({ ...newFlag, description: e.target.value })} placeholder="What does this feature do?" />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={newFlag.category} onValueChange={v => setNewFlag({ ...newFlag, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="stores">Stores</SelectItem>
                  <SelectItem value="products">Products</SelectItem>
                  <SelectItem value="payments">Payments</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="analytics">Analytics</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setCreateOpen(false)} className="px-4 py-2 text-slate-500 font-medium">Cancel</button>
            <button onClick={handleCreate} disabled={creating} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50">
              {creating ? "Creating..." : "Create Feature"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default ShopalizeFeatureFlags;
