import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, ShoppingBag, Package, Users, BarChart3, Settings, Globe,
  ChevronDown, Search, LogOut, Menu, Bell, ExternalLink, ShoppingCart, HelpCircle,
  Tag, Megaphone, Percent, FileText, Inbox, Server
} from 'lucide-react';
import { cn } from '@/lib/utils';

const generalItems = [
  { icon: LayoutDashboard, label: 'Overview', path: '/dashboard' },
  { icon: Inbox, label: 'Orders', path: '/orders' },
  { icon: Package, label: 'Products', path: '/products' },
  { icon: Users, label: 'Customers', path: '/customers' },
];

const manageItems = [
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  { icon: Megaphone, label: 'Marketing', path: '/marketing' },
  { icon: Percent, label: 'Discounts', path: '/discounts' },
  { icon: Globe, label: 'Online Store', path: '/online-store' },
];

const bottomItems = [
  { icon: Settings, label: 'Settings', path: '/settings' },
  { icon: HelpCircle, label: 'Help Center', path: '/help' },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const renderNavItem = (item: { icon: any; label: string; path: string }) => {
    const active = isActive(item.path);
    return (
      <button
        key={item.label}
        onClick={() => navigate(item.path)}
        className={cn(
          "flex items-center w-full rounded-xl text-sm transition-all duration-200",
          collapsed ? "justify-center px-2 py-3" : "gap-3 px-3 py-3",
          active ? "bg-[#D4F655] text-black font-semibold shadow-md shadow-[#D4F655]/10" : "text-gray-400 hover:text-white hover:bg-white/5 font-medium"
        )}
        title={collapsed ? item.label : undefined}
      >
        <item.icon className={cn("shrink-0 transition-transform", active ? "w-5 h-5" : "w-[18px] h-[18px]")} />
        {!collapsed && <span>{item.label}</span>}
      </button>
    );
  };

  return (
    <div className="flex h-screen bg-[#F8F9FA] overflow-hidden selection:bg-[#D4F655] selection:text-black font-sans">
      {/* Sidebar */}
      <aside className={cn(
        "hidden md:flex flex-col h-screen fixed left-0 top-0 z-50 transition-all duration-300 bg-[#0A0A0A] border-r border-[#1a1a1a]",
        collapsed ? "w-[80px]" : "w-[260px]"
      )}>
        {/* Logo */}
        <div className={cn("pt-6 pb-6 flex items-center", collapsed ? "px-4 justify-center" : "px-6 justify-between")}>
          {collapsed ? (
            <div className="w-10 h-10 rounded-xl bg-[#D4F655] flex items-center justify-center text-black font-bold text-lg shadow-sm">S</div>
          ) : (
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/dashboard')}>
              <div className="w-8 h-8 bg-[#D4F655] rounded-bl-lg rounded-tr-lg flex items-center justify-center relative shadow-sm">
                <ShoppingCart className="w-4 h-4 text-black absolute top-2 left-2" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">Shopalize</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-gray-400"
          >
            <ChevronDown className={cn("w-4 h-4 transition-transform", collapsed ? "rotate-90" : "-rotate-90")} />
          </button>
        </div>

        {/* Navigation Area */}
        <div className={cn("flex-1 overflow-y-auto seamless-scrollbar", collapsed ? "px-3" : "px-5")}>
          {!collapsed && <p className="text-[10px] font-bold uppercase tracking-widest px-3 mb-3 text-gray-500 mt-2">General</p>}
          <nav className="space-y-1">
            {generalItems.map(renderNavItem)}
          </nav>

          {!collapsed && <p className="text-[10px] font-bold uppercase tracking-widest px-3 mb-3 mt-8 text-gray-500">Manage</p>}
          {collapsed && <div className="my-4 mx-3 border-t border-gray-800" />}
          <nav className="space-y-1">
            {manageItems.map(renderNavItem)}
          </nav>
        </div>

        {/* Bottom Connectors */}
        <div className={cn("pb-6 space-y-1 pt-4 mx-5 border-t border-gray-800", collapsed ? "mx-3" : "mx-5")}>
          {bottomItems.map(renderNavItem)}

          {/* User Profile */}
          <div className="pt-4 mt-2">
            {!collapsed ? (
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5 group cursor-pointer hover:bg-white/10 transition-all">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-9 h-9 rounded-full bg-[#D4F655] flex items-center justify-center text-sm font-bold text-black shrink-0">
                    {(userProfile?.fullName || userProfile?.email || 'U').substring(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{userProfile?.businessName || userProfile?.fullName || 'User Account'}</p>
                    <p className="text-[11px] text-gray-400 truncate">{userProfile?.email || 'Admin'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-center mt-2">
                <div className="w-10 h-10 rounded-full bg-[#D4F655] flex items-center justify-center text-sm font-bold text-black cursor-pointer hover:scale-105 transition-transform">
                  {(userProfile?.fullName || userProfile?.email || 'U').substring(0, 1).toUpperCase()}
                </div>
              </div>
            )}

            <button
              onClick={() => { logout(); navigate('/login'); }}
              className={cn(
                "flex items-center w-full mt-3 rounded-xl text-sm text-red-400 hover:bg-red-400/10 font-medium transition-colors",
                collapsed ? "justify-center px-2 py-3" : "gap-3 px-3 py-3"
              )}
              title={collapsed ? "Sign Out" : undefined}
            >
              <LogOut className="w-5 h-5 shrink-0" />
              {!collapsed && <span>Sign Out</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 transition-all duration-300",
        collapsed ? "md:ml-[80px]" : "md:ml-[260px]"
      )}>
        {/* Top Header */}
        <header className="flex items-center justify-between h-20 px-6 md:px-10 bg-white/80 backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors" onClick={() => setCollapsed(!collapsed)}>
              <Menu className="w-5 h-5 text-black" />
            </button>
            <div className="hidden sm:flex items-center gap-3 bg-[#F8F9FA] border border-gray-200 rounded-full px-5 py-2.5 focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search anything..."
                className="bg-transparent border-none outline-none text-sm text-black w-32 md:w-64 placeholder:text-gray-400"
              />
              <span className="text-[10px] uppercase font-bold text-gray-400 bg-white px-2 py-0.5 rounded shadow-sm border border-gray-100 hidden lg:inline">⌘ K</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 rounded-full bg-[#F8F9FA] border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors relative">
              <Bell className="w-5 h-5 text-gray-600" />
              <div className="absolute top-2 right-2.5 w-2 h-2 bg-[#D4F655] rounded-full border-2 border-white" />
            </button>
            <button className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors text-sm font-medium">
              <ExternalLink className="w-4 h-4 text-gray-500" /> View Store
            </button>
            <div className="h-8 w-px bg-gray-200 mx-2 hidden sm:block" />
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold text-black group-hover:text-gray-600 transition-colors">{userProfile?.fullName || 'Shop Admin'}</p>
                <p className="text-[11px] text-gray-500 font-medium">Platform Manager</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#D4F655] flex items-center justify-center text-sm font-bold text-black border-2 border-white shadow-sm">
                {(userProfile?.fullName || 'U').substring(0, 1).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-10 overflow-auto bg-[#F8F9FA]">
          <div className="max-w-7xl mx-auto">
             <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
