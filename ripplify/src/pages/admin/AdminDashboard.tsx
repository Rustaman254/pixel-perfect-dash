import AdminLayout from "@/components/admin/AdminLayout";
import { TrendingUp, Users, CreditCard, ArrowUpRight, ArrowDownRight, Link2, DollarSign, ArrowLeftRight, Wallet, Send, Plus, Bell, Flag, BarChart3, Receipt, AlertTriangle, Settings } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { fetchWithAuth } from "@/lib/api";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const COLORS = ['#025864', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6'];

const AdminDashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);

  const loadData = async () => {
    try {
      const [statsData, analyticsData] = await Promise.all([
        fetchWithAuth('/admin/stats'),
        fetchWithAuth('/admin/analytics?period=30d'),
      ]);
      setStats(statsData);
      setAnalytics(analyticsData);
    } catch (error: any) {
      console.error("Failed to load admin data:", error);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const revenueChartData = analytics?.revenueTrend?.map((item: any) => ({
    date: item.date?.slice(5),
    revenue: item.revenue || 0,
    fees: item.fees || 0,
  })) || [];

  const volumeChartData = analytics?.volumeTrend?.map((item: any) => ({
    date: item.date?.slice(5),
    volume: item.volume || 0,
    count: item.transactionCount || 0,
  })) || [];

  const userGrowthData = analytics?.userGrowth?.map((item: any) => ({
    date: item.date?.slice(5),
    users: item.newUsers || 0,
    sellers: item.newSellers || 0,
  })) || [];

  const statusData = analytics?.statusBreakdown?.map((item: any) => ({
    name: item.status,
    value: item.count,
  })) || [];

  const paymentData = analytics?.paymentBreakdown?.map((item: any) => ({
    name: item.name || 'KES',
    value: item.total || 0,
    count: item.count,
  })) || [];

  const comp = analytics?.comparison;
  const revChange = comp?.lastMonth?.revenue > 0
    ? (((comp.thisMonth.revenue - comp.lastMonth.revenue) / comp.lastMonth.revenue) * 100).toFixed(1)
    : '+0';
  const txChange = comp?.lastMonth?.transactions > 0
    ? (((comp.thisMonth.transactions - comp.lastMonth.transactions) / comp.lastMonth.transactions) * 100).toFixed(1)
    : '+0';

  const statCards = [
    { title: "Total Revenue", value: stats ? `KES ${Number(stats.revenue||0).toLocaleString()}` : "...", change: `${revChange}%`, positive: Number(revChange) >= 0, icon: DollarSign, color: "bg-emerald-50 text-emerald-600" },
    { title: "Total Volume", value: stats ? `KES ${Number(stats.volume||0).toLocaleString()}` : "...", change: "", positive: true, icon: TrendingUp, color: "bg-blue-50 text-blue-600" },
    { title: "Sellers", value: stats ? stats.sellers || 0 : "...", change: `${analytics?.userStats?.verified || 0} verified`, positive: true, icon: Users, color: "bg-indigo-50 text-indigo-600" },
    { title: "Transactions", value: stats ? stats.transactions || 0 : "...", change: `${txChange}%`, positive: Number(txChange) >= 0, icon: CreditCard, color: "bg-orange-50 text-orange-600" },
    { title: "Payment Links", value: stats ? stats.links || 0 : "...", change: "", positive: true, icon: Link2, color: "bg-purple-50 text-purple-600" },
    { title: "Pending", value: stats ? stats.pendingTransactions || 0 : "...", change: "escrow", positive: true, icon: Wallet, color: "bg-yellow-50 text-yellow-600" },
    { title: "Disputed", value: stats ? stats.disputedTransactions || 0 : "...", change: "flagged", positive: false, icon: AlertTriangle, color: "bg-red-50 text-red-600" },
    { title: "Disabled", value: analytics?.userStats?.disabled || 0, change: `${analytics?.userStats?.suspended || 0} suspended`, positive: false, icon: ArrowDownRight, color: "bg-slate-50 text-slate-600" },
  ];

  const shortcuts = [
    { label: "Create User", to: "/admin/users", icon: Plus, color: "bg-[#025864]" },
    { label: "Transactions", to: "/admin/transactions", icon: Receipt, color: "bg-blue-600" },
    { label: "Analytics", to: "/admin/analytics", icon: BarChart3, color: "bg-purple-600" },
    { label: "Send Notification", to: "/admin/notifications", icon: Bell, color: "bg-amber-600" },
    { label: "Feature Flags", to: "/admin/features", icon: Flag, color: "bg-indigo-600" },
    { label: "Settings", to: "/admin/settings", icon: Settings, color: "bg-slate-600" },
  ];

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Platform Overview</h1>
          <p className="text-sm text-slate-500">Monitor Ripplify operations in real-time</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold animate-pulse">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Live
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {statCards.map((stat) => (
          <div key={stat.title} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className={cn("p-1.5 rounded-lg", stat.color)}>
                <stat.icon className="w-4 h-4" />
              </div>
              {stat.change && (
                <span className={cn(
                  "text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                  stat.positive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                )}>
                  {stat.change}
                </span>
              )}
            </div>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{stat.title}</p>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Quick Shortcuts */}
      <div className="flex flex-wrap gap-2 mb-6">
        {shortcuts.map(s => (
          <Link key={s.label} to={s.to} className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs font-bold hover:opacity-90 transition-all",
            s.color
          )}>
            <s.icon className="w-3.5 h-3.5" /> {s.label}
          </Link>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Revenue Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-900 text-sm mb-4">Revenue Trend (30d)</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChartData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#025864" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#025864" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#025864" strokeWidth={2} fill="url(#revGrad)" name="Revenue" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Volume Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-900 text-sm mb-4">Transaction Volume (30d)</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip />
                <Bar dataKey="volume" fill="#025864" radius={[4, 4, 0, 0]} name="Volume (KES)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* User Growth */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-900 text-sm mb-4">User Growth (30d)</h3>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userGrowthData}>
                <defs>
                  <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <Tooltip />
                <Area type="monotone" dataKey="users" stroke="#8b5cf6" strokeWidth={2} fill="url(#userGrad)" name="New Users" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Breakdown Pie */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-900 text-sm mb-4">Tx Status</h3>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
                  {statusData.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Sellers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm">Top Sellers</h3>
            <Link to="/admin/companies" className="text-[10px] font-bold text-[#025864] hover:underline">View All</Link>
          </div>
          <div className="space-y-2.5 max-h-[180px] overflow-y-auto">
            {(!stats?.companyStats || stats.companyStats.length === 0) ? (
              <div className="py-6 text-center text-xs text-slate-400">No data yet</div>
            ) : (
              stats.companyStats.slice(0, 5).map((c: any, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-[10px] font-bold text-[#025864]">
                    {c.businessName?.charAt(0) || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">{c.businessName || "Unknown"}</p>
                    <p className="text-[9px] text-slate-400">{c.txCount} txns</p>
                  </div>
                  <p className="text-[11px] font-bold text-slate-900">KES {Number(c.totalVolume||0).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <Link to="/admin/payouts" className="p-5 bg-[#025864] rounded-2xl text-white hover:bg-[#014a52] transition-colors">
          <h4 className="font-bold text-sm mb-1">Pending Payouts</h4>
          <p className="text-white/60 text-xs">{stats?.pendingTransactions || 0} requests waiting</p>
        </Link>
        <Link to="/admin/support" className="p-5 bg-amber-600 rounded-2xl text-white hover:bg-amber-700 transition-colors">
          <h4 className="font-bold text-sm mb-1">Open Tickets</h4>
          <p className="text-white/60 text-xs">{stats?.disputedTransactions || 0} flagged transactions</p>
        </Link>
        <Link to="/admin/transactions" className="p-5 bg-blue-600 rounded-2xl text-white hover:bg-blue-700 transition-colors">
          <h4 className="font-bold text-sm mb-1">All Transactions</h4>
          <p className="text-white/60 text-xs">View payments, payouts, transfers</p>
        </Link>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
