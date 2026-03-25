import DashboardLayout from "@/components/dashboard/DashboardLayout";
import FeatureGuard from "@/components/FeatureGuard";
import usePageTitle from "@/hooks/usePageTitle";
import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip, AreaChart, Area, PieChart, Pie } from "recharts";
import { fetchWithAuth } from "@/lib/api";
import { TrendingUp, DollarSign, ShoppingBag, CreditCard, ArrowUpRight, ArrowDownRight, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

const StatisticsPage = () => {
    usePageTitle("Statistics");
    const [data, setData] = useState<any[]>([]);
    const [methodStats, setMethodStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState("30d");

    const fetchStats = async () => {
        try {
            const response = await fetchWithAuth('/transactions/stats');
            setData(response.stats || []);
            setMethodStats(response.methodStats || []);
        } catch (err: any) {
            console.error("Failed to fetch stats:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const totalRevenue = data.reduce((acc, curr) => acc + curr.revenue, 0);
    const totalCount = data.reduce((acc, curr) => acc + curr.count, 0);
    const successfulCount = data.reduce((acc, curr) => acc + (curr.successfulCount || 0), 0);
    const successRate = totalCount > 0 ? (successfulCount / totalCount * 100).toFixed(1) : "0";
    const avgValue = successfulCount > 0 ? totalRevenue / successfulCount : 0;

    const summaryCards = [
        { title: "Total Revenue", value: `KES ${totalRevenue.toLocaleString()}`, icon: DollarSign, color: "bg-emerald-50 text-emerald-600", trend: "+100%" },
        { title: "Successful Transactions", value: successfulCount, icon: ShoppingBag, color: "bg-blue-50 text-blue-600", trend: "Live" },
        { title: "Avg. Transaction Value", value: `KES ${avgValue.toFixed(0)}`, icon: TrendingUp, color: "bg-indigo-50 text-indigo-600", trend: "Calculated" },
        { title: "Success Rate", value: `${successRate}%`, icon: CreditCard, color: "bg-orange-50 text-orange-600", trend: "Real-time" },
    ];

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-[500px]">
                    <p className="animate-pulse text-muted-foreground">Generating financial insights...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <FeatureGuard featureKey="analytics">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Statistics & Insights</h1>
                    <p className="text-muted-foreground">Detailed breakdown of your business performance.</p>
                </div>
                <div className="flex bg-muted/30 p-1 rounded-xl">
                    {["7d", "30d", "90d", "All"].map((t) => (
                        <button
                            key={t}
                            onClick={() => setTimeframe(t)}
                            className={cn(
                                "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                                timeframe === t ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {summaryCards.map((card) => (
                    <div key={card.title} className="bg-card p-6 rounded-3xl border border-border shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className={cn("p-3 rounded-2xl", card.color)}>
                                <card.icon className="w-5 h-5" />
                            </div>
                            <span className={cn(
                                "text-[10px] font-bold px-2 py-0.5 rounded-full",
                                card.trend.startsWith('+') || card.trend === 'Live' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                            )}>{card.trend}</span>
                        </div>
                        <p className="text-xs text-muted-foreground font-medium mb-1">{card.title}</p>
                        <h3 className="text-xl font-bold text-foreground">{card.value}</h3>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-2 bg-card p-6 rounded-3xl border border-border">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="font-bold text-foreground">Revenue Over Time</h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Showing last {data.length} active days</span>
                        </div>
                    </div>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#025864" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#025864" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10}} tickFormatter={v => v.split('-').slice(1).join('/')} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} tickFormatter={v => `KES ${v}`} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '16px', border: '1px solid hsl(var(--border))' }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#025864" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-card p-6 rounded-3xl border border-border">
                    <h3 className="font-bold text-foreground mb-6">Payment Activity</h3>
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                <XAxis dataKey="date" hide />
                                <YAxis hide />
                                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '16px', border: '1px solid hsl(var(--border))' }} />
                                <Bar dataKey="count" fill="#00D47E" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-400" /> Successful
                            </span>
                            <span className="text-xs font-bold font-mono">100%</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-amber-400" /> Pending
                            </span>
                            <span className="text-xs font-bold font-mono">0%</span>
                        </div>
                    </div>
                </div>
            </div>
            </FeatureGuard>
        </DashboardLayout>
    );
};

export default StatisticsPage;
