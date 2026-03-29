import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Search, Filter, CreditCard, ArrowUpRight, ArrowDownLeft, AlertCircle, Clock, CheckCircle2, RefreshCw } from "lucide-react";
import { fetchWithAuth } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const AdminTransactionsPage = () => {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [categories, setCategories] = useState({ payments: 0, payouts: 0, transfers: 0, total: 0 });
    const [statuses, setStatuses] = useState({ completed: 0, pending: 0, disputed: 0 });
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState("all");
    const [activeStatus, setActiveStatus] = useState("");
    const [search, setSearch] = useState("");
    const { toast } = useToast();

    const loadData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (activeCategory !== "all") params.set("category", activeCategory);
            if (activeStatus) params.set("status", activeStatus);
            if (search) params.set("search", search);

            const data = await fetchWithAuth(`/admin/transactions?${params.toString()}`);
            setTransactions(data.transactions || []);
            setCategories(data.categories || { payments: 0, payouts: 0, transfers: 0, total: 0 });
            setStatuses(data.statuses || { completed: 0, pending: 0, disputed: 0 });
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [activeCategory, activeStatus]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        loadData();
    };

    const statusColor: Record<string, string> = {
        Completed: "bg-emerald-50 text-emerald-600",
        "Funds locked": "bg-blue-50 text-blue-600",
        Processing: "bg-yellow-50 text-yellow-600",
        Pending: "bg-orange-50 text-orange-600",
        Disputed: "bg-red-50 text-red-600",
        Failed: "bg-red-50 text-red-600",
        Shipped: "bg-purple-50 text-purple-600",
    };

    const categoryIcon: Record<string, any> = {
        payment: CreditCard,
        payout: ArrowUpRight,
        transfer: ArrowDownLeft,
    };

    const categoryLabel: Record<string, string> = {
        payment: "Payment",
        payout: "Payout",
        transfer: "Transfer",
    };

    return (
        <AdminLayout>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">All Transactions</h1>
                <p className="text-slate-500">Monitor and manage all platform transactions.</p>
            </div>

            {/* Category Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <button
                    onClick={() => setActiveCategory("all")}
                    className={cn(
                        "p-4 rounded-2xl border-2 text-left transition-all",
                        activeCategory === "all" ? "border-[#025864] bg-[#025864]/5" : "border-slate-100 bg-white hover:border-slate-200"
                    )}
                >
                    <p className="text-xs text-slate-500 font-medium">All</p>
                    <p className="text-xl font-bold text-slate-900">{categories.total}</p>
                </button>
                <button
                    onClick={() => setActiveCategory("payment")}
                    className={cn(
                        "p-4 rounded-2xl border-2 text-left transition-all",
                        activeCategory === "payment" ? "border-blue-500 bg-blue-50" : "border-slate-100 bg-white hover:border-slate-200"
                    )}
                >
                    <div className="flex items-center gap-1.5 mb-1">
                        <CreditCard className="w-3.5 h-3.5 text-blue-500" />
                        <p className="text-xs text-slate-500 font-medium">Payments</p>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{categories.payments}</p>
                </button>
                <button
                    onClick={() => setActiveCategory("payout")}
                    className={cn(
                        "p-4 rounded-2xl border-2 text-left transition-all",
                        activeCategory === "payout" ? "border-emerald-500 bg-emerald-50" : "border-slate-100 bg-white hover:border-slate-200"
                    )}
                >
                    <div className="flex items-center gap-1.5 mb-1">
                        <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                        <p className="text-xs text-slate-500 font-medium">Payouts</p>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{categories.payouts}</p>
                </button>
                <button
                    onClick={() => setActiveCategory("transfer")}
                    className={cn(
                        "p-4 rounded-2xl border-2 text-left transition-all",
                        activeCategory === "transfer" ? "border-purple-500 bg-purple-50" : "border-slate-100 bg-white hover:border-slate-200"
                    )}
                >
                    <div className="flex items-center gap-1.5 mb-1">
                        <ArrowDownLeft className="w-3.5 h-3.5 text-purple-500" />
                        <p className="text-xs text-slate-500 font-medium">Transfers</p>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{categories.transfers}</p>
                </button>
            </div>

            {/* Status Filters */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
                <button
                    onClick={() => setActiveStatus("")}
                    className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-bold border transition-all",
                        !activeStatus ? "bg-[#025864] text-white border-[#025864]" : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                    )}
                >All Status</button>
                <button
                    onClick={() => setActiveStatus("Completed")}
                    className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-bold border transition-all",
                        activeStatus === "Completed" ? "bg-emerald-500 text-white border-emerald-500" : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                    )}
                >Completed ({statuses.completed})</button>
                <button
                    onClick={() => setActiveStatus("Pending")}
                    className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-bold border transition-all",
                        activeStatus === "Pending" ? "bg-orange-500 text-white border-orange-500" : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                    )}
                >Pending ({statuses.pending})</button>
                <button
                    onClick={() => setActiveStatus("Disputed")}
                    className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-bold border transition-all",
                        activeStatus === "Disputed" ? "bg-red-500 text-white border-red-500" : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                    )}
                >Disputed ({statuses.disputed})</button>

                <form onSubmit={handleSearch} className="ml-auto flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search transactions..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#025864]/20 w-64"
                        />
                    </div>
                    <button type="submit" className="p-2 rounded-xl bg-[#025864] text-white hover:bg-[#014a52]">
                        <Search className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={loadData} className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </form>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-[11px] text-slate-400 uppercase tracking-wider border-b border-slate-50">
                                <th className="text-left font-medium p-4">Transaction ID</th>
                                <th className="text-left font-medium p-4">Category</th>
                                <th className="text-left font-medium p-4">Seller / Business</th>
                                <th className="text-left font-medium p-4">Buyer / Recipient</th>
                                <th className="text-left font-medium p-4">Amount</th>
                                <th className="text-left font-medium p-4">Fee</th>
                                <th className="text-left font-medium p-4">Status</th>
                                <th className="text-left font-medium p-4">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan={8} className="p-10 text-center text-slate-400">Loading transactions...</td></tr>
                            ) : transactions.length === 0 ? (
                                <tr><td colSpan={8} className="p-10 text-center text-slate-400">No transactions found.</td></tr>
                            ) : (
                                transactions.map((t) => {
                                    const Icon = categoryIcon[t.category] || CreditCard;
                                    return (
                                        <tr key={`${t.category}-${t.id}`} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4 text-xs font-mono text-slate-600">
                                                {t.transactionId || `#${t.id}`}
                                            </td>
                                            <td className="p-4">
                                                <span className={cn(
                                                    "inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold",
                                                    t.category === 'payment' ? "bg-blue-50 text-blue-600" :
                                                    t.category === 'payout' ? "bg-emerald-50 text-emerald-600" :
                                                    "bg-purple-50 text-purple-600"
                                                )}>
                                                    <Icon className="w-3 h-3" />
                                                    {categoryLabel[t.category] || t.category}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <p className="text-sm font-medium text-slate-900">{t.sellerName || t.businessName || '—'}</p>
                                            </td>
                                            <td className="p-4">
                                                <p className="text-sm text-slate-600">{t.buyerName || t.buyerEmail || '—'}</p>
                                            </td>
                                            <td className="p-4 text-sm font-bold text-slate-900">
                                                {t.currency} {Number(t.amount).toLocaleString()}
                                            </td>
                                            <td className="p-4 text-sm text-slate-500">
                                                {t.fee > 0 ? `${t.currency} ${Number(t.fee).toLocaleString()}` : '—'}
                                            </td>
                                            <td className="p-4">
                                                <span className={cn(
                                                    "px-2 py-1 rounded-full text-[10px] font-bold",
                                                    statusColor[t.status] || 'bg-slate-100 text-slate-600'
                                                )}>{t.status}</span>
                                            </td>
                                            <td className="p-4 text-sm text-slate-400">
                                                {new Date(t.createdAt).toLocaleString()}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminTransactionsPage;
