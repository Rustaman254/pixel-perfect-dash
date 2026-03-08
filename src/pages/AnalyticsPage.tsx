import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, PieChart, Pie, Tooltip, AreaChart, Area } from "recharts";
import { TrendingUp, Users, Globe, CreditCard, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

const revenueData = [
    { name: "Jan", revenue: 12400 }, { name: "Feb", revenue: 18200 }, { name: "Mar", revenue: 22800 },
    { name: "Apr", revenue: 19600 }, { name: "May", revenue: 28400 }, { name: "Jun", revenue: 32100 },
    { name: "Jul", revenue: 29800 }, { name: "Aug", revenue: 35600 }, { name: "Sep", revenue: 31200 },
    { name: "Oct", revenue: 38400 }, { name: "Nov", revenue: 42100 }, { name: "Dec", revenue: 48320 },
];

const methodData = [
    { name: "M-Pesa", value: 35, color: "#025864" },
    { name: "Card", value: 40, color: "#00D47E" },
    { name: "Crypto", value: 15, color: "#047ce4" },
    { name: "Bank", value: 10, color: "#8b9eb0" },
];

const geoData = [
    { name: "Kenya", value: 32, flag: "🇰🇪" },
    { name: "USA", value: 28, flag: "🇺🇸" },
    { name: "UK", value: 15, flag: "🇬🇧" },
    { name: "Nigeria", value: 12, flag: "🇳🇬" },
    { name: "UAE", value: 8, flag: "🇦🇪" },
    { name: "Others", value: 5, flag: "🌍" },
];

const dailyVisitors = [
    { name: "Mon", visitors: 1240 }, { name: "Tue", visitors: 1580 }, { name: "Wed", visitors: 1820 },
    { name: "Thu", visitors: 1460 }, { name: "Fri", visitors: 2100 }, { name: "Sat", visitors: 980 },
    { name: "Sun", visitors: 720 },
];

const AnalyticsPage = () => {
    const [timeRange, setTimeRange] = useState("12 Months");

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
                    <h3 className="text-xl font-bold text-foreground">$358,920</h3>
                    <span className="text-xs font-medium text-success">+22.4% ↑</span>
                </div>
                {/* ... other metrics ... */}
                <div className="bg-card rounded-2xl p-5 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4" style={{ color: '#025864' }} />
                        <p className="text-sm text-muted-foreground">Customers</p>
                    </div>
                    <h3 className="text-xl font-bold text-foreground">2,847</h3>
                    <span className="text-xs font-medium text-success">+15.3% ↑</span>
                </div>
                <div className="bg-card rounded-2xl p-5 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                        <CreditCard className="w-4 h-4" style={{ color: '#025864' }} />
                        <p className="text-sm text-muted-foreground">Transactions</p>
                    </div>
                    <h3 className="text-xl font-bold text-foreground">12,483</h3>
                    <span className="text-xs font-medium text-success">+8.7% ↑</span>
                </div>
                <div className="bg-card rounded-2xl p-5 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                        <Globe className="w-4 h-4" style={{ color: '#025864' }} />
                        <p className="text-sm text-muted-foreground">Countries</p>
                    </div>
                    <h3 className="text-xl font-bold text-foreground">24</h3>
                    <span className="text-xs font-medium text-success">+3 new</span>
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
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueData}>
                            <defs>
                                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#025864" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#025864" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                            <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]} />
                            <Area type="monotone" dataKey="revenue" stroke="#025864" strokeWidth={2} fill="url(#revenueGrad)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Payment Method Breakdown */}
                <div className="bg-card rounded-2xl p-5 border border-border">
                    <h3 className="font-semibold text-foreground mb-4">Payment Methods</h3>
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
                                    <span className="text-sm font-medium text-foreground">{m.value}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Geographic Distribution */}
                <div className="bg-card rounded-2xl p-5 border border-border">
                    <h3 className="font-semibold text-foreground mb-4">Top Regions</h3>
                    <div className="space-y-3">
                        {geoData.map((g) => (
                            <div key={g.name} className="flex items-center gap-3">
                                <span className="text-lg">{g.flag}</span>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm text-foreground">{g.name}</span>
                                        <span className="text-sm font-medium text-foreground">{g.value}%</span>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-1.5">
                                        <div className="h-1.5 rounded-full" style={{ width: `${g.value}%`, backgroundColor: '#025864' }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Daily Visitors */}
            <div className="bg-card rounded-2xl p-5 border border-border">
                <h3 className="font-semibold text-foreground mb-4">Daily Visitors (This Week)</h3>
                <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dailyVisitors}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                            <Tooltip />
                            <Bar dataKey="visitors" radius={[6, 6, 0, 0]} fill="#00D47E" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AnalyticsPage;
