import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Download, ArrowUpRight, Clock, CheckCircle2, ChevronLeft, ChevronRight, Wallet } from "lucide-react";
import { useAppContext } from "@/contexts/AppContext";

const PayoutsPage = () => {
    const { userProfile, links, transactions } = useAppContext();
    const [page, setPage] = useState(1);

    const statusColor: Record<string, string> = {
        Completed: "bg-green-50 text-green-600",
        Processing: "bg-yellow-50 text-yellow-600",
        Failed: "bg-red-50 text-red-600",
    };

    const totalEarned = links.reduce((acc, l) => acc + (l.totalEarnedValue || 0), 0);
    const paidOut = transactions
        .filter(t => t.status === "Completed")
        .reduce((acc, t) => acc + t.amount, 0);

    // For now, let's assume "Available" is total earned minus what we calculate as "Paid Out" 
    // (though in a real system this would be more complex)
    const available = totalEarned;
    const pending = transactions
        .filter(t => t.status === "Funds locked")
        .reduce((acc, t) => acc + t.amount, 0);

    return (
        <DashboardLayout>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                <h1 className="text-xl md:text-2xl font-bold text-foreground">Payouts</h1>
                <button className="flex items-center gap-2 text-sm font-medium text-white px-4 py-2.5 rounded-lg transition-colors" style={{ backgroundColor: '#025864' }}>
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
                        <p className="text-sm text-muted-foreground">Pending</p>
                    </div>
                    <h3 className="text-xl font-bold text-foreground">KES {pending.toLocaleString()}</h3>
                </div>
                <div className="bg-card rounded-2xl p-5 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-success" />
                        <p className="text-sm text-muted-foreground">Paid Out (Total)</p>
                    </div>
                    <h3 className="text-xl font-bold text-foreground">KES {paidOut.toLocaleString()}</h3>
                </div>
                <div className="bg-card rounded-2xl p-5 border border-border">
                    <p className="text-sm text-muted-foreground mb-2">Payout Method</p>
                    <h3 className="text-base font-bold text-foreground capitalize">{userProfile?.payoutMethod || "M-Pesa"}</h3>
                    <p className="text-[11px] text-muted-foreground">{userProfile?.payoutDetails || "Not set"}</p>
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
                            <tr className="text-[11px] text-muted-foreground uppercase tracking-wider">
                                <th className="text-left font-medium pb-3">ID</th>
                                <th className="text-left font-medium pb-3">Amount</th>
                                <th className="text-left font-medium pb-3 hidden sm:table-cell">Method</th>
                                <th className="text-left font-medium pb-3">Status</th>
                                <th className="text-left font-medium pb-3 hidden md:table-cell">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">No payout history yet.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">Showing 0 payouts</p>
                    <div className="flex items-center gap-2">
                        <button className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50" disabled>
                            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <span className="text-sm font-medium text-foreground px-2">Page {page}</span>
                        <button className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50" disabled>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default PayoutsPage;
