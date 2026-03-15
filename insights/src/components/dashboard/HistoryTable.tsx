import { useState, useEffect } from "react";
import { 
    Search, Smartphone, Monitor, MapPin, 
    Calendar, Clock, Filter, ChevronLeft, ChevronRight,
    ArrowUpRight, Activity
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Session {
    id: number;
    sessionId: string;
    device: string;
    browser: string;
    os: string;
    country: string;
    city: string;
    duration: number;
    pageViews: number;
    isRageClick: number;
    createdAt: string;
}

interface HistoryTableProps {
    sessions: Session[];
    onRowClick: (session: Session) => void;
}

const HistoryTable = ({ sessions = [], onRowClick }: HistoryTableProps) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [deviceFilter, setDeviceFilter] = useState<string>("all");
    const [showRageOnly, setShowRageOnly] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const filteredSessions = sessions.filter(s => {
        const matchesSearch = s.sessionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              s.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              s.country.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDevice = deviceFilter === "all" || s.device === deviceFilter;
        const matchesRage = !showRageOnly || s.isRageClick === 1;
        
        return matchesSearch && matchesDevice && matchesRage;
    });

    const totalPages = Math.ceil(filteredSessions.length / itemsPerPage);
    const paginatedSessions = filteredSessions.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset page if filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, deviceFilter, showRageOnly, sessions.length]);

    return (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="font-bold text-slate-900">Session History</h3>
                    <p className="text-xs text-slate-500 mt-1">Total {sessions.length} recorded interactions</p>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        {["all", "Desktop", "Mobile"].map((d) => (
                            <button
                                key={d}
                                onClick={() => setDeviceFilter(d)}
                                className={cn(
                                    "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                                    deviceFilter === d ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                {d.charAt(0).toUpperCase() + d.slice(1)}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => setShowRageOnly(!showRageOnly)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all",
                            showRageOnly ? "bg-rose-50 border-rose-100 text-rose-600" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        )}
                    >
                        <Activity className={cn("w-3.5 h-3.5", showRageOnly && "animate-pulse")} />
                        Rage Clicks
                    </button>

                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Search location..."
                            className="pl-10 pr-4 py-2 bg-slate-50 border border-transparent rounded-xl text-sm w-full md:w-64 focus:ring-2 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-100 transition-all outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50">
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">User / Device</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Location</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Duration</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Pages</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {paginatedSessions.map((session) => (
                            <tr 
                                key={session.id} 
                                onClick={() => onRowClick(session)}
                                className="group hover:bg-indigo-50/30 cursor-pointer transition-colors"
                            >
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-white group-hover:shadow-sm transition-all">
                                            {session.device === 'Mobile' ? <Smartphone className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                                ID: {session.sessionId.substring(0, 8)}...
                                                {session.isRageClick === 1 && (
                                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Rage Clicks Detected"></span>
                                                )}
                                            </p>
                                            <p className="text-[11px] text-slate-500">{session.os} • {session.browser}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg group-hover:bg-white transition-all">
                                        <MapPin className="w-3 h-3 text-slate-400" />
                                        <span className="text-xs font-medium text-slate-600 truncate max-w-[120px]">
                                            {session.city}, {session.country}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex flex-col items-center">
                                        <span className="text-sm font-bold text-slate-800">{session.duration}s</span>
                                        <div className="w-12 h-1 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                                            <div 
                                                className="h-full bg-indigo-500 rounded-full" 
                                                style={{ width: `${Math.min(100, (session.duration / 300) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="text-xs font-bold px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg">
                                        {session.pageViews} views
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex flex-col items-end">
                                        <p className="text-xs font-bold text-slate-900">{new Date(session.createdAt).toLocaleDateString()}</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">{new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                
                {filteredSessions.length === 0 && (
                    <div className="py-20 text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Activity className="w-8 h-8 text-slate-300" />
                        </div>
                        <h4 className="font-bold text-slate-900">No history found</h4>
                        <p className="text-sm text-slate-500 mt-1">Try broading your search or wait for more traffic.</p>
                    </div>
                )}
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs font-medium text-slate-500">
                    Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredSessions.length)}-{Math.min(currentPage * itemsPerPage, filteredSessions.length)} of {filteredSessions.length} sessions
                </p>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-slate-600 disabled:opacity-50"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-bold text-slate-500">Page {currentPage} of {Math.max(totalPages, 1)}</span>
                    <button 
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage >= totalPages || totalPages === 0}
                        className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-slate-600 disabled:opacity-50"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HistoryTable;
