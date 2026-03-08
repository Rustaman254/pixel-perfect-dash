import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { CreditCard, Smartphone, Bitcoin, Building2, Settings, ChevronRight, Plus, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
    const { toast } = useToast();

    const handleAddMethod = () => {
        const name = prompt("Enter Payment Method Name (e.g., PayPal):");
        if (!name) return;
        
        const newMethod: PaymentMethod = {
            id: name.toLowerCase().replace(/\s/g, "-"),
            name: name,
            description: "New payment method added manually",
            icon: HelpCircle,
            enabled: true,
            fee: "2.0%",
            currencies: ["USD"],
        };

        setMethods([...methods, newMethod]);
        toast({
            title: "Payment Method Added",
            description: `${name} has been added to your payment options.`,
        });
    };

    const toggleMethod = (id: string) => {
        setMethods((prev) =>
            prev.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m))
        );
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
                                <button className="flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80" style={{ color: '#025864' }}>
                                    <Settings className="w-4 h-4" />
                                    Configure Settings
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </DashboardLayout>
    );
};

export default PaymentMethodsPage;
