import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Search, Plus, Key, trash2, Trash2, Copy, Check, ShieldCheck, ShieldAlert, Loader2, Building2, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchWithAuth } from "@/lib/api";
import { cn } from "@/lib/utils";

const ManageApiKeys = () => {
    const [keys, setKeys] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [search, setSearch] = useState("");
    const [newKeyForm, setNewKeyForm] = useState({ userId: "", name: "Default API Key" });
    const { toast } = useToast();

    const fetchData = async () => {
        try {
            setLoading(true);
            const [keysData, usersData] = await Promise.all([
                fetchWithAuth('/admin/api-keys'),
                fetchWithAuth('/admin/users')
            ]);
            setKeys(keysData);
            // Only companies can have API keys
            setUsers(usersData.filter((u: any) => u.businessName));
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateKey = async () => {
        if (!newKeyForm.userId) {
            toast({ title: "Error", description: "Please select a company", variant: "destructive" });
            return;
        }
        try {
            await fetchWithAuth('/admin/api-keys', {
                method: 'POST',
                body: JSON.stringify(newKeyForm)
            });
            setShowCreateModal(false);
            fetchData();
            toast({ title: "Success", description: "API Key generated successfully" });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const handleDeleteKey = async (id: number) => {
        if (!confirm("Are you sure? Any integrations using this key will stop working immediately.")) return;
        try {
            await fetchWithAuth(`/admin/api-keys/${id}`, { method: 'DELETE' });
            fetchData();
            toast({ title: "Key Revoked", description: "The API key has been deleted." });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copied!", description: "API Key copied to clipboard" });
    };

    const filteredKeys = keys.filter(k =>
        (k.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (k.businessName || "").toLowerCase().includes(search.toLowerCase()) ||
        (k.userEmail || "").toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AdminLayout>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">API Key Management</h1>
                    <p className="text-slate-500">Generate and manage access keys for company integrations.</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-[#025864] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#013a42] transition-colors flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" /> Generate New Key
                </button>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-50">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by key name or company..."
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#025864]/10 focus:border-[#025864] transition-all"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Key Name / Company</th>
                                <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">API Key</th>
                                <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Status</th>
                                <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Created At</th>
                                <th className="text-right px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-[#025864] mx-auto mb-2" />
                                        <p className="text-sm text-slate-500 font-medium">Loading API keys...</p>
                                    </td>
                                </tr>
                            ) : filteredKeys.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center text-slate-500 text-sm py-10">No API keys found.</td>
                                </tr>
                            ) : filteredKeys.map((k) => (
                                <tr key={k.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-bold text-slate-900">{k.name}</p>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <Building2 className="w-3 h-3 text-[#025864]" />
                                            <p className="text-[10px] text-[#025864] font-bold uppercase">{k.businessName}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <code className="bg-slate-100 px-2 py-1 rounded text-[11px] font-mono text-slate-600 block max-w-[150px] truncate">
                                                {k.key}
                                            </code>
                                            <button onClick={() => copyToClipboard(k.key)} className="p-1.5 hover:bg-slate-200 rounded-md transition-colors text-slate-400 hover:text-slate-600">
                                                <Copy className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            "text-[10px] px-2 py-0.5 rounded-full font-bold",
                                            k.status === 'Active' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                                        )}>
                                            {k.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-slate-500">
                                        {new Date(k.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const newStatus = k.status === 'Active' ? 'Suspended' : 'Active';
                                                        await fetchWithAuth(`/admin/api-keys/${k.id}/status`, {
                                                            method: 'PATCH',
                                                            body: JSON.stringify({ status: newStatus })
                                                        });
                                                        fetchData();
                                                        toast({ title: "Status Updated", description: `API Key is now ${newStatus}` });
                                                    } catch (error: any) {
                                                        toast({ title: "Error", description: error.message, variant: "destructive" });
                                                    }
                                                }}
                                                className={cn(
                                                    "p-2 rounded-lg transition-colors",
                                                    k.status === 'Active'
                                                        ? "hover:bg-amber-50 text-amber-500 hover:text-amber-600"
                                                        : "hover:bg-emerald-50 text-emerald-500 hover:text-emerald-600"
                                                )}
                                                title={k.status === 'Active' ? "Suspend Key" : "Activate Key"}
                                            >
                                                {k.status === 'Active' ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteKey(k.id)}
                                                className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-400 hover:text-red-600"
                                                title="Revoke Key"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-slate-900">Generate API Key</h2>
                                <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                    <Plus className="w-5 h-5 text-slate-400 rotate-45" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-700 block mb-1.5">Company *</label>
                                    <select
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#025864]/10 focus:border-[#025864] transition-all text-sm"
                                        value={newKeyForm.userId}
                                        onChange={e => setNewKeyForm(p => ({ ...p, userId: e.target.value }))}
                                    >
                                        <option value="">Select a company</option>
                                        {users.map(u => (
                                            <option key={u.id} value={u.id}>{u.businessName} ({u.email})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 block mb-1.5">Key Label</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#025864]/10 focus:border-[#025864] transition-all text-sm"
                                        value={newKeyForm.name}
                                        onChange={e => setNewKeyForm(p => ({ ...p, name: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateKey}
                                    className="flex-1 py-3 bg-[#025864] text-white font-bold rounded-xl hover:bg-[#013a42] transition-colors"
                                >
                                    Generate Key
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default ManageApiKeys;
