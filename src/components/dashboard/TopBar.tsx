import { Search, Calendar, ChevronDown, Download } from "lucide-react";

const TopBar = () => {
  return (
    <header className="flex items-center justify-between h-14 px-6 bg-card border-b border-border">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5">
          <Search className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Search</span>
          <span className="text-[11px] text-muted-foreground/60 ml-4">⌘ + F</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>18 Oct 2024 - 18 Nov 2024</span>
        </div>
        <div className="flex items-center gap-1 text-sm font-medium text-foreground">
          <span>Last 30 days</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </div>
        <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <Download className="w-4 h-4" />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
};

export default TopBar;
