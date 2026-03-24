import AdminLayout from "@/components/admin/AdminLayout";
import { TrendingUp, Users, Building2, CreditCard, ArrowUpRight, ArrowDownRight, MoreVertical, ShieldCheck, Search, Filter } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, AreaChart, Area, Tooltip } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { fetchWithAuth } from "@/lib/api";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/contexts/AppContext";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const recentActivities = [
  { company: "Global Tech Solutions", action: "New Registration", date: "2 mins ago", status: "Active" },
  { company: "Global Traders", action: "API Key Generated", date: "15 mins ago", status: "Active" },
  { company: "Aero Logistics", action: "Suspended", date: "1 hour ago", status: "Suspended" },
];

const AdminDashboard = () => {
  const { toast } = useToast();
  const { userProfile } = useAppContext();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const chartData = stats?.monthlyRevenue?.map((item: any) => {
    const [year, month] = item.month.split('-');
    const monthIndex = parseInt(month, 10) - 1;
    return {
      name: monthNames[monthIndex] || item.month,
      revenue: item.revenue
    };
  }) || [];

  const loadStats = async () => {
    try {
      const data = await fetchWithAuth('/admin/stats');
      setStats(data);
    } catch (error: any) {
      console.error("Failed to load admin stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000); // Polling every 30s
    return () => clearInterval(interval);
  }, []);

  const platformStats = [
    { title: "Platform Revenue", value: stats ? `KES ${Number(stats.revenue).toLocaleString()}` : "...", change: "+12.5%", positive: true, icon: TrendingUp, color: "bg-emerald-50 text-emerald-600" },
    { title: "Payout Earnings", value: stats ? `KES ${Number(stats.payoutRevenue).toLocaleString()}` : "...", change: "+8.2%", positive: true, icon: CreditCard, color: "bg-blue-50 text-blue-600" },
    { title: "Active Sellers", value: stats ? stats.sellers : "...", change: "+8.2%", positive: true, icon: Users, color: "bg-indigo-50 text-indigo-600" },
    { title: "Escrow Transactions", value: stats ? stats.transactions : "...", change: "-2.4%", positive: false, icon: ShieldCheck, color: "bg-orange-50 text-orange-600" },
  ];

  return (
    <AdminLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-bold text-slate-900">Platform Overview</h1>
            <p className="text-slate-500">Monitor and manage Ripplify global operations.</p>
        </div>
        <div className="flex items-center gap-3">
            <button 
                onClick={() => setIsWithdrawOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#025864] text-white rounded-xl text-sm font-bold shadow-sm hover:opacity-90 transition-all"
            >
                <CreditCard className="w-4 h-4" />
                Withdraw Revenue
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold animate-pulse">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Live Updates
            </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {platformStats.map((stat) => (
          <div key={stat.title} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-3 rounded-2xl", stat.color)}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className={cn(
                "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
                stat.positive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
              )}>
                {stat.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {stat.change}
              </div>
            </div>
            <p className="text-sm font-medium text-slate-500 mb-1">{stat.title}</p>
            <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-900">Revenue Growth (Annual)</h3>
            <button className="text-sm font-bold text-[#025864] hover:underline">Download Report</button>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="adminRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#025864" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#025864" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} tickFormatter={(v) => `KES ${(v / 1000).toFixed(0)}k`} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#025864" strokeWidth={3} fill="url(#adminRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Company Stats */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900">Company Revenue</h3>
          </div>
          <div className="space-y-6 max-h-[350px] overflow-y-auto pr-2">
            {!stats?.companyStats || stats.companyStats.length === 0 ? (
                <div className="py-10 text-center text-sm text-slate-500">No company data yet.</div>
            ) : (
                stats.companyStats.map((company: any, i: number) => (
                    <div key={i} className="flex gap-4 items-center border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 font-bold text-[#025864]">
                            {company.businessName?.charAt(0) || "C"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">{company.businessName || "Unknown"}</p>
                            <p className="text-[10px] text-slate-500">{company.txCount} transactions</p>
                        </div>
                        <div className="text-right shrink-0">
                            <p className="text-xs font-bold text-slate-900">KES {Number(company.totalVolume).toLocaleString()}</p>
                            <p className="text-[10px] text-emerald-600 font-medium">Earned: KES {Number(company.totalFees).toLocaleString()}</p>
                        </div>
                    </div>
                ))
            )}
          </div>
          <Link to="/admin/companies" className="block w-full mt-6 py-3 bg-slate-50 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-100 transition-colors text-center">
            View All Companies
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-[#025864] rounded-3xl text-white">
          <h4 className="font-bold mb-2">Pending Withdrawals</h4>
          <p className="text-white/70 text-sm mb-6">{stats?.pendingTransactions || 0} withdrawal requests waiting for approval.</p>
          <Link to="/admin/payouts" className="block w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all text-center">
            Review All
          </Link>
        </div>
        <div className="p-6 bg-red-600 rounded-3xl text-white">
          <h4 className="font-bold mb-2">Flagged Accounts</h4>
          <p className="text-white/70 text-sm mb-6">{stats?.disputedTransactions || 0} accounts have been flagged for suspicious activities.</p>
          <button className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all">
            Investigate
          </button>
        </div>
        <div className="p-6 bg-blue-600 rounded-3xl text-white">
          <h4 className="font-bold mb-2">System Updates</h4>
          <p className="text-white/70 text-sm mb-6">The next scheduled maintenance is in 3 days.</p>
          <button className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all">
            Manage
          </button>
        </div>
      </div>

      <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
        <DialogContent className="max-w-md rounded-3xl">
            <DialogHeader>
                <DialogTitle className="text-xl font-bold">Withdraw Platform Revenue</DialogTitle>
                <DialogDescription>Withdraw accumulated platform fees to your configured payout account.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-widest font-bold">Total Platform Revenue</p>
                    <p className="text-3xl font-black text-[#025864]">KES {Number(stats?.revenue || 0).toLocaleString()}</p>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Amount to Withdraw</label>
                    <Input 
                        type="number" 
                        placeholder="0.00" 
                        value={withdrawAmount} 
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="h-12 rounded-xl border-slate-200 focus:ring-[#025864]"
                    />
                    <p className="text-[10px] text-slate-400 mt-2 px-1">
                        Funds will be sent to your {userProfile?.payoutMethod || 'configured'} account: 
                        <strong className="text-slate-600 ml-1 truncate max-w-[200px] inline-block align-bottom">{userProfile?.payoutDetails || 'Not set'}</strong>
                    </p>
                </div>
                <div className="pt-2">
                    <Button 
                        className="w-full h-12 rounded-xl bg-[#025864] hover:bg-[#025864]/90 text-white font-bold shadow-lg shadow-emerald-900/10 transition-all active:scale-[0.98]"
                        onClick={async () => {
                            try {
                                setLoading(true);
                                await fetchWithAuth('/payouts/request', {
                                    method: 'POST',
                                    body: JSON.stringify({ amount: parseFloat(withdrawAmount) })
                                });
                                toast({ title: "Payout Requested", description: "Your revenue withdrawal has been initiated." });
                                setIsWithdrawOpen(false);
                                setWithdrawAmount("");
                                loadStats();
                            } catch (err: any) {
                                toast({ title: "Error", description: err.message, variant: "destructive" });
                            } finally {
                                setLoading(false);
                            }
                        }}
                        disabled={loading || !withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > (stats?.revenue || 0)}
                    >
                        {loading ? "Processing..." : "Confirm Withdrawal"}
                    </Button>
                </div>
            </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminDashboard;
