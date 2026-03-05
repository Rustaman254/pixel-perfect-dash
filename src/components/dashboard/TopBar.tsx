import { Search, Calendar, ChevronDown, Download, Menu } from "lucide-react";

interface TopBarProps {
  onMenuToggle?: () => void;
}

const TopBar = ({ onMenuToggle }: TopBarProps) => {
  return (
    <header className="flex items-center justify-between h-14 px-4 md:px-6 bg-card border-b border-border">
      <div className="flex items-center gap-3">
        <button className="md:hidden p-1.5 rounded-lg hover:bg-muted transition-colors" onClick={onMenuToggle}>
          <Menu className="w-5 h-5 text-foreground" />
        </button>
        <div className="hidden sm:flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5">
          <Search className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Search</span>
          <span className="text-[11px] text-muted-foreground/60 ml-4 hidden lg:inline">⌘ + F</span>
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>Last 30 days</span>
        </div>
        <div className="flex items-center gap-1 text-sm font-medium text-foreground">
          <span className="hidden sm:inline">Last 30 days</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </div>
        <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>
    </header>
  );
};

export default TopBar;
