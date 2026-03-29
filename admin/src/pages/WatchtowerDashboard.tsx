import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { projectFetch, cn } from "@/lib/utils";
import { Activity, Eye, MousePointer, MousePointerClick, Timer, Users, Globe, Monitor, Chrome, Loader2, TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#ec4899"];

const WatchtowerDashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [statsData, analyticsData] = await Promise.all([
        projectFetch("watchtower", "stats"),
        projectFetch("watchtower", "analytics?period=30d"),
      ]);
      setStats(statsData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error("Failed to load watchtower data:", error);
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
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      </AdminLayout>
    );
  }

  const sessionsChartData = analytics?.sessionsOverTime?.map((item: any) => ({
    date: item.date?.slice(5),
    sessions: parseInt(item.sessions) || 0,
    pageViews: parseInt(item.pageViews) || 0,
  })) || [];

  const deviceData = analytics?.deviceBreakdown?.map((item: any) => ({
    name: item.device || "Unknown",
    value: parseInt(item.count) || 0,
  })) || [];

  const browserData = analytics?.browserBreakdown?.map((item: any) => ({
    name: item.browser || "Unknown",
    value: parseInt(item.count) || 0,
  })) || [];

  const countryData = analytics?.countryBreakdown?.map((item: any) => ({
    name: item.country || "Unknown",
    value: parseInt(item.count) || 0,
  })) || [];

  const statCards = [
    { title: "Total Sessions", value: stats?.totalSessions || 0, icon: Activity, color: "bg-purple-50 text-purple-600" },
    { title: "Total Page Views", value: stats?.totalPageViews || 0, icon: Eye, color: "bg-blue-50 text-blue-600" },
    { title: "Unique Users", value: stats?.uniqueUsers || 0, icon: Users, color: "bg-emerald-50 text-emerald-600" },
    { title: "Avg Duration", value: `${stats?.avgDuration || 0}s`, icon: Timer, color: "bg-amber-50 text-amber-600" },
    { title: "Rage Clicks", value: stats?.totalRageClicks || 0, icon: MousePointerClick, color: "bg-red-50 text-red-600" },
    { title: "Dead Clicks", value: stats?.totalDeadClicks || 0, icon: MousePointer, color: "bg-orange-50 text-orange-600" },
    { title: "Today Sessions", value: stats?.todaySessions || 0, icon: TrendingUp, color: "bg-indigo-50 text-indigo-600" },
    { title: "Total Events", value: analytics?.totalEvents || 0, icon: Globe, color: "bg-cyan-50 text-cyan-600" },
  ];

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Watchtower Overview</h1>
          <p className="text-sm text-slate-500">Real-time analytics & behavioral insights</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-600 rounded-full text-xs font-bold animate-pulse">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500" /> Live
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
          <h3 className="font-bold text-slate-900 text-sm mb-4">Sessions Over Time (30d)</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sessionsChartData}>
                <defs>
                  <linearGradient id="sessGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <Tooltip />
                <Area type="monotone" dataKey="sessions" stroke="#8b5cf6" strokeWidth={2} fill="url(#sessGrad)" name="Sessions" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-900 text-sm mb-4">Page Views (30d)</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sessionsChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <Tooltip />
                <Bar dataKey="pageViews" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Page Views" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-900 text-sm mb-4">Devices</h3>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={deviceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {deviceData.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-900 text-sm mb-4">Browsers</h3>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={browserData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {browserData.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-900 text-sm mb-4">Top Countries</h3>
          <div className="space-y-2 max-h-[180px] overflow-y-auto">
            {countryData.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">No data yet</div>
            ) : (
              countryData.slice(0, 8).map((c: any, i: number) => {
                const total = countryData.reduce((sum: number, item: any) => sum + item.value, 0);
                const pct = total > 0 ? ((c.value / total) * 100).toFixed(1) : 0;
                return (
                  <div key={i} className="flex items-center gap-2">
                    <Globe className="w-3 h-3 text-slate-400" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-slate-700 truncate">{c.name}</p>
                        <span className="text-[10px] font-bold text-slate-500">{pct}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1 mt-0.5">
                        <div className="bg-purple-500 h-1 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Rage Clicks / Dead Clicks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
            <MousePointerClick className="w-4 h-4 text-red-500" /> Rage Click Targets
          </h3>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {analytics?.rageClicksByTarget?.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">No rage clicks detected</div>
            ) : (
              analytics?.rageClicksByTarget?.map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                  <span className="text-xs font-mono text-slate-700 truncate max-w-[200px]">{item.target}</span>
                  <span className="text-[10px] font-bold text-red-600">{item.count}</span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
            <MousePointer className="w-4 h-4 text-orange-500" /> Dead Click Targets
          </h3>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {analytics?.deadClicksByTarget?.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">No dead clicks detected</div>
            ) : (
              analytics?.deadClicksByTarget?.map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
                  <span className="text-xs font-mono text-slate-700 truncate max-w-[200px]">{item.target}</span>
                  <span className="text-[10px] font-bold text-orange-600">{item.count}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default WatchtowerDashboard;
