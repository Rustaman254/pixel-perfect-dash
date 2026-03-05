import { useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import BalanceCard from "@/components/dashboard/BalanceCard";
import CashFlowChart from "@/components/dashboard/CashFlowChart";
import IncomeExpenseCards from "@/components/dashboard/IncomeExpenseCards";
import StatsCards from "@/components/dashboard/StatsCards";
import RecentActivity from "@/components/dashboard/RecentActivity";
import MyCards from "@/components/dashboard/MyCards";
import PaymentLinks from "@/components/dashboard/PaymentLinks";

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 md:ml-[240px] flex flex-col min-w-0">
        <TopBar onMenuToggle={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6 space-y-4 overflow-auto">
          <BalanceCard />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <CashFlowChart />
            <IncomeExpenseCards />
          </div>
          <StatsCards />
          <PaymentLinks />
          <div className="flex flex-col md:flex-row gap-4">
            <RecentActivity />
            <MyCards />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
