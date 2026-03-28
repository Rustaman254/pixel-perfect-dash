import AdminLayout from "@/components/AdminLayout";
import { useState, useEffect } from "react";
import { fetchWithAuth, projectFetch, cn } from "@/lib/utils";
import { useProjectContext } from "@/contexts/ProjectContext";
import { TrendingUp, Users, CreditCard, DollarSign, ArrowUpRight, ArrowDownRight, ArrowLeftRight, Wallet, Calendar } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";

const COLORS = ['#025864', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6'];

const AdminAnalyticsPage = () => {
    const [data, setData] = useState<any>(null);
    const [period, setPeriod] = useState("30d");
    const [loading, setLoading] = useState(true);
    const { currentProject } = useProjectContext();

    const loadData = async () => {
        setLoading(true);
        try {
            const result = await projectFetch(currentProject.id, `analytics?period=${period}`);
            setData(result);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [period]);

    const fmtDate = (d: string) => d?.slice(5) || d;

    const revenueTrend = data?.revenueTrend?.map((i: any) => ({ date: fmtDate(i.date), revenue: i.revenue || 0, fees: i.fees || 0 })) || [];
    const volumeTrend = data?.volumeTrend?.map((i: any) => ({ date: fmtDate(i.date), volume: i.volume || 0, count: i.transactionCount || 0 })) || [];
    const userGrowth = data?.userGrowth?.map((i: any) => ({ date: fmtDate(i.date), users: i.newUsers || 0, sellers: i.newSellers || 0 })) || [];
    const payoutTrend = data?.payoutTrend?.map((i: any) => ({ date: fmtDate(i.date), payouts: i.totalPayouts || 0, count: i.payoutCount || 0 })) || [];
    const transferTrend = data?.transferTrend?.map((i: any) => ({ date: fmtDate(i.date), transfers: i.totalTransfers || 0, count: i.transferCount || 0 })) || [];
    const statusData = data?.statusBreakdown?.map((i: any) => ({ name: i.status, value: i.count, total: i.total })) || [];
    const paymentData = data?.paymentBreakdown?.map((i: any) => ({ name: i.name || 'KES', value: i.total || 0, count: i.count })) || [];

    const comp = data?.comparison;
    const revChange = comp?.lastMonth?.revenue > 0 ? (((comp.thisMonth.revenue - comp.lastMonth.revenue) / comp.lastMonth.revenue) * 100).toFixed(1) : '0';
    const txChange = comp?.lastMonth?.transactions > 0 ? (((comp.thisMonth.transactions - comp.lastMonth.transactions) / comp.lastMonth.transactions) * 100).toFixed(1) : '0';

    const periods = [
        { key: '7d', label: '7 Days' },
        { key: '30d', label: '30 Days' },
        { key: '90d', label: '90 Days' },
        { key: '1y', label: '1 Year' },
    ];

    return (
        <AdminLayout>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
                    <p className="text-slate-500">Detailed platform insights and trends</p>
                </div>
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                    {periods.map(p => (
                        <button
                            key={p.key}
                            onClick={() => setPeriod(p.key)}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                                period === p.key ? "bg-white shadow text-[#025864]" : "text-slate-500 hover:text-slate-700"
                            )}
                        >{p.label}</button>
                    ))}
                </div>
            </div>

            {/* Month Comparison Cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-xs text-slate-500 mb-1">This Month Revenue</p>
                    <p className="text-2xl font-bold text-slate-900">KES {Number(comp?.thisMonth?.revenue || 0).toLocaleString()}</p>
                    <div className={cn("flex items-center gap-1 text-xs font-bold mt-1", Number(revChange) >= 0 ? "text-emerald-600" : "text-red-600")}>
                        {Number(revChange) >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {revChange}% vs last month
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-xs text-slate-500 mb-1">This Month Transactions</p>
                    <p className="text-2xl font-bold text-slate-900">{comp?.thisMonth?.transactions || 0}</p>
                    <div className={cn("flex items-center gap-1 text-xs font-bold mt-1", Number(txChange) >= 0 ? "text-emerald-600" : "text-red-600")}>
                        {Number(txChange) >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {txChange}% vs last month
                    </div>
                </div>
            </div>

            {/* Revenue Trend */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm mb-6">
                <h3 className="font-bold text-slate-900 text-sm mb-4">Revenue & Fee Trends</h3>
                <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueTrend}>
                            <defs>
                                <linearGradient id="aRev" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#025864" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#025864" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="aFee" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                            <Tooltip />
                            <Legend />
                            <Area type="monotone" dataKey="revenue" stroke="#025864" strokeWidth={2} fill="url(#aRev)" name="Revenue (KES)" />
                            <Area type="monotone" dataKey="fees" stroke="#f59e0b" strokeWidth={2} fill="url(#aFee)" name="Fees (KES)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Volume + User Growth */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="font-bold text-slate-900 text-sm mb-4">Transaction Volume</h3>
                    <div className="h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={volumeTrend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                                <Tooltip />
                                <Bar dataKey="volume" fill="#025864" radius={[3, 3, 0, 0]} name="Volume (KES)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="font-bold text-slate-900 text-sm mb-4">User Growth</h3>
                    <div className="h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={userGrowth}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="users" stroke="#8b5cf6" strokeWidth={2} dot={false} name="New Users" />
                                <Line type="monotone" dataKey="sellers" stroke="#10b981" strokeWidth={2} dot={false} name="New Sellers" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Payouts + Transfers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="font-bold text-slate-900 text-sm mb-4">Payout Activity</h3>
                    <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={payoutTrend}>
                                <defs>
                                    <linearGradient id="aPay" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                                <Tooltip />
                                <Area type="monotone" dataKey="payouts" stroke="#10b981" strokeWidth={2} fill="url(#aPay)" name="Payouts (KES)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="font-bold text-slate-900 text-sm mb-4">Transfer Activity</h3>
                    <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={transferTrend}>
                                <defs>
                                    <linearGradient id="aTr" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                                <Tooltip />
                                <Area type="monotone" dataKey="transfers" stroke="#8b5cf6" strokeWidth={2} fill="url(#aTr)" name="Transfers (KES)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Status + Payment Breakdown + User Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="font-bold text-slate-900 text-sm mb-4">Transaction Status</h3>
                    <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
                                    {statusData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="font-bold text-slate-900 text-sm mb-4">Currency Breakdown</h3>
                    <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={paymentData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
                                    {paymentData.map((_: any, i: number) => <Cell key={i} fill={COLORS[(i+2) % COLORS.length]} />)}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="font-bold text-slate-900 text-sm mb-4">User Statistics</h3>
                    <div className="space-y-3 mt-4">
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                            <div className="flex items-center gap-2"><Users className="w-4 h-4 text-blue-500" /><span className="text-sm text-slate-600">Total Users</span></div>
                            <span className="text-sm font-bold text-slate-900">{data?.userStats?.total || 0}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                            <div className="flex items-center gap-2"><ArrowUpRight className="w-4 h-4 text-emerald-500" /><span className="text-sm text-slate-600">Verified</span></div>
                            <span className="text-sm font-bold text-emerald-600">{data?.userStats?.verified || 0}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                            <div className="flex items-center gap-2"><ArrowDownRight className="w-4 h-4 text-red-500" /><span className="text-sm text-slate-600">Disabled</span></div>
                            <span className="text-sm font-bold text-red-600">{data?.userStats?.disabled || 0}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                            <div className="flex items-center gap-2"><ArrowDownRight className="w-4 h-4 text-orange-500" /><span className="text-sm text-slate-600">Suspended</span></div>
                            <span className="text-sm font-bold text-orange-600">{data?.userStats?.suspended || 0}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Sellers Table */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-900 text-sm mb-4">Top Sellers by Revenue</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-50">
                                <th className="text-left font-medium p-3">#</th>
                                <th className="text-left font-medium p-3">Business</th>
                                <th className="text-left font-medium p-3">Email</th>
                                <th className="text-left font-medium p-3">Transactions</th>
                                <th className="text-left font-medium p-3">Revenue</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {(data?.topSellers || []).map((s: any, i: number) => (
                                <tr key={i} className="hover:bg-slate-50/50">
                                    <td className="p-3 text-xs font-bold text-slate-400">{i + 1}</td>
                                    <td className="p-3 text-sm font-medium text-slate-900">{s.businessName || s.fullName}</td>
                                    <td className="p-3 text-xs text-slate-500">{s.email}</td>
                                    <td className="p-3 text-xs font-bold text-slate-700">{s.transactionCount}</td>
                                    <td className="p-3 text-sm font-bold text-[#025864]">KES {Number(s.totalRevenue).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminAnalyticsPage;
