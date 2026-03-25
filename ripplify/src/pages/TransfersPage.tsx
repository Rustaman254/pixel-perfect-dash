import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Send, Users, Plus, Trash2, Search, Smartphone, Building, User, ArrowUpRight, ArrowDownLeft, RefreshCw } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { fetchWithAuth } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import useDebounce from "@/hooks/useDebounce";

interface Recipient {
    id: string;
    receiverId?: number;
    name: string;
    phone: string;
    email: string;
    amount: string;
}

const TransfersPage = () => {
    const { refreshData } = useAppContext();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<"single" | "batch">("single");
    const [transfers, setTransfers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Single transfer state
    const [singleMethod, setSingleMethod] = useState<"internal" | "mpesa">("internal");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [singlePhone, setSinglePhone] = useState("");
    const [singleAmount, setSingleAmount] = useState("");
    const [singleNote, setSingleNote] = useState("");

    // Batch transfer state
    const [batchMethod, setBatchMethod] = useState<"internal" | "mpesa">("mpesa");
    const [recipients, setRecipients] = useState<Recipient[]>([
        { id: crypto.randomUUID(), name: "", phone: "", email: "", amount: "" }
    ]);
    const [batchNote, setBatchNote] = useState("");

    const debouncedSearch = useDebounce(searchQuery, 300);

    // Load transfer history
    useEffect(() => {
        const loadTransfers = async () => {
            try {
                const data = await fetchWithAuth('/transfers');
                setTransfers(data);
            } catch (e) {
                console.error("Failed to load transfers:", e);
            }
        };
        loadTransfers();
    }, []);

    // Search users for internal transfer
    useEffect(() => {
        if (debouncedSearch.length >= 2 && singleMethod === "internal") {
            fetchWithAuth(`/transfers/search?q=${encodeURIComponent(debouncedSearch)}`)
                .then(setSearchResults)
                .catch(() => setSearchResults([]));
        } else {
            setSearchResults([]);
        }
    }, [debouncedSearch, singleMethod]);

    const resetSingleForm = () => {
        setSelectedUser(null);
        setSearchQuery("");
        setSinglePhone("");
        setSingleAmount("");
        setSingleNote("");
    };

    const handleSingleTransfer = async () => {
        if (!singleAmount || parseFloat(singleAmount) <= 0) {
            toast({ title: "Error", description: "Enter a valid amount", variant: "destructive" });
            return;
        }

        if (singleMethod === "internal" && !selectedUser) {
            toast({ title: "Error", description: "Select a recipient", variant: "destructive" });
            return;
        }
        if (singleMethod === "mpesa" && !singlePhone) {
            toast({ title: "Error", description: "Enter a phone number", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            const body: any = {
                amount: parseFloat(singleAmount),
                currency: "KES",
                method: singleMethod,
                note: singleNote,
            };
            if (singleMethod === "internal") {
                body.receiverId = selectedUser.id;
            } else {
                body.receiverPhone = singlePhone;
            }

            await fetchWithAuth('/transfers/send', {
                method: 'POST',
                body: JSON.stringify(body)
            });

            toast({ title: "Transfer Successful", description: `KES ${Number(singleAmount).toLocaleString()} sent successfully.` });
            setIsDialogOpen(false);
            resetSingleForm();
            refreshData();
            // Reload transfers
            const data = await fetchWithAuth('/transfers');
            setTransfers(data);
        } catch (err: any) {
            toast({ title: "Transfer Failed", description: err.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const addRecipient = () => {
        setRecipients([...recipients, { id: crypto.randomUUID(), name: "", phone: "", email: "", amount: "" }]);
    };

    const removeRecipient = (id: string) => {
        if (recipients.length <= 1) return;
        setRecipients(recipients.filter(r => r.id !== id));
    };

    const updateRecipient = (id: string, field: keyof Recipient, value: string) => {
        setRecipients(recipients.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    const handleBatchTransfer = async () => {
        const validRecipients = recipients.filter(r => {
            if (batchMethod === "internal") return r.receiverId && parseFloat(r.amount) > 0;
            return r.phone && parseFloat(r.amount) > 0;
        });

        if (validRecipients.length === 0) {
            toast({ title: "Error", description: "Add at least one valid recipient", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            const body: any = {
                recipients: validRecipients.map(r => ({
                    receiverId: r.receiverId,
                    phone: r.phone,
                    email: r.email,
                    amount: parseFloat(r.amount),
                })),
                currency: "KES",
                method: batchMethod,
                note: batchNote,
            };

            const result = await fetchWithAuth('/transfers/batch', {
                method: 'POST',
                body: JSON.stringify(body)
            });

            toast({
                title: "Batch Transfer Complete",
                description: result.message
            });
            setIsDialogOpen(false);
            setRecipients([{ id: crypto.randomUUID(), name: "", phone: "", email: "", amount: "" }]);
            refreshData();
            const data = await fetchWithAuth('/transfers');
            setTransfers(data);
        } catch (err: any) {
            toast({ title: "Batch Transfer Failed", description: err.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const totalBatchAmount = recipients.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

    const checkStatus = async (transferId: number) => {
        try {
            const result = await fetchWithAuth(`/transfers/status/${transferId}`);
            toast({ title: "Status Updated", description: `Transfer is now: ${result.status}` });
            // Reload transfers
            const data = await fetchWithAuth('/transfers');
            setTransfers(data);
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Transfers</h1>
                        <p className="text-slate-500 mt-1">Send money to users or M-Pesa numbers instantly.</p>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetSingleForm(); }}>
                        <DialogTrigger asChild>
                            <Button className="flex items-center gap-2 bg-[#025864] hover:bg-[#014a52]">
                                <Send className="w-4 h-4" /> New Transfer
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Send Money</DialogTitle>
                                <DialogDescription>Transfer funds to another user or M-Pesa number.</DialogDescription>
                            </DialogHeader>

                            {/* Tab Selector */}
                            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                                <button
                                    onClick={() => setActiveTab("single")}
                                    className={cn(
                                        "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all",
                                        activeTab === "single" ? "bg-white shadow text-[#025864]" : "text-slate-500"
                                    )}
                                >
                                    <User className="w-4 h-4 inline mr-1" /> Single
                                </button>
                                <button
                                    onClick={() => setActiveTab("batch")}
                                    className={cn(
                                        "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all",
                                        activeTab === "batch" ? "bg-white shadow text-[#025864]" : "text-slate-500"
                                    )}
                                >
                                    <Users className="w-4 h-4 inline mr-1" /> Batch
                                </button>
                            </div>

                            <div className="space-y-4 py-2">
                                {activeTab === "single" ? (
                                    <>
                                        {/* Method Toggle */}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setSingleMethod("internal")}
                                                className={cn(
                                                    "flex-1 p-3 rounded-xl border-2 text-left transition-all",
                                                    singleMethod === "internal" ? "border-[#025864] bg-[#025864]/5" : "border-slate-200"
                                                )}
                                            >
                                                <User className="w-4 h-4 mb-1 text-[#025864]" />
                                                <p className="text-xs font-bold">Ripplify User</p>
                                            </button>
                                            <button
                                                onClick={() => setSingleMethod("mpesa")}
                                                className={cn(
                                                    "flex-1 p-3 rounded-xl border-2 text-left transition-all",
                                                    singleMethod === "mpesa" ? "border-[#025864] bg-[#025864]/5" : "border-slate-200"
                                                )}
                                            >
                                                <Smartphone className="w-4 h-4 mb-1 text-green-600" />
                                                <p className="text-xs font-bold">M-Pesa</p>
                                            </button>
                                        </div>

                                        {singleMethod === "internal" ? (
                                            <>
                                                <div>
                                                    <label className="text-sm font-medium mb-1 block">Search User</label>
                                                    <div className="relative">
                                                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                                        <Input
                                                            placeholder="Search by name, email, phone, or ID"
                                                            className="pl-9"
                                                            value={searchQuery}
                                                            onChange={e => { setSearchQuery(e.target.value); setSelectedUser(null); }}
                                                        />
                                                    </div>
                                                    {searchResults.length > 0 && !selectedUser && (
                                                        <div className="mt-1 border rounded-xl max-h-40 overflow-y-auto">
                                                            {searchResults.map((u: any) => (
                                                                <button
                                                                    key={u.id}
                                                                    onClick={() => { setSelectedUser(u); setSearchQuery(u.fullName || u.businessName || u.email); setSearchResults([]); }}
                                                                    className="w-full text-left px-3 py-2 hover:bg-slate-50 border-b last:border-0"
                                                                >
                                                                    <p className="text-sm font-medium">{u.fullName || u.businessName}</p>
                                                                    <p className="text-xs text-slate-500">{u.email} {u.phone ? `· ${u.phone}` : ''}</p>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {selectedUser && (
                                                        <div className="mt-2 p-3 bg-[#025864]/5 rounded-xl flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-[#025864] text-white flex items-center justify-center text-xs font-bold">
                                                                {(selectedUser.fullName || selectedUser.businessName || "U").substring(0, 2).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium">{selectedUser.fullName || selectedUser.businessName}</p>
                                                                <p className="text-xs text-slate-500">{selectedUser.email}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        ) : (
                                            <div>
                                                <label className="text-sm font-medium mb-1 block">M-Pesa Phone Number</label>
                                                <Input
                                                    placeholder="07xxxxxxxx"
                                                    value={singlePhone}
                                                    onChange={e => setSinglePhone(e.target.value)}
                                                />
                                            </div>
                                        )}

                                        <div>
                                            <label className="text-sm font-medium mb-1 block">Amount (KES)</label>
                                            <Input type="number" placeholder="0.00" value={singleAmount} onChange={e => setSingleAmount(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium mb-1 block">Note (Optional)</label>
                                            <Input placeholder="What's this for?" value={singleNote} onChange={e => setSingleNote(e.target.value)} />
                                        </div>

                                        <Button className="w-full bg-[#025864] hover:bg-[#014a52]" onClick={handleSingleTransfer} disabled={loading}>
                                            {loading ? "Sending..." : `Send ${singleAmount ? `KES ${Number(singleAmount).toLocaleString()}` : ''}`}
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        {/* Batch Transfer */}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setBatchMethod("internal")}
                                                className={cn(
                                                    "flex-1 p-3 rounded-xl border-2 text-center transition-all text-xs font-bold",
                                                    batchMethod === "internal" ? "border-[#025864] bg-[#025864]/5 text-[#025864]" : "border-slate-200 text-slate-500"
                                                )}
                                            >
                                                Ripplify Users
                                            </button>
                                            <button
                                                onClick={() => setBatchMethod("mpesa")}
                                                className={cn(
                                                    "flex-1 p-3 rounded-xl border-2 text-center transition-all text-xs font-bold",
                                                    batchMethod === "mpesa" ? "border-[#025864] bg-[#025864]/5 text-[#025864]" : "border-slate-200 text-slate-500"
                                                )}
                                            >
                                                M-Pesa Numbers
                                            </button>
                                        </div>

                                        <div className="space-y-3 max-h-[300px] overflow-y-auto">
                                            {recipients.map((r, i) => (
                                                <div key={r.id} className="p-3 border rounded-xl space-y-2 relative">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-xs font-bold text-slate-400">Recipient {i + 1}</span>
                                                        {recipients.length > 1 && (
                                                            <button onClick={() => removeRecipient(r.id)} className="text-red-400 hover:text-red-600">
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <Input
                                                        placeholder={batchMethod === "mpesa" ? "Phone (07xxxxxxxx)" : "User ID"}
                                                        value={batchMethod === "mpesa" ? r.phone : (r.receiverId?.toString() || "")}
                                                        onChange={e => batchMethod === "mpesa"
                                                            ? updateRecipient(r.id, "phone", e.target.value)
                                                            : updateRecipient(r.id, "receiverId", e.target.value)
                                                        }
                                                        className="text-sm"
                                                    />
                                                    <Input
                                                        placeholder="Amount (KES)"
                                                        type="number"
                                                        value={r.amount}
                                                        onChange={e => updateRecipient(r.id, "amount", e.target.value)}
                                                        className="text-sm"
                                                    />
                                                </div>
                                            ))}
                                        </div>

                                        <button
                                            onClick={addRecipient}
                                            className="w-full py-2 border-2 border-dashed border-slate-200 rounded-xl text-sm font-medium text-slate-500 hover:border-[#025864] hover:text-[#025864] transition-colors flex items-center justify-center gap-1"
                                        >
                                            <Plus className="w-4 h-4" /> Add Recipient
                                        </button>

                                        <div>
                                            <label className="text-sm font-medium mb-1 block">Note (Optional)</label>
                                            <Input placeholder="What's this for?" value={batchNote} onChange={e => setBatchNote(e.target.value)} />
                                        </div>

                                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                            <span className="text-sm font-medium text-slate-600">Total Amount</span>
                                            <span className="text-lg font-bold text-slate-900">KES {totalBatchAmount.toLocaleString()}</span>
                                        </div>

                                        <Button className="w-full bg-[#025864] hover:bg-[#014a52]" onClick={handleBatchTransfer} disabled={loading}>
                                            {loading ? "Processing..." : `Send to ${recipients.length} Recipients`}
                                        </Button>
                                    </>
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Transfer History */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-100">
                        <h3 className="font-bold text-slate-900">Transfer History</h3>
                    </div>
                    {transfers.length === 0 ? (
                        <div className="p-10 text-center text-slate-400">
                            <Send className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">No transfers yet. Send money to get started.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-50">
                            {transfers.map((t) => (
                                <div key={t.id} className="px-5 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center",
                                            t.method === 'internal' ? "bg-indigo-50 text-indigo-600" : t.method === 'mpesa' ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"
                                        )}>
                                            <ArrowUpRight className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">
                                                {t.receiverName || t.receiverBusiness || t.receiverPhone || `User #${t.receiverId}`}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {t.method === 'mpesa' ? 'M-Pesa' : t.method === 'bank' ? 'Bank' : 'Internal'}
                                                {t.fee > 0 ? ` · Fee: KES ${Number(t.fee).toLocaleString()}` : ''}
                                                {t.note ? ` · ${t.note}` : ''}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-slate-900">- KES {Number(t.amount).toLocaleString()}</p>
                                            <div className="flex items-center gap-1.5 justify-end">
                                                <span className={cn(
                                                    "text-[10px] font-bold",
                                                    t.status === 'Completed' ? "text-emerald-500" : t.status === 'Processing' ? "text-amber-500" : "text-red-500"
                                                )}>
                                                    {t.status}
                                                </span>
                                                {t.status === 'Processing' && (
                                                    <button
                                                        onClick={() => checkStatus(t.id)}
                                                        className="text-[10px] text-[#025864] hover:underline font-medium flex items-center gap-0.5"
                                                        title="Check status with IntaSend"
                                                    >
                                                        <RefreshCw className="w-3 h-3" /> Refresh
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default TransfersPage;
