import { 
  LayoutDashboard, Link2, ArrowLeftRight, CreditCard, 
  BarChart3, Globe, Wallet, Settings, HelpCircle, 
  ChevronDown, X, Users
} from "lucide-react";
import { cn } from "@/lib/utils";

const generalItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Link2, label: "Payment Links" },
  { icon: ArrowLeftRight, label: "Transactions" },
  { icon: CreditCard, label: "Payment Methods", hasChevron: true },
  { icon: Globe, label: "Currencies" },
];

const manageItems = [
  { icon: BarChart3, label: "Analytics" },
  { icon: Wallet, label: "Payouts" },
  { icon: Users, label: "Customers" },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

const Sidebar = ({ open, onClose }: SidebarProps) => {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={onClose} />
      )}
      <aside className={cn(
        "w-[240px] bg-sidebar flex flex-col h-screen fixed left-0 top-0 z-50 transition-transform duration-300",
        "md:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        {/* Logo */}
        <div className="flex items-center gap-2 px-5 pt-5 pb-6">
          <div className="w-8 h-8 rounded-lg bg-sidebar-active flex items-center justify-center">
            <span className="text-primary-foreground text-sm font-bold">P</span>
          </div>
          <span className="text-primary-foreground font-semibold text-lg">PayFlow</span>
          <button className="ml-auto text-sidebar-foreground hover:text-primary-foreground hidden md:block">
            <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
          </button>
          <button className="ml-auto text-sidebar-foreground hover:text-primary-foreground md:hidden" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* General */}
        <div className="px-4 flex-1 overflow-y-auto">
          <p className="text-[11px] font-medium uppercase tracking-wider text-sidebar-foreground/50 px-2 mb-2">General</p>
          <nav className="space-y-0.5">
            {generalItems.map((item) => (
              <button
                key={item.label}
                className={cn(
                  "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-colors",
                  item.active
                    ? "bg-sidebar-active/20 text-sidebar-active font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-hover hover:text-primary-foreground"
                )}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
                {item.hasChevron && <ChevronDown className="w-3.5 h-3.5 ml-auto" />}
              </button>
            ))}
          </nav>

          <p className="text-[11px] font-medium uppercase tracking-wider text-sidebar-foreground/50 px-2 mb-2 mt-6">Manage</p>
          <nav className="space-y-0.5">
            {manageItems.map((item) => (
              <button
                key={item.label}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-hover hover:text-primary-foreground transition-colors"
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Bottom */}
        <div className="px-4 pb-4 space-y-0.5">
          <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-hover hover:text-primary-foreground transition-colors">
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
          <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-hover hover:text-primary-foreground transition-colors">
            <HelpCircle className="w-4 h-4" />
            <span>Help Center</span>
          </button>

          {/* User */}
          <div className="flex items-center gap-3 px-3 py-3 mt-2 border-t border-sidebar-hover">
            <div className="w-8 h-8 rounded-full bg-sidebar-active/30 flex items-center justify-center text-sidebar-active text-xs font-semibold">
              JD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-primary-foreground truncate">John's Store</p>
              <p className="text-[11px] text-sidebar-foreground truncate">john@mystore.com</p>
            </div>
          </div>
          <p className="text-[10px] text-sidebar-foreground/40 px-3">© 2025 PayFlow Inc.</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
