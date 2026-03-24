import AdminLayout from "@/components/admin/AdminLayout";
import { TrendingUp, Users, Building2, CreditCard, ArrowUpRight, ArrowDownRight, ShieldCheck, Link2, AlertTriangle, DollarSign } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { fetchWithAuth } from "@/lib/api";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const AdminDashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/admin/payouts" className="p-4 bg-[#025864] rounded-2xl text-white hover:bg-[#014a52] transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <CreditCard className="w-5 h-5" />
            <h4 className="font-bold text-sm">Pending Payouts</h4>
          </div>
          <p className="text-white/70 text-xs">{stats?.pendingTransactions || 0} requests waiting</p>
        </Link>
        <Link to="/admin/support" className="p-4 bg-amber-500 rounded-2xl text-white hover:bg-amber-600 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-5 h-5" />
            <h4 className="font-bold text-sm">Open Tickets</h4>
          </div>
          <p className="text-white/70 text-xs">{stats?.openTickets || 0} support tickets</p>
        </Link>
        <Link to="/admin/users" className="p-4 bg-blue-600 rounded-2xl text-white hover:bg-blue-700 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5" />
            <h4 className="font-bold text-sm">User Management</h4>
          </div>
          <p className="text-white/70 text-xs">{stats?.sellers || 0} active sellers</p>
        </Link>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
