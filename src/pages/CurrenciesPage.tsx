import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Search, Globe, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
    const [currencies, setCurrencies] = useState(initialCurrencies);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<"All" | "Active" | "Inactive">("All");
    const { toast } = useToast();

    const handleAddCurrency = () => {
        const code = prompt("Enter Currency Code (e.g., CAD):");
        if (!code) return;
        const name = prompt("Enter Currency Name (e.g., Canadian Dollar):");
        if (!name) return;
        
        const newCurrency: Currency = {
            code: code.toUpperCase(),
            name: name,
            flag: "🏳️",
            rate: (Math.random() * 100).toFixed(2),
            symbol: "$",
            enabled: true,
            volume: "$0",
        };

        setCurrencies([newCurrency, ...currencies]);
        toast({
            title: "Currency Added",
            description: `${name} (${code.toUpperCase()}) has been added to your list.`,
        });
    };

    const toggleCurrency = (code: string) => {
        setCurrencies((prev) =>
            prev.map((c) => (c.code === code ? { ...c, enabled: !c.enabled } : c))
        );
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
        </DashboardLayout>
    );
};

export default CurrenciesPage;
