import { 
  LayoutDashboard, CreditCard, ArrowLeftRight, Layers, 
  Landmark, Lock, FileBarChart, Coins, Settings, HelpCircle, 
  ChevronDown, Search
} from "lucide-react";
import { cn } from "@/lib/utils";

const generalItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: CreditCard, label: "Payment" },
  { icon: ArrowLeftRight, label: "Transaction" },
  { icon: Layers, label: "Cards", hasChevron: true },
];

const supportItems = [
  { icon: Landmark, label: "Capital" },
  { icon: Lock, label: "Vaults" },
  { icon: FileBarChart, label: "Reports" },
  { icon: Coins, label: "Earn", badge: "€ 160" },
];

const Sidebar = () => {
  return (
    <aside className="w-[220px] bg-sidebar flex flex-col h-screen fixed left-0 top-0 z-50">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 pt-5 pb-6">
        <div className="w-7 h-7 rounded-lg bg-sidebar-active flex items-center justify-center">
          <span className="text-primary-foreground text-xs font-bold">S</span>
        </div>
        <span className="text-primary-foreground font-semibold text-lg">Sequence</span>
        <button className="ml-auto text-sidebar-foreground hover:text-primary-foreground">
          <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
        </button>
      </div>

      {/* General */}
      <div className="px-4 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wider text-sidebar-foreground/50 px-2 mb-2">General</p>
        <nav className="space-y-0.5">
          {generalItems.map((item) => (
            <button
              key={item.label}
              className={cn(
                "flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors",
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

        <p className="text-[11px] font-medium uppercase tracking-wider text-sidebar-foreground/50 px-2 mb-2 mt-6">Support</p>
        <nav className="space-y-0.5">
          {supportItems.map((item) => (
            <button
              key={item.label}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-hover hover:text-primary-foreground transition-colors"
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-auto text-[11px] bg-sidebar-active/20 text-sidebar-active px-2 py-0.5 rounded-full font-medium">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Bottom */}
      <div className="px-4 pb-4 space-y-0.5">
        <button className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-hover hover:text-primary-foreground transition-colors">
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </button>
        <button className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-hover hover:text-primary-foreground transition-colors">
          <HelpCircle className="w-4 h-4" />
          <span>Help</span>
        </button>
        <div className="flex items-center gap-3 px-3 py-2">
          <span className="text-sm text-sidebar-foreground">Pro Mode</span>
          <div className="ml-auto w-9 h-5 bg-sidebar-active rounded-full relative">
            <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-primary-foreground rounded-full" />
          </div>
        </div>

        {/* User */}
        <div className="flex items-center gap-3 px-3 py-3 mt-2 border-t border-sidebar-hover">
          <div className="w-8 h-8 rounded-full bg-sidebar-active/30 flex items-center justify-center text-sidebar-active text-xs font-semibold">
            YA
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-primary-foreground truncate">Young Alaska</p>
            <p className="text-[11px] text-sidebar-foreground truncate">aliskayng@gmail.com</p>
          </div>
        </div>
        <p className="text-[10px] text-sidebar-foreground/40 px-3">© 2024 Sequence Inc.</p>
      </div>
    </aside>
  );
};

export default Sidebar;
