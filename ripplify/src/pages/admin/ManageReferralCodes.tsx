import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Ticket, Plus, Trash2, Power, User, Search, Percent, Info, Link2, Eye, Users, Copy, ExternalLink } from "lucide-react";
import { fetchWithAuth, BASE_URL } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface ReferralCode {
    id: number;
    code: string;
    userId: number | null;
    userEmail: string | null;
    userFullName: string | null;
    userBusiness: string | null;
    discount: number;
    maxUses: number;
    currentUses: number;
    isActive: boolean;
    pointsPerReferral: number;
    expiresAt: string | null;
    createdAt: string;
}

interface UsageRecord {
    id: number;
    referredUserId: number;
    referredName: string;
    referredEmail: string;
    referredBusiness: string;
    pointsAwarded: number;
    createdAt: string;
}

const ManageReferralCodes = () => {
    const [codes, setCodes] = useState<ReferralCode[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const { toast } = useToast();

    // Form state
    const [newCodeField, setNewCodeField] = useState("");
    const [discount, setDiscount] = useState("0");
    const [maxUses, setMaxUses] = useState("-1");
    const [pointsPerReferral, setPointsPerReferral] = useState("10");
    const [targetUserId, setTargetUserId] = useState("");
    const [expiresAt, setExpiresAt] = useState("");

    // Usage detail modal
    const [usageOpen, setUsageOpen] = useState(false);
    const [usageData, setUsageData] = useState<any>(null);
    const [loadingUsage, setLoadingUsage] = useState(false);

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

    useEffect(() => { loadData(); }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCodeField) return;

        setCreating(true);
        try {
            await fetchWithAuth('/admin/referrals', {
                method: 'POST',
                body: JSON.stringify({
                    code: newCodeField.toUpperCase(),
                    userId: targetUserId ? parseInt(targetUserId) : null,
                    discount: parseFloat(discount) || 0,
                    maxUses: parseInt(maxUses) || -1,
                    pointsPerReferral: parseInt(pointsPerReferral) || 10,
                    expiresAt: expiresAt || null
                })
            });
            toast({ title: "Success", description: "Referral code created" });
            setNewCodeField("");
            setDiscount("0");
            setMaxUses("-1");
            setPointsPerReferral("10");
            setTargetUserId("");
            setExpiresAt("");
            loadData();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this referral code and all its usage history?")) return;
        try {
            await fetchWithAuth(`/admin/referrals/${id}`, { method: 'DELETE' });
            setCodes(codes.filter(c => c.id !== id));
            toast({ title: "Deleted", description: "Code removed" });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const toggleStatus = async (id: number, currentStatus: boolean) => {
        try {
            await fetchWithAuth(`/admin/referrals/${id}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ isActive: !currentStatus })
            });
            setCodes(codes.map(c => c.id === id ? { ...c, isActive: !currentStatus } : c));
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const viewUsage = async (code: ReferralCode) => {
        setUsageOpen(true);
        setLoadingUsage(true);
        try {
            const data = await fetchWithAuth(`/admin/referrals/${code.id}/usage`);
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
        setNewCodeField(result);
    };

    const getReferralLink = (code: string) => `${window.location.origin}/signup?ref=${code}`;

    const copyLink = (code: string) => {
        navigator.clipboard.writeText(getReferralLink(code));
        toast({ title: "Copied!", description: "Referral link copied to clipboard" });
    };

    return (
        <AdminLayout>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Referral Codes</h1>
                <p className="text-slate-500">Create referral codes, link users, track registrations, and award points.</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                {/* Create Form */}
                <div className="xl:col-span-1 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-fit">
                    <div className="flex items-center gap-2 mb-6 text-[#025864]">
                        <Ticket className="w-5 h-5" />
                        <h3 className="font-bold">New Referral Code</h3>
                    </div>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase">Code</label>
                            <div className="flex gap-2">
                                <input type="text" value={newCodeField} onChange={e => setNewCodeField(e.target.value.toUpperCase())}
                                    placeholder="REFER10" required
                                    className="flex-1 px-4 py-3 rounded-xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-[#025864] text-sm bg-slate-50 font-mono" />
                                <button type="button" onClick={generateRandomCode} className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200" title="Generate">
                                    <Power className="w-4 h-4 rotate-90" />
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase">Points / Referral</label>
                                <input type="number" value={pointsPerReferral} onChange={e => setPointsPerReferral(e.target.value)} min="1"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-[#025864] text-sm bg-slate-50" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase">Max Uses</label>
                                <input type="number" value={maxUses} onChange={e => setMaxUses(e.target.value)} min="-1"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-[#025864] text-sm bg-slate-50" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase">Expires At (Optional)</label>
                            <input type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-[#025864] text-sm bg-slate-50" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase">Assign to User (Optional)</label>
                            <select value={targetUserId} onChange={e => setTargetUserId(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-[#025864] text-sm bg-slate-50">
                                <option value="">Standalone (No User)</option>
                                {users.map(u => <option key={u.id} value={u.id}>{u.fullName || u.email}</option>)}
                            </select>
                        </div>
                        {targetUserId && (
                            <div className="p-3 bg-blue-50 rounded-xl flex gap-2">
                                <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                <p className="text-[11px] text-blue-700">When someone registers with this code, the assigned user earns <strong>{pointsPerReferral} points</strong>.</p>
                            </div>
                        )}
                        <button disabled={creating}
                            className="w-full py-3 bg-[#025864] text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-[#014751] transition-all mt-2">
                            {creating ? "Creating..." : <><Plus className="w-4 h-4" /> Create Code</>}
                        </button>
                    </form>
                </div>

                {/* Codes Table */}
                <div className="xl:col-span-3 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-50">
                        <h3 className="font-bold text-slate-900">All Referral Codes</h3>
                    </div>
                    {loading ? (
                        <div className="p-12 text-center text-slate-500">Loading...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase">Code</th>
                                        <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase">Assigned To</th>
                                        <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase">Points</th>
                                        <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase">Registrations</th>
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
                                                    <Ticket className="w-4 h-4 text-[#025864]" />
                                                    <div>
                                                        <span className="text-sm font-bold text-slate-900 font-mono">{c.code}</span>
                                                        <button onClick={() => copyLink(c.code)} className="ml-2 text-[10px] text-[#025864] hover:underline flex items-center gap-0.5">
                                                            <Link2 className="w-3 h-3" /> Copy Link
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                {c.userEmail ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center">
                                                            <User className="w-3 h-3 text-blue-500" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-medium text-slate-700">{c.userFullName || c.userBusiness}</p>
                                                            <p className="text-[10px] text-slate-400">{c.userEmail}</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-slate-300 uppercase">Standalone</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="text-xs font-bold text-emerald-600">{c.pointsPerReferral} pts</span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <button onClick={() => viewUsage(c)} className="flex items-center gap-1.5 hover:text-[#025864] transition-colors">
                                                    <Users className="w-4 h-4 text-slate-400" />
                                                    <span className="text-sm font-bold text-slate-900">{c.currentUses}</span>
                                                    <Eye className="w-3 h-3 text-slate-300 ml-1" />
                                                </button>
                                            </td>
                                            <td className="px-5 py-4">
                                                {c.expiresAt ? (
                                                    <span className={`text-xs font-medium ${new Date(c.expiresAt) < new Date() ? 'text-red-500' : 'text-slate-600'}`}>
                                                        {new Date(c.expiresAt).toLocaleDateString()}
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-slate-300 uppercase">Never</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4">
                                                <button onClick={() => toggleStatus(c.id, c.isActive)}
                                                    className={cn("px-2 py-1 text-[10px] font-bold rounded flex items-center gap-1", c.isActive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600")}>
                                                    <div className={cn("w-1 h-1 rounded-full", c.isActive ? "bg-emerald-500" : "bg-red-500")} />
                                                    {c.isActive ? 'Active' : 'Inactive'}
                                                </button>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => viewUsage(c)} className="p-2 text-slate-400 hover:text-[#025864] hover:bg-slate-50 rounded-lg" title="View Usage">
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDelete(c.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg" title="Delete">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {codes.length === 0 && (
                                        <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">No referral codes yet.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Usage Detail Modal */}
            <Dialog open={usageOpen} onOpenChange={setUsageOpen}>
                <DialogContent className="max-w-lg bg-white">
                    <DialogHeader>
                        <DialogTitle>Referral Code: {usageData?.code?.code}</DialogTitle>
                        <DialogDescription>
                            {usageData?.referrer
                                ? `Assigned to ${usageData.referrer.fullName || usageData.referrer.email} (${usageData.referrer.referralPoints || 0} total points)`
                                : 'Standalone code (no user assigned)'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="p-3 bg-slate-50 rounded-xl">
                            <p className="text-xs text-slate-500 mb-1">Referral Link</p>
                            <div className="flex items-center gap-2">
                                <code className="text-xs text-[#025864] font-mono flex-1 truncate">
                                    {usageData?.code ? getReferralLink(usageData.code.code) : ''}
                                </code>
                                <button onClick={() => copyLink(usageData?.code?.code)} className="p-1.5 bg-[#025864] text-white rounded-lg">
                                    <Copy className="w-3 h-3" />
                                </button>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-bold text-slate-900 mb-2">Registrations ({usageData?.usage?.length || 0})</h4>
                            {loadingUsage ? (
                                <div className="py-6 text-center text-sm text-slate-400">Loading...</div>
                            ) : !usageData?.usage || usageData.usage.length === 0 ? (
                                <div className="py-6 text-center text-sm text-slate-400 border border-dashed border-slate-200 rounded-xl">No registrations yet.</div>
                            ) : (
                                <div className="max-h-[300px] overflow-y-auto space-y-2">
                                    {usageData.usage.map((u: UsageRecord) => (
                                        <div key={u.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-[#025864]/10 flex items-center justify-center text-xs font-bold text-[#025864]">
                                                    {(u.referredName || u.referredEmail || '?').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900">{u.referredName || u.referredBusiness || 'Unknown'}</p>
                                                    <p className="text-[10px] text-slate-400">{u.referredEmail}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs font-bold text-emerald-600">+{u.pointsAwarded} pts</span>
                                                <p className="text-[9px] text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</p>
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

export default ManageReferralCodes;
