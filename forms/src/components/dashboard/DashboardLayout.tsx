import { useState, ReactNode } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import AccountStatusBanner from "@/components/dashboard/AccountStatusBanner";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
    children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="flex h-screen bg-white overflow-hidden">
            <Sidebar
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                collapsed={collapsed}
                onToggleCollapse={() => setCollapsed(!collapsed)}
            />
            <div className={cn(
                "flex-1 flex flex-col min-w-0 transition-all duration-300",
                collapsed ? "md:ml-[68px]" : "md:ml-[240px]",
                "pb-16 md:pb-0"
            )}>
                <TopBar onMenuToggle={() => setSidebarOpen(true)} />
                <AccountStatusBanner />
                <main className="flex-1 p-4 md:p-6 space-y-4 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
