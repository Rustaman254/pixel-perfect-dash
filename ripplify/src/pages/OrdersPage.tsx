import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Search, Download, ChevronLeft, ChevronRight, ExternalLink, CheckCircle2, AlertTriangle, Link as LinkIcon, MapPin } from "lucide-react";
import { useAppContext } from "@/contexts/AppContext";
import { useToast } from "@/hooks/use-toast";
import { fetchWithAuth } from "@/lib/api";

type StatusType = "All" | "Success" | "Pending" | "Failed" | "Refunded";

const OrdersPage = () => {
    const { transactions, refreshData } = useAppContext();
    const { toast } = useToast();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusType>("All");
    const [page, setPage] = useState(1);

    const mappedTransactions = transactions.map(t => ({
        id: `ORD-${t.id.toString().padStart(3, '0')}`,
        rawId: t.id,
        customer: t.buyerName || "Anonymous",
        linkName: t.linkName || "Unknown Link",
        linkSlug: t.linkSlug || null,
        linkId: t.linkId,
        trackingToken: t.trackingToken || null,
        flag: "🛒",
        method: "M-Pesa",
        methodSub: t.buyerPhone || "",
        amount: `${t.currency} ${t.amount.toLocaleString()}`,
        status: t.status === "Completed" || t.status === "Funds locked" ? "Success" : (t.status === "Pending" ? "Pending" : t.status === "Failed" ? "Failed" : "Pending"),
        date: new Date(t.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        rawAmount: t.amount,
        rawStatus: t.status
    }));

    const filtered = mappedTransactions.filter((t) => {
        const matchSearch =
            t.customer.toLowerCase().includes(search.toLowerCase()) ||
            t.id.toLowerCase().includes(search.toLowerCase()) ||
            t.linkName.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === "All" || t.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const statusColor: Record<string, string> = {
        Success: "bg-green-50 text-green-600",
        Pending: "bg-yellow-50 text-yellow-600",
        Failed: "bg-red-50 text-red-600",
        Refunded: "bg-blue-50 text-blue-600",
        Disputed: "bg-red-50 text-red-600",
        Shipped: "bg-indigo-50 text-indigo-600",
    };

    const totalVolume = mappedTransactions.reduce((acc, t) => acc + t.rawAmount, 0);
    const successCount = mappedTransactions.filter(t => t.status === "Success").length;
    const successRate = mappedTransactions.length > 0 ? (successCount / mappedTransactions.length * 100).toFixed(1) : "0";
    const avgAmount = mappedTransactions.length > 0 ? (totalVolume / mappedTransactions.length).toFixed(2) : "0";

    const handleConfirmReceived = async (t: typeof mappedTransactions[0]) => {
        if (!t.linkId) return;
        try {
            await fetchWithAuth(`/links/${t.linkId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status: 'Completed' })
            });
            await refreshData();
            toast({ title: "Delivery Confirmed", description: "Transaction marked as Completed." });
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
    };

    const handleReportProblem = async (t: typeof mappedTransactions[0]) => {
        if (!t.linkId) return;
        try {
            await fetchWithAuth(`/links/${t.linkId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status: 'Disputed' })
            });
            await refreshData();
            toast({ title: "Problem Reported", description: "Transaction flagged as Disputed." });
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
    };

    const handleOpenTracking = (t: typeof mappedTransactions[0]) => {
        if (t.linkSlug) {
            const trackUrl = t.trackingToken
                ? `${window.location.origin}/pay/${t.linkSlug}?track=${t.trackingToken}`
                : `${window.location.origin}/pay/${t.linkSlug}`;
            window.open(trackUrl, "_blank");
        } else {
            toast({ title: "No Link", description: "This order has no associated payment link.", variant: "destructive" });
        }
    };

    const ITEMS_PER_PAGE = 10;
    const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

    return (
        <DashboardLayout>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                <h1 className="text-xl md:text-2xl font-bold text-foreground">Orders</h1>
                <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Download className="w-4 h-4" />
                    Export CSV
                </button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-card rounded-2xl p-5 border border-border">
                    <p className="text-sm text-muted-foreground mb-1">Total Volume</p>
                    <h3 className="text-xl font-bold text-foreground">KES {totalVolume.toLocaleString()}</h3>
                </div>
                <div className="bg-card rounded-2xl p-5 border border-border">
                    <p className="text-sm text-muted-foreground mb-1">Total Orders</p>
                    <h3 className="text-xl font-bold text-foreground">{mappedTransactions.length}</h3>
                </div>
                <div className="bg-card rounded-2xl p-5 border border-border">
                    <p className="text-sm text-muted-foreground mb-1">Success Rate</p>
                    <h3 className="text-xl font-bold text-success">{successRate}%</h3>
                </div>
                <div className="bg-card rounded-2xl p-5 border border-border">
                    <p className="text-sm text-muted-foreground mb-1">Avg. Amount</p>
                    <h3 className="text-xl font-bold text-foreground">KES {avgAmount}</h3>
                </div>
            </div>

            {/* Table */}
            <div className="bg-card rounded-2xl p-5 border border-border">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                    <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 flex-1">
                        <Search className="w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search by customer, ID, or link..."
                            className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {(["All", "Success", "Pending", "Failed"] as StatusType[]).map((s) => (
                            <button
                                key={s}
                                onClick={() => { setStatusFilter(s); setPage(1); }}
                                className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${statusFilter === s ? 'text-white' : 'text-muted-foreground hover:text-foreground bg-muted'}`}
                                style={statusFilter === s ? { backgroundColor: '#025864' } : undefined}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-[11px] text-muted-foreground uppercase tracking-wider">
                                <th className="text-left font-medium pb-3">Order ID</th>
                                <th className="text-left font-medium pb-3">Customer</th>
                                <th className="text-left font-medium pb-3 hidden md:table-cell">Payment Link</th>
                                <th className="text-left font-medium pb-3 hidden sm:table-cell">Method</th>
                                <th className="text-left font-medium pb-3">Amount</th>
                                <th className="text-left font-medium pb-3">Status</th>
                                <th className="text-left font-medium pb-3 hidden md:table-cell">Date</th>
                                <th className="text-right font-medium pb-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-8 text-center text-sm text-muted-foreground">No transactions found.</td>
                                </tr>
                            ) : (
                                paginated.map((t) => (
                                    <tr key={t.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                                        <td className="py-3">
                                            <p className="text-xs font-mono text-muted-foreground">{t.id}</p>
                                        </td>
                                        <td className="py-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">{t.flag}</span>
                                                <div>
                                                    <p className="text-sm font-medium text-foreground">{t.customer}</p>
                                                    {t.methodSub && <p className="text-[10px] text-muted-foreground">{t.methodSub}</p>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 hidden md:table-cell">
                                            <div className="flex items-center gap-1.5">
                                                <LinkIcon className="w-3 h-3 text-muted-foreground shrink-0" />
                                                <p className="text-sm text-foreground truncate max-w-[160px]">{t.linkName}</p>
                                            </div>
                                        </td>
                                        <td className="py-3 hidden sm:table-cell">
                                            <p className="text-sm text-foreground">{t.method}</p>
                                        </td>
                                        <td className="py-3">
                                            <p className="text-sm font-semibold text-foreground">{t.amount}</p>
                                        </td>
                                        <td className="py-3">
                                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColor[t.rawStatus] || statusColor[t.status]}`}>
                                                {t.rawStatus}
                                            </span>
                                        </td>
                                        <td className="py-3 hidden md:table-cell">
                                            <p className="text-sm text-muted-foreground">{t.date}</p>
                                        </td>
                                        <td className="py-3">
                                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                                {/* Tracking Link */}
                                                {t.linkSlug && (
                                                    <button
                                                        onClick={() => handleOpenTracking(t)}
                                                        title="Open Tracking Link"
                                                        className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                                                    >
                                                        <MapPin className="w-3 h-3" />
                                                        Track
                                                    </button>
                                                )}
                                                {/* Confirm Received */}
                                                {(t.rawStatus === "Shipped" || t.rawStatus === "Funds locked") && (
                                                    <button
                                                        onClick={() => handleConfirmReceived(t)}
                                                        title="Confirm Received"
                                                        className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                                                    >
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        Confirm
                                                    </button>
                                                )}
                                                {/* Report Problem */}
                                                {(t.rawStatus === "Shipped" || t.rawStatus === "Funds locked") && (
                                                    <button
                                                        onClick={() => handleReportProblem(t)}
                                                        title="Report Problem"
                                                        className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                                    >
                                                        <AlertTriangle className="w-3 h-3" />
                                                        Dispute
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">Showing {paginated.length} of {filtered.length} orders</p>
                    <div className="flex items-center gap-2">
                        <button
                            className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-40"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <span className="text-sm font-medium text-foreground px-2">Page {page} of {totalPages || 1}</span>
                        <button
                            className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-40"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                        >
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default OrdersPage;
