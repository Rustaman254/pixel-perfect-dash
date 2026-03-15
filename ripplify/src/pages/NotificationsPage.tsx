import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Bell, CheckCircle2, Info, AlertTriangle, Trash2, Check, Clock } from "lucide-react";
import { fetchWithAuth } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import usePageTitle from "@/hooks/usePageTitle";
import { cn } from "@/lib/utils";

interface Notification {
    id: number;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'alert';
    isRead: boolean;
    createdAt: string;
}

const NotificationsPage = () => {
    usePageTitle("Notifications");
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const loadNotifications = async () => {
        try {
            const data = await fetchWithAuth('/notifications');
            setNotifications(data);
        } catch (error: any) {
            console.error("Failed to load notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadNotifications();
        // Poll for new notifications every minute
        const interval = setInterval(loadNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async (id: number) => {
        try {
            await fetchWithAuth(`/notifications/${id}/read`, { method: 'PUT' });
            setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            toast({ title: "Error", description: "Failed to mark as read", variant: "destructive" });
        }
    };

    const markAllRead = async () => {
        try {
            await fetchWithAuth('/notifications/read-all', { method: 'PUT' });
            setNotifications(notifications.map(n => ({ ...n, isRead: true })));
            toast({ title: "Success", description: "All notifications marked as read" });
        } catch (error) {
            toast({ title: "Error", description: "Failed to mark all as read", variant: "destructive" });
        }
    };

    const deleteNotification = async (id: number) => {
        try {
            await fetchWithAuth(`/notifications/${id}`, { method: 'DELETE' });
            setNotifications(notifications.filter(n => n.id !== id));
            toast({ title: "Success", description: "Notification deleted" });
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete notification", variant: "destructive" });
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
            case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
            case 'alert': return <AlertTriangle className="w-5 h-5 text-red-500" />;
            default: return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    return (
        <DashboardLayout>
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
                    <p className="text-slate-500">Stay updated on your account activity and platform news.</p>
                </div>
                {notifications.some(n => !n.isRead) && (
                    <button 
                        onClick={markAllRead}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-colors"
                    >
                        <Check className="w-4 h-4" />
                        Mark all as read
                    </button>
                )}
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-slate-500">Loading notifications...</div>
                ) : notifications.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Bell className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">All caught up!</h3>
                        <p className="text-slate-500">You don't have any notifications at the moment.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-50">
                        {notifications.map((notification) => (
                            <div 
                                key={notification.id} 
                                className={cn(
                                    "p-6 flex gap-4 transition-colors hover:bg-slate-50/50",
                                    !notification.isRead && "bg-blue-50/30"
                                )}
                            >
                                <div className="shrink-0 mt-1">
                                    {getTypeIcon(notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className={cn("text-sm font-bold", !notification.isRead ? "text-slate-900" : "text-slate-700")}>
                                            {notification.title}
                                        </h4>
                                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(notification.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                                        {notification.message}
                                    </p>
                                    <div className="flex items-center gap-3">
                                        {!notification.isRead && (
                                            <button 
                                                onClick={() => markAsRead(notification.id)}
                                                className="text-xs font-bold text-[#025864] hover:underline"
                                            >
                                                Mark as read
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => deleteNotification(notification.id)}
                                            className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default NotificationsPage;
