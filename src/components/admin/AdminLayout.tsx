import { useState, ReactNode, useEffect } from "react";
import {
  LayoutDashboard, Users, Building2, BarChart3,
  Settings, LogOut, ShieldCheck, Menu, X, CreditCard, Bell, Ticket
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAppContext } from "@/contexts/AppContext";
import { fetchWithAuth } from "@/lib/api";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [open, setOpen] = useState(false);
  const { userProfile, logout } = useAppContext();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    try {
      const data = await fetchWithAuth('/notifications/admin/all');
      setUnreadCount(data.filter((n: any) => !n.isRead).length);
    } catch (e) {
      console.error("Admin unread fetch failed", e);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
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
            <div className="relative group">
              <button 
                onClick={() => navigate('/admin/notifications')}
                className="p-2 rounded-lg hover:bg-slate-50 transition-colors relative"
              >
                <Bell className="w-5 h-5 text-slate-600" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              <div className="absolute left-0 top-full mt-1 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Platform Notifications
              </div>
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
