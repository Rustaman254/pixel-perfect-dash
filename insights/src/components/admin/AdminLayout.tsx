import { useState, ReactNode, useEffect } from "react";
import {
  LayoutDashboard, Users, Building2, BarChart3,
  Settings, LogOut, ShieldCheck, Menu, X, CreditCard, Bell, Ticket, AppWindow
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAppContext } from "@/contexts/AppContext";
import { fetchWithAuth } from "@/lib/api";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink, Clock as ClockIcon } from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [open, setOpen] = useState(false);
  const { userProfile, logout } = useAppContext();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchNotifications = async () => {
    try {
      const data = await fetchWithAuth('/notifications/admin/all');
      setNotifications(data.slice(0, 5));
      setUnreadCount(data.filter((n: any) => !n.isRead).length);
    } catch (e) {
      console.error("Admin notifications fetch failed", e);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await fetchWithAuth(`/notifications/${id}/read`, { method: 'PUT' });
      fetchNotifications();
    } catch (e) {
      console.error("Mark read failed", e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const menuItems = [
    { icon: LayoutDashboard, label: "Platform Overview", to: "/admin" },
    { icon: Users, label: "User Management", to: "/admin/users" },
    { icon: Building2, label: "Company Management", to: "/admin/companies" },
    { icon: ShieldCheck, label: "API Key Management", to: "/admin/api-keys" },
    { icon: BarChart3, label: "Revenue & Stats", to: "/admin/revenue" },
    { icon: CreditCard, label: "Global Payouts", to: "/admin/payouts" },
    { icon: Ticket, label: "Referral Codes", to: "/admin/referrals" },
    { icon: AppWindow, label: "App Management", to: "http://localhost:5173/admin/apps" },
    { icon: ShieldCheck, label: "Support Tickets", to: "/admin/support" },
    { icon: Settings, label: "System Settings", to: "/admin/settings" },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Mobile Trigger */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-slate-200"
      >
        <Menu className="w-5 h-5 text-slate-600" />
      </button>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-[#012a30] text-white transition-transform duration-300 md:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center gap-2 mb-10">
            <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center text-white font-bold">R</div>
            <span className="text-xl font-bold">Admin Panel</span>
            <button onClick={() => setOpen(false)} className="md:hidden ml-auto">
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 space-y-1">
            {menuItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all",
                  isActive ? "bg-white/10 text-white font-bold" : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
                end={item.to === "/admin"}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-white/10">
            <div className="flex items-center gap-3 px-4 py-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{userProfile?.email || "Admin"}</p>
                <p className="text-[10px] text-red-400 uppercase tracking-widest font-bold">Super Admin</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 flex flex-col">
        {/* Admin Top Header */}
        <header className="h-14 bg-white border-b border-border px-4 md:px-8 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-lg hover:bg-slate-50 transition-colors relative"
              >
                <Bell className="w-5 h-5 text-slate-600" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-[55]" onClick={() => setShowNotifications(false)} />
                  <div className="absolute left-0 mt-2 w-80 bg-white border border-slate-200 shadow-xl rounded-2xl z-[60] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="font-bold text-sm text-slate-900">Platform Alerts</h3>
                      {unreadCount > 0 && (
                        <span className="text-[10px] font-bold text-white bg-red-500 px-2 py-0.5 rounded-full">
                          {unreadCount} New
                        </span>
                      )}
                    </div>
                    <div className="max-h-[350px] overflow-y-auto">
                      {notifications.length > 0 ? (
                        <div className="divide-y divide-slate-50">
                          {notifications.map((n) => (
                            <div
                              key={n.id}
                              className={cn(
                                "p-4 hover:bg-slate-50 transition-all cursor-pointer group",
                                !n.isRead && "bg-blue-50/40"
                              )}
                              onClick={() => {
                                if (!n.isRead) handleMarkAsRead(n.id);
                                setShowNotifications(false);
                                if (n.actionUrl && n.actionUrl.startsWith('/')) {
                                   navigate(n.actionUrl);
                                } else {
                                   navigate('/admin/notifications');
                                }
                              }}
                            >
                              <div className="flex gap-3">
                                <div className={cn(
                                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm",
                                  n.type === 'success' ? "bg-emerald-100 text-emerald-600" :
                                    n.type === 'warning' ? "bg-amber-100 text-amber-600" :
                                      n.type === 'alert' ? "bg-red-100 text-red-600" :
                                        "bg-blue-100 text-blue-600"
                                )}>
                                  <Bell className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={cn("text-xs font-bold truncate", !n.isRead ? "text-slate-900" : "text-slate-500")}>
                                    {n.title}
                                  </p>
                                  <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">
                                    {n.message}
                                  </p>
                                  
                                  {n.actionUrl && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (!n.isRead) handleMarkAsRead(n.id);
                                        setShowNotifications(false);
                                        navigate(n.actionUrl);
                                      }}
                                      className="mt-2 w-full py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-lg hover:bg-black transition-colors flex items-center justify-center gap-1.5"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                      {n.actionLabel || 'View Details'}
                                    </button>
                                  )}

                                  <div className="flex items-center gap-2 mt-2">
                                    <ClockIcon className="w-3 h-3 text-slate-300" />
                                    <span className="text-[9px] font-medium text-slate-400">
                                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-12 flex flex-col items-center justify-center text-center px-6">
                          <Bell className="w-8 h-8 text-slate-100 mb-2" />
                          <p className="text-xs font-bold text-slate-900">Clean Slate</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">No recent alerts found.</p>
                        </div>
                      )}
                    </div>
                    <NavLink
                      to="/admin/notifications"
                      onClick={() => setShowNotifications(false)}
                      className="block py-3 text-center text-[10px] font-bold text-blue-600 hover:bg-slate-50 transition-colors border-t border-slate-100 uppercase tracking-widest"
                    >
                      View All Alerts
                    </NavLink>
                  </div>
                </>
              )}
            </div>
            <h2 className="text-sm font-semibold text-slate-700 hidden sm:block">Dashboard Control Panel</h2>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-right text-right">
              <span className="text-[11px] font-bold text-slate-900 leading-tight">{userProfile?.fullName || "Administrator"}</span>
              <span className="text-[9px] text-red-500 uppercase font-black tracking-tighter">System Access Level: High</span>
            </div>
          </div>
        </header>

        <main className="p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
