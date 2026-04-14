import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Copy, Plus, Send, Wallet, Download } from "lucide-react";
import { useState } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { fetchWithAuth } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const WalletsPage = () => {
    const { wallets, refreshData } = useAppContext();
    const { toast } = useToast();
    const [isDepositOpen, setIsDepositOpen] = useState(false);
    const [isTransferOpen, setIsTransferOpen] = useState(false);
    
    // Transfer State
    const [transferReceiverId, setTransferReceiverId] = useState("");
    const [transferAmount, setTransferAmount] = useState("");
    const [transferCurrency, setTransferCurrency] = useState("KES");
    
    // Deposit State
    const [depositCurrency, setDepositCurrency] = useState("KES");
    const [depositAmount, setDepositAmount] = useState("");
    const [depositResponse, setDepositResponse] = useState<any>(null);

    const handleTransfer = async () => {
        try {
            await fetchWithAuth('/wallets/transfer', {
                method: 'POST',
                body: JSON.stringify({
                    receiverId: transferReceiverId,
                    amount: transferAmount,
                    currency: transferCurrency,
                    network: 'fiat'
                })
            });
            toast({ title: "Transfer Successful", description: "Funds sent successfully." });
            setIsTransferOpen(false);
            refreshData();
        } catch (error: any) {
            toast({ title: "Transfer Failed", description: error.message, variant: "destructive" });
        }
    };

    const handleDeposit = async () => {
        try {
            const isCrypto = ['USDC', 'USDA'].includes(depositCurrency);
            const network = depositCurrency === 'USDA' ? 'cardano' : (isCrypto ? 'polygon' : 'fiat');
            
            const reqData = {
                amount: depositAmount || "0",
                currency: depositCurrency,
                network,
                paymentMethod: isCrypto ? 'crypto' : 'mpesa'
            };
            
            const res = await fetchWithAuth('/wallets/deposit', {
                method: 'POST',
                body: JSON.stringify(reqData)
            });
            
            if (isCrypto) {
                setDepositResponse(res.depositInfo);
            } else {
                toast({ title: "Deposit Initialized", description: "M-Pesa push sent." });
                setIsDepositOpen(false);
                refreshData(); // If instant deposit fake is on, this will refresh
            }
        } catch (error: any) {
            toast({ title: "Deposit Error", description: error.message, variant: "destructive" });
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Your Wallets</h1>
                    <p className="text-slate-500 mt-1">Manage balances, top-up crypto/fiat, and send funds instantly.</p>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-4">
                    <Dialog open={isDepositOpen} onOpenChange={setIsDepositOpen}>
                        <DialogTrigger asChild>
                            <Button className="flex items-center gap-2">
                                <Download className="w-4 h-4" /> Deposit
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Deposit Funds</DialogTitle>
                                <DialogDescription>Choose a currency to deposit. Crypto deposits will generate a network address.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                {!depositResponse ? (
                                    <>
                                        <div>
                                            <label className="text-sm font-medium mb-1 block">Currency</label>
                                            <select 
                                                className="w-full rounded-md border p-2"
                                                value={depositCurrency}
                                                onChange={(e) => setDepositCurrency(e.target.value)}
                                            >
                                                <option value="KES">KES (M-Pesa)</option>
                                                <option value="USDA">USDA (Cardano)</option>
                                                <option value="USDC">USDC (Polygon)</option>
                                            </select>
                                        </div>
                                        {(depositCurrency === 'KES' || depositCurrency === 'USD') && (
                                            <div>
                                                <label className="text-sm font-medium mb-1 block">Amount</label>
                                                <Input type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} />
                                            </div>
                                        )}
                                        <Button className="w-full" onClick={handleDeposit}>Proceed</Button>
                                    </>
                                ) : (
                                    <div className="text-center space-y-4">
                                        <div className="p-4 bg-slate-100 rounded-lg break-all font-mono text-sm">
                                            {depositResponse.address}
                                        </div>
                                        <p className="text-sm text-slate-500">Send only {depositResponse.currency} on the {depositResponse.network} network to this address. It will be automatically credited.</p>
                                        <Button variant="outline" className="w-full" onClick={() => {
                                            navigator.clipboard.writeText(depositResponse.address);
                                            toast({ title: "Address copied" });
                                        }}>
                                            <Copy className="w-4 h-4 mr-2" /> Copy Address
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="flex items-center gap-2">
                                <Send className="w-4 h-4" /> Transfer internally
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Transfer to User</DialogTitle>
                                <DialogDescription>Send money instantly to another RippliFy user without fees.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Receiver ID</label>
                                    <Input value={transferReceiverId} onChange={e => setTransferReceiverId(e.target.value)} placeholder="e.g. 15" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Currency</label>
                                    <select className="w-full rounded-md border p-2" value={transferCurrency} onChange={e => setTransferCurrency(e.target.value)}>
                                        <option value="KES">KES</option>
                                        <option value="USDA">USDA</option>
                                        <option value="USDC">USDC</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Amount</label>
                                    <Input type="number" value={transferAmount} onChange={e => setTransferAmount(e.target.value)} />
                                </div>
                                <Button className="w-full" onClick={handleTransfer}>Confirm Transfer</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Wallets Grid */}
                {wallets.length === 0 ? (
                    <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
                        No active wallets. Deposit funds to create one.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {wallets.map((wallet) => (
                            <div key={wallet.id} className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-semibold text-lg text-slate-900">{wallet.currency_code}</h3>
                                        <p className="text-xs text-slate-500 font-medium uppercase">{wallet.network}</p>
                                    </div>
                                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                        <Wallet className="w-5 h-5" />
                                    </div>
                                </div>
                                
                                <div>
                                    <p className="text-3xl font-bold tracking-tight text-slate-900">
                                        {wallet.balance.toLocaleString()}
                                    </p>
                                    {wallet.locked_balance > 0 && (
                                        <p className="text-xs text-amber-500 mt-1">
                                            {wallet.locked_balance.toLocaleString()} locked
                                        </p>
                                    )}
                                </div>
                                
                                {wallet.address && (
                                    <div className="mt-4 pt-4 border-t border-slate-100">
                                        <p className="text-xs text-slate-500 mb-1">Deposit Address</p>
                                        <div className="flex items-center gap-2">
                                            <code className="text-xs bg-slate-50 p-1 rounded truncate flex-1 block">
                                                {wallet.address}
                                            </code>
                                            <button 
                                                className="text-slate-400 hover:text-slate-600 transition"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(wallet.address || "");
                                                    toast({ title: "Address copied" });
                                                }}
                                            >
                                                <Copy className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default WalletsPage;
