import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import { Bell, Send, Users, Trash2, Clock, Info, CheckCircle2, AlertTriangle, AlertCircle, Plus, ExternalLink, Eye, Smartphone, Globe, Layers } from "lucide-react";
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
    deliveryChannel?: string;
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
    const navigate = useNavigate();

    // Form state
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [type, setType] = useState<string>("info");
    const [targetUserId, setTargetUserId] = useState("");
    const [targetRole, setTargetRole] = useState("");
    const [actionUrl, setActionUrl] = useState("");
    const [actionLabel, setActionLabel] = useState("");
    const [deliveryChannel, setDeliveryChannel] = useState<string>("app");

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
                    actionLabel: actionLabel || null,
                    deliveryChannel
                })
            });
            toast({ title: "Success", description: `Notification sent via ${deliveryChannel === 'both' ? 'app + SMS' : deliveryChannel}` });
            setTitle("");
            setMessage("");
            setTargetUserId("");
            setTargetRole("");
            setActionUrl("");
            setActionLabel("");
            setDeliveryChannel("app");
            loadData();
        } catch (error) {
            toast({ title: "Error", description: "Failed to send notification", variant: "destructive" });
        } finally {
            setSending(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await fetchWithAuth(`/notifications/admin/${id}`, { method: 'DELETE' });
            setNotifications(notifications.filter(n => n.id !== id));
            toast({ title: "Deleted", description: "Notification removed" });
        } catch (error) {
            toast({ title: "Error", description: "Delete failed", variant: "destructive" });
        }
    };

    const handleMarkRead = async (id: number) => {
        try {
            await fetchWithAuth(`/notifications/admin/${id}/read`, { method: 'PUT' });
            setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            toast({ title: "Error", description: "Failed to mark as read", variant: "destructive" });
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await fetchWithAuth('/notifications/admin/read-all', { method: 'PUT' });
            setNotifications(notifications.map(n => ({ ...n, isRead: true })));
            toast({ title: "Done", description: "All notifications marked as read" });
        } catch (error) {
            toast({ title: "Error", description: "Failed", variant: "destructive" });
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

    const getChannelBadge = (channel?: string) => {
        if (!channel || channel === 'app') {
            return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">App</span>;
        }
        if (channel === 'sms') {
            return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-green-50 text-green-600">SMS</span>;
        }
        return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-600">Both</span>;
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <AdminLayout>
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Platform Notifications</h1>
                    <p className="text-slate-500">Send alerts to users via app notifications or SMS.</p>
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={handleMarkAllRead}
                        className="flex items-center gap-1.5 text-xs font-bold text-[#025864] hover:underline"
                    >
                        <Eye className="w-3.5 h-3.5" /> Mark all as read ({unreadCount})
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Send Notification Form */}
                <div className="lg:col-span-1 border border-slate-100 bg-white rounded-3xl p-6 shadow-sm h-fit">
                    <div className="flex items-center gap-2 mb-6 text-[#025864]">
                        <Plus className="w-5 h-5" />
                        <h3 className="font-bold">Create Notification</h3>
                    </div>
                    <form onSubmit={handleSend} className="space-y-4">
                        {/* Target */}
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

                        {/* Delivery Channel */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase">Deliver Via</label>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setDeliveryChannel("app")}
                                    className={cn(
                                        "flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all",
                                        deliveryChannel === "app" ? "border-[#025864] bg-[#025864]/5" : "border-slate-100 hover:border-slate-200"
                                    )}
                                >
                                    <Bell className="w-4 h-4 text-blue-500" />
                                    <span className="text-[10px] font-bold">App</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDeliveryChannel("sms")}
                                    className={cn(
                                        "flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all",
                                        deliveryChannel === "sms" ? "border-[#025864] bg-[#025864]/5" : "border-slate-100 hover:border-slate-200"
                                    )}
                                >
                                    <Smartphone className="w-4 h-4 text-green-500" />
                                    <span className="text-[10px] font-bold">SMS</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDeliveryChannel("both")}
                                    className={cn(
                                        "flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all",
                                        deliveryChannel === "both" ? "border-[#025864] bg-[#025864]/5" : "border-slate-100 hover:border-slate-200"
                                    )}
                                >
                                    <Layers className="w-4 h-4 text-purple-500" />
                                    <span className="text-[10px] font-bold">Both</span>
                                </button>
                            </div>
                        </div>

                        {/* Title */}
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

                        {/* Action Link */}
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
                                    onClick={() => { setActionUrl(preset.url); setActionLabel(preset.btnLabel); }}
                                    className="text-[10px] font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>

                        {/* Type */}
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

                        {/* Message */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase">Message</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Enter notification message..."
                                rows={4}
                                className="w-full px-4 py-3 rounded-xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-[#025864] text-sm bg-slate-50 resize-none"
                                required
                            />
                        </div>

                        <button
                            disabled={sending}
                            className="w-full py-3 bg-[#025864] text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-[#014751] transition-all disabled:opacity-50"
                        >
                            {sending ? "Sending..." : <><Send className="w-4 h-4" /> Send via {deliveryChannel === 'both' ? 'App + SMS' : deliveryChannel.toUpperCase()}</>}
                        </button>
                    </form>
                </div>

                {/* History */}
                <div className="lg:col-span-2 border border-slate-100 bg-white rounded-3xl overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                        <h3 className="font-bold text-slate-900">Notification History</h3>
                        <div className="flex items-center gap-3">
                            {unreadCount > 0 && (
                                <span className="text-[10px] font-bold px-2 py-1 bg-red-50 text-red-600 rounded-full">
                                    {unreadCount} unread
                                </span>
                            )}
                            <Bell className="w-5 h-5 text-slate-400" />
                        </div>
                    </div>
                    {loading ? (
                        <div className="p-12 text-center text-slate-500">Loading history...</div>
                    ) : notifications.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">No notifications found.</div>
                    ) : (
                        <div className="divide-y divide-slate-50">
                            {notifications.map((n) => (
                                <div
                                    key={n.id}
                                    className={cn(
                                        "p-6 flex gap-4 hover:bg-slate-50/50 transition-colors",
                                        !n.isRead && "bg-blue-50/30"
                                    )}
                                >
                                    <div className="shrink-0 mt-1">
                                        {getTypeIcon(n.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className={cn("text-sm", !n.isRead ? "font-bold text-slate-900" : "font-medium text-slate-700")}>
                                                    {n.title}
                                                </h4>
                                                {!n.isRead && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
                                                {getChannelBadge(n.deliveryChannel)}
                                            </div>
                                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(n.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 mb-2">Target: {(n as any).email || "Platform Broadcast"}</p>
                                        <p className="text-sm text-slate-600 leading-relaxed mb-3">{n.message}</p>
                                        {(n as any).actionUrl && (
                                            <div className="mb-3">
                                                <button
                                                    onClick={() => navigate((n as any).actionUrl)}
                                                    className="px-3 py-1.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-200 hover:bg-slate-200 transition-colors flex items-center gap-1.5 w-fit"
                                                >
                                                    <ExternalLink className="w-3 h-3" />
                                                    {(n as any).actionLabel || 'View Action'}
                                                </button>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-3">
                                            {!n.isRead && (
                                                <button
                                                    onClick={() => handleMarkRead(n.id)}
                                                    className="text-xs font-bold text-[#025864] hover:underline flex items-center gap-1"
                                                >
                                                    <Eye className="w-3 h-3" /> Mark as read
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(n.id)}
                                                className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1"
                                            >
                                                <Trash2 className="w-3 h-3" /> Delete
                                            </button>
                                        </div>
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
