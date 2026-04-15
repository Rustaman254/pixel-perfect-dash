import { useState, useEffect } from "react";
import {
  LayoutDashboard, Link2, ArrowLeftRight, CreditCard,
  BarChart3, Globe, Wallet, Settings, HelpCircle,
  ChevronDown, X, Users, LogOut, TerminalSquare, Plus, Send, Lock,
  Home, MoreHorizontal, ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NavLink, useNavigate } from "react-router-dom";
import { useAppContext } from "@/contexts/AppContext";
import { useToast } from "@/hooks/use-toast";
import Logo from "../Logo";

const generalItems = [
  { icon: LayoutDashboard, label: "Overview", to: "/", featureKey: null },
  { icon: Link2, label: "Payment Links", to: "/payment-links", featureKey: "payment_links" },
  { icon: ArrowLeftRight, label: "Orders", to: "/orders", featureKey: "orders" },
  { icon: Send, label: "Transfers", to: "/transfers", featureKey: "transfers" },
  { icon: Wallet, label: "Payouts", to: "/payouts", featureKey: "payouts" },
];

const manageItems = [
  { icon: BarChart3, label: "Statistics", to: "/statistics", featureKey: "analytics" },
  { icon: CreditCard, label: "Payment Methods", to: "/payment-methods", featureKey: "payment_methods" },
  { icon: Globe, label: "Currencies", to: "/currencies", featureKey: "currencies" },
  { icon: Users, label: "Customers", to: "/customers", featureKey: "customers" },
];

const bottomItems = [
  { icon: TerminalSquare, label: "Developer Docs", to: "/developer-docs" },
  { icon: Settings, label: "Settings", to: "/settings" },
  { icon: HelpCircle, label: "Help Center", to: "/help-center" },
];

const mobileBottomItems = [
  { icon: Home, label: "Overview", to: "/", featureKey: null },
  { icon: Link2, label: "Payment Links", to: "/payment-links", featureKey: "payment_links" },
  { icon: ArrowLeftRight, label: "Orders", to: "/orders", featureKey: "orders" },
  { icon: BarChart3, label: "Statistics", to: "/statistics", featureKey: "analytics" },
];

