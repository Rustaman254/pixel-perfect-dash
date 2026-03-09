import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, PieChart, Pie, Tooltip, AreaChart, Area } from "recharts";
import { TrendingUp, Users, Globe, CreditCard, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchWithAuth } from "@/lib/api";
import { useAppContext } from "@/contexts/AppContext";

const AnalyticsPage = () => {
    const [timeRange, setTimeRange] = useState("30 Days");
    const [stats, setStats] = useState<any[]>([]);
    const [methodData, setMethodData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { links, transactions } = useAppContext();

    useEffect(() => {
        const loadAnalytics = async () => {
            try {
                const response = await fetchWithAuth('/transactions/stats');
                setStats(response.stats || []);
                
                if (response.methodStats) {
                    const colors = ["#025864", "#00D47E", "#047ce4", "#8b9eb0"];
                    const formatted = response.methodStats.map((m: any, i: number) => ({
                        name: m.name,
                        value: m.count,
                        color: colors[i % colors.length]
                    }));
                    setMethodData(formatted);
                }
            } catch (err) {
                console.error("Failed to load analytics:", err);
            } finally {
                setLoading(false);
            }
        };
        loadAnalytics();
    }, []);

    const totalRevenue = stats.reduce((acc, curr) => acc + curr.revenue, 0);
    const successfulTransactions = transactions.filter(t => t.status === 'Completed' || t.status === 'Funds locked' || t.status === 'Shipped').length;
    const totalCustomers = new Set(transactions.map(t => t.buyerEmail)).size;
    const totalClicks = links.reduce((acc, l) => acc + (l.clicks || 0), 0);
    
    const revenueChartData = stats.map(s => ({
        name: s.date.split('-').slice(1).join('/'),
        revenue: s.revenue
    }));

    const countriesCount = new Set(transactions.map(t => t.currency)).size || 1; // Simplistic proxy for countries

    return (
        <DashboardLayout>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h1 className="text-xl md:text-2xl font-bold text-foreground">Analytics</h1>
                <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
                    {["30 Days", "90 Days", "12 Months", "All Time"].map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={cn(
                                "text-xs px-3 py-1.5 rounded-md transition-all",
                                timeRange === range 
                                    ? "bg-white text-foreground shadow-sm font-medium" 
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-card rounded-2xl p-5 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4" style={{ color: '#025864' }} />
                        <p className="text-sm text-muted-foreground">Revenue</p>
                    </div>
                    <h3 className="text-xl font-bold text-foreground">KES {totalRevenue.toLocaleString()}</h3>
                    <span className="text-xs font-medium text-success">Live</span>
                </div>
                <div className="bg-card rounded-2xl p-5 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4" style={{ color: '#025864' }} />
                        <p className="text-sm text-muted-foreground">Customers</p>
                    </div>
                    <h3 className="text-xl font-bold text-foreground">{totalCustomers.toLocaleString()}</h3>
                    <span className="text-xs font-medium text-success">Unique</span>
                </div>
                <div className="bg-card rounded-2xl p-5 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                        <CreditCard className="w-4 h-4" style={{ color: '#025864' }} />
                        <p className="text-sm text-muted-foreground">Transactions</p>
                    </div>
                    <h3 className="text-xl font-bold text-foreground">{successfulTransactions.toLocaleString()}</h3>
                    <span className="text-xs font-medium text-success">Successful</span>
                </div>
                <div className="bg-card rounded-2xl p-5 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                        <Globe className="w-4 h-4" style={{ color: '#025864' }} />
                        <p className="text-sm text-muted-foreground">Link Clicks</p>
                    </div>
                    <h3 className="text-xl font-bold text-foreground">{totalClicks.toLocaleString()}</h3>
                    <span className="text-xs font-medium text-success">Engagement</span>
                </div>
            </div>

            {/* Revenue Chart */}
            <div className="bg-card rounded-2xl p-5 border border-border mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground">Revenue Over Time</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                        <Calendar className="w-3 h-3" />
                        <span>Showing {timeRange}</span>
                    </div>
                </div>
                <div className="h-[280px]">
                    {revenueChartData.length === 0 ? (
                        <div className="h-full flex items-center justify-center border border-dashed border-border rounded-xl">
                            <p className="text-sm text-muted-foreground">No revenue data available yet.</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueChartData}>
                                <defs>
                                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#025864" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#025864" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `KES ${v}`} />
                                <Tooltip formatter={(value: number) => [`KES ${value.toLocaleString()}`, "Revenue"]} />
                                <Area type="monotone" dataKey="revenue" stroke="#025864" strokeWidth={2} fill="url(#revenueGrad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Payment Method Breakdown */}
                <div className="bg-card rounded-2xl p-5 border border-border">
                    <h3 className="font-semibold text-foreground mb-4">Currency Distribution</h3>
                    {methodData.length === 0 ? (
                        <div className="h-[140px] flex items-center justify-center border border-dashed border-border rounded-xl">
                             <p className="text-sm text-muted-foreground">No data yet.</p>
                        </div>
                    ) : (
                        <div className="flex items-center gap-6">
                            <div className="w-[140px] h-[140px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={methodData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" stroke="none">
                                            {methodData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-3 flex-1">
                                {methodData.map((m) => (
                                    <div key={m.name} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: m.color }} />
                                            <span className="text-sm text-foreground">{m.name}</span>
                                        </div>
                                        <span className="text-sm font-medium text-foreground">{m.value} txns</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Engagement Breakdown */}
                <div className="bg-card rounded-2xl p-5 border border-border">
                    <h3 className="font-semibold text-foreground mb-4">Link Engagement</h3>
                    <div className="space-y-4">
                        {links.slice(0, 5).map((link) => (
                            <div key={link.id} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-foreground font-medium truncate max-w-[200px]">{link.name}</span>
                                    <span className="text-muted-foreground">{link.clicks} clicks</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-1.5">
                                    <div 
                                        className="h-1.5 rounded-full" 
                                        style={{ 
                                            width: `${Math.min((link.clicks / (totalClicks || 1)) * 100, 100)}%`, 
                                            backgroundColor: '#025864' 
                                        }} 
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AnalyticsPage;
