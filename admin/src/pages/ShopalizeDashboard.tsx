import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { projectFetch, cn } from "@/lib/utils";
import { ShoppingCart, Package, Store, DollarSign, Clock, CheckCircle, Users, FileText, Loader2, TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

const ShopalizeDashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [statsData, analyticsData] = await Promise.all([
        projectFetch("shopalize", "stats"),
        projectFetch("shopalize", "analytics?period=30d"),
      ]);
      setStats(statsData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error("Failed to load shopalize data:", error);
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
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </AdminLayout>
    );
  }

  const ordersChartData = analytics?.ordersOverTime?.map((item: any) => ({
    date: item.date?.slice(5),
    orders: parseInt(item.orders) || 0,
    revenue: parseFloat(item.revenue) || 0,
  })) || [];

  const statusData = analytics?.orderStatusBreakdown?.map((item: any) => ({
    name: item.status,
    value: parseInt(item.count) || 0,
  })) || [];

  const categoryData = analytics?.productCategoryBreakdown?.map((item: any) => ({
    name: item.category || "Uncategorized",
    value: parseInt(item.count) || 0,
  })) || [];

  const statCards = [
    { title: "Total Stores", value: stats?.totalProjects || 0, icon: Store, color: "bg-blue-50 text-blue-600" },
    { title: "Published", value: stats?.publishedProjects || 0, icon: CheckCircle, color: "bg-emerald-50 text-emerald-600" },
    { title: "Draft", value: stats?.draftProjects || 0, icon: FileText, color: "bg-slate-50 text-slate-600" },
    { title: "Products", value: stats?.totalProducts || 0, icon: Package, color: "bg-purple-50 text-purple-600" },
    { title: "Total Orders", value: stats?.totalOrders || 0, icon: ShoppingCart, color: "bg-amber-50 text-amber-600" },
    { title: "Revenue", value: `$${Number(stats?.totalRevenue || 0).toLocaleString()}`, icon: DollarSign, color: "bg-emerald-50 text-emerald-600" },
    { title: "Pending Orders", value: stats?.pendingOrders || 0, icon: Clock, color: "bg-orange-50 text-orange-600" },
    { title: "Unique Users", value: stats?.uniqueUsers || 0, icon: Users, color: "bg-indigo-50 text-indigo-600" },
  ];

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Shopalize Overview</h1>
          <p className="text-sm text-slate-500">Store builder & e-commerce analytics</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-bold animate-pulse">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Live
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {statCards.map((stat) => (
          <div key={stat.title} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className={cn("p-1.5 rounded-lg", stat.color)}>
                <stat.icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{stat.title}</p>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-900 text-sm mb-4">Revenue Trend (30d)</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ordersChartData}>
                <defs>
                  <linearGradient id="revGradShop" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#revGradShop)" name="Revenue ($)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-900 text-sm mb-4">Orders (30d)</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ordersChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <Tooltip />
                <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Orders" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-900 text-sm mb-4">Order Status</h3>
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
          <h3 className="font-bold text-slate-900 text-sm mb-4">Product Categories</h3>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {categoryData.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-900 text-sm mb-4">Top Stores</h3>
          <div className="space-y-2.5 max-h-[180px] overflow-y-auto">
            {analytics?.topStores?.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">No stores yet</div>
            ) : (
              analytics?.topStores?.slice(0, 6).map((s: any, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-[10px] font-bold text-blue-600">
                    {s.name?.charAt(0) || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">{s.name || "Unnamed"}</p>
                    <p className="text-[9px] text-slate-400">{s.orderCount || 0} orders</p>
                  </div>
                  <p className="text-[11px] font-bold text-slate-900">${Number(s.totalRevenue || 0).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="mt-6 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-900 text-sm mb-4">Top Products</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 text-[10px] uppercase tracking-widest font-bold text-slate-400">Product</th>
                <th className="text-left py-2 text-[10px] uppercase tracking-widest font-bold text-slate-400">Price</th>
                <th className="text-left py-2 text-[10px] uppercase tracking-widest font-bold text-slate-400">Orders</th>
                <th className="text-right py-2 text-[10px] uppercase tracking-widest font-bold text-slate-400">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {analytics?.topProducts?.length === 0 ? (
                <tr><td colSpan={4} className="py-6 text-center text-xs text-slate-400">No products yet</td></tr>
              ) : (
                analytics?.topProducts?.slice(0, 8).map((p: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <Package className="w-3 h-3 text-slate-400" />
                        <span className="text-xs font-medium text-slate-700">{p.name}</span>
                      </div>
                    </td>
                    <td className="py-2 text-xs text-slate-600">{p.currency || '$'}{Number(p.price || 0).toLocaleString()}</td>
                    <td className="py-2 text-xs font-bold text-slate-900">{p.orderCount || 0}</td>
                    <td className="py-2 text-xs font-bold text-slate-900 text-right">${Number(p.totalRevenue || 0).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ShopalizeDashboard;
