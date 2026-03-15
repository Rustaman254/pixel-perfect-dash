import { 
  Users, MousePointer, Activity, Zap, Sparkles, Globe, 
  LayoutGrid, BarChart3, TrendingUp, ShieldCheck
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api";
import { cn } from "@/lib/utils";
import usePageTitle from "@/hooks/usePageTitle";

const AdminOverview = () => {
  usePageTitle("Platform Overview");

  const { data: platformData, isLoading } = useQuery({
    queryKey: ["platform-overview"],
    queryFn: () => fetchWithAuth("/watchtower/platform-overview"),
    refetchInterval: 10000,
  });

  const stats = [
    { label: "Platform Revenue", value: `$${(platformData?.platformStats?.totalRevenue || 0).toLocaleString()}`, icon: TrendingUp, color: "emerald" },
    { label: "Total Sessions", value: platformData?.platformStats?.totalSessions || 0, icon: Users, color: "indigo" },
    { label: "Active Sellers", value: platformData?.platformStats?.activeSellers || 0, icon: LayoutGrid, color: "amber" },
    { label: "Rage Clicks (Global)", value: platformData?.platformStats?.totalRageClicks || 0, icon: Activity, color: "rose" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-indigo-600" />
              Platform Watchtower
            </h1>
            <p className="text-slate-500 mt-1 font-medium">Global governance and performance monitoring for all Ripplify applications.</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center mb-6",
                stat.color === 'emerald' ? "bg-emerald-50 text-emerald-600" :
                stat.color === 'indigo' ? "bg-indigo-50 text-indigo-600" :
                stat.color === 'amber' ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
              )}>
                <stat.icon className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{stat.value}</h3>
            </div>
          ))}
        </div>

        {/* App Status Section */}
        <div className="bg-slate-900 p-10 rounded-[3rem] text-white">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
            <Globe className="w-6 h-6 text-indigo-400" />
             Managed Applications
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {platformData?.apps?.map((app: any) => (
              <div key={app.slug} className="p-6 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-all group">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg">{app.name}</h3>
                  <div className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                    app.isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                  )}>
                    {app.isActive ? 'Healthy' : 'Degraded'}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-xs mb-6">
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>/{app.slug}</span>
                </div>
                <button className="w-full py-3 bg-white/10 group-hover:bg-indigo-600 text-white rounded-2xl text-xs font-bold transition-all">
                  VIEW INSTANCE
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminOverview;
