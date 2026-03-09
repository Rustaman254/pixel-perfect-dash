import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Bell, Send, Users, Trash2, Clock, Info, CheckCircle2, AlertTriangle, AlertCircle, Plus } from "lucide-react";
import { fetchWithAuth } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Notification {
    id: number;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'alert';
    email?: string;
    isRead: boolean;
    createdAt: string;
}

interface User {
    id: number;
    email: string;
    fullName: string;
}

const AdminNotificationsPage = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const { toast } = useToast();

    // Form state
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [type, setType] = useState<any>("info");
    const [targetUserId, setTargetUserId] = useState("");
    const [targetRole, setTargetRole] = useState("");
    const [actionUrl, setActionUrl] = useState("");
    const [actionLabel, setActionLabel] = useState("");

    const actionPresets = [
        { label: "None", url: "", btnLabel: "" },
        { label: "Create Deal", url: "/links", btnLabel: "Create New Deal" },
        { label: "Manage Coupons", url: "/admin/referrals", btnLabel: "View Coupons" },
        { label: "Platform Stats", url: "/statistics", btnLabel: "View Stats" },
        { label: "User Management", url: "/admin/users", btnLabel: "Manage Users" },
    ];

    const loadData = async () => {
        try {
            const [notifsData, usersData] = await Promise.all([
                fetchWithAuth('/notifications/admin/all'),
                fetchWithAuth('/admin/users')
            ]);
            setNotifications(notifsData);
            setUsers(usersData);
        } catch (error) {
            console.error("Failed to load admin notifications data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !message) return;

        setSending(true);
        try {
            await fetchWithAuth('/notifications/admin/send', {
                method: 'POST',
                body: JSON.stringify({
                    userId: targetUserId || null,
                    targetRole: targetRole || null,
                    title,
                    message,
                    type,
                    actionUrl: actionUrl || null,
                    actionLabel: actionLabel || null
                })
            });
            toast({ title: "Success", description: "Notification sent successfully" });
            setTitle("");
            setMessage("");
            setTargetUserId("");
            setTargetRole("");
            setActionUrl("");
            setActionLabel("");
            loadData();
        } catch (error) {
            toast({ title: "Error", description: "Failed to send notification", variant: "destructive" });
        } finally {
            setSending(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            // Reusing user delete endpoint logic on backend if we wanted, 
            // but controller has no admin delete for specific notification yet.
            // For now just client-side filter or add delete endpoint to backend.
            await fetchWithAuth(`/api/notifications/${id}`, { method: 'DELETE' }); // Using current delete
            setNotifications(notifications.filter(n => n.id !== id));
        } catch (error) {
            toast({ title: "Error", description: "Delete failed", variant: "destructive" });
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
            case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
            case 'alert': return <AlertCircle className="w-5 h-5 text-red-500" />;
            default: return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    return (
        <AdminLayout>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Platform Notifications</h1>
                <p className="text-slate-500">Send broadcast or targeted alerts to RippliFy users.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Send Notification Form */}
                <div className="lg:col-span-1 border border-slate-100 bg-white rounded-3xl p-6 shadow-sm h-fit">
                    <div className="flex items-center gap-2 mb-6 text-[#025864]">
                        <Plus className="w-5 h-5" />
                        <h3 className="font-bold">Create Notification</h3>
                    </div>
                    <form onSubmit={handleSend} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase">Target User</label>
                                <select 
                                    value={targetUserId}
                                    onChange={(e) => {
                                        setTargetUserId(e.target.value);
                                        if (e.target.value) setTargetRole("");
                                    }}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-[#025864] text-sm bg-slate-50"
                                >
                                    <option value="">Broadcast (By Role)</option>
                                    {users.map(user => (
                                        <option key={user.id} value={user.id}>{user.email}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase">Target Role</label>
                                <select 
                                    value={targetRole}
                                    disabled={!!targetUserId}
                                    onChange={(e) => setTargetRole(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-[#025864] text-sm bg-slate-50 disabled:opacity-50"
                                >
                                    <option value="">Everyone</option>
                                    <option value="seller">All Sellers</option>
                                    <option value="admin">All Admins</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase">Title</label>
                            <input 
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Maintenance Update, New Feature, etc."
                                className="w-full px-4 py-3 rounded-xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-[#025864] text-sm bg-slate-50"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase">Action Link (Optional)</label>
                                <input 
                                    type="text"
                                    value={actionUrl}
                                    onChange={(e) => setActionUrl(e.target.value)}
                                    placeholder="/links"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-[#025864] text-sm bg-slate-50"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase">Button Label</label>
                                <input 
                                    type="text"
                                    value={actionLabel}
                                    onChange={(e) => setActionLabel(e.target.value)}
                                    placeholder="Click Here"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-[#025864] text-sm bg-slate-50"
                                />
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 py-1">
                            {actionPresets.map(preset => (
                                <button 
                                    key={preset.label}
                                    type="button"
                                    onClick={() => {
                                        setActionUrl(preset.url);
                                        setActionLabel(preset.btnLabel);
                                    }}
                                    className="text-[10px] font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase">Type</label>
                            <div className="flex gap-2">
                                {['info', 'success', 'warning', 'alert'].map(t => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setType(t)}
                                        className={cn(
                                            "flex-1 capitalize py-2 rounded-lg text-[10px] font-bold border transition-all",
                                            type === t ? "bg-[#025864] text-white border-[#025864]" : "bg-white text-slate-400 border-slate-100 hover:bg-slate-50"
                                        )}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase">Message</label>
                            <textarea 
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Enter notification message details..."
                                rows={4}
                                className="w-full px-4 py-3 rounded-xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-[#025864] text-sm bg-slate-50 resize-none"
                                required
                            />
                        </div>
                        <button 
                            disabled={sending}
                            className="w-full py-3 bg-[#025864] text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-[#014751] transition-all"
                        >
                            {sending ? "Sending..." : <><Send className="w-4 h-4" /> Send Notification</>}
                        </button>
                    </form>
                </div>

                {/* History */}
                <div className="lg:col-span-2 border border-slate-100 bg-white rounded-3xl overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                        <h3 className="font-bold text-slate-900">Notification History</h3>
                        <Bell className="w-5 h-5 text-slate-400" />
                    </div>
                    {loading ? (
                        <div className="p-12 text-center text-slate-500">Loading history...</div>
                    ) : notifications.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">No notifications found.</div>
                    ) : (
                        <div className="divide-y divide-slate-50">
                            {notifications.map((n) => (
                                <div key={n.id} className="p-6 flex gap-4 hover:bg-slate-50/50 transition-colors">
                                    <div className="shrink-0 mt-1">
                                        {getTypeIcon(n.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className="text-sm font-bold text-slate-900">{n.title}</h4>
                                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(n.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 mb-2">Target: {n.email || "Platform Broadcast"}</p>
                                        <p className="text-sm text-slate-600 leading-relaxed mb-4">{n.message}</p>
                                        <button 
                                            onClick={() => handleDelete(n.id)}
                                            className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                            Delete Log
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminNotificationsPage;
