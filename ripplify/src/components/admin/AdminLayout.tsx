import { useState, ReactNode, useEffect } from "react";
import {
  LayoutDashboard, Users, Building2, BarChart3,
  Settings, LogOut, ShieldCheck, Menu, X, CreditCard, Bell, Ticket, AppWindow, Shield,
  ChevronDown, Key, LifeBuoy, Wallet, Globe
} from "lucide-react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAppContext } from "@/contexts/AppContext";
import { fetchWithAuth } from "@/lib/api";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink, Clock as ClockIcon } from "lucide-react";
import Logo from "../Logo";

interface AdminLayoutProps {
  children: ReactNode;
}

interface NavGroup {
  label: string;
  icon: React.ElementType;
  items: { icon: React.ElementType; label: string; to: string }[];
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [open, setOpen] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const { userProfile, logout } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const navGroups: NavGroup[] = [
    {
      label: "Overview",
      icon: LayoutDashboard,
      items: [
        { icon: LayoutDashboard, label: "Dashboard", to: "/admin" },
        { icon: BarChart3, label: "Analytics", to: "/admin/analytics" },
      ]
    },
    {
      label: "Users & Access",
      icon: Users,
      items: [
        { icon: Users, label: "Users", to: "/admin/users" },
        { icon: Building2, label: "Companies", to: "/admin/companies" },
        { icon: Shield, label: "Roles & Permissions", to: "/admin/roles" },
      ]
    },
    {
      label: "Payments",
      icon: CreditCard,
      items: [
        { icon: Wallet, label: "Payouts", to: "/admin/payouts" },
        { icon: Key, label: "API Keys", to: "/admin/api-keys" },
        { icon: Ticket, label: "Referral Codes", to: "/admin/referrals" },
      ]
    },
    {
      label: "System",
      icon: Settings,
      items: [
        { icon: Settings, label: "Settings", to: "/admin/settings" },
        { icon: AppWindow, label: "Apps", to: "/admin/apps" },
        { icon: Globe, label: "Currencies", to: "/admin/currencies" },
      ]
    },
    {
      label: "Support",
      icon: LifeBuoy,
      items: [
        { icon: LifeBuoy, label: "Tickets", to: "/admin/support" },
        { icon: Bell, label: "Notifications", to: "/admin/notifications" },
      ]
    },
  ];

  // Auto-expand group based on current route
  useEffect(() => {
    for (const group of navGroups) {
      if (group.items.some(item => location.pathname === item.to || 
          (item.to !== "/admin" && location.pathname.startsWith(item.to)))) {
        setExpandedGroup(group.label);
        break;
      }
    }
  }, [location.pathname]);

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

  const toggleGroup = (label: string) => {
    setExpandedGroup(expandedGroup === label ? null : label);
  };

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
        "fixed inset-y-0 left-0 z-50 w-64 bg-[#012a30] text-white transition-transform duration-300 md:translate-x-0 flex flex-col",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center justify-between">
            <Logo text="Admin" textColor="#ffffff" />
            <button onClick={() => setOpen(false)} className="md:hidden p-1 hover:bg-white/10 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navGroups.map((group) => (
            <div key={group.label}>
              <button
                onClick={() => toggleGroup(group.label)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                  expandedGroup === group.label ? "text-white bg-white/10" : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <group.icon className="w-4 h-4" />
                  {group.label}
                </div>
                <ChevronDown className={cn(
                  "w-3.5 h-3.5 transition-transform",
                  expandedGroup === group.label && "rotate-180"
                )} />
              </button>
              
              {expandedGroup === group.label && (
                <div className="mt-1 ml-3 space-y-0.5 animate-in slide-in-from-top-2 duration-200">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setOpen(false)}
                      className={({ isActive }) => cn(
                        "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all",
                        isActive 
                          ? "bg-white/15 text-white font-semibold" 
                          : "text-slate-400 hover:text-white hover:bg-white/5"
                      )}
                      end={item.to === "/admin"}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-2 py-2 mb-3">
            <div className="w-9 h-9 rounded-full bg-red-500/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{userProfile?.email || "Admin"}</p>
              <p className="text-[10px] text-red-400 uppercase tracking-widest font-bold">Super Admin</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Admin Top Header */}
        <header className="h-14 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-slate-700 hidden sm:block">Dashboard Control Panel</h2>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-lg hover:bg-slate-50 transition-colors relative"
              >
                <Bell className="w-5 h-5 text-slate-500" />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-[55]" onClick={() => setShowNotifications(false)} />
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 shadow-xl rounded-2xl z-[60] overflow-hidden">
                    <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="font-bold text-sm text-slate-900">Alerts</h3>
                      {unreadCount > 0 && (
                        <span className="text-[10px] font-bold text-white bg-red-500 px-2 py-0.5 rounded-full">
                          {unreadCount} New
                        </span>
                      )}
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {notifications.length > 0 ? (
                        <div className="divide-y divide-slate-50">
                          {notifications.map((n) => (
                            <div
                              key={n.id}
                              className={cn(
                                "p-3 hover:bg-slate-50 transition-all cursor-pointer",
                                !n.isRead && "bg-blue-50/40"
                              )}
                              onClick={() => {
                                if (!n.isRead) handleMarkAsRead(n.id);
                                setShowNotifications(false);
                                if (n.actionUrl && n.actionUrl.startsWith('/')) navigate(n.actionUrl);
                              }}
                            >
                              <p className={cn("text-xs font-bold truncate", !n.isRead ? "text-slate-900" : "text-slate-500")}>
                                {n.title}
                              </p>
                              <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{n.message}</p>
                              <span className="text-[9px] text-slate-400 mt-1 block">
                                {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-8 text-center">
                          <p className="text-xs text-slate-400">No alerts</p>
                        </div>
                      )}
                    </div>
                    <NavLink
                      to="/admin/notifications"
                      onClick={() => setShowNotifications(false)}
                      className="block py-2.5 text-center text-[10px] font-bold text-blue-600 hover:bg-slate-50 transition-colors border-t border-slate-100 uppercase tracking-widest"
                    >
                      View All
                    </NavLink>
                  </div>
                </>
              )}
            </div>

            {/* Admin Badge */}
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-red-600" />
              </div>
              <span className="text-xs font-bold text-slate-700">{userProfile?.fullName?.split(' ')[0] || "Admin"}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
