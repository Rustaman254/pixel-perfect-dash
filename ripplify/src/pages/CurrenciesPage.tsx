import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Search, Globe, Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchWithAuth } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface Currency {
    code: string;
    name: string;
    flag: string;
    rate: string;
    symbol: string;
    enabled: boolean;
    volume: string;
}

const initialCurrencies: Currency[] = [
    { code: "USD", name: "US Dollar", flag: "🇺🇸", rate: "1.00", symbol: "$", enabled: true, volume: "$24,680" },
    { code: "EUR", name: "Euro", flag: "🇪🇺", rate: "0.92", symbol: "€", enabled: true, volume: "$8,320" },
    { code: "GBP", name: "British Pound", flag: "🇬🇧", rate: "0.79", symbol: "£", enabled: true, volume: "$5,120" },
    { code: "KES", name: "Kenyan Shilling", flag: "🇰🇪", rate: "129.00", symbol: "KSh", enabled: true, volume: "$12,450" },
    { code: "NGN", name: "Nigerian Naira", flag: "🇳🇬", rate: "1,550.00", symbol: "₦", enabled: true, volume: "$3,210" },
    { code: "ZAR", name: "South African Rand", flag: "🇿🇦", rate: "18.45", symbol: "R", enabled: false, volume: "$0" },
    { code: "BRL", name: "Brazilian Real", flag: "🇧🇷", rate: "5.10", symbol: "R$", enabled: false, volume: "$0" },
    { code: "JPY", name: "Japanese Yen", flag: "🇯🇵", rate: "149.50", symbol: "¥", enabled: false, volume: "$0" },
    { code: "INR", name: "Indian Rupee", flag: "🇮🇳", rate: "83.20", symbol: "₹", enabled: true, volume: "$1,870" },
    { code: "AED", name: "UAE Dirham", flag: "🇦🇪", rate: "3.67", symbol: "د.إ", enabled: true, volume: "$6,540" },
    { code: "GHS", name: "Ghanaian Cedi", flag: "🇬🇭", rate: "14.80", symbol: "₵", enabled: false, volume: "$0" },
    { code: "TZS", name: "Tanzanian Shilling", flag: "🇹🇿", rate: "2,510.00", symbol: "TSh", enabled: true, volume: "$2,100" },
];

