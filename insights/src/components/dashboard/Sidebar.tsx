import { useState } from "react";
import {
  LayoutDashboard, BarChart3, Users, Clock, Settings, HelpCircle,
  ChevronDown, X, LogOut, ArrowLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAppContext } from "@/contexts/AppContext";
import { useToast } from "@/hooks/use-toast";

const insightsItems = [
  { icon: LayoutDashboard, label: "Overview", to: "/" },
  { icon: Users, label: "Sessions", to: "/sessions" },
  { icon: Settings, label: "Setup", to: "/setup" },
];

const bottomItems = [
  { icon: Settings, label: "Settings", to: "/settings" },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

const Sidebar = ({ open, onClose }: SidebarProps) => {
  const { userProfile, logout } = useAppContext();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path: string) => {
    if (path === "/" && (location.pathname === "/" || location.pathname === "/insights")) return true;
    if (path === "/sessions" && (location.pathname === "/sessions" || location.pathname === "/insights/sessions")) return true;
    return location.pathname.startsWith(path) && path !== "/";
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
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-600 shadow-sm shadow-indigo-200">
            <BarChart3 className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-lg text-slate-800 tracking-tight">Insights</span>
          <button className="ml-auto hover:opacity-70 md:hidden" style={{ color: '#333333' }} onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Analytics */}
        <div className="px-4 flex-1 overflow-y-auto mt-2">
          <p className="text-[10px] font-bold uppercase tracking-widest px-3 mb-3 text-slate-400">Behavioral Data</p>
          <nav className="space-y-1">
            {insightsItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                onClick={onClose}
                className={() =>
                  cn(
                    "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition-all duration-200",
                    isActive(item.to)
                      ? "font-bold bg-indigo-50 text-indigo-600 shadow-sm shadow-indigo-50/50"
                      : "text-slate-500 hover:bg-slate-100/80 hover:text-slate-900"
                  )
                }
              >
                <item.icon className={cn("w-4 h-4 transition-colors", isActive(item.to) ? "text-indigo-600" : "text-slate-400")} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <p className="text-[10px] font-bold uppercase tracking-widest px-3 mb-3 mt-8 text-slate-400">Ecosystem</p>
          <nav className="space-y-1">
              <a 
                href="http://localhost:5173" 
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition-all text-slate-500 hover:bg-slate-100/80 hover:text-slate-900"
              >
                  <ArrowLeft className="w-4 h-4 text-slate-400" />
                  <span>Back to Ripplify</span>
              </a>
          </nav>
        </div>

        {/* Bottom */}
        <div className="px-4 pb-4 space-y-0.5 border-t border-slate-100 pt-4">
          <div className="pt-2">
            <div className="flex items-center justify-between px-3 py-3 rounded-2xl group cursor-pointer hover:bg-slate-100 transition-all">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 bg-indigo-600 shadow-sm shadow-indigo-100">
                    {userProfile?.businessName?.substring(0, 1).toUpperCase() || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate text-slate-800">{userProfile?.businessName || "User"}</p>
                  <p className="text-[10px] truncate text-slate-400 font-medium">{userProfile?.email || ""}</p>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 mt-2 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>

          <p className="text-[10px] px-3 mt-6 font-medium text-slate-300">© 2025 Ripplify Insights</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
