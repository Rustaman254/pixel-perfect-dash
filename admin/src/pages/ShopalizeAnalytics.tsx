import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { fetchWithAuth, cn } from "@/lib/utils";
import { ShoppingCart, Package, Store, DollarSign, Users, Loader2, TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

const ShopalizeAnalytics = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchWithAuth(`/admin/shopalize/analytics?period=${period}`);
      setAnalytics(data);
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [period]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </AdminLayout>
    );
  }

  const salesData = analytics?.dailySales?.map((item: any) => ({
    date: item.date?.slice(5),
    revenue: parseFloat(item.revenue) || 0,
    orders: parseInt(item.orders) || 0,
  })) || [];

  const statusData = analytics?.orderStatusBreakdown?.map((item: any) => ({
    name: item.status,
    value: parseInt(item.count) || 0,
  })) || [];

  const storeStatusData = analytics?.storeStatusBreakdown?.map((item: any) => ({
    name: item.status,
    value: parseInt(item.count) || 0,
  })) || [];

  const categoryData = analytics?.productCategoryBreakdown?.map((item: any) => ({
    name: item.category || "Uncategorized",
    value: parseInt(item.count) || 0,
  })) || [];

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Shopalize Analytics</h1>
          <p className="text-sm text-slate-500">Platform-wide e-commerce analytics and reports</p>
        </div>
        <select value={period} onChange={e => setPeriod(e.target.value)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-medium outline-none text-sm">
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
        </select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { title: "Total Revenue", value: `$${(analytics?.totalRevenue || 0).toLocaleString()}`, icon: DollarSign, color: "bg-emerald-50 text-emerald-600" },
          { title: "Total Orders", value: analytics?.totalOrders || 0, icon: ShoppingCart, color: "bg-blue-50 text-blue-600" },
          { title: "Total Stores", value: analytics?.totalStores || 0, icon: Store, color: "bg-purple-50 text-purple-600" },
          { title: "Products", value: analytics?.totalProducts || 0, icon: Package, color: "bg-amber-50 text-amber-600" },
          { title: "Customers", value: analytics?.uniqueCustomers || 0, icon: Users, color: "bg-indigo-50 text-indigo-600" },
          { title: "Pending Orders", value: analytics?.pendingOrders || 0, icon: Loader2, color: "bg-orange-50 text-orange-600" },
          { title: "Avg Order Value", value: `$${(analytics?.aov || 0).toLocaleString()}`, icon: TrendingUp, color: "bg-cyan-50 text-cyan-600" },
          { title: "Published Stores", value: analytics?.publishedStores || 0, icon: Store, color: "bg-emerald-50 text-emerald-600" },
        ].map((s) => (
          <div key={s.title} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className={cn("p-1.5 rounded-lg w-fit mb-2", s.color)}><s.icon className="w-4 h-4" /></div>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{s.title}</p>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">{s.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-900 text-sm mb-4">Revenue Trend</h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="revGradAn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#revGradAn)" name="Revenue ($)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-900 text-sm mb-4">Orders Trend</h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-900 text-sm mb-4">Order Status</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {statusData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-900 text-sm mb-4">Store Status</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={storeStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {storeStatusData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-900 text-sm mb-4">Product Categories</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {categoryData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-900 text-sm mb-4">Top Stores by Revenue</h3>
          <div className="space-y-2.5">
            {analytics?.topStores?.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">No data</div>
            ) : analytics?.topStores?.map((s: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-[10px] font-bold text-blue-600">
                  {s.name?.charAt(0) || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-900 truncate">{s.name || "Unnamed"}</p>
                  <p className="text-[9px] text-slate-400">{s.orderCount || 0} orders</p>
                </div>
                <p className="text-[11px] font-bold text-slate-900">${(parseFloat(s.totalRevenue) || 0).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-900 text-sm mb-4">Top Products</h3>
          <div className="space-y-2.5">
            {analytics?.topProducts?.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">No data</div>
            ) : analytics?.topProducts?.map((p: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
                  <Package className="w-3 h-3 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-900 truncate">{p.name}</p>
                  <p className="text-[9px] text-slate-400">{p.orderCount || 0} orders</p>
                </div>
                <p className="text-[11px] font-bold text-slate-900">${(parseFloat(p.totalRevenue) || 0).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ShopalizeAnalytics;
