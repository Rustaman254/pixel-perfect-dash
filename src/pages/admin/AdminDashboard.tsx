import AdminLayout from "@/components/admin/AdminLayout";
import { TrendingUp, Users, Building2, CreditCard, ArrowUpRight, ArrowDownRight, MoreVertical, ShieldCheck, Search, Filter } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, AreaChart, Area, Tooltip } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { fetchWithAuth } from "@/lib/api";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const data = [
  { name: "Jan", revenue: 45000 }, { name: "Feb", revenue: 52000 }, { name: "Mar", revenue: 48000 },
  { name: "Apr", revenue: 61000 }, { name: "May", revenue: 55000 }, { name: "Jun", revenue: 67000 },
  { name: "Jul", revenue: 72000 }, { name: "Aug", revenue: 69000 }, { name: "Sep", revenue: 81000 },
  { name: "Oct", revenue: 85000 }, { name: "Nov", revenue: 92000 }, { name: "Dec", revenue: 105000 },
];

const recentActivities = [
  { company: "Global Tech Solutions", action: "New Registration", date: "2 mins ago", status: "Active" },
  { company: "My Store", action: "API Key Generated", date: "15 mins ago", status: "Active" },
  { company: "Aero Logistics", action: "Suspended", date: "1 hour ago", status: "Suspended" },
];

const AdminDashboard = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await fetchWithAuth('/admin/stats');
      setStats(data);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const platformStats = [
    { title: "Platform Revenue", value: stats ? `KES ${stats.revenue.toLocaleString()}` : "...", change: "+12.5%", positive: true, icon: TrendingUp, color: "bg-emerald-50 text-emerald-600" },
    { title: "Active Sellers", value: stats ? stats.sellers : "...", change: "+8.2%", positive: true, icon: Users, color: "bg-blue-50 text-blue-600" },
    { title: "Payment Links", value: stats ? stats.links : "...", change: "+4.1%", positive: true, icon: Building2, color: "bg-indigo-50 text-indigo-600" },
    { title: "Escrow Transactions", value: stats ? stats.transactions : "...", change: "-2.4%", positive: false, icon: ShieldCheck, color: "bg-orange-50 text-orange-600" },
  ];

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Platform Overview</h1>
        <p className="text-slate-500">Monitor and manage Ripplify global operations.</p>
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
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="adminRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#025864" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#025864" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#025864" strokeWidth={3} fill="url(#adminRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900">Recent Activity</h3>
            <button className="p-2 hover:bg-slate-50 rounded-lg transition-colors">
              <MoreVertical className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          <div className="space-y-6">
            {recentActivities.map((activity, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{activity.company}</p>
                  <p className="text-xs text-slate-500">{activity.action}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-slate-400 mb-1">{activity.date}</p>
                  <span className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full font-bold",
                    activity.status === "Active" ? "bg-emerald-50 text-emerald-600" :
                      activity.status === "Suspended" ? "bg-red-50 text-red-600" : "bg-orange-50 text-orange-600"
                  )}>
                    {activity.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-8 py-3 bg-slate-50 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-100 transition-colors">
            View All Activity
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-[#025864] rounded-3xl text-white">
          <h4 className="font-bold mb-2">Pending Withdrawals</h4>
          <p className="text-white/70 text-sm mb-6">There are 12 withdrawal requests waiting for approval.</p>
          <button className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all">
            Review All
          </button>
        </div>
        <div className="p-6 bg-red-600 rounded-3xl text-white">
          <h4 className="font-bold mb-2">Flagged Accounts</h4>
          <p className="text-white/70 text-sm mb-6">4 accounts have been flagged for suspicious activities.</p>
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
    </AdminLayout>
  );
};

export default AdminDashboard;
