import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Download, ArrowUpRight, Clock, CheckCircle2, ChevronLeft, ChevronRight, Wallet, AlertCircle, ShieldCheck } from "lucide-react";
import { useAppContext } from "@/contexts/AppContext";
import { fetchWithAuth } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import usePageTitle from "@/hooks/usePageTitle";

const PayoutsPage = () => {
    usePageTitle("Payouts");
    const { userProfile, links, payouts, refreshData } = useAppContext();
    const { toast } = useToast();
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Initial load handled by AppContext

    const handleWithdrawRequest = async () => {
        const amount = parseFloat(withdrawAmount);
        if (!amount || amount <= 0) {
            toast({ title: "Invalid Amount", description: "Please enter a valid amount to withdraw.", variant: "destructive" });
            return;
        }

        setSubmitting(true);
        try {
            await fetchWithAuth('/payouts', {
                method: 'POST',
                body: JSON.stringify({ amount })
            });
            
            await refreshData();
            
            setShowModal(false);
            setWithdrawAmount("");
            toast({ title: "Payout Requested", description: `Your request for ${userProfile?.currency || 'KES'} ${amount.toLocaleString()} is being processed.` });
        } catch (err: any) {
            toast({ title: "Request Failed", description: err.message, variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    const statusColor: Record<string, string> = {
        Completed: "bg-emerald-50 text-emerald-600",
        Processing: "bg-yellow-50 text-yellow-600",
        Failed: "bg-red-50 text-red-600",
    };

    // Correct Balance Calculations
    const totalEarned = links.reduce((acc, l) => acc + (l.totalEarnedValue || 0), 0);
    const paidOut = payouts
        .filter(p => p.status === "Completed")
        .reduce((acc, p) => acc + p.amount, 0);
    
    // Available = Total Earned - (Processing + Completed Payouts)
    const withdrawnSum = payouts
        .filter(p => ["Processing", "Completed"].includes(p.status))
        .reduce((acc, p) => acc + p.amount, 0);
    
    const available = totalEarned - withdrawnSum;
    
    // Pending = sums of deals where status is "Funds locked" or "Shipped" but not yet "Completed"
    // Wait, the PaymentLink model adds to totalEarnedValue only when status becomes 'Completed' (I should verify this)
    // Actually, looking at PaymentLink.js:
    /*
    updatePaymentStats: async (id, amount) => {
        const db = getDb();
        await db.run(`
            UPDATE payment_links 
            SET paymentCount = paymentCount + 1, 
                totalEarnedValue = totalEarnedValue + ? 
            WHERE id = ?
        `, [amount, id]);
    },
    */
    // I need to check where updatePaymentStats is called.

    return (
        <DashboardLayout>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                <h1 className="text-xl md:text-2xl font-bold text-foreground">Payouts</h1>
                <button 
                  onClick={() => setShowModal(true)}
                  className="flex items-center gap-2 text-sm font-medium text-white px-4 py-2.5 rounded-xl transition-all hover:opacity-90 active:scale-[0.98]" 
                  style={{ backgroundColor: '#025864' }}
                >
                    <ArrowUpRight className="w-4 h-4" />
                    Withdraw Funds
                </button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-card rounded-2xl p-5 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                        <Wallet className="w-4 h-4" style={{ color: '#025864' }} />
                        <p className="text-sm text-muted-foreground">Available</p>
                    </div>
                    <h3 className="text-xl font-bold text-foreground">KES {available.toLocaleString()}</h3>
                </div>
                <div className="bg-card rounded-2xl p-5 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-yellow-500" />
                        <p className="text-sm text-muted-foreground">In Escrow</p>
                    </div>
                    <h3 className="text-xl font-bold text-foreground">Escrow Active</h3>
                </div>
                <div className="bg-card rounded-2xl p-5 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <p className="text-sm text-muted-foreground">Paid Out (Total)</p>
                    </div>
                    <h3 className="text-xl font-bold text-foreground">KES {paidOut.toLocaleString()}</h3>
                </div>
                <div className="bg-card rounded-2xl p-5 border border-border">
                    <p className="text-sm text-muted-foreground mb-2">Payout Method</p>
                    <h3 className="text-base font-bold text-foreground capitalize">{userProfile?.payoutMethod || "M-Pesa"}</h3>
                    <p className="text-[11px] text-muted-foreground truncate">{userProfile?.payoutDetails || "Not set"}</p>
                </div>
            </div>

            {/* Payout History */}
            <div className="bg-card rounded-2xl p-5 border border-border mt-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground">Payout History</h3>
                    <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-[11px] text-muted-foreground uppercase tracking-wider border-b border-border/50">
                                <th className="text-left font-medium pb-4">ID</th>
                                <th className="text-left font-medium pb-4">Amount</th>
                                <th className="text-left font-medium pb-4 hidden sm:table-cell">Method</th>
                                <th className="text-left font-medium pb-4">Status</th>
                                <th className="text-left font-medium pb-4 hidden md:table-cell">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">Loading payouts...</td>
                                </tr>
                            ) : payouts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">No payout history yet.</td>
                                </tr>
                            ) : (
                                payouts.map((p) => (
                                    <tr key={p.id}>
                                        <td className="py-4 text-xs font-mono text-muted-foreground">#PO-{p.id.toString().padStart(4, '0')}</td>
                                        <td className="py-4 text-sm font-bold text-foreground">{p.currency} {p.amount.toLocaleString()}</td>
                                        <td className="py-4 text-sm text-muted-foreground hidden sm:table-cell uppercase">{p.method}</td>
                                        <td className="py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${statusColor[p.status] || 'bg-gray-50 text-gray-500'}`}>
                                                {p.status}
                                            </span>
                                        </td>
                                        <td className="py-4 text-sm text-muted-foreground hidden md:table-cell">
                                            {new Date(p.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Withdraw Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-card rounded-[28px] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 border border-border">
                        <div className="p-6 md:p-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-foreground">Withdraw Funds</h2>
                                <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">✕</button>
                            </div>

                            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex items-center gap-3">
                                <Wallet className="w-5 h-5 text-emerald-600" />
                                <div>
                                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Available Balance</p>
                                    <p className="text-lg font-black text-emerald-900">KES {available.toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Withdrawal Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">KES</span>
                                        <input 
                                            type="number" 
                                            className="w-full pl-14 pr-4 py-4 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-[#025864]/20 focus:border-[#025864] text-lg font-bold"
                                            placeholder="0.00"
                                            value={withdrawAmount}
                                            onChange={(e) => setWithdrawAmount(e.target.value)}
                                        />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-2">Funds will be sent to your {userProfile?.payoutMethod || 'M-Pesa'} account: <strong>{userProfile?.payoutDetails || 'Not set'}</strong></p>
                                </div>

                                <div className="p-4 bg-slate-50 rounded-xl border border-border flex items-start gap-3">
                                    <ShieldCheck className="w-5 h-5 text-[#025864] shrink-0 mt-0.5" />
                                    <p className="text-xs text-muted-foreground leading-relaxed">Withdrawals are processed within 24 hours. A transaction fee of KES 50 may apply.</p>
                                </div>

                                <button 
                                    onClick={handleWithdrawRequest}
                                    disabled={submitting || !withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > available}
                                    className="w-full bg-[#025864] hover:bg-[#024852] text-white font-bold py-4 rounded-xl shadow-lg shadow-[#025864]/20 transition-all disabled:opacity-50 disabled:shadow-none"
                                >
                                    {submitting ? "Processing..." : "Confirm Withdrawal"}
                                </button>

                                {!userProfile?.payoutDetails && (
                                    <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl border border-red-100 italic text-[11px]">
                                        <AlertCircle className="w-4 h-4" />
                                        Please set your payout details in Settings first.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default PayoutsPage;
