import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, BarChart, Bar } from "recharts";
import { fetchWithAuth } from "@/lib/api";
import { Users, MousePointer2, Clock, Zap, BarChart3, ArrowRight, MousePointerClick, TrendingUp, Tablet, Monitor, Smartphone, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

const InsightsOverview = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchOverview = async () => {
        try {
            const response = await fetchWithAuth('/insights/overview');
            setData(response);
        } catch (err: any) {
            console.error("Failed to fetch insights overview:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOverview();
    }, []);

    const stats = data?.stats || { totalSessions: 0, totalPageViews: 0, avgDuration: 0, totalRageClicks: 0 };
    const chartData = data?.sessionsOverTime || [];
    
    const advancedMetrics = [
        { label: "Dead Clicks", value: "8.2%", color: "text-amber-500" },
        { label: "Rage Clicks", value: stats.totalRageClicks, color: "text-red-500" },
        { label: "Excessive Scrolling", value: "12%", color: "text-indigo-500" },
        { label: "Quick Backs", value: "4.5%", color: "text-slate-500" },
    ];

    const deviceStats = [
        { name: 'Desktop', value: 65, icon: Monitor },
        { name: 'Mobile', value: 28, icon: Smartphone },
        { name: 'Tablet', value: 7, icon: Tablet },
    ];

    const summaryCards = [
        { title: "Total Sessions", value: stats.totalSessions.toLocaleString(), trend: "+12%", icon: Users, color: "bg-indigo-50 text-indigo-600" },
        { title: "Avg. Duration", value: `${stats.avgDuration}s`, trend: "-5%", icon: Clock, color: "bg-emerald-50 text-emerald-600" },
        { title: "Click Conversion", value: "24.2%", trend: "+2%", icon: MousePointerClick, color: "bg-blue-50 text-blue-600" },
        { title: "User Retention", value: "68%", trend: "+8%", icon: TrendingUp, color: "bg-violet-50 text-violet-600" },
    ];

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-[500px]">
                    <p className="animate-pulse text-indigo-600 font-medium">Analyzing user behavioral patterns...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
                    <p className="text-slate-500 text-sm">Real-time behavioral insights and session metrics.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                {String.fromCharCode(64 + i)}
                            </div>
                        ))}
                    </div>
                    <Link 
                        to="/sessions" 
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all text-sm font-bold shadow-sm shadow-indigo-200"
                    >
                        Analyze Sessions <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {summaryCards.map((card) => (
                    <div key={card.title} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex items-center justify-between mb-4">
                            <div className={cn("p-2.5 rounded-xl transition-transform group-hover:scale-110", card.color)}>
                                <card.icon className="w-5 h-5" />
                            </div>
                            <span className={cn(
                                "text-[10px] font-bold px-2 py-0.5 rounded-full",
                                card.trend.startsWith('+') ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                            )}>
                                {card.trend}
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">{card.title}</p>
                        <h3 className="text-2xl font-bold text-slate-900">{card.value}</h3>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-indigo-500" />
                            Session Activity
                        </h3>
                        <div className="flex bg-slate-50 p-1 rounded-lg">
                            <button className="px-3 py-1 text-xs font-bold bg-white text-indigo-600 rounded-md shadow-sm">Historical</button>
                            <button className="px-3 py-1 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors">Real-time</button>
                        </div>
                    </div>
                    <div className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/>
                                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="date" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 10, fontWeight: 600, fill: '#94a3b8'}}
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 10, fontWeight: 600, fill: '#94a3b8'}}
                                />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: '#fff', 
                                        borderRadius: '12px', 
                                        border: '1px solid #e2e8f0',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                        fontSize: '12px',
                                        fontWeight: 'bold'
                                    }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="count" 
                                    stroke="#4f46e5" 
                                    strokeWidth={3} 
                                    fillOpacity={1} 
                                    fill="url(#colorSessions)" 
                                    animationDuration={1500}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                             <Zap className="w-4 h-4 text-amber-500" />
                             Insights
                        </h3>
                        <div className="space-y-4">
                            {advancedMetrics.map(m => (
                                <div key={m.label} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-slate-50 hover:bg-slate-50 transition-colors">
                                    <span className="text-sm font-medium text-slate-600">{m.label}</span>
                                    <span className={cn("text-sm font-bold", m.color)}>{m.value}</span>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all">
                            View Friction Report
                        </button>
                    </div>

                    <div className="bg-indigo-600 p-6 rounded-2xl shadow-lg shadow-indigo-100 text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="font-bold text-lg mb-2">Live Replays</h3>
                            <p className="text-indigo-100 text-xs mb-4">Watch real users navigate your store in real-time.</p>
                            <Link 
                                to="/sessions" 
                                className="inline-flex items-center justify-center w-full py-2 bg-white text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-50 transition-colors"
                            >
                                Launch Player
                            </Link>
                        </div>
                        <div className="absolute -right-4 -bottom-4 opacity-10">
                            <BarChart3 size={120} />
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default InsightsOverview;
