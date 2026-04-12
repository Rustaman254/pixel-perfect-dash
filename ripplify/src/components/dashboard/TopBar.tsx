import { Search, Calendar, Download, Menu, LogOut, Bell, ExternalLink, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/contexts/AppContext";
import { useState, useEffect } from "react";
import { fetchWithAuth } from "@/lib/api";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface TopBarProps {
  onMenuToggle?: () => void;
}

const TopBar = ({ onMenuToggle }: TopBarProps) => {
  const { toast } = useToast();
  const { userProfile, logout } = useAppContext();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchNotifications = async () => {
    try {
      const data = await fetchWithAuth('/notifications');
      setNotifications(data.slice(0, 5)); // Latest 5
      setUnreadCount(data.filter((n: any) => !n.isRead).length);
    } catch (e) {
      console.error("Fetch notifications failed", e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id: number) => {
    try {
      await fetchWithAuth(`/notifications/${id}/read`, { method: 'PUT' });
      fetchNotifications();
    } catch (e) {
      console.error("Mark read failed", e);
    }
  };

  const handleExport = () => {
    toast({
      title: "Exporting data",
      description: "Your report is being prepared and will download shortly.",
    });
  };

  return (
    <header className="flex items-center justify-between h-14 px-4 md:px-6 bg-white border-b border-border sticky top-0 z-40">
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
          <span className="hidden sm:inline">Export Report</span>
        </button>

        {/* App Switcher & Notifications container */}
        <div className="flex items-center gap-1 sm:gap-2 mr-1">
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors relative"
          >
            <Bell className="w-5 h-5 text-muted-foreground hover:text-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <>
              <div className="fixed inset-0 z-[55]" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 mt-2 w-80 bg-white border border-border shadow-xl rounded-xl z-[60] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {unreadCount} New
                    </span>
                  )}
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  {notifications.length > 0 ? (
                    <div className="divide-y divide-slate-50">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className={cn(
                            "p-3.5 hover:bg-slate-50 transition-colors cursor-pointer group",
                            !n.isRead && "bg-blue-50/30"
                          )}
                          onClick={() => {
                            if (!n.isRead) handleMarkAsRead(n.id);
                            setShowNotifications(false);
                            navigate('/notifications');
                          }}
                        >
                          <div className="flex gap-3">
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                              n.type === 'success' ? "bg-green-100 text-green-600" :
                                n.type === 'warning' ? "bg-amber-100 text-amber-600" :
                                  n.type === 'alert' ? "bg-red-100 text-red-600" :
                                    "bg-blue-100 text-blue-600"
                            )}>
                              <Bell className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn("text-xs font-semibold truncate", !n.isRead ? "text-slate-900" : "text-slate-600")}>
                                {n.title}
                              </p>
                              <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                                {n.message}
                              </p>
                              {n.actionUrl && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!n.isRead) handleMarkAsRead(n.id);
                                    setShowNotifications(false);
                                    navigate(n.actionUrl);
                                  }}
                                  className="mt-2 w-full py-1.5 bg-[#025864] text-white text-[10px] font-bold rounded-lg hover:bg-[#014751] transition-colors flex items-center justify-center gap-1.5"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  {n.actionLabel || 'View Details'}
                                </button>
                              )}
                              <div className="flex items-center gap-2 mt-1.5">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span className="text-[10px] text-slate-400">
                                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                </span>
                              </div>
                            </div>
                            {!n.isRead && (
                              <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 flex flex-col items-center justify-center text-center px-6">
                      <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                        <Bell className="w-6 h-6 text-slate-300" />
                      </div>
                      <p className="text-sm font-medium text-slate-900">No notifications yet</p>
                      <p className="text-xs text-slate-500 mt-1">We'll notify you when something important happens.</p>
                    </div>
                  )}
                </div>
                <Link
                  to="/notifications"
                  onClick={() => setShowNotifications(false)}
                  className="block py-3 text-center text-xs font-semibold text-primary hover:bg-slate-50 transition-colors border-t border-border flex items-center justify-center gap-1.5"
                >
                  View All Notifications
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </>
          )}
        </div>
        </div>

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
