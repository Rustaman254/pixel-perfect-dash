import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, ShoppingBag, Package, Users, BarChart3, Settings, Globe,
  ChevronDown, Search, LogOut, Menu, Bell, ExternalLink, ShoppingCart, HelpCircle,
  Tag, Megaphone, Percent, FileText, Inbox
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
          "flex items-center w-full rounded-lg text-sm transition-colors",
          collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5",
          active ? "font-medium" : "hover:bg-[#ebeef1]"
        )}
        style={{
          backgroundColor: active ? 'rgba(124, 58, 237, 0.08)' : undefined,
          color: active ? '#7C3AED' : '#333333',
        }}
        title={collapsed ? item.label : undefined}
      >
        <item.icon className="w-4 h-4 shrink-0" />
        {!collapsed && <span>{item.label}</span>}
      </button>
    );
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Sidebar */}
      <aside className={cn(
        "hidden md:flex flex-col h-screen fixed left-0 top-0 z-50 transition-all duration-300 border-r border-border",
        collapsed ? "w-[68px]" : "w-[240px]"
      )} style={{ backgroundColor: '#f5f7f9' }}>
        {/* Logo */}
        <div className={cn("pt-5 pb-4 flex items-center", collapsed ? "px-3 justify-center" : "px-5 justify-between")}>
          {collapsed ? (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: '#7C3AED' }}>S</div>
          ) : (
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-6 h-6" style={{ color: '#7C3AED' }} />
              <span className="text-lg font-bold" style={{ color: '#333333', fontFamily: 'Rebond Grotesque, sans-serif' }}>Shopalize</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-[#ebeef1] transition-colors"
            style={{ color: '#333333' }}
          >
            <ChevronDown className={cn("w-4 h-4 transition-transform", collapsed ? "rotate-90" : "-rotate-90")} />
          </button>
        </div>

        {/* General */}
        <div className={cn("flex-1 overflow-y-auto", collapsed ? "px-2" : "px-4")}>
          {!collapsed && <p className="text-[11px] font-medium uppercase tracking-wider px-2 mb-2" style={{ color: '#999999' }}>General</p>}
          <nav className="space-y-0.5">
            {generalItems.map(renderNavItem)}
          </nav>

          {!collapsed && <p className="text-[11px] font-medium uppercase tracking-wider px-2 mb-2 mt-6" style={{ color: '#999999' }}>Manage</p>}
          {collapsed && <div className="my-3 mx-2 border-t border-slate-200" />}
          <nav className="space-y-0.5">
            {manageItems.map(renderNavItem)}
          </nav>
        </div>

        {/* Bottom */}
        <div className={cn("pb-4 space-y-0.5 border-t pt-4", collapsed ? "px-2" : "px-4")}>
          {bottomItems.map(renderNavItem)}

          {/* User */}
          <div className="pt-2">
            {!collapsed ? (
              <div className="flex items-center justify-between px-3 py-3 border-t border-border group cursor-pointer hover:bg-black/5 rounded-xl transition-colors">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0" style={{ backgroundColor: '#7C3AED' }}>
                    {(userProfile?.fullName || userProfile?.email || 'U').substring(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#333333' }}>{userProfile?.businessName || userProfile?.fullName || 'User'}</p>
                    <p className="text-[11px] truncate" style={{ color: '#999999' }}>{userProfile?.email || ''}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-center py-2 border-t border-border">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white" style={{ backgroundColor: '#7C3AED' }}>
                  {(userProfile?.fullName || userProfile?.email || 'U').substring(0, 1).toUpperCase()}
                </div>
              </div>
            )}

            <button
              onClick={() => { logout(); navigate('/login'); }}
              className={cn(
                "flex items-center w-full mt-1 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors",
                collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5"
              )}
              title={collapsed ? "Sign Out" : undefined}
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {!collapsed && <span>Sign Out</span>}
            </button>
          </div>

          {!collapsed && <p className="text-[10px] px-3 mt-4" style={{ color: '#bbbbbb' }}>© 2026 Shopalize Inc.</p>}
        </div>
      </aside>

      {/* Main Content */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 transition-all duration-300",
        collapsed ? "md:ml-[68px]" : "md:ml-[240px]"
      )}>
        {/* TopBar */}
        <header className="flex items-center justify-between h-14 px-4 md:px-6 bg-white border-b border-border sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-1.5 rounded-lg hover:bg-muted transition-colors" onClick={() => setCollapsed(!collapsed)}>
              <Menu className="w-5 h-5 text-foreground" />
            </button>
            <div className="hidden sm:flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5 focus-within:ring-1 focus-within:ring-primary/20">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search"
                className="bg-transparent border-none outline-none text-sm text-foreground w-24 lg:w-48 placeholder:text-muted-foreground/60"
              />
              <span className="text-[11px] text-muted-foreground/60 ml-4 hidden lg:inline">⌘ + F</span>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <div className="relative">
              <button className="p-1.5 rounded-lg hover:bg-muted transition-colors relative">
                <Bell className="w-5 h-5 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
            <button className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="View store">
              <ExternalLink className="w-5 h-5 text-muted-foreground hover:text-foreground" />
            </button>
            <div className="flex items-center gap-2 pl-2 border-l border-border ml-2">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-medium text-foreground">{userProfile?.fullName || userProfile?.businessName || 'User'}</p>
                <p className="text-[10px] text-muted-foreground">Seller Account</p>
              </div>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white cursor-pointer" style={{ backgroundColor: '#7C3AED' }}>
                {(userProfile?.fullName || userProfile?.email || 'U').substring(0, 1).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 space-y-4 overflow-auto" style={{ backgroundColor: '#f5f7f9' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
