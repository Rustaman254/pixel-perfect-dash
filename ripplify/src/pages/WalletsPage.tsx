import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Copy, Plus, Send, Wallet, Download, RefreshCw, ArrowUpRight, ArrowDownLeft, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { useAppContext, Wallet as WalletType } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { fetchWithAuth } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const WalletsPage = () => {
    const { wallets, refreshData } = useAppContext();
    const { toast } = useToast();
    const [isDepositOpen, setIsDepositOpen] = useState(false);
    const [isTransferOpen, setIsTransferOpen] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    // Selected Wallet for history
    const [selectedWallet, setSelectedWallet] = useState<WalletType | null>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    
    // Transfer State
    const [transferReceiverId, setTransferReceiverId] = useState("");
    const [transferAmount, setTransferAmount] = useState("");
    const [transferCurrency, setTransferCurrency] = useState("KES");
    
    // Deposit State
    const [depositCurrency, setDepositCurrency] = useState("KES");
    const [depositAmount, setDepositAmount] = useState("");
    const [depositResponse, setDepositResponse] = useState<any>(null);

    useEffect(() => {
        if (wallets.length > 0 && !selectedWallet) {
            setSelectedWallet(wallets[0]);
        }
    }, [wallets]);

    useEffect(() => {
        if (selectedWallet) {
            fetchHistory(selectedWallet.id);
        }
    }, [selectedWallet]);

    const fetchHistory = async (walletId: number) => {
        setLoadingHistory(true);
        try {
            const data = await fetchWithAuth(`/wallets/${walletId}/transactions`);
            setHistory(data.results || data || []);
        } catch (error) {
            console.error("Failed to fetch history:", error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refreshData();
        if (selectedWallet) {
            await fetchHistory(selectedWallet.id);
        }
        setIsRefreshing(false);
        toast({ title: "Updated", description: "Balance and history refreshed." });
    };

    const handleTransfer = async () => {
        try {
            await fetchWithAuth('/wallets/withdraw', { // Changed to withdraw or new transfer endpoint if needed
                method: 'POST',
                body: JSON.stringify({
                    receiverId: transferReceiverId,
                    amount: transferAmount,
                    currency: transferCurrency,
                    method: 'internal'
                })
            });
            toast({ title: "Transfer Successful", description: "Funds sent successfully." });
            setIsTransferOpen(false);
            refreshData();
        } catch (error: any) {
            toast({ title: "Transfer Failed", description: error.message, variant: "destructive" });
        }
    };

    const handleCreateWallet = async (currency: string) => {
        try {
            await fetchWithAuth('/wallets', {
                method: 'POST',
                body: JSON.stringify({ currency_code: currency, network: 'fiat' })
            });
            toast({ title: "Wallet Created", description: `${currency} wallet is ready.` });
            refreshData();
        } catch (error: any) {
            toast({ title: "Creation Failed", description: error.message, variant: "destructive" });
        }
    };

    const handleDeposit = async () => {
        try {
            const isCrypto = ['USDC', 'USDA'].includes(depositCurrency);
            const network = depositCurrency === 'USDA' ? 'cardano' : (isCrypto ? 'polygon' : 'fiat');
            
            // For KES, we use public-transaction endpoint which is more robust
            if (!isCrypto) {
                // Should redirect to a payment link flow or use stk push
                toast({ title: "Deposit", description: "Please use a payment link to top up your wallet." });
                setIsDepositOpen(false);
                return;
            }

            const reqData = {
                amount: depositAmount || "0",
                currency: depositCurrency,
                network,
                paymentMethod: 'crypto'
            };
            
            const res = await fetchWithAuth('/wallets/deposit', {
                method: 'POST',
                body: JSON.stringify(reqData)
            });
            
            setDepositResponse(res.depositInfo || res.wallet);
        } catch (error: any) {
            toast({ title: "Deposit Error", description: error.message, variant: "destructive" });
        }
    };

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('en-KE', { 
            style: 'currency', 
            currency: currency,
            minimumFractionDigits: 2 
        }).format(amount);
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Your Wallets</h1>
                        <p className="text-slate-500 mt-1">Directly owned IntaSend wallets for real-time fund management.</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="flex items-center gap-2">
                        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh
                    </Button>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-4">
                    <Dialog open={isDepositOpen} onOpenChange={setIsDepositOpen}>
                        <DialogTrigger asChild>
                            <Button className="flex items-center gap-2 shadow-sm">
                                <Download className="w-4 h-4" /> Deposit
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Deposit Funds</DialogTitle>
                                <DialogDescription>Top up your RippliFy wallet. M-Pesa and Crypto supported.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                {!depositResponse ? (
                                    <>
                                        <div>
                                            <label className="text-sm font-medium mb-1 block text-slate-700">Currency</label>
                                            <select 
                                                className="w-full rounded-md border border-slate-200 bg-white p-2 text-sm focus:ring-2 focus:ring-emerald-500 transition-all"
                                                value={depositCurrency}
                                                onChange={(e) => setDepositCurrency(e.target.value)}
                                            >
                                                <option value="KES">KES (M-Pesa / Card)</option>
                                                <option value="USDC">USDC (Polygon)</option>
                                                <option value="USDA">USDA (Cardano)</option>
                                            </select>
                                        </div>
                                        {depositCurrency === 'KES' ? (
                                            <div className="bg-emerald-50 p-4 rounded-lg text-emerald-800 text-sm">
                                                To deposit KES, create a payment link and pay it. Funds will reflect instantly in your KES wallet.
                                            </div>
                                        ) : (
                                            <div>
                                                <label className="text-sm font-medium mb-1 block text-slate-700">Amount</label>
                                                <Input type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} placeholder="0.00" />
                                            </div>
                                        )}
                                        <Button className="w-full" onClick={handleDeposit} disabled={depositCurrency === 'KES'}>Proceed</Button>
                                    </>
                                ) : (
                                    <div className="text-center space-y-4">
                                        <div className="p-4 bg-slate-900 text-slate-100 rounded-lg break-all font-mono text-xs shadow-inner">
                                            {depositResponse.address}
                                        </div>
                                        <p className="text-xs text-slate-500 italic">Send only {depositResponse.currency} on the {depositResponse.network} network.</p>
                                        <div className="flex gap-2">
                                            <Button variant="outline" className="flex-1" onClick={() => {
                                                navigator.clipboard.writeText(depositResponse.address);
                                                toast({ title: "Address copied" });
                                            }}>
                                                <Copy className="w-4 h-4 mr-2" /> Copy
                                            </Button>
                                            <Button className="flex-1" onClick={() => setDepositResponse(null)}>Done</Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="flex items-center gap-2 shadow-sm">
                                <Send className="w-4 h-4" /> Transfer
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Internal Transfer</DialogTitle>
                                <DialogDescription>Send funds to another RippliFy user instantly.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Receiver ID / Email</label>
                                    <Input value={transferReceiverId} onChange={e => setTransferReceiverId(e.target.value)} placeholder="User ID or email" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium mb-1 block">Currency</label>
                                        <select className="w-full rounded-md border p-2 text-sm" value={transferCurrency} onChange={e => setTransferCurrency(e.target.value)}>
                                            {wallets.map(w => <option key={w.id} value={w.currency_code}>{w.currency_code}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-1 block">Amount</label>
                                        <Input type="number" value={transferAmount} onChange={e => setTransferAmount(e.target.value)} placeholder="0.00" />
                                    </div>
                                </div>
                                <Button className="w-full" onClick={handleTransfer}>Confirm Transfer</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                    
                    {!wallets.some(w => w.currency_code === 'KES') && (
                        <Button variant="secondary" onClick={() => handleCreateWallet('KES')} className="flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Setup KES Wallet
                        </Button>
                    )}
                </div>

                {/* Wallets Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {wallets.length === 0 ? (
                        <div className="col-span-3 bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
                            <Wallet className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-slate-900">No active wallets</h3>
                            <p className="text-slate-500 mt-1 max-w-xs mx-auto mb-6">Setup your first wallet to start accepting payments and managing funds.</p>
                            <Button onClick={() => handleCreateWallet('KES')}>
                                <Plus className="w-4 h-4 mr-2" /> Initial Setup
                            </Button>
                        </div>
                    ) : (
                        wallets.map((wallet) => (
                            <Card 
                                key={wallet.id} 
                                className={`cursor-pointer transition-all hover:shadow-md ${selectedWallet?.id === wallet.id ? 'ring-2 ring-emerald-500 border-transparent bg-emerald-50/10' : ''}`}
                                onClick={() => setSelectedWallet(wallet)}
                            >
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        {wallet.currency_code} Wallet
                                        <p className="text-[10px] text-slate-500 font-normal uppercase mt-0.5">{wallet.network}</p>
                                    </CardTitle>
                                    <div className={`p-2 rounded-lg ${selectedWallet?.id === wallet.id ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                        <Wallet className="w-4 h-4" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-slate-900">
                                        {formatCurrency(wallet.balance, wallet.currency_code)}
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                        <p className="text-[10px] text-slate-500">
                                            {wallet.locked_balance > 0 ? `${formatCurrency(wallet.locked_balance, wallet.currency_code)} locked` : 'No funds locked'}
                                        </p>
                                        {wallet.intasend_wallet_id && (
                                            <Badge variant="outline" className="text-[8px] h-4 py-0 font-mono">INTASEND SECURED</Badge>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {/* Transaction History Section */}
                {selectedWallet && (
                    <Card className="border-slate-200 shadow-sm overflow-hidden">
                        <CardHeader className="border-b border-slate-100 py-4 px-6 bg-slate-50/50">
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle className="text-lg">Transaction History</CardTitle>
                                    <CardDescription>Recent activity for your {selectedWallet.currency_code} wallet.</CardDescription>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => fetchHistory(selectedWallet.id)} disabled={loadingHistory} className="h-8 px-2">
                                    <RefreshCw className={`w-3 h-3 ${loadingHistory ? 'animate-spin' : ''}`} />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loadingHistory ? (
                                <div className="p-12 text-center text-slate-400">
                                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                                    <p className="text-sm">Fetching real-time ledger...</p>
                                </div>
                            ) : history.length === 0 ? (
                                <div className="p-12 text-center text-slate-400">
                                    <Clock className="w-6 h-6 mx-auto mb-2 opacity-20" />
                                    <p className="text-sm font-medium">No transactions yet</p>
                                    <p className="text-xs">Incoming and outgoing funds will appear here.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {history.map((tx: any, idx: number) => {
                                        const isOutgoing = tx.type === 'Internal Transfer' && tx.sender_wallet_id === selectedWallet.intasend_wallet_id;
                                        const amount = parseFloat(tx.amount || tx.net_amount || 0);
                                        
                                        return (
                                            <div key={tx.id || idx} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-2 rounded-full ${isOutgoing ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                        {isOutgoing ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-900">{tx.narrative || tx.description || 'Wallet Transaction'}</p>
                                                        <p className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
                                                            {new Date(tx.created_at || tx.createdAt).toLocaleString()} • {tx.status || 'Completed'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-sm font-bold ${isOutgoing ? 'text-slate-900' : 'text-emerald-600'}`}>
                                                        {isOutgoing ? '-' : '+'}{formatCurrency(amount, selectedWallet.currency_code)}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 font-mono">{tx.tracking_id || tx.transactionId}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
};

export default WalletsPage;
