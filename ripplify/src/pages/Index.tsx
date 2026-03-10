import DashboardLayout from "@/components/dashboard/DashboardLayout";
import BalanceCard from "@/components/dashboard/BalanceCard";
import CashFlowChart from "@/components/dashboard/CashFlowChart";
import IncomeExpenseCards from "@/components/dashboard/IncomeExpenseCards";
import StatsCards from "@/components/dashboard/StatsCards";
import RecentActivity from "@/components/dashboard/RecentActivity";
import MyCards from "@/components/dashboard/MyCards";
import PaymentLinks from "@/components/dashboard/PaymentLinks";

const Index = () => {
  return (
    <DashboardLayout>
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
    </DashboardLayout>
  );
};

export default Index;
