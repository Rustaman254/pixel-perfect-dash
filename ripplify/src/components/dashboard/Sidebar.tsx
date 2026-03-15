import { useState, useEffect } from "react";
import {
  LayoutDashboard, Link2, ArrowLeftRight, CreditCard,
  BarChart3, Globe, Wallet, Settings, HelpCircle,
  ChevronDown, X, Users, LogOut, TerminalSquare, Plus, Bell
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NavLink, useNavigate } from "react-router-dom";
import { useAppContext } from "@/contexts/AppContext";
import { useToast } from "@/hooks/use-toast";
import { fetchWithAuth } from "@/lib/api";
import Logo from "../Logo";

const generalItems = [
  { icon: LayoutDashboard, label: "Overview", to: "/" },
  { icon: Link2, label: "Payment Links", to: "/payment-links" },
  { icon: ArrowLeftRight, label: "Orders", to: "/orders" },
  { icon: CreditCard, label: "Payment Methods", to: "/payment-methods" },
  { icon: Globe, label: "Currencies", to: "/currencies" },
];

const manageItems = [
  { icon: BarChart3, label: "Statistics", to: "/statistics" },
  { icon: Wallet, label: "Payouts", to: "/payouts" },
  { icon: Users, label: "Customers", to: "/customers" },
];

const externalLinks = [
  { icon: BarChart3, label: "Insights", href: "http://localhost:5175" },
];

const bottomItems = [
  { icon: TerminalSquare, label: "Developer Docs", to: "/developer-docs" },
  { icon: Settings, label: "Settings", to: "/settings" },
  { icon: HelpCircle, label: "Help Center", to: "/help-center" },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

const Sidebar = ({ open, onClose }: SidebarProps) => {
  const { userProfile, logout } = useAppContext();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  useEffect(() => {
    // Other effects if any
  }, []);

  const handleWorkspaceSwitch = () => {
    toast({
      title: "Workspace Switcher",
      description: "Workspace switching functionality will be available soon.",
    });
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={onClose} />
      )}
      <aside className={cn(
        "w-[240px] flex flex-col h-screen fixed left-0 top-0 z-50 transition-transform duration-300 border-r border-border",
        "md:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )} style={{ backgroundColor: '#f5f7f9' }}>
        {/* Logo */}
        <div className="px-5 pt-5 pb-6">
          <Logo />
          <button
            onClick={handleWorkspaceSwitch}
            className="ml-auto hover:opacity-70 hidden md:block"
            style={{ color: '#333333' }}
          >
            <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
          </button>
          <button className="ml-auto hover:opacity-70 md:hidden" style={{ color: '#333333' }} onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* General */}
        <div className="px-4 flex-1 overflow-y-auto">
          <p className="text-[11px] font-medium uppercase tracking-wider px-2 mb-2" style={{ color: '#999999' }}>General</p>
          <nav className="space-y-0.5">
            {generalItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    "flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm transition-colors",
                    isActive
                      ? "font-medium"
                      : "hover:bg-[#ebeef1]"
                  )
                }
                style={({ isActive }) => ({
                  backgroundColor: isActive ? 'rgba(2, 88, 100, 0.08)' : undefined,
                  color: isActive ? '#025864' : '#333333',
                })}
                end={item.to === "/"}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
              </NavLink>
            ))}
          </nav>

          <p className="text-[11px] font-medium uppercase tracking-wider px-2 mb-2 mt-6" style={{ color: '#999999' }}>Manage</p>
          <nav className="space-y-0.5">
            {manageItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-colors",
                    isActive
                      ? "font-medium"
                      : "hover:bg-[#ebeef1]"
                  )
                }
                style={({ isActive }) => ({
                  backgroundColor: isActive ? 'rgba(2, 88, 100, 0.08)' : undefined,
                  color: isActive ? '#025864' : '#333333',
                })}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <p className="text-[11px] font-medium uppercase tracking-wider px-2 mb-2 mt-6" style={{ color: '#999999' }}>Products</p>
          <nav className="space-y-0.5">
            {externalLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-[#ebeef1]"
                style={{ color: '#333333' }}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </a>
            ))}
          </nav>
        </div>

        {/* Bottom */}
        <div className="px-4 pb-4 space-y-0.5 border-t pt-4">
          {bottomItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-colors",
                  isActive
                    ? "font-medium"
                    : "hover:bg-[#ebeef1]"
                )
              }
              style={({ isActive }) => ({
                backgroundColor: isActive ? 'rgba(2, 88, 100, 0.08)' : undefined,
                color: isActive ? '#025864' : '#333333',
              })}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          ))}

          {/* User & Sign Out */}
          <div className="pt-2">
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
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 mt-1 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>

          <p className="text-[10px] px-3 mt-4" style={{ color: '#bbbbbb' }}>© 2025 Ripplify Inc.</p>
        </div>
      </aside>

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
