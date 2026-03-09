import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { CreditCard, Smartphone, Bitcoin, Building2, Settings, ChevronRight, Plus, HelpCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchWithAuth } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface PaymentMethod {
    id: string;
    name: string;
    description: string;
    icon: React.ElementType;
    enabled: boolean;
    fee: string;
    currencies: string[];
}

const initialMethods: PaymentMethod[] = [
    { id: "mpesa", name: "M-Pesa", description: "Mobile money payments across East Africa", icon: Smartphone, enabled: true, fee: "1.5%", currencies: ["KES", "TZS", "UGX"] },
    { id: "card", name: "Card Payments", description: "Accept Visa, Mastercard, and AMEX", icon: CreditCard, enabled: true, fee: "2.9% + $0.30", currencies: ["USD", "EUR", "GBP"] },
    { id: "crypto", name: "Cryptocurrency", description: "Accept USDC, USDT, BTC, and ETH", icon: Bitcoin, enabled: true, fee: "1.0%", currencies: ["USDC", "USDT", "BTC", "ETH"] },
    { id: "bank", name: "Bank Transfer", description: "Direct bank-to-bank transfers", icon: Building2, enabled: false, fee: "0.5%", currencies: ["USD", "EUR", "GBP", "NGN"] },
];

const PaymentMethodsPage = () => {
    const [methods, setMethods] = useState(initialMethods);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newMethodName, setNewMethodName] = useState("");
    
    const [configMethodId, setConfigMethodId] = useState<string | null>(null);
    const [configFee, setConfigFee] = useState("");

    useEffect(() => {
        fetchMethods();
    }, []);

    const fetchMethods = async () => {
        try {
            const userMethods = await fetchWithAuth('/payment-methods');
            // Merge user settings into initialMethods
            const merged = initialMethods.map(method => {
                const userSetting = userMethods.find((m: any) => m.methodId === method.id);
                if (userSetting) {
                    return { ...method, enabled: !!userSetting.enabled, fee: userSetting.fee };
                }
                return method;
            });
            setMethods(merged);
        } catch (error) {
            console.error("Failed to fetch payment methods:", error);
            toast({
                title: "Error",
                description: "Failed to load your payment method settings.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAddMethod = () => {
        setIsAddOpen(true);
    };

    const confirmAddMethod = () => {
        if (!newMethodName.trim()) return;
        
        const newMethod: PaymentMethod = {
            id: newMethodName.toLowerCase().replace(/\s/g, "-"),
            name: newMethodName,
            description: "New payment method added manually",
            icon: HelpCircle,
            enabled: true,
            fee: "2.0%",
            currencies: ["USD"],
        };

        setMethods([...methods, newMethod]);
        toast({
            title: "Payment Method Added",
            description: `${newMethodName} has been added to your payment options.`,
        });
        setIsAddOpen(false);
        setNewMethodName("");
    };

    const toggleMethod = async (id: string) => {
        const method = methods.find(m => m.id === id);
        if (!method) return;
        
        const newEnabled = !method.enabled;
        
        // Optimistic UI update
        setMethods((prev) =>
            prev.map((m) => (m.id === id ? { ...m, enabled: newEnabled } : m))
        );

        try {
            await fetchWithAuth(`/payment-methods/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ enabled: newEnabled, fee: method.fee })
            });
        } catch (error) {
            // Revert on error
            setMethods((prev) =>
                prev.map((m) => (m.id === id ? { ...m, enabled: method.enabled } : m))
            );
            toast({
                title: "Error",
                description: "Failed to update payment method.",
                variant: "destructive"
            });
        }
    };

    const handleConfigure = (id: string) => {
        const method = methods.find(m => m.id === id);
        if (!method) return;
        setConfigMethodId(id);
        setConfigFee(method.fee);
    };

    const confirmConfigure = async () => {
        if (!configMethodId) return;
        const method = methods.find(m => m.id === configMethodId);
        if (!method) return;

        const newFee = configFee.trim();
        if (!newFee || newFee === method.fee) {
            setConfigMethodId(null);
            return;
        }

        setMethods((prev) =>
            prev.map((m) => (m.id === configMethodId ? { ...m, fee: newFee } : m))
        );

        try {
            await fetchWithAuth(`/payment-methods/${configMethodId}`, {
                method: 'PUT',
                body: JSON.stringify({ enabled: method.enabled, fee: newFee })
            });
            toast({
                title: "Settings Updated",
                description: `Fee rate for ${method.name} updated to ${newFee}.`
            });
        } catch (error) {
            setMethods((prev) =>
                prev.map((m) => (m.id === configMethodId ? { ...m, fee: method.fee } : m))
            );
            toast({
                title: "Error",
                description: "Failed to update fee rate.",
                variant: "destructive"
            });
        }
        setConfigMethodId(null);
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h1 className="text-xl md:text-2xl font-bold text-foreground">Payment Methods</h1>
                <button 
                    onClick={handleAddMethod}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                    style={{ backgroundColor: '#025864' }}
                >
                    <Plus className="w-4 h-4" />
                    Add Method
                </button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-card rounded-2xl p-5 border border-border">
                    <p className="text-sm text-muted-foreground mb-1">Active Methods</p>
                    <h3 className="text-2xl font-bold text-foreground">{methods.filter(m => m.enabled).length}</h3>
                </div>
                <div className="bg-card rounded-2xl p-5 border border-border">
                    <p className="text-sm text-muted-foreground mb-1">Total Methods</p>
                    <h3 className="text-2xl font-bold text-foreground">{methods.length}</h3>
                </div>
                <div className="bg-card rounded-2xl p-5 border border-border">
                    <p className="text-sm text-muted-foreground mb-1">Avg. Fee</p>
                    <h3 className="text-2xl font-bold text-foreground">1.5%</h3>
                </div>
            </div>

            {/* Methods List */}
            <div className="space-y-4">
                {methods.map((method) => (
                    <div key={method.id} className="bg-card rounded-2xl p-5 border border-border hover:shadow-sm transition-shadow">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: method.enabled ? 'rgba(2, 88, 100, 0.08)' : '#f3f4f6' }}>
                                <method.icon className="w-6 h-6" style={{ color: method.enabled ? '#025864' : '#9ca3af' }} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="text-base font-semibold text-foreground">{method.name}</h3>
                                    <button
                                        onClick={() => toggleMethod(method.id)}
                                        className={`relative w-11 h-6 rounded-full transition-colors ${method.enabled ? '' : 'bg-gray-200'}`}
                                        style={method.enabled ? { backgroundColor: '#00D47E' } : undefined}
                                    >
                                        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${method.enabled ? 'left-[22px]' : 'left-0.5'}`} />
                                    </button>
                                </div>
                                <p className="text-sm text-muted-foreground mb-3">{method.description}</p>
                                <div className="flex flex-wrap items-center gap-4">
                                    <div>
                                        <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Transaction Fee</p>
                                        <p className="text-sm font-medium text-foreground">{method.fee}</p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Currencies</p>
                                        <div className="flex flex-wrap gap-1">
                                            {method.currencies.map((c) => (
                                                <span key={c} className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground">{c}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {method.enabled && (
                            <div className="mt-4 pt-4 border-t border-border">
                                <button 
                                    onClick={() => handleConfigure(method.id)}
                                    className="flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80" 
                                    style={{ color: '#025864' }}
                                >
                                    <Settings className="w-4 h-4" />
                                    Configure Fee
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Add Method Dialog */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Payment Method</DialogTitle>
                        <DialogDescription>Enter the details for the new payment method.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="method-name">Payment Method Name</Label>
                            <Input 
                                id="method-name" 
                                placeholder="e.g., PayPal" 
                                value={newMethodName} 
                                onChange={(e) => setNewMethodName(e.target.value)} 
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                        <Button className="bg-primary text-primary-foreground" onClick={confirmAddMethod}>Add Method</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Configure Fee Dialog */}
            <Dialog open={!!configMethodId} onOpenChange={(open) => !open && setConfigMethodId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Configure Fee</DialogTitle>
                        <DialogDescription>Update the transaction fee for this payment method.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="method-fee">Fee Rate</Label>
                            <Input 
                                id="method-fee" 
                                placeholder="e.g., 2.5%" 
                                value={configFee} 
                                onChange={(e) => setConfigFee(e.target.value)} 
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfigMethodId(null)}>Cancel</Button>
                        <Button className="bg-primary text-primary-foreground" onClick={confirmConfigure}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default PaymentMethodsPage;