const moreMenuItems = [
  { icon: Send, label: "Transfers", to: "/transfers", featureKey: "transfers" },
  { icon: Wallet, label: "Payouts", to: "/payouts", featureKey: "payouts" },
  { icon: CreditCard, label: "Payment Methods", to: "/payment-methods", featureKey: "payment_methods" },
  { icon: Globe, label: "Currencies", to: "/currencies", featureKey: "currencies" },
  { icon: Users, label: "Customers", to: "/customers", featureKey: "customers" },
  { icon: TerminalSquare, label: "Developer Docs", to: "/developer-docs", featureKey: null },
  { icon: Settings, label: "Settings", to: "/settings", featureKey: null },
  { icon: HelpCircle, label: "Help Center", to: "/help-center", featureKey: null },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const Sidebar = ({ open, onClose, collapsed, onToggleCollapse }: SidebarProps) => {
  const { userProfile, logout, isFeatureEnabled } = useAppContext();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const renderNavItem = (item: { icon: any; label: string; to: string; featureKey: string | null }, showLabel = true) => {
    const isDisabled = item.featureKey && !isFeatureEnabled(item.featureKey);
    if (isDisabled) {
      return (
        <div
          key={item.label}
          className={cn(
            "flex items-center w-full rounded-lg text-sm opacity-40 cursor-not-allowed",
            collapsed && !showLabel ? "justify-center px-2 py-2.5" : "justify-between px-3 py-2.5"
          )}
          style={{ color: '#999999' }}
          title={collapsed ? item.label : `${item.label} is disabled`}
        >
          <div className={cn("flex items-center", collapsed && !showLabel ? "" : "gap-3")}>
            <item.icon className="w-4 h-4" />
            {(!collapsed || showLabel) && <span>{item.label}</span>}
          </div>
          {(!collapsed || showLabel) && <Lock className="w-3 h-3" />}
        </div>
      );
    }
    return (
      <NavLink
        key={item.label}
        to={item.to}
        onClick={onClose}
        className={({ isActive }) =>
          cn(
            "flex items-center w-full rounded-lg text-sm transition-colors",
            collapsed && !showLabel ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5",
            isActive ? "font-medium" : "hover:bg-[#ebeef1]"
          )
        }
        style={({ isActive }) => ({
          backgroundColor: isActive ? 'rgba(2, 88, 100, 0.08)' : undefined,
          color: isActive ? '#025864' : '#333333',
        })}
        end={item.to === "/"}
        title={collapsed ? item.label : undefined}
      >
        <item.icon className="w-4 h-4 shrink-0" />
        {(!collapsed || showLabel) && <span>{item.label}</span>}
      </NavLink>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden md:flex flex-col h-screen fixed left-0 top-0 z-50 transition-all duration-300 border-r border-border",
        collapsed ? "w-[68px]" : "w-[240px]"
      )} style={{ backgroundColor: '#f5f7f9' }}>
        {/* Logo */}
        <div className={cn("pt-5 pb-4 flex items-center", collapsed ? "px-3 justify-center" : "px-5 justify-between")}>
          {collapsed ? (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: '#025864' }}>R</div>
          ) : (
            <Logo />
          )}
          <button
            onClick={onToggleCollapse}
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
            {generalItems.map(item => renderNavItem(item))}
          </nav>

          {!collapsed && <p className="text-[11px] font-medium uppercase tracking-wider px-2 mb-2 mt-6" style={{ color: '#999999' }}>Manage</p>}
          {collapsed && <div className="my-3 mx-2 border-t border-slate-200" />}
          <nav className="space-y-0.5">
            {manageItems.map(item => renderNavItem(item))}
          </nav>
        </div>

        {/* Bottom */}
        <div className={cn("pb-4 space-y-0.5 border-t pt-4", collapsed ? "px-2" : "px-4")}>
          {!collapsed && bottomItems.map(item => renderNavItem(item))}
          {collapsed && bottomItems.map(item => renderNavItem(item))}

          {/* User & Sign Out */}
          <div className="pt-2">
            {!collapsed ? (
              <div className="flex items-center justify-between px-3 py-3 border-t border-border group cursor-pointer hover:bg-black/5 rounded-xl transition-colors" onClick={() => setShowWorkspaceModal(true)}>
                <div className="flex items-center gap-3 overflow-hidden">
                  {userProfile?.profilePictureUrl ? (
                    <img src={userProfile.profilePictureUrl} alt={userProfile.businessName} className="w-8 h-8 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0" style={{ backgroundColor: '#025864' }}>
                      {userProfile?.businessName?.substring(0, 2).toUpperCase() || "U"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#333333' }}>{userProfile?.businessName || "User"}</p>
                    <p className="text-[11px] truncate" style={{ color: '#999999' }}>{userProfile?.email || ""}</p>
                  </div>
                </div>
                <ArrowLeftRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
              </div>
            ) : (
              <div className="flex justify-center py-2 border-t border-border">
                {userProfile?.profilePictureUrl ? (
                  <img src={userProfile.profilePictureUrl} alt={userProfile.businessName} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white" style={{ backgroundColor: '#025864' }}>
                    {userProfile?.businessName?.substring(0, 2).toUpperCase() || "U"}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleLogout}
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

          {!collapsed && <p className="text-[10px] px-3 mt-4" style={{ color: '#bbbbbb' }}>© 2025 Sokostack Forms</p>}
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 safe-area-bottom">
        <div className="flex items-center justify-around py-2 px-1">
          {mobileBottomItems.map((item) => {
            const isDisabled = item.featureKey && !isFeatureEnabled(item.featureKey);
            return (
              <NavLink
                key={item.label}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors min-w-[56px]",
                    isDisabled ? "opacity-30 pointer-events-none" : "",
                    isActive ? "text-[#025864]" : "text-slate-400"
                  )
                }
                end={item.to === "/"}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </NavLink>
            );
          })}

          {/* More button */}
          <div className="relative">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors min-w-[56px]",
                showMoreMenu ? "text-[#025864]" : "text-slate-400"
              )}
            >
              {showMoreMenu ? <ChevronUp className="w-5 h-5" /> : <MoreHorizontal className="w-5 h-5" />}
              <span className="text-[10px] font-medium">More</span>
            </button>

            {/* More dropdown going up */}
            {showMoreMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMoreMenu(false)} />
                <div className="absolute bottom-full right-0 mb-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50">
                  <div className="py-2">
                    {moreMenuItems.map((item) => {
                      const isDisabled = item.featureKey && !isFeatureEnabled(item.featureKey);
                      return (
                        <NavLink
                          key={item.label}
                          to={item.to}
                          onClick={() => setShowMoreMenu(false)}
                          className={cn(
                            "flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                            isDisabled ? "opacity-30 pointer-events-none text-slate-400" : "text-slate-700 hover:bg-slate-50"
                          )}
                        >
                          <item.icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </NavLink>
                      );
                    })}
                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        onClick={() => { handleLogout(); setShowMoreMenu(false); }}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors w-full"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile overlay for sidebar (kept for backward compat with open prop) */}
      {open && (
        <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={onClose} />
      )}

      {/* Workspace Switcher Modal */}
      {showWorkspaceModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowWorkspaceModal(false) }}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden p-6 relative">
            <button onClick={() => setShowWorkspaceModal(false)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-lg text-slate-800 mb-4">Switch Workspace</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#025864]/5 border-2 border-[#025864]">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ backgroundColor: '#025864' }}>
                  {userProfile?.businessName?.substring(0, 2).toUpperCase() || "U"}
                </div>
                <div>
                  <h4 className="font-medium text-slate-900">{userProfile?.businessName || "Your Business"}</h4>
                  <p className="text-xs text-slate-500">Current Workspace</p>
                </div>
              </div>

              <button
                onClick={() => {
                  toast({ title: "Coming Soon", description: "Creating a new business will be available in the next update." });
                  setShowWorkspaceModal(false);
                }}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all text-sm font-medium text-slate-600 mt-2"
              >
                <Plus className="w-4 h-4" />
                Create New Business
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
