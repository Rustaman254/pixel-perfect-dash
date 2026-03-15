import { 
  Users, MousePointer, Clock, Activity, ArrowUpRight, 
  ArrowDownRight, Smartphone, Monitor, Globe, Search,
  Zap, ShieldAlert, Sparkles, Wand2, Link2
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api";
import { cn } from "@/lib/utils";
import usePageTitle from "@/hooks/usePageTitle";
import HistoryTable from "@/components/dashboard/HistoryTable";
import { useNavigate } from "react-router-dom";

const WatchtowerOverview = () => {
  usePageTitle("Overview");
  const navigate = useNavigate();

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ["watchtower-overview"],
    queryFn: () => fetchWithAuth("/watchtower/overview"),
    refetchInterval: 5000,
  });

  const { data: features, isLoading: featuresLoading } = useQuery({
    queryKey: ["watchtower-features"],
    queryFn: () => fetchWithAuth("/watchtower/features"),
    refetchInterval: 5000,
  });

  const { data: sessions } = useQuery({
    queryKey: ["watchtower-sessions"],
    queryFn: () => fetchWithAuth("/watchtower/sessions?limit=200"),
    refetchInterval: 5000,
  });

  const { data: products } = useQuery({
    queryKey: ["watchtower-products"],
    queryFn: () => fetchWithAuth("/watchtower/products"),
    refetchInterval: 5000,
  });

  const stats = [
    { label: "Total Revenue", value: `$${(overview?.stats?.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: Zap, change: "", color: "indigo" },
    { label: "Conversion Rate", value: `${overview?.stats?.conversionRate || 0}%`, icon: Sparkles, change: "", color: "emerald" },
    { label: "Avg. Scroll", value: `${overview?.stats?.avgScrollDepth || 0}%`, icon: ArrowDownRight, change: "", color: "amber" },
    { label: "Rage Clicks", value: overview?.stats?.totalRageClicks || 0, icon: Activity, change: "", color: "rose" },
    { label: "Dead Clicks", value: overview?.stats?.totalDeadClicks || 0, icon: MousePointer, change: "", color: "slate" },
    { label: "Total Sessions", value: overview?.stats?.totalSessions || 0, icon: Users, change: "", color: "indigo" },
    { label: "Link Clicks", value: overview?.stats?.totalLinkClicks || 0, icon: Link2, change: "", color: "emerald" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Intelligence Overview</h1>
            <p className="text-slate-500 mt-1 font-medium">Predictive behavioral analysis for your web application.</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-sm font-bold text-indigo-700">Live Traffic</span>
             </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center",
                  stat.color === 'indigo' ? "bg-indigo-50 text-indigo-600" :
                  stat.color === 'emerald' ? "bg-emerald-50 text-emerald-600" :
                  stat.color === 'slate' ? "bg-slate-50 text-slate-600" :
                  stat.color === 'amber' ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
                )}>
                  <stat.icon className="w-6 h-6" />
                </div>
                {stat.change && (
                  <span className={cn(
                    "text-xs font-bold px-2 py-1 rounded-lg",
                    stat.change.startsWith('+') ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                  )}>
                    {stat.change}
                  </span>
                )}
              </div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{stat.value}</h3>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart */}
          <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                 <Sparkles className="w-5 h-5 text-indigo-500" />
                 Engagement Trends
              </h3>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={overview?.sessionsOverTime || []}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#6366f1" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorCount)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Feature Health / Insights */}
          <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-800">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-indigo-400" />
                Feature Analysis
            </h3>
            <div className="space-y-4">
               {featuresLoading ? (
                 <div className="text-slate-500 text-sm animate-pulse">Analyzing interactions...</div>
               ) : features?.length > 0 ? (
                 features.slice(0, 5).map((feature: any, i: number) => (
                    <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-400 truncate max-w-[150px]">{feature.target}</span>
                            <span className={cn(
                                "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded",
                                feature.color === 'emerald' ? "bg-emerald-500/20 text-emerald-400" :
                                feature.color === 'amber' ? "bg-amber-500/20 text-amber-400" :
                                feature.color === 'indigo' ? "bg-indigo-500/20 text-indigo-400" : "bg-rose-500/20 text-rose-400"
                            )}>
                                {feature.recommendation}
                            </span>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                            <span>{feature.usages} Uses</span>
                            {feature.rageClicks > 0 && <span className="text-rose-400">{feature.rageClicks} Rage</span>}
                        </div>
                    </div>
                 ))
               ) : (
                 <div className="p-8 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
                    <Zap className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                    <p className="text-xs text-slate-500">Collect more data to generate insights.</p>
                 </div>
               )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Product Performance Correlation */}
          <div className="lg:col-span-3 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                   <Zap className="w-5 h-5 text-amber-500" />
                   Product Performance
                </h3>
                <p className="text-sm text-slate-500 font-medium">Correlation between behavioral interest and actual sales.</p>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-50">
                    <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Product</th>
                    <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Visits</th>
                    <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Clicks</th>
                    <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Sales</th>
                    <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Conv. Rate</th>
                    <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {products?.map((product: any) => (
                    <tr key={product.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="py-4">
                        <div className="font-bold text-slate-900">{product.name}</div>
                        <div className="text-[10px] text-slate-400 font-medium">/{product.slug}</div>
                      </td>
                      <td className="py-4 text-sm font-bold text-slate-600">{product.visits}</td>
                      <td className="py-4 text-sm font-bold text-slate-600">{product.clicks}</td>
                      <td className="py-4 text-sm font-bold text-indigo-600">{product.sales}</td>
                      <td className="py-4 text-sm font-bold text-slate-900">{product.conversionRate}%</td>
                      <td className="py-4 text-right">
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg",
                          product.health === 'Healthy' ? "bg-emerald-50 text-emerald-600" :
                          product.health === 'Needs Attention' ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
                        )}>
                          {product.health}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* History Table */}
        <HistoryTable 
            sessions={sessions || []} 
            onRowClick={(s) => navigate(`/sessions?id=${s.sessionId}`)} 
        />
      </div>
    </DashboardLayout>
  );
};

export default WatchtowerOverview;
