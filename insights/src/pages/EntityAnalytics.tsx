import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { fetchWithAuth } from "@/lib/api";
import { ArrowLeft, BarChart3, TrendingUp, Users, Clock, MousePointer2, Activity, Target, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const EntityAnalytics = () => {
    const { id } = useParams();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchEntityAnalytics = async () => {
        try {
            const response = await fetchWithAuth(`/insights/entity/${id}?type=payment-link`);
            setData(response);
        } catch (err: any) {
            console.error("Failed to fetch entity analytics:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEntityAnalytics();
    }, [id]);

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-[500px]">
                    <p className="animate-pulse text-indigo-600 font-medium text-sm">Quantifying entity performance...</p>
                </div>
            </DashboardLayout>
        );
    }

    const funnelData = [
        { step: "Impression", count: data?.sessionCount || 0, percentage: "100%", description: "Users viewed the link" },
        { step: "Interaction", count: Math.round((data?.sessionCount || 0) * 0.65), percentage: "65%", description: "Hover or scroll activity" },
        { step: "Intent", count: Math.round((data?.sessionCount || 0) * 0.32), percentage: "32%", description: "Clicked 'Pay Now' or input fields" },
        { step: "Conversion", count: Math.round((data?.sessionCount || 0) * 0.12), percentage: "12%", description: "Successful payments" },
    ];

    return (
        <DashboardLayout>
            <div className="mb-8">
                <a href="http://localhost:5173/payment-links" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 mb-4 transition-colors font-medium">
                    <ArrowLeft className="w-4 h-4" /> Back to Ripplify
                </a>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                             <Target className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Entity Analysis</h1>
                            <p className="text-slate-500 text-sm">Performance funnel for Entity <span className="font-mono text-indigo-600 bg-indigo-50 px-1 rounded">#{id?.substring(0, 8)}</span></p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border border-emerald-100">
                            <TrendingUp className="w-4 h-4" /> +12.4% Performance
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
                {/* Funnel Table */}
                <div className="lg:col-span-12 xl:col-span-4 space-y-4">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-full">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">Performance Funnel</h3>
                        <div className="space-y-8">
                            {funnelData.map((item, index) => (
                                <div key={item.step} className="relative group">
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <span className="text-sm font-bold text-slate-800">{item.step}</span>
                                            <p className="text-[10px] text-slate-400 font-medium">{item.description}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm font-bold text-slate-900">{item.count}</span>
                                            <span className="text-[10px] text-slate-400 ml-2 font-mono">({item.percentage})</span>
                                        </div>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-indigo-600 transition-all duration-1000 group-hover:bg-indigo-500" 
                                            style={{ width: item.percentage, opacity: 1 - (index * 0.15) }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-8 pt-6 border-t border-slate-50">
                            <div className="flex items-center justify-between p-4 bg-indigo-50/50 rounded-2xl">
                                <span className="text-xs font-bold text-slate-500">Overall Drop-off</span>
                                <span className="text-lg font-bold text-indigo-600">88%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="lg:col-span-12 xl:col-span-8 flex flex-col gap-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm group hover:border-indigo-100 transition-all">
                            <div className="p-2 w-fit bg-blue-50 text-blue-600 rounded-lg mb-4 group-hover:scale-110 transition-transform">
                                <Users className="w-4 h-4" />
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Reach</p>
                            <h4 className="text-xl font-bold text-slate-900">{data?.sessionCount || 0}</h4>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm group hover:border-indigo-100 transition-all">
                            <div className="p-2 w-fit bg-amber-50 text-amber-600 rounded-lg mb-4 group-hover:scale-110 transition-transform">
                                <Clock className="w-4 h-4" />
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Engagement Time</p>
                            <h4 className="text-xl font-bold text-slate-900">2m 45s</h4>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm group hover:border-indigo-100 transition-all">
                            <div className="p-2 w-fit bg-red-50 text-red-600 rounded-lg mb-4 group-hover:scale-110 transition-transform">
                                <Activity className="w-4 h-4" />
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Friction Events</p>
                            <h4 className="text-xl font-bold text-slate-900">14</h4>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex-1">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-indigo-500" />
                                Session Context
                            </h3>
                            <button className="text-xs font-bold text-indigo-600 hover:underline">View All</button>
                        </div>
                        <div className="space-y-1">
                            {(data?.sessions || []).slice(0, 5).map((session: any) => (
                                <div key={session.id} className="p-4 flex items-center justify-between rounded-xl hover:bg-slate-50 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                                            <Users className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">Session {session.sessionId.substring(0, 8)}</p>
                                            <p className="text-[11px] font-medium text-slate-400 uppercase">{session.country || 'Unknown'} · {session.duration}s · {session.browser}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                         {session.isRageClick === 1 && <Zap className="w-4 h-4 text-red-400" title="Rage Clicks" />}
                                         <a 
                                            href={`/sessions`} 
                                            className="text-[10px] font-bold text-white bg-slate-900 px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all transform translate-x-1 group-hover:translate-x-0 overflow-hidden"
                                        >
                                            Watch
                                        </a>
                                    </div>
                                </div>
                            ))}
                            {(!data?.sessions || data?.sessions.length === 0) && (
                                <div className="py-20 flex flex-col items-center justify-center text-center opacity-40">
                                    <BarChart3 className="w-12 h-12 mb-4" />
                                    <p className="text-sm font-medium">No behavioral correlations yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default EntityAnalytics;