const CurrenciesPage = () => {
    const [currencies, setCurrencies] = useState<Currency[]>([]);
    const [supportedCurrencies, setSupportedCurrencies] = useState<Currency[]>([]);
    
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<"All" | "Active" | "Inactive">("All");
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [selectedCurrencyToAdd, setSelectedCurrencyToAdd] = useState<string>("");

    useEffect(() => {
        fetchCurrencies();
    }, []);

    const fetchCurrencies = async () => {
        try {
            // First fetch the list of currencies supported by the platform
            const supported = await fetchWithAuth('/currencies/supported');
            setSupportedCurrencies(supported);

            // Then fetch the user's currency settings
            const userSettings = await fetchWithAuth('/currencies');
            
            // If the user has no settings, maybe we fallback to defaults or empty
            const merged = userSettings.map((us: any) => {
                const sc = supported.find((s: any) => s.code === us.code);
                if (sc) {
                    return { ...sc, ...us, enabled: !!us.enabled };
                }
                return null;
            }).filter(Boolean);
            
            // If user has NO currencies configured yet, let's load initialCurrencies that are supported
            if (merged.length === 0) {
                const defaults = initialCurrencies.map(ic => {
                    const sc = supported.find((s: any) => s.code === ic.code);
                    return sc ? { ...sc, enabled: ic.enabled } : null;
                }).filter(Boolean);
                setCurrencies(defaults as Currency[]);
            } else {
                setCurrencies(merged as Currency[]);
            }
            
        } catch (error) {
            console.error("Failed to fetch currencies:", error);
            toast({
                title: "Error",
                description: "Failed to load your currency settings.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAddCurrency = () => {
        setIsAddOpen(true);
        setSelectedCurrencyToAdd("");
    };

    const confirmAddCurrency = async () => {
        if (!selectedCurrencyToAdd) return;
        
        const currencyToAdd = supportedCurrencies.find(c => c.code === selectedCurrencyToAdd);
        if (!currencyToAdd) return;

        // Add to local state
        const newCurrencies = [{ ...currencyToAdd, enabled: true }, ...currencies];
        setCurrencies(newCurrencies);
        
        try {
            await fetchWithAuth(`/currencies/${currencyToAdd.code}`, {
                method: 'PUT',
                body: JSON.stringify({ enabled: true })
            });
            toast({
                title: "Currency Added",
                description: `${currencyToAdd.name} has been added to your platform.`,
            });
            setIsAddOpen(false);
        } catch (error) {
            setCurrencies(currencies); // Revert
            toast({
                title: "Error",
                description: "Failed to add currency.",
                variant: "destructive"
            });
        }
    };

    const toggleCurrency = async (code: string) => {
        const currency = currencies.find(c => c.code === code);
        if (!currency) return;

        const newEnabled = !currency.enabled;

        setCurrencies((prev) =>
            prev.map((c) => (c.code === code ? { ...c, enabled: newEnabled } : c))
        );

        try {
            await fetchWithAuth(`/currencies/${code}`, {
                method: 'PUT',
                body: JSON.stringify({ enabled: newEnabled })
            });
        } catch (error) {
            setCurrencies((prev) =>
                prev.map((c) => (c.code === code ? { ...c, enabled: currency.enabled } : c))
            );
            toast({
                title: "Error",
                description: "Failed to update currency setting.",
                variant: "destructive"
            });
        }
    };

    const filtered = currencies.filter((c) => {
        const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase());
        const matchFilter = filter === "All" || (filter === "Active" ? c.enabled : !c.enabled);
        return matchSearch && matchFilter;
    });

    return (
        <DashboardLayout>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                <h1 className="text-xl md:text-2xl font-bold text-foreground">Currencies</h1>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Globe className="w-4 h-4" />
                        <span>{currencies.filter(c => c.enabled).length} of {currencies.length} active</span>
                    </div>
                    <button 
                        onClick={handleAddCurrency}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                        style={{ backgroundColor: '#025864' }}
                    >
                        <Plus className="w-4 h-4" />
                        Add New
                    </button>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
                <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 flex-1 w-full sm:w-auto">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search currencies..."
                        className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    {(["All", "Active", "Inactive"] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${filter === f ? 'text-white' : 'text-muted-foreground hover:text-foreground bg-muted'}`}
                            style={filter === f ? { backgroundColor: '#025864' } : undefined}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Currency Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((currency) => (
                    <div key={currency.code} className="bg-card rounded-2xl p-5 border border-border">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{currency.flag}</span>
                                <div>
                                    <h3 className="text-sm font-semibold text-foreground">{currency.code}</h3>
                                    <p className="text-[11px] text-muted-foreground">{currency.name}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => toggleCurrency(currency.code)}
                                className={`relative w-10 h-5.5 rounded-full transition-colors ${currency.enabled ? '' : 'bg-gray-200'}`}
                                style={currency.enabled ? { backgroundColor: '#00D47E' } : undefined}
                            >
                                <span className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-transform ${currency.enabled ? 'left-[19px]' : 'left-0.5'}`}
                                    style={{ width: '18px', height: '18px' }}
                                />
                            </button>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[11px] text-muted-foreground">Exchange Rate</p>
                                <p className="text-sm font-medium text-foreground">1 USD = {currency.symbol}{currency.rate}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[11px] text-muted-foreground">Volume</p>
                                <p className="text-sm font-medium text-foreground">{currency.volume}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Currency Dialog */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Supported Currency</DialogTitle>
                        <DialogDescription>Select a currency to support on your platform.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Currency</Label>
                            <Select value={selectedCurrencyToAdd} onValueChange={setSelectedCurrencyToAdd}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select currency..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {supportedCurrencies
                                        .filter(sc => !currencies.some(c => c.code === sc.code))
                                        .map(sc => (
                                            <SelectItem key={sc.code} value={sc.code}>
                                                <span className="flex items-center gap-2">
                                                    <span>{sc.flag}</span>
                                                    <span>{sc.code} - {sc.name}</span>
                                                </span>
                                            </SelectItem>
                                        ))
                                    }
                                    {supportedCurrencies.filter(sc => !currencies.some(c => c.code === sc.code)).length === 0 && (
                                        <SelectItem value="none" disabled>No more currencies available</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                        <Button 
                            className="bg-primary text-primary-foreground" 
                            onClick={confirmAddCurrency}
                            disabled={!selectedCurrencyToAdd || selectedCurrencyToAdd === "none"}
                        >
                            Add Currency
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default CurrenciesPage;
