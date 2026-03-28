import { useState, useEffect, ReactNode } from "react";
import {
  LayoutDashboard, Users, Building2, BarChart3,
  Settings, LogOut, ShieldCheck, Menu, X, CreditCard, Bell, Ticket, AppWindow, Shield,
  ChevronDown, Key, LifeBuoy, Wallet, Globe, Flag, Receipt,
  ArrowLeftRight, LayoutGrid, ExternalLink, Eye, ShoppingCart, Activity
} from "lucide-react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAppContext } from "@/contexts/AppContext";
import { useProjectContext, PROJECTS, ProjectId } from "@/contexts/ProjectContext";
import { fetchWithAuth, publicFetch, cn, PRODUCTS } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import Logo from "./Logo";

interface NavGroup {
  label: string;
  icon: React.ElementType;
  items: { icon: React.ElementType; label: string; to: string }[];
  projects?: ProjectId[];
}

interface Product {
  id: number;
  name: string;
  url: string;
  icon: string;
}

// Ripplify-specific nav
const ripplifyNavGroups: NavGroup[] = [
  {
    label: "Overview",
    icon: LayoutDashboard,
    items: [
      { icon: LayoutDashboard, label: "Dashboard", to: "/" },
      { icon: BarChart3, label: "Analytics", to: "/analytics" },
    ],
    projects: ["ripplify"],
  },
  {
    label: "Users & Access",
    icon: Users,
    items: [
      { icon: Users, label: "Users", to: "/users" },
      { icon: Building2, label: "Companies", to: "/companies" },
      { icon: Shield, label: "Roles & Permissions", to: "/roles" },
    ],
    projects: ["ripplify"],
  },
  {
    label: "Payments",
    icon: CreditCard,
    items: [
      { icon: Receipt, label: "Transactions", to: "/transactions" },
      { icon: Wallet, label: "Payouts", to: "/payouts" },
      { icon: Key, label: "API Keys", to: "/api-keys" },
      { icon: Ticket, label: "Referral Codes", to: "/referrals" },
    ],
    projects: ["ripplify"],
  },
  {
    label: "System",
    icon: Settings,
    items: [
      { icon: Settings, label: "Settings", to: "/settings" },
      { icon: Flag, label: "Feature Flags", to: "/features" },
      { icon: AppWindow, label: "Apps", to: "/apps" },
      { icon: Globe, label: "Currencies", to: "/currencies" },
    ],
    projects: ["ripplify"],
  },
  {
    label: "Support",
    icon: LifeBuoy,
    items: [
      { icon: LifeBuoy, label: "Tickets", to: "/support" },
      { icon: Bell, label: "Notifications", to: "/notifications" },
    ],
    projects: ["ripplify"],
  },
];

// Watchtower-specific nav
const watchtowerNavGroups: NavGroup[] = [
  {
    label: "Overview",
    icon: Eye,
    items: [
      { icon: Eye, label: "Dashboard", to: "/watchtower" },
      { icon: BarChart3, label: "Analytics", to: "/watchtower" },
    ],
    projects: ["watchtower"],
  },
];

// Shopalize-specific nav
const shopalizeNavGroups: NavGroup[] = [
  {
    label: "Overview",
    icon: ShoppingCart,
    items: [
      { icon: ShoppingCart, label: "Dashboard", to: "/shopalize" },
      { icon: BarChart3, label: "Analytics", to: "/shopalize" },
    ],
    projects: ["shopalize"],
  },
];

const projectNavMap: Record<ProjectId, NavGroup[]> = {
  ripplify: ripplifyNavGroups,
  watchtower: watchtowerNavGroups,
  shopalize: shopalizeNavGroups,
};

const projectIcons: Record<string, React.ElementType> = {
  ripplify: LayoutGrid,
  shopalize: ShoppingCart,
  watchtower: Activity,
};

const projectRoutes: Record<ProjectId, string> = {
  ripplify: "/",
  watchtower: "/watchtower",
  shopalize: "/shopalize",
};

