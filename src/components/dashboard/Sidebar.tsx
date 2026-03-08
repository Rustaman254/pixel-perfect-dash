import {
  LayoutDashboard, Link2, ArrowLeftRight, CreditCard,
  BarChart3, Globe, Wallet, Settings, HelpCircle,
  ChevronDown, X, Users, LogOut, TerminalSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NavLink } from "react-router-dom";
import { useAppContext } from "@/contexts/AppContext";
import { useToast } from "@/hooks/use-toast";

const generalItems = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/" },
  { icon: Link2, label: "Payment Links", to: "/payment-links" },
  { icon: ArrowLeftRight, label: "Orders", to: "/orders" },
  { icon: CreditCard, label: "Payment Methods", to: "/payment-methods" },
  { icon: Globe, label: "Currencies", to: "/currencies" },
];

const manageItems = [
  { icon: BarChart3, label: "Analytics", to: "/analytics" },
  { icon: Wallet, label: "Payouts", to: "/payouts" },
  { icon: Users, label: "Customers", to: "/customers" },
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

  const handleWorkspaceSwitch = () => {
    toast({
      title: "Workspace Switcher",
      description: "Workspace switching functionality will be available soon.",
    });
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
        <div className="flex items-center gap-2.5 px-5 pt-5 pb-6">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#025864' }}>
            <span className="text-white text-sm font-bold">R</span>
          </div>
          <span className="font-semibold text-lg" style={{ color: '#025864' }}>Ripplify</span>
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
                end={item.to === "/"}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
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
        </div>

        {/* Bottom */}
        <div className="px-4 pb-4 space-y-0.5">
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

          {/* User */}
          <div className="flex items-center justify-between px-3 py-3 mt-2 border-t border-border group">
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
            <button
              onClick={() => logout()}
              className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all focus:opacity-100 shrink-0"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] px-3 mt-2" style={{ color: '#bbbbbb' }}>© 2025 Ripplify Inc.</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
