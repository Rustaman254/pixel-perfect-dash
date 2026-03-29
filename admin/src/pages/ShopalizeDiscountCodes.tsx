import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Tag, Plus, Trash2, Power, User, Percent, DollarSign, Calendar, Eye, Users, Copy, Loader2, Package } from "lucide-react";
import { fetchWithAuth } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface DiscountCode {
  id: number;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minOrderAmount: number;
  maxDiscountAmount: number | null;
  maxUses: number;
  currentUses: number;
  userId: number | null;
  expiresAt: string | null;
  applicableProducts: string | null;
  description: string;
  isActive: boolean;
  createdAt: string;
}

interface UsageRecord {
  id: number;
  orderId: number;
  userId: number;
  orderAmount: number;
  discountAmount: number;
  pointsAwarded: number;
  createdAt: string;
}

const ShopalizeDiscountCodes = () => {
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  const [newCode, setNewCode] = useState("");
  const [codeType, setCodeType] = useState<"percentage" | "fixed">("percentage");
  const [codeValue, setCodeValue] = useState("10");
  const [minOrderAmount, setMinOrderAmount] = useState("0");
  const [maxDiscountAmount, setMaxDiscountAmount] = useState("");
  const [maxUses, setMaxUses] = useState("-1");
  const [expiresAt, setExpiresAt] = useState("");
  const [description, setDescription] = useState("");
  const [assignUserId, setAssignUserId] = useState("");

  const [usageOpen, setUsageOpen] = useState(false);
  const [usageData, setUsageData] = useState<any>(null);
  const [loadingUsage, setLoadingUsage] = useState(false);

  const loadData = async () => {
    try {
      const data = await fetchWithAuth("/admin/shopalize/discount-codes");
      setCodes(data.codes || data || []);
    } catch (error) {
      console.error("Failed to load discount codes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !codeValue) return;
    setCreating(true);
    try {
      await fetchWithAuth("/admin/shopalize/discount-codes", {
        method: "POST",
        body: JSON.stringify({
          code: newCode.toUpperCase(),
          type: codeType,
          value: parseFloat(codeValue),
          minOrderAmount: parseFloat(minOrderAmount) || 0,
          maxDiscountAmount: maxDiscountAmount ? parseFloat(maxDiscountAmount) : null,
          maxUses: parseInt(maxUses) || -1,
          expiresAt: expiresAt || null,
          description,
          userId: assignUserId ? parseInt(assignUserId) : null,
        }),
      });
      toast({ title: "Success", description: "Discount code created" });
      setNewCode("");
      setCodeValue("10");
      setMinOrderAmount("0");
      setMaxDiscountAmount("");
      setMaxUses("-1");
      setExpiresAt("");
      setDescription("");
      setAssignUserId("");
      loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this discount code?")) return;
    try {
      await fetchWithAuth("/admin/shopalize/discount-codes/" + id, { method: "DELETE" });
      setCodes(codes.filter((c) => c.id !== id));
      toast({ title: "Deleted", description: "Code removed" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const toggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      await fetchWithAuth("/admin/shopalize/discount-codes/" + id, {
        method: "PUT",
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      setCodes(codes.map((c) => (c.id === id ? { ...c, isActive: !currentStatus } : c)));
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const viewUsage = async (code: DiscountCode) => {
    setUsageOpen(true);
    setLoadingUsage(true);
    try {
      const data = await fetchWithAuth("/admin/shopalize/discount-codes/" + code.id + "/usage");
      setUsageData(data);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setUsageOpen(false);
    } finally {
      setLoadingUsage(false);
    }
  };

  const generateRandomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    setNewCode(result);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copied!", description: "Code copied to clipboard" });
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Discount & Promo Codes</h1>
        <p className="text-slate-500">Create discount codes for customers and affiliate tracking codes for sellers.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-1 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-fit">
          <div className="flex items-center gap-2 mb-6 text-blue-600">
            <Tag className="w-5 h-5" />
            <h3 className="font-bold">New Code</h3>
          </div>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  placeholder="SUMMER20"
                  required
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50 font-mono"
                />
                <button
                  type="button"
                  onClick={generateRandomCode}
                  className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200"
                  title="Generate"
                >
                  <Power className="w-4 h-4 rotate-90" />
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCodeType("percentage")}
                  className={cn(
                    "flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold border-2 transition-all",
                    codeType === "percentage" ? "border-blue-500 bg-blue-50 text-blue-600" : "border-slate-100 text-slate-500"
                  )}
                >
                  <Percent className="w-4 h-4" /> Percentage
                </button>
                <button
                  type="button"
                  onClick={() => setCodeType("fixed")}
                  className={cn(
                    "flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold border-2 transition-all",
                    codeType === "fixed" ? "border-blue-500 bg-blue-50 text-blue-600" : "border-slate-100 text-slate-500"
                  )}
                >
                  <DollarSign className="w-4 h-4" /> Fixed Amount
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">
                {codeType === "percentage" ? "Discount %" : "Discount Amount"}
              </label>
              <input
                type="number"
                value={codeValue}
                onChange={(e) => setCodeValue(e.target.value)}
                min="0"
                step={codeType === "percentage" ? "1" : "0.01"}
                max={codeType === "percentage" ? "100" : undefined}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Min Order</label>
                <input
                  type="number"
                  value={minOrderAmount}
                  onChange={(e) => setMinOrderAmount(e.target.value)}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 rounded-xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Max Uses</label>
                <input
                  type="number"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  min="-1"
                  className="w-full px-4 py-3 rounded-xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
                />
              </div>
            </div>

            {codeType === "percentage" && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Max Discount Cap (Optional)</label>
                <input
                  type="number"
                  value={maxDiscountAmount}
                  onChange={(e) => setMaxDiscountAmount(e.target.value)}
                  min="0"
                  step="0.01"
                  placeholder="No cap"
                  className="w-full px-4 py-3 rounded-xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Expires At (Optional)</label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Assign to Affiliate (Optional)</label>
              <input
                type="number"
                value={assignUserId}
                onChange={(e) => setAssignUserId(e.target.value)}
                placeholder="User ID for affiliate tracking"
                className="w-full px-4 py-3 rounded-xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Summer sale 20% off"
                className="w-full px-4 py-3 rounded-xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
              />
            </div>

            <button
              disabled={creating}
              className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-all mt-2"
            >
              {creating ? "Creating..." : <><Plus className="w-4 h-4" /> Create Code</>}
            </button>
          </form>
        </div>

        <div className="xl:col-span-3 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50">
            <h3 className="font-bold text-slate-900">All Discount Codes</h3>
          </div>
          {loading ? (
            <div className="p-12 text-center text-slate-500 flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase">Code</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase">Type</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase">Value</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase">Usage</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase">Expires</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase">Status</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {codes.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-blue-600" />
                          <div>
                            <span className="text-sm font-bold text-slate-900 font-mono">{c.code}</span>
                            {c.description && <p className="text-[10px] text-slate-400">{c.description}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={cn("text-[10px] font-bold px-2 py-1 rounded", c.type === "percentage" ? "bg-purple-50 text-purple-600" : "bg-amber-50 text-amber-600")}>
                          {c.type === "percentage" ? "PERCENT" : "FIXED"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-bold text-slate-900">
                          {c.type === "percentage" ? c.value + "%" : "$" + c.value}
                        </span>
                        {c.minOrderAmount > 0 && <p className="text-[10px] text-slate-400">Min: ${c.minOrderAmount}</p>}
                      </td>
                      <td className="px-5 py-4">
                        <button onClick={() => viewUsage(c)} className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
                          <Users className="w-4 h-4 text-slate-400" />
                          <span className="text-sm font-bold text-slate-900">{c.currentUses}</span>
                          {c.maxUses > 0 && <span className="text-[10px] text-slate-400">/ {c.maxUses}</span>}
                          <Eye className="w-3 h-3 text-slate-300 ml-1" />
                        </button>
                      </td>
                      <td className="px-5 py-4">
                        {c.expiresAt ? (
                          <span className={cn("text-xs font-medium", new Date(c.expiresAt) < new Date() ? "text-red-500" : "text-slate-600")}>
                            {new Date(c.expiresAt).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-300 uppercase">Never</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => toggleStatus(c.id, c.isActive)}
                          className={cn(
                            "px-2 py-1 text-[10px] font-bold rounded flex items-center gap-1",
                            c.isActive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                          )}
                        >
                          <div className={cn("w-1 h-1 rounded-full", c.isActive ? "bg-emerald-500" : "bg-red-500")} />
                          {c.isActive ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => copyCode(c.code)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Copy Code"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => viewUsage(c)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="View Usage"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {codes.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                        No discount codes yet. Create one to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Dialog open={usageOpen} onOpenChange={setUsageOpen}>
        <DialogContent className="max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle>Code: {usageData?.code?.code}</DialogTitle>
            <DialogDescription>
              {usageData?.code?.type === "percentage"
                ? usageData.code.value + "% off"
                : "$" + usageData.code?.value + " off"}
              {usageData?.code?.description && " - " + usageData.code.description}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-500 mb-1">Total Uses</p>
              <p className="text-lg font-bold text-slate-900">{usageData?.code?.currentUses || 0}</p>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-2">Recent Usage</h4>
              {loadingUsage ? (
                <div className="py-6 text-center text-sm text-slate-400">Loading...</div>
              ) : !usageData?.usage || usageData.usage.length === 0 ? (
                <div className="py-6 text-center text-sm text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  No usage recorded yet.
                </div>
              ) : (
                <div className="max-h-[300px] overflow-y-auto space-y-2">
                  {usageData.usage.map((u: UsageRecord) => (
                    <div key={u.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-slate-900">Order #{u.orderId}</p>
                        <p className="text-[10px] text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-900">${u.orderAmount}</p>
                        <p className="text-xs font-bold text-red-500">-${u.discountAmount}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default ShopalizeDiscountCodes;
