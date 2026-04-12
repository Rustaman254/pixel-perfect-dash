import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import FeatureGuard from "@/components/FeatureGuard";
import { Download, ArrowUpRight, Clock, CheckCircle2, Wallet, AlertCircle, ShieldCheck, Smartphone, Building, ChevronRight } from "lucide-react";
import { useAppContext } from "@/contexts/AppContext";
import { fetchWithAuth } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import usePageTitle from "@/hooks/usePageTitle";
import { cn } from "@/lib/utils";

const PayoutsPage = () => {
    usePageTitle("Payouts");
    const navigate = useNavigate();
    const { userProfile, links, payouts, refreshData, wallets } = useAppContext();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Payout methods state
    const [payoutMethods, setPayoutMethods] = useState<any[]>([]);
    const [selectedMethodId, setSelectedMethodId] = useState<number | null>(null);

    // Fetch payout methods when modal opens
    useEffect(() => {
        if (showModal) {
            fetchWithAuth('/user-payout-methods')
                .then(methods => {
                    setPayoutMethods(methods);
                    // Auto-select default or first available
                    const defaultMethod = methods.find((m: any) => m.isDefault);
                    if (defaultMethod) {
                        setSelectedMethodId(defaultMethod.id);
                    } else if (methods.length > 0) {
                        setSelectedMethodId(methods[0].id);
                    }
                })
                .catch(() => setPayoutMethods([]));
        }
    }, [showModal]);

    const selectedMethod = payoutMethods.find(m => m.id === selectedMethodId);

    const handleWithdrawRequest = async () => {
        const amount = parseFloat(withdrawAmount);
        if (!amount || amount <= 0) {
            setError("Please enter a valid amount to withdraw.");
            return;
        }
        if (amount > available) {
            setError("Insufficient balance for this withdrawal.");
            return;
        }

        // Check if a method is selected
        if (!selectedMethodId) {
            setError("Please select a payout method.");
            return;
        }

        // Check if the selected method exists and is valid
        const method = payoutMethods.find(m => m.id === selectedMethodId);
        if (!method) {
            setError("Selected payout method not found.");
            return;
        }

        setSubmitting(true);
        setError(null);
        try {
            await fetchWithAuth('/payouts', {
                method: 'POST',
                body: JSON.stringify({ amount, payoutMethodId: selectedMethodId })
            });

            await refreshData();
            setShowModal(false);
            setWithdrawAmount("");
            setSelectedMethodId(null);
            toast({ title: "Payout Requested", description: `Your withdrawal of KES ${amount.toLocaleString()} via ${method.label || method.method} is being processed.` });
        } catch (err: any) {
            // Check if backend says to redirect
            if (err.redirectTo) {
                navigate(err.redirectTo);
                return;
            }
            setError(err.message || "Failed to process withdrawal. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const statusColor: Record<string, string> = {
        Completed: "bg-emerald-50 text-emerald-600",
        Processing: "bg-yellow-50 text-yellow-600",
        Failed: "bg-red-50 text-red-600",
    };

    // Balance calculations
    const totalEarned = links?.reduce((acc, l) => acc + (Number(l.totalEarnedValue) || 0), 0) || 0;
    const paidOut = payouts
        ?.filter(p => p.status === "Completed")
        .reduce((acc, p) => acc + (Number(p.amount) || 0), 0) || 0;
    const withdrawnSum = payouts
        ?.filter(p => ["Processing", "Completed"].includes(p.status))
        .reduce((acc, p) => acc + (Number(p.amount) || 0) + (Number(p.fee) || 0), 0) || 0;
    
    // Use wallet balance if available, otherwise calculate from links
    const walletBalance = wallets?.reduce((acc, w) => acc + (Number(w.balance) || 0), 0) || 0;
    const available = walletBalance > 0 ? walletBalance : (totalEarned - withdrawnSum);

    const formatAmount = (amount: number) => {
        if (amount == null || isNaN(amount)) return "0.00";
        return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const hasMpesa = payoutMethods.some(m => m.method === 'mpesa' && m.isActive);
    const hasBank = payoutMethods.some(m => m.method === 'bank' && m.isActive);

    return (
        <DashboardLayout>
            <FeatureGuard featureKey="payouts">
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
                    <p className="text-[11px] text-muted-foreground truncate">
                        {userProfile?.payoutDetails || "Not set"}
                    </p>
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
                                        <td className="py-4 text-sm text-muted-foreground hidden sm:table-cell uppercase">
                                            {p.method}
                                            <span className="block text-[10px] lowercase opacity-60 normal-case">{p.details}</span>
                                        </td>
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
                    <div className="bg-card rounded-[28px] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 border border-border max-h-[90vh] overflow-y-auto">
                        <div className="p-6 md:p-8 space-y-5">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-foreground">Withdraw Funds</h2>
                                <button onClick={() => { setShowModal(false); setError(null); setWithdrawAmount(""); }} className="text-muted-foreground hover:text-foreground text-lg">✕</button>
                            </div>

                            {/* Available Balance */}
                            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex items-center gap-3">
                                <Wallet className="w-5 h-5 text-emerald-600" />
                                <div>
                                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Available Balance</p>
                                    <p className="text-lg font-black text-emerald-900">KES {formatAmount(available)}</p>
                                </div>
                            </div>

                            {/* Payout Method Selection */}
                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Send Money Via</label>

                                {payoutMethods.length === 0 ? (
                                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                                        <div className="flex items-start gap-3">
                                            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-sm text-amber-800 font-medium">No payout methods configured</p>
                                                <p className="text-xs text-amber-600 mt-1">Add an M-Pesa or Bank account to receive payouts.</p>
                                                <button
                                                    onClick={() => { setShowModal(false); navigate('/settings'); }}
                                                    className="mt-3 text-xs font-bold text-white px-4 py-2 rounded-lg bg-[#025864] hover:bg-[#014a52] flex items-center gap-1"
                                                >
                                                    Set Up Payout Method <ChevronRight className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2">
                                        {/* M-Pesa Option */}
                                        {(() => {
                                            const mpesaMethod = payoutMethods.find(m => m.method === 'mpesa');
                                            if (mpesaMethod) {
                                                return (
                                                    <button
                                                        onClick={() => setSelectedMethodId(mpesaMethod.id)}
                                                        className={cn(
                                                            "p-3 rounded-xl border-2 text-left transition-all",
                                                            selectedMethodId === mpesaMethod.id ? "border-[#025864] bg-[#025864]/5" : "border-border hover:border-slate-300"
                                                        )}
                                                    >
                                                        <Smartphone className="w-5 h-5 mb-1.5 text-green-600" />
                                                        <p className="text-xs font-bold text-foreground">M-Pesa</p>
                                                        <p className="text-[10px] text-muted-foreground truncate">{mpesaMethod.details}</p>
                                                    </button>
                                                );
                                            } else {
                                                return (
                                                    <button
                                                        onClick={() => { setShowModal(false); navigate('/settings'); }}
                                                        className="p-3 rounded-xl border-2 border-dashed border-border text-left hover:border-[#025864] transition-all"
                                                    >
                                                        <Smartphone className="w-5 h-5 mb-1.5 text-slate-300" />
                                                        <p className="text-xs font-bold text-muted-foreground">M-Pesa</p>
                                                        <p className="text-[10px] text-[#025864]">+ Add M-Pesa</p>
                                                    </button>
                                                );
                                            }
                                        })()}

                                        {/* Bank Option */}
                                        {(() => {
                                            const bankMethod = payoutMethods.find(m => m.method === 'bank');
                                            if (bankMethod) {
                                                let bankLabel = bankMethod.details;
                                                try {
                                                    const b = JSON.parse(bankMethod.details);
                                                    bankLabel = `${b.bankCode} - ${b.account}`;
                                                } catch (e) { }
                                                return (
                                                    <button
                                                        onClick={() => setSelectedMethodId(bankMethod.id)}
                                                        className={cn(
                                                            "p-3 rounded-xl border-2 text-left transition-all",
                                                            selectedMethodId === bankMethod.id ? "border-[#025864] bg-[#025864]/5" : "border-border hover:border-slate-300"
                                                        )}
                                                    >
                                                        <Building className="w-5 h-5 mb-1.5 text-blue-600" />
                                                        <p className="text-xs font-bold text-foreground">Bank</p>
                                                        <p className="text-[10px] text-muted-foreground truncate">{bankLabel}</p>
                                                    </button>
                                                );
                                            } else {
                                                return (
                                                    <button
                                                        onClick={() => { setShowModal(false); navigate('/settings'); }}
                                                        className="p-3 rounded-xl border-2 border-dashed border-border text-left hover:border-[#025864] transition-all"
                                                    >
                                                        <Building className="w-5 h-5 mb-1.5 text-slate-300" />
                                                        <p className="text-xs font-bold text-muted-foreground">Bank</p>
                                                        <p className="text-[10px] text-[#025864]">+ Add Bank</p>
                                                    </button>
                                                );
                                            }
                                        })()}
                                    </div>
                                )}
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-700 font-medium">{error}</p>
                                </div>
                            )}

                            {/* Amount Input */}
                            {payoutMethods.length > 0 && (
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
                                                onChange={(e) => { setWithdrawAmount(e.target.value); if (error) setError(null); }}
                                            />
                                        </div>
                                    </div>

                                    {/* Fee breakdown */}
                                    {parseFloat(withdrawAmount) > 0 && (() => {
                                        const amt = parseFloat(withdrawAmount);
                                        const totalFee = amt * 0.01;
                                        const netAmount = Math.max(0, amt - totalFee);
                                        return (
                                            <div className="bg-slate-50 rounded-2xl p-4 border border-border space-y-2">
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-muted-foreground">Withdrawal Amount</span>
                                                    <span className="font-bold text-foreground">KES {amt.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-muted-foreground">Platform Fee (1%)</span>
                                                    <span className="font-bold text-red-500">-KES {totalFee.toLocaleString()}</span>
                                                </div>
                                                <div className="pt-2 border-t border-border flex justify-between text-sm font-black">
                                                    <span className="text-foreground">You will receive</span>
                                                    <span className="text-[#025864]">KES {netAmount.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    <div className="p-3 bg-slate-50 rounded-xl border border-border flex items-start gap-2">
                                        <ShieldCheck className="w-4 h-4 text-[#025864] shrink-0 mt-0.5" />
                                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                                            Payout via <strong>{selectedMethod?.label || selectedMethod?.method || 'selected method'}</strong>. Processed within 24 hours. 1% fee applies.
                                        </p>
                                    </div>

                                    <button
                                        onClick={handleWithdrawRequest}
                                        disabled={submitting || !withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > available || !selectedMethodId}
                                        className="w-full bg-[#025864] hover:bg-[#024852] text-white font-bold py-4 rounded-xl shadow-lg shadow-[#025864]/20 transition-all disabled:opacity-50 disabled:shadow-none"
                                    >
                                        {submitting ? "Processing..." : "Confirm Withdrawal"}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            </FeatureGuard>
        </DashboardLayout>
    );
};

export default PayoutsPage;
