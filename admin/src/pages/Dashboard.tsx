import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { fetchWithAuth, projectFetch, cn } from "@/lib/utils";
import { useProjectContext } from "@/contexts/ProjectContext";
import { TrendingUp, Users, CreditCard, ArrowUpRight, ArrowDownRight, Link2, DollarSign, Wallet, Plus, Bell, Flag, BarChart3, Receipt, AlertTriangle, Settings, Loader2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { Link } from "react-router-dom";

const COLORS = ["#025864", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#3b82f6"];

const Dashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { currentProject } = useProjectContext();
  const [platformStats, setPlatformStats] = useState<any>(null);

  const loadData = async () => {
    try {
      // Load platform stats
      const platformData = await fetchWithAuth("/admin/dashboard");
      setPlatformStats(platformData);
      
      // Load project stats if a project is selected
      if (currentProject?.id) {
        const [statsData, analyticsData] = await Promise.all([
          projectFetch(currentProject.id, "stats"),
          projectFetch(currentProject.id, "analytics?period=30d"),
        ]);
        setStats(statsData);
        setAnalytics(analyticsData);
      }
    } catch (error) {
      console.error("Failed to load admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-[#025864]" />
        </div>
      </AdminLayout>
    );
  }

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
  })) || [];

  const statusData = analytics?.statusBreakdown?.map((item: any) => ({
    name: item.status,
    value: item.count,
  })) || [];

  const comp = analytics?.Comparison || analytics?.comparison;
  const revChange = "+0";
  const txChange = "+0";

  const statCards = [
    { title: "Ripplify Revenue", value: stats ? `KES ${Number(stats.ripplifyRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "...", change: `${revChange}%`, positive: Number(revChange) >= 0, icon: DollarSign, color: "bg-emerald-50 text-emerald-600" },
    { title: "Total Revenue", value: stats ? `KES ${Number(stats.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "...", change: "", positive: true, icon: TrendingUp, color: "bg-blue-50 text-blue-600" },
    { title: "Total Users", value: stats ? stats.totalUsers || 0 : "...", change: `${stats?.todaySignups || 0} today`, positive: true, icon: Users, color: "bg-indigo-50 text-indigo-600" },
    { title: "Transactions", value: stats ? stats.totalTransactions || 0 : "...", change: `${txChange}%`, positive: Number(txChange) >= 0, icon: CreditCard, color: "bg-orange-50 text-orange-600" },
    { title: "Stores", value: stats ? stats.totalStores || 0 : "...", change: `${stats?.publishedStores || 0} published`, positive: true, icon: Link2, color: "bg-purple-50 text-purple-600" },
    { title: "Pending Payments", value: stats ? `KES ${Number(stats.ripplifyPending || 0).toLocaleString()}` : "...", change: "escrow", positive: true, icon: Wallet, color: "bg-yellow-50 text-yellow-600" },
    { title: "Orders", value: stats ? stats.totalOrders || 0 : "...", change: "shopalize", positive: true, icon: AlertTriangle, color: "bg-red-50 text-red-600" },
    { title: "Active Users", value: stats ? stats.activeUsers || 0 : "...", change: `${stats?.uniqueVisitors || 0} visitors`, positive: false, icon: ArrowDownRight, color: "bg-slate-50 text-slate-600" },
  ];

  const shortcuts = [
    { label: "Create User", to: "/users", icon: Plus, color: "bg-[#025864]" },
    { label: "Transactions", to: "/transactions", icon: Receipt, color: "bg-blue-600" },
    { label: "Analytics", to: "/analytics", icon: BarChart3, color: "bg-purple-600" },
    { label: "Notifications", to: "/notifications", icon: Bell, color: "bg-amber-600" },
    { label: "Feature Flags", to: "/features", icon: Flag, color: "bg-indigo-600" },
    { label: "Settings", to: "/settings", icon: Settings, color: "bg-slate-600" },
  ];

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Platform Overview</h1>
          <p className="text-sm text-slate-500">Monitor {currentProject?.name || "platform"} operations in real-time</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold animate-pulse">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Live
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {statCards.map((stat) => (
          <div key={stat.title} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className={cn("p-1.5 rounded-lg", stat.color)}>
                <stat.icon className="w-4 h-4" />
              </div>
              {stat.change && (
                <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full", stat.positive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600")}>
                  {stat.change}
                </span>
              )}
            </div>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{stat.title}</p>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {shortcuts.map((s) => (
          <Link key={s.label} to={s.to} className={cn("flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs font-bold hover:opacity-90 transition-all", s.color)}>
            <s.icon className="w-3.5 h-3.5" /> {s.label}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
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
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#025864" strokeWidth={2} fill="url(#revGrad)" name="Revenue" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-900 text-sm mb-4">Transaction Volume (30d)</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip />
                <Bar dataKey="volume" fill="#025864" radius={[4, 4, 0, 0]} name="Volume (KES)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
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
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-900 text-sm mb-4">Tx Status</h3>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {statusData.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm">Top Sellers</h3>
            <Link to="/companies" className="text-[10px] font-bold text-[#025864] hover:underline">View All</Link>
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
                  <p className="text-[11px] font-bold text-slate-900">KES {Number(c.totalVolume || 0).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