const projectLinks = [
  { name: "Ripplify", id: "ripplify" as ProjectId, icon: LayoutGrid, color: "bg-emerald-500" },
  { name: "Shopalize", id: "shopalize" as ProjectId, icon: ShoppingCart, color: "bg-blue-500" },
  { name: "Watchtower", id: "watchtower" as ProjectId, icon: Activity, color: "bg-purple-500" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [showProjectSwitcher, setShowProjectSwitcher] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const { userProfile, logout } = useAppContext();
  const { currentProject, setProject } = useProjectContext();
  const navigate = useNavigate();
  const location = useLocation();

  const navGroups = projectNavMap[currentProject.id] || ripplifyNavGroups;

  useEffect(() => {
    for (const group of navGroups) {
      if (group.items.some((item) => location.pathname === item.to || (item.to !== "/" && location.pathname.startsWith(item.to)))) {
        setExpandedGroup(group.label);
        break;
      }
    }
  }, [location.pathname, currentProject.id]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await fetchWithAuth("/admin/notifications");
        setNotifications(data.slice(0, 5));
        setUnreadCount(data.filter((n: any) => !n.isRead).length);
      } catch { /* ignore */ }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Mobile hamburger */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-slate-200"
      >
        <Menu className="w-5 h-5 text-slate-600" />
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-[#012a30] text-white flex flex-col transition-transform duration-300 md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo + Project Switcher */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-3">
            <Logo text="Admin" textColor="#ffffff" />
            <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 hover:bg-white/10 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Project Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowProjectSwitcher(!showProjectSwitcher)}
              className="w-full flex items-center justify-between px-3 py-2 bg-white/10 hover:bg-white/15 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className={cn("w-6 h-6 rounded-md flex items-center justify-center", currentProject.bgColor + "/20")}>
                  {(() => { const Icon = projectIcons[currentProject.id]; return <Icon className="w-3.5 h-3.5 text-white" />; })()}
                </div>
                <span className="text-sm font-medium">{currentProject.name}</span>
              </div>
              <ChevronDown className={cn("w-4 h-4 transition-transform", showProjectSwitcher && "rotate-180")} />
            </button>

            {showProjectSwitcher && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowProjectSwitcher(false)} />
                <div className="absolute left-0 right-0 top-full mt-1 bg-[#013a42] rounded-xl border border-white/10 shadow-2xl z-50 overflow-hidden">
                  <div className="p-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1.5">Switch Project</p>
                    {projectLinks.map((project) => (
                      <button
                        key={project.id}
                        onClick={() => {
                          setProject(project.id);
                          setShowProjectSwitcher(false);
                          navigate(projectRoutes[project.id]);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                          currentProject.id === project.id ? "bg-white/15" : "hover:bg-white/10"
                        )}
                      >
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white", project.color)}>
                          <project.icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium text-white">{project.name}</p>
                          <p className="text-[10px] text-slate-400">
                            {currentProject.id === project.id ? "Currently viewing" : "Switch to this project"}
                          </p>
                        </div>
                        {currentProject.id === project.id && (
                          <div className="w-2 h-2 rounded-full bg-emerald-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navGroups.map((group) => (
            <div key={group.label}>
              <button
                onClick={() => setExpandedGroup(expandedGroup === group.label ? null : group.label)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                  expandedGroup === group.label
                    ? "text-white bg-white/10"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <group.icon className="w-4 h-4" />
                  {group.label}
                </div>
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", expandedGroup === group.label && "rotate-180")} />
              </button>
              {expandedGroup === group.label && (
                <div className="mt-1 ml-3 space-y-0.5">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all",
                          isActive
                            ? "bg-white/15 text-white font-semibold"
                            : "text-slate-400 hover:text-white hover:bg-white/5"
                        )
                      }
                      end={item.to === "/"}
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

        {/* User & Logout */}
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

      {/* Main content */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Top header */}
        <header className="h-14 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-slate-700 hidden sm:block">
              {currentProject.name} Control Panel
            </h2>
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
                    {unreadCount > 9 ? "9+" : unreadCount}
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
                        <span className="text-[10px] font-bold text-white bg-red-500 px-2 py-0.5 rounded-full">{unreadCount} New</span>
                      )}
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {notifications.length > 0 ? (
                        <div className="divide-y divide-slate-50">
                          {notifications.map((n: any) => (
                            <div key={n.id} className={cn("p-3 hover:bg-slate-50 transition-all cursor-pointer", !n.isRead && "bg-blue-50/40")}>
                              <p className={cn("text-xs font-bold truncate", !n.isRead ? "text-slate-900" : "text-slate-500")}>{n.title}</p>
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
                      to="/notifications"
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
              <span className="text-xs font-bold text-slate-700">{userProfile?.fullName?.split(" ")[0] || "Admin"}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
