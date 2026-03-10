import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Search, Download, Users, MoreHorizontal, ChevronLeft, ChevronRight, Mail } from "lucide-react";
import { useAppContext } from "@/contexts/AppContext";

const CustomersPage = () => {
    const { transactions } = useAppContext();
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    // Derive customers from transactions
    const customerMap = new Map();
    transactions.forEach(t => {
        const email = t.buyerEmail || `phone-${t.buyerPhone}` || "anonymous";
        if (!customerMap.has(email)) {
            customerMap.set(email, {
                id: `CUS-${email.substring(0, 5)}`,
                name: t.buyerName || "Anonymous",
                email: t.buyerEmail || "No Email",
                phone: t.buyerPhone || "",
                flag: "👤",
                totalSpent: 0,
                transactions: 0,
                lastTxn: t.createdAt,
                status: "Active"
            });
        }
        const cus = customerMap.get(email);
        cus.totalSpent += t.amount;
        cus.transactions += 1;
        if (new Date(t.createdAt) > new Date(cus.lastTxn)) {
            cus.lastTxn = t.createdAt;
        }
    });

    const customersList = Array.from(customerMap.values());

    const filtered = customersList.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase()) ||
        c.id.toLowerCase().includes(search.toLowerCase())
    );

    const totalRevenue = customersList.reduce((acc, c) => acc + c.totalSpent, 0);
    const avgLTV = customersList.length > 0 ? (totalRevenue / customersList.length).toFixed(2) : "0";

    return (
        <DashboardLayout>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                <h1 className="text-xl md:text-2xl font-bold text-foreground">Customers</h1>
                <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Download className="w-4 h-4" />
                    Export
                </button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-card rounded-2xl p-5 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4" style={{ color: '#025864' }} />
                        <p className="text-sm text-muted-foreground">Total</p>
                    </div>
                    <h3 className="text-xl font-bold text-foreground">{customersList.length}</h3>
                </div>
                <div className="bg-card rounded-2xl p-5 border border-border">
                    <p className="text-sm text-muted-foreground mb-2">Active</p>
                    <h3 className="text-xl font-bold text-success">{customersList.filter(c => c.status === "Active").length}</h3>
                </div>
                <div className="bg-card rounded-2xl p-5 border border-border">
                    <p className="text-sm text-muted-foreground mb-2">Total Revenue</p>
                    <h3 className="text-xl font-bold text-foreground">KES {totalRevenue.toLocaleString()}</h3>
                </div>
                <div className="bg-card rounded-2xl p-5 border border-border">
                    <p className="text-sm text-muted-foreground mb-2">Avg. Lifetime Value</p>
                    <h3 className="text-xl font-bold text-foreground">KES {avgLTV}</h3>
                </div>
            </div>

            {/* Table */}
            <div className="bg-card rounded-2xl p-5 border border-border">
                <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 mb-4">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search customers..."
                        className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-[11px] text-muted-foreground uppercase tracking-wider">
                                <th className="text-left font-medium pb-3">Customer</th>
                                <th className="text-left font-medium pb-3 hidden sm:table-cell">Email</th>
                                <th className="text-left font-medium pb-3">Total Spent</th>
                                <th className="text-left font-medium pb-3 hidden md:table-cell">Transactions</th>
                                <th className="text-left font-medium pb-3 hidden lg:table-cell">Last Transaction</th>
                                <th className="text-left font-medium pb-3">Status</th>
                                <th className="text-right font-medium pb-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-sm text-muted-foreground">No customers found.</td>
                                </tr>
                            ) : (
                                filtered.map((c) => (
                                    <tr key={c.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                                        <td className="py-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">{c.flag}</span>
                                                <div>
                                                    <p className="text-sm font-medium text-foreground">{c.name}</p>
                                                    <p className="text-[11px] text-muted-foreground sm:hidden">{c.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 hidden sm:table-cell">
                                            <p className="text-sm text-muted-foreground">{c.email}</p>
                                        </td>
                                        <td className="py-3">
                                            <p className="text-sm font-semibold text-foreground">KES {c.totalSpent.toLocaleString()}</p>
                                        </td>
                                        <td className="py-3 hidden md:table-cell">
                                            <p className="text-sm text-foreground">{c.transactions}</p>
                                        </td>
                                        <td className="py-3 hidden lg:table-cell">
                                            <p className="text-sm text-muted-foreground">{new Date(c.lastTxn).toLocaleDateString()}</p>
                                        </td>
                                        <td className="py-3">
                                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${c.status === "Active" ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"}`}>
                                                {c.status}
                                            </span>
                                        </td>
                                        <td className="py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <button className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                                                    <Mail className="w-3.5 h-3.5" />
                                                </button>
                                                <button className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                                                    <MoreHorizontal className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">Showing {filtered.length} of {customersList.length} customers</p>
                    <div className="flex items-center gap-2">
                        <button className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors" onClick={() => setPage(p => Math.max(1, p - 1))}>
                            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <span className="text-sm font-medium text-foreground px-2">Page {page}</span>
                        <button className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors" onClick={() => setPage(p => p + 1)}>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default CustomersPage;
