import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { fetchWithAuth, cn } from "@/lib/utils";
import { Users, Search, Loader2, Mail, Phone, DollarSign, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  orders: number;
  totalSpent: number;
  storeCount: number;
  firstOrder: string;
  lastOrder: string;
}

const CustomerManagement = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);
  const { toast } = useToast();

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      params.set('limit', '100');
      const data = await fetchWithAuth(`/admin/shopalize/customers?${params.toString()}`);
      setCustomers(data.customers || []);
      setTotal(data.total || 0);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCustomers(); }, []);

  const totalSpent = customers.reduce((s, c) => s + c.totalSpent, 0);
  const totalOrders = customers.reduce((s, c) => s + c.orders, 0);
  const avgOrderValue = totalOrders > 0 ? Math.round(totalSpent / totalOrders) : 0;

  const filteredCustomers = customers.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Customer Management</h1>
        <p className="text-sm text-slate-500">All customers across all stores</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { title: "Total Customers", value: total, icon: Users, color: "bg-blue-50 text-blue-600" },
          { title: "Total Orders", value: totalOrders, icon: ShoppingCart, color: "bg-purple-50 text-purple-600" },
          { title: "Total Spent", value: `$${totalSpent.toLocaleString()}`, icon: DollarSign, color: "bg-emerald-50 text-emerald-600" },
          { title: "Avg Order", value: `$${avgOrderValue}`, icon: DollarSign, color: "bg-amber-50 text-amber-600" },
        ].map((s) => (
          <div key={s.title} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className={cn("p-1.5 rounded-lg w-fit mb-2", s.color)}><s.icon className="w-4 h-4" /></div>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{s.title}</p>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">{s.value}</h3>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <input type="text" placeholder="Search customers..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && loadCustomers()} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Customer</th>
                <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Contact</th>
                <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Orders</th>
                <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Total Spent</th>
                <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Stores</th>
                <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">First Order</th>
                <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Last Order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={7} className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" /><p className="text-sm text-slate-500">Loading customers...</p></td></tr>
              ) : filteredCustomers.length === 0 ? (
                <tr><td colSpan={7} className="py-20 text-center"><p className="text-sm text-slate-500">No customers found.</p></td></tr>
              ) : filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold uppercase">
                        {(customer.name || customer.email).charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{customer.name || 'Guest'}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{customer.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Mail className="w-3 h-3" /> {customer.email}
                      </div>
                      {customer.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <Phone className="w-3 h-3" /> {customer.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-slate-900">{customer.orders}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-emerald-600">${customer.totalSpent.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-bold uppercase bg-slate-100 px-2 py-0.5 rounded-full text-slate-600">{customer.storeCount} store{customer.storeCount !== 1 ? 's' : ''}</span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">{new Date(customer.firstOrder).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-xs text-slate-500">{new Date(customer.lastOrder).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default CustomerManagement;
