import AdminLayout from "@/components/admin/AdminLayout";
import { TrendingUp, Users, Building2, CreditCard, ArrowUpRight, ArrowDownRight, ShieldCheck, Link2, AlertTriangle, DollarSign } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { fetchWithAuth } from "@/lib/api";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/contexts/AppContext";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const AdminDashboard = () => {
  const { toast } = useToast();
  const { userProfile } = useAppContext();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");

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
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const chartData = stats?.monthlyRevenue?.map((item: any) => {
    const [year, month] = item.month.split('-');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthIndex = parseInt(month, 10) - 1;
    return { name: monthNames[monthIndex] || item.month, revenue: item.revenue };
  }) || [];

  const statCards = [
    { title: "Total Revenue", value: stats ? `KES ${Number(stats.revenue || 0).toLocaleString()}` : "...", change: "+12.5%", positive: true, icon: DollarSign, color: "bg-emerald-50 text-emerald-600" },
    { title: "Active Sellers", value: stats ? stats.sellers || 0 : "...", change: "+8.2%", positive: true, icon: Users, color: "bg-blue-50 text-blue-600" },
    { title: "Payment Links", value: stats ? stats.links || 0 : "...", change: "+4.1%", positive: true, icon: Link2, color: "bg-indigo-50 text-indigo-600" },
    { title: "Transactions", value: stats ? stats.transactions || 0 : "...", change: "-2.4%", positive: false, icon: CreditCard, color: "bg-orange-50 text-orange-600" },
  ];

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Platform Overview</h1>
          <p className="text-sm text-slate-500">Monitor Ripplify operations in real-time</p>
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((stat) => (
          <div key={stat.title} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className={cn("p-2 rounded-xl", stat.color)}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className={cn(
                "flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                stat.positive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
              )}>
                {stat.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {stat.change}
              </div>
            </div>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{stat.title}</p>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Charts & Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm">Revenue Trend</h3>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#025864" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#025864" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#025864" strokeWidth={2} fill="url(#revenueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Companies */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm">Top Companies</h3>
            <Link to="/admin/companies" className="text-[10px] font-bold text-[#025864] hover:underline">View All</Link>
          </div>
          <div className="space-y-3 max-h-[260px] overflow-y-auto">
            {!stats?.companyStats || stats.companyStats.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No data yet</div>
            ) : (
              stats.companyStats.slice(0, 6).map((company: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-xs font-bold text-[#025864]">
                    {company.businessName?.charAt(0) || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">{company.businessName || "Unknown"}</p>
                    <p className="text-[10px] text-slate-400">{company.txCount} txns</p>
                  </div>
                  <p className="text-xs font-bold text-slate-900">KES {Number(company.totalVolume || 0).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
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
