import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useState, useEffect } from "react";
import { fetchWithAuth } from "@/lib/api";
import { 
    Search, Monitor, Smartphone, Globe, ExternalLink, Filter, 
    ChevronRight, Clock, MapPin, MousePointer, Layout, Fingerprint,
    Play, Shield, Activity, Calendar, Users
} from "lucide-react";
import { cn } from "@/lib/utils";

const SessionsPage = () => {
    const [sessions, setSessions] = useState<any[]>([]);
    const [selectedSession, setSelectedSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [sessionDetail, setSessionDetail] = useState<any>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    const fetchSessions = async () => {
        try {
            const response = await fetchWithAuth('/insights/sessions');
            setSessions(response || []);
        } catch (err: any) {
            console.error("Failed to fetch sessions:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSessionDetail = async (sessionId: string) => {
        setLoadingDetail(true);
        try {
            const response = await fetchWithAuth(`/insights/sessions/${sessionId}`);
            setSessionDetail(response);
        } catch (err: any) {
            console.error("Failed to fetch session detail:", err);
        } finally {
            setLoadingDetail(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    useEffect(() => {
        if (selectedSession) {
            fetchSessionDetail(selectedSession.sessionId);
        } else {
            setSessionDetail(null);
        }
    }, [selectedSession]);

    const getDeviceIcon = (device: string) => {
        if (device?.toLowerCase().includes('mobile')) return <Smartphone className="w-4 h-4" />;
        return <Monitor className="w-4 h-4" />;
    };

    const formatTimestamp = (ts: string) => {
        return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-[500px]">
                    <p className="animate-pulse text-muted-foreground text-sm font-medium">Replaying user history...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="flex flex-col h-[calc(100vh-140px)]">
                <div className="flex items-center justify-between mb-6 shrink-0">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Sessions</h1>
                        <p className="text-slate-500 text-sm">Monitor user behavior and replay interactions.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Filter sessions..." 
                                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-64"
                            />
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all">
                            <Filter className="w-4 h-4" />
                            Filters
                        </button>
                    </div>
                </div>

                <div className="flex flex-1 min-h-0 gap-6">
                    <div className={cn(
                        "flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-all duration-300",
                        selectedSession ? "w-1/3" : "w-full"
                    )}>
                        <div className="bg-slate-50/50 border-b border-slate-200 px-4 py-3 shrink-0">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{sessions.length} Recorded Sessions</span>
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title="Real-time collection active"></div>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {sessions.length > 0 ? (
                                <div className="divide-y divide-slate-100">
                                    {sessions.map((session) => (
                                        <div 
                                            key={session.id} 
                                            onClick={() => setSelectedSession(session)}
                                            className={cn(
                                                "p-4 cursor-pointer transition-all hover:bg-indigo-50/30 group relative",
                                                selectedSession?.id === session.id ? "bg-indigo-50/50 border-l-4 border-indigo-600" : "border-l-4 border-transparent"
                                            )}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold",
                                                        session.isRageClick ? "bg-red-100 text-red-600" : "bg-indigo-100 text-indigo-600"
                                                    )}>
                                                        {getDeviceIcon(session.device)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900">{session.sessionId.substring(0, 8)}</p>
                                                        <p className="text-[10px] text-slate-400 font-medium capitalize">{session.city || 'Unknown'}, {session.country}</p>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-400">{new Date(session.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center gap-4 text-[11px] text-slate-500">
                                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {session.duration}s</span>
                                                <span className="flex items-center gap-1"><Layout className="w-3 h-3" /> {session.pageViews} views</span>
                                                {session.os && <span className="flex items-center gap-1">{session.os} / {session.browser}</span>}
                                            </div>
                                            {session.isRageClick === 1 && (
                                                <div className="mt-2 inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold rounded uppercase">
                                                    <Activity className="w-3 h-3" /> Rage Click Detected
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-400">
                                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                                        <Users className="w-6 h-6" />
                                    </div>
                                    <p className="text-sm font-medium">No sessions found</p>
                                    <p className="text-xs mt-1">Waiting for user activity...</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {selectedSession && (
                        <div className="flex-1 flex flex-col min-w-0 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
                                <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/30">
                                    <div className="flex items-center gap-4">
                                        <button 
                                            onClick={() => setSelectedSession(null)}
                                            className="p-2 hover:bg-slate-200 rounded-lg transition-colors md:hidden"
                                        >
                                            <ChevronRight className="w-4 h-4 rotate-180" />
                                        </button>
                                        <div>
                                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                                Session {selectedSession.sessionId.substring(0, 12)}
                                                <button className="p-1 hover:bg-slate-200 rounded" title="Copy ID">
                                                    <Fingerprint className="w-3 h-3 text-slate-400" />
                                                </button>
                                            </h2>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 font-medium">
                                                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {selectedSession.city}, {selectedSession.country}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(selectedSession.createdAt).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-sm">
                                            <Play className="w-4 h-4 fill-white" />
                                            Replay Session
                                        </button>
                                        <button className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50">
                                            <ExternalLink className="w-4 h-4 text-slate-600" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Duration</p>
                                            <p className="text-xl font-bold text-indigo-600">{selectedSession.duration}s</p>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Interactions</p>
                                            <p className="text-xl font-bold text-indigo-600">{sessionDetail?.events?.length || 0}</p>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">OS / Browser</p>
                                            <p className="text-sm font-bold text-slate-800 truncate">{selectedSession.os} / {selectedSession.browser}</p>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">User Agency</p>
                                            <div className="flex items-center gap-1">
                                                <Shield className="w-3 h-3 text-green-500" />
                                                <span className="text-sm font-bold text-slate-800">Verified</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                                            <Activity className="w-4 h-4 text-indigo-500" />
                                            Interaction Timeline
                                        </h3>
                                        <div className="relative pl-6 border-l border-slate-100 space-y-6">
                                            {loadingDetail ? (
                                                <div className="py-8 text-center text-slate-400 text-sm">Loading events...</div>
                                            ) : sessionDetail?.events?.length > 0 ? (
                                                sessionDetail.events.map((event: any, idx: number) => (
                                                    <div key={idx} className="relative">
                                                        <div className={cn(
                                                            "absolute -left-[31px] w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm transition-transform",
                                                            event.eventType === 'click' ? "bg-indigo-500 scale-125" : 
                                                            event.eventType === 'navigation' ? "bg-emerald-500" : "bg-slate-400"
                                                        )}></div>
                                                        
                                                        <div className="flex items-start justify-between">
                                                            <div>
                                                                <p className="text-xs font-bold text-slate-800 flex items-center gap-2">
                                                                    {event.eventType === 'click' && <MousePointer className="w-3 h-3" />}
                                                                    {event.eventType === 'navigation' && <Layout className="w-3 h-3" />}
                                                                    <span className="capitalize">{event.eventType}</span>
                                                                    <span className="text-slate-400 text-[10px] font-mono">{formatTimestamp(event.timestamp)}</span>
                                                                </p>
                                                                <p className="text-[11px] text-slate-500 mt-1 bg-slate-50 border border-slate-100 rounded px-2 py-1 inline-block">
                                                                    {event.eventData}
                                                                </p>
                                                            </div>
                                                            {event.targetUrl && (
                                                                <span className="text-[9px] font-bold text-slate-400 bg-slate-100 rounded px-1.5 py-0.5">
                                                                    {new URL(event.targetUrl).pathname}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="py-8 text-center text-slate-400 text-sm italic">
                                                    No behavioral events captured for this session.
                                                </div>
                                            )}
                                            
                                            <div className="absolute -left-[31px] -bottom-2 w-2.5 h-2.5 rounded-full bg-slate-200"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default SessionsPage;
