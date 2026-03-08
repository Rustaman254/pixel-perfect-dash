import { Search, Calendar, ChevronDown, Download, Menu, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/contexts/AppContext";

interface TopBarProps {
  onMenuToggle?: () => void;
}

const TopBar = ({ onMenuToggle }: TopBarProps) => {
  const { toast } = useToast();
  const { userProfile, logout } = useAppContext();

  const handleExport = () => {
    toast({
      title: "Exporting data",
      description: "Your report is being prepared and will download shortly.",
    });
  };

  return (
    <header className="flex items-center justify-between h-14 px-4 md:px-6 bg-card border-b border-border">
      <div className="flex items-center gap-3">
        <button className="md:hidden p-1.5 rounded-lg hover:bg-muted transition-colors" onClick={onMenuToggle}>
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
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors hover:bg-muted p-1 px-2 rounded-md"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Export</span>
        </button>

        <div className="flex items-center gap-2 pl-2 border-l border-border ml-2">
          <div className="hidden sm:block text-right">
            <p className="text-xs font-medium text-foreground">{userProfile?.fullName || userProfile?.businessName || "User"}</p>
            <p className="text-[10px] text-muted-foreground">Seller Account</p>
          </div>
          <div className="flex items-center gap-2 group relative">
            {userProfile?.profilePictureUrl ? (
              <img src={userProfile.profilePictureUrl} alt="Profile" className="w-8 h-8 rounded-full object-cover border border-border cursor-pointer peer" />
            ) : (
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white cursor-pointer peer" style={{ backgroundColor: '#025864' }}>
                {(userProfile?.fullName || userProfile?.businessName || "U").substring(0, 1).toUpperCase()}
              </div>
            )}

            <button
              onClick={() => logout()}
              className="absolute right-0 top-full mt-1 bg-white border border-border shadow-lg rounded-lg p-2.5 flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 w-36 opacity-0 invisible group-hover:opacity-100 group-hover:visible peer-hover:opacity-100 peer-hover:visible transition-all z-50 origin-top-right focus:opacity-100 focus:visible"
            >
              <LogOut className="w-4 h-4" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
