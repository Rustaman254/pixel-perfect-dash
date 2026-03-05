import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import BalanceCard from "@/components/dashboard/BalanceCard";
import CashFlowChart from "@/components/dashboard/CashFlowChart";
import IncomeExpenseCards from "@/components/dashboard/IncomeExpenseCards";
import StatsCards from "@/components/dashboard/StatsCards";
import RecentActivity from "@/components/dashboard/RecentActivity";
import MyCards from "@/components/dashboard/MyCards";

const Index = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 ml-[220px] flex flex-col">
        <TopBar />
        <main className="flex-1 p-6 space-y-4 overflow-auto">
          <BalanceCard />
          <div className="grid grid-cols-3 gap-4">
            <CashFlowChart />
            <IncomeExpenseCards />
          </div>
          <StatsCards />
          <div className="flex gap-4">
            <RecentActivity />
            <MyCards />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
