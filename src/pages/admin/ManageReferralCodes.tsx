import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Ticket, Plus, Trash2, Power, User, Search, Filter, Percent, Info } from "lucide-react";
import { fetchWithAuth } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ReferralCode {
    id: number;
    code: string;
    userId: number | null;
    userEmail: string | null;
    discount: number;
    maxUses: number;
    currentUses: number;
    isActive: boolean;
    createdAt: string;
}

interface User {
    id: number;
    email: string;
    fullName: string;
}

const ManageReferralCodes = () => {
    const [codes, setCodes] = useState<ReferralCode[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const { toast } = useToast();

    // Form state
    const [newCodeField, setNewCodeField] = useState("");
    const [discount, setDiscount] = useState("0");
    const [maxUses, setMaxUses] = useState("-1");
    const [targetUserId, setTargetUserId] = useState("");

    const loadData = async () => {
        try {
            const [codesData, usersData] = await Promise.all([
                fetchWithAuth('/admin/referrals'),
                fetchWithAuth('/admin/users')
            ]);
            setCodes(codesData);
            setUsers(usersData);
        } catch (error) {
            console.error("Failed to load referral codes data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCodeField) return;

        setCreating(true);
        try {
            await fetchWithAuth('/admin/referrals', {
                method: 'POST',
                body: JSON.stringify({
                    code: newCodeField.toUpperCase(),
                    userId: targetUserId || null,
                    discount: parseFloat(discount),
                    maxUses: parseInt(maxUses)
                })
            });
            toast({ title: "Success", description: "Referral code created" });
            setNewCodeField("");
            setDiscount("0");
            setMaxUses("-1");
            setTargetUserId("");
            loadData();
        } catch (error) {
            toast({ title: "Error", description: "Failed to create code", variant: "destructive" });
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this code?")) return;
        try {
            await fetchWithAuth(`/admin/referrals/${id}`, { method: 'DELETE' });
            setCodes(codes.filter(c => c.id !== id));
            toast({ title: "Deleted", description: "Code removed successfully" });
        } catch (error) {
            toast({ title: "Error", description: "Delete failed", variant: "destructive" });
        }
    };

    const toggleStatus = async (id: number, currentStatus: boolean) => {
        try {
            await fetchWithAuth(`/admin/referrals/${id}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ isActive: !currentStatus })
            });
            setCodes(codes.map(c => c.id === id ? { ...c, isActive: !currentStatus } : c));
        } catch (error) {
            toast({ title: "Error", description: "Update failed", variant: "destructive" });
        }
    };

    const generateRandomCode = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let result = "";
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setNewCodeField(result);
    };

    return (
        <AdminLayout>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Referral Codes</h1>
                <p className="text-slate-500">Create and manage platform referral codes for your users.</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                {/* Create Form */}
                <div className="xl:col-span-1 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-fit">
                    <div className="flex items-center gap-2 mb-6 text-[#025864]">
                        <Ticket className="w-5 h-5" />
                        <h3 className="font-bold">New Coupon</h3>
                    </div>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase">Code Name</label>
                            <div className="flex gap-2">
                                <input 
                                    type="text"
                                    value={newCodeField}
                                    onChange={(e) => setNewCodeField(e.target.value)}
                                    placeholder="RIPPLE10"
                                    className="flex-1 px-4 py-3 rounded-xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-[#025864] text-sm bg-slate-50 font-mono"
                                    required
                                />
                                <button 
                                    type="button"
                                    onClick={generateRandomCode}
                                    className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"
                                    title="Generate Random"
                                >
                                    <Power className="w-4 h-4 rotate-90" />
                                </button>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase">Discount (%)</label>
                            <div className="relative">
                                <Percent className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                    type="number"
                                    value={discount}
                                    onChange={(e) => setDiscount(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-[#025864] text-sm bg-slate-50"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase">Max Uses (-1 for unlim.)</label>
                            <input 
                                type="number"
                                value={maxUses}
                                onChange={(e) => setMaxUses(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-[#025864] text-sm bg-slate-50"
                                min="-1"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase">Assign to User (Optional)</label>
                            <select 
                                value={targetUserId}
                                onChange={(e) => setTargetUserId(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-[#025864] text-sm bg-slate-50"
                            >
                                <option value="">Global / Unassigned</option>
                                {users.map(user => (
                                    <option key={user.id} value={user.id}>{user.email}</option>
                                ))}
                            </select>
                        </div>
                        <button 
                            disabled={creating}
                            className="w-full py-3 bg-[#025864] text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-[#014751] transition-all mt-4"
                        >
                            {creating ? "Creating..." : <><Plus className="w-4 h-4" /> Create Coupon</>}
                        </button>
                    </form>
                </div>

                {/* Coupons Table */}
                <div className="xl:col-span-3 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                        <h3 className="font-bold text-slate-900">Active Coupons</h3>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="text"
                                placeholder="Search codes..."
                                className="pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs focus:ring-2 focus:ring-[#025864] w-48"
                            />
                        </div>
                    </div>
                    {loading ? (
                        <div className="p-12 text-center text-slate-500">Loading coupons...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Code</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assignee</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Discount</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Usage</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {codes.map((c) => (
                                        <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Ticket className="w-4 h-4 text-[#025864]" />
                                                    <span className="text-sm font-bold text-slate-900 font-mono">{c.code}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {c.userEmail ? (
                                                        <>
                                                            <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center">
                                                                <User className="w-3 h-3 text-blue-500" />
                                                            </div>
                                                            <span className="text-xs text-slate-600 truncate max-w-[150px]">{c.userEmail}</span>
                                                        </>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-slate-300 uppercase">Global</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-bold text-emerald-600">{c.discount}% Off</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-[10px] font-bold">
                                                        <span className="text-slate-500">{c.currentUses} used</span>
                                                        <span className="text-slate-400">{c.maxUses === -1 ? '∞' : c.maxUses}</span>
                                                    </div>
                                                    <div className="w-24 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full bg-[#025864]" 
                                                            style={{ width: `${c.maxUses === -1 ? 0 : (c.currentUses / c.maxUses) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button 
                                                    onClick={() => toggleStatus(c.id, c.isActive)}
                                                    className={cn(
                                                        "px-2 px-1 text-[10px] font-bold rounded flex items-center gap-1 transition-all",
                                                        c.isActive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                                                    )}
                                                >
                                                    <div className={cn("w-1 h-1 rounded-full", c.isActive ? "bg-emerald-500" : "bg-red-500")} />
                                                    {c.isActive ? 'Active' : 'Inactive'}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => handleDelete(c.id)}
                                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {codes.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-slate-500 text-sm">No referral codes created yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default ManageReferralCodes;
