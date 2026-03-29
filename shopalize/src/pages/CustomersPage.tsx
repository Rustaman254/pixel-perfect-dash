import { useEffect, useState } from 'react';
import { fetchWithAuth } from '@/lib/api';
import { Search, Users, Filter, Loader2, Eye, Mail, ShoppingBag, DollarSign, ChevronDown, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Customer { id: string; name: string; email: string; phone: string; orders: number; totalSpent: number; createdAt: string; }

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => { fetchWithAuth('/shopalize/products/customers').then(d => setCustomers(Array.isArray(d) ? d : [])).catch(() => setCustomers([])).finally(() => setLoading(false)); }, []);

  const filtered = customers.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase()));
  const totalSpent = customers.reduce((s, c) => s + (c.totalSpent || 0), 0);
  const avgOrders = customers.length > 0 ? (customers.reduce((s, c) => s + (c.orders || 0), 0) / customers.length).toFixed(1) : '0';

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-[22px] font-bold text-foreground" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>Customers</h1><p className="text-sm text-muted-foreground">{customers.length} customer{customers.length !== 1 ? 's' : ''}</p></div>
        <button className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted"><Download className="w-4 h-4" /> Export</button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total customers', value: String(customers.length), icon: Users },
          { label: 'Total spent', value: `KES ${totalSpent.toLocaleString()}`, icon: DollarSign },
          { label: 'Avg orders/customer', value: avgOrders, icon: ShoppingBag },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-border p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2"><s.icon className="w-4 h-4 text-muted-foreground" /><span className="text-xs font-medium text-muted-foreground">{s.label}</span></div>
            <p className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-border shadow-sm">
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <div className="flex-1 relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input type="text" placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-muted border border-border rounded-lg text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20" /></div>
          <button className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted"><Filter className="w-4 h-4" /> Filter</button>
          <button className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted">Sort <ChevronDown className="w-3 h-3" /></button>
        </div>

        {loading ? <div className="p-16 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" /></div> : filtered.length === 0 ? (
          <div className="p-16 text-center"><div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3"><Users className="w-7 h-7 text-muted-foreground" /></div><h3 className="text-lg font-bold text-foreground mb-1" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>No customers yet</h3><p className="text-sm text-muted-foreground">Customers appear after their first purchase.</p></div>
        ) : (
          <table className="w-full"><thead><tr className="bg-secondary/50">
            <th className="text-left px-5 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase">Customer</th>
            <th className="text-left px-2 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase">Email</th>
            <th className="text-left px-2 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase">Location</th>
            <th className="text-right px-2 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase">Orders</th>
            <th className="text-right px-2 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase">Total spent</th>
            <th className="text-left px-2 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase">First order</th>
            <th className="w-10"></th>
          </tr></thead>
          <tbody className="divide-y divide-border">{filtered.map(c => (
            <tr key={c.id} className="hover:bg-secondary/30 cursor-pointer" onClick={() => setSelectedCustomer(c)}>
              <td className="px-5 py-3"><div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold text-white" style={{ backgroundColor: '#7C3AED' }}>{(c.name || c.email || '?').charAt(0).toUpperCase()}</div>
                <span className="text-sm font-medium text-foreground">{c.name || 'Guest'}</span>
              </div></td>
              <td className="px-2 py-3 text-xs text-muted-foreground">{c.email}</td>
              <td className="px-2 py-3 text-xs text-muted-foreground">—</td>
              <td className="px-2 py-3 text-right text-xs font-semibold text-foreground">{c.orders || 0}</td>
              <td className="px-2 py-3 text-right text-xs font-semibold text-foreground">KES {(c.totalSpent || 0).toLocaleString()}</td>
              <td className="px-2 py-3 text-xs text-muted-foreground">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}</td>
              <td className="px-2 py-3"><button className="p-1 rounded hover:bg-muted text-muted-foreground"><Eye className="w-4 h-4" /></button></td>
            </tr>))}</tbody></table>
        )}
      </div>

      {/* Customer Detail Slide */}
      {selectedCustomer && (<><div className="fixed inset-0 bg-black/40 z-50" onClick={() => setSelectedCustomer(null)} />
        <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-50 shadow-2xl overflow-y-auto animate-fade-in">
          <div className="sticky top-0 bg-white border-b border-border p-5 flex items-center justify-between z-10">
            <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>{selectedCustomer.name || 'Customer'}</h2>
            <button onClick={() => setSelectedCustomer(null)} className="text-muted-foreground hover:text-foreground text-sm">Close</button>
          </div>
          <div className="p-5 space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white" style={{ backgroundColor: '#7C3AED' }}>{(selectedCustomer.name || selectedCustomer.email || '?').charAt(0).toUpperCase()}</div>
              <div><p className="text-base font-bold text-foreground">{selectedCustomer.name || 'Guest'}</p><p className="text-sm text-muted-foreground">{selectedCustomer.email}</p></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/50 rounded-xl p-4"><p className="text-[10px] text-muted-foreground uppercase mb-1">Orders</p><p className="text-xl font-bold text-foreground">{selectedCustomer.orders}</p></div>
              <div className="bg-muted/50 rounded-xl p-4"><p className="text-[10px] text-muted-foreground uppercase mb-1">Total spent</p><p className="text-xl font-bold text-foreground">KES {selectedCustomer.totalSpent.toLocaleString()}</p></div>
            </div>
            <div className="bg-muted/50 rounded-xl p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Contact</h3>
              <div className="flex items-center gap-2 mb-1"><Mail className="w-3.5 h-3.5 text-muted-foreground" /><span className="text-sm text-foreground">{selectedCustomer.email}</span></div>
              {selectedCustomer.phone && <div className="flex items-center gap-2"><span className="text-sm text-foreground">{selectedCustomer.phone}</span></div>}
            </div>
            <div className="bg-muted/50 rounded-xl p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Timeline</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3"><div className="w-2 h-2 rounded-full bg-primary mt-1.5" /><div><p className="text-xs font-medium text-foreground">First order placed</p><p className="text-[10px] text-muted-foreground">{selectedCustomer.createdAt ? new Date(selectedCustomer.createdAt).toLocaleDateString() : 'Unknown'}</p></div></div>
              </div>
            </div>
          </div>
        </div></>)}
    </>
  );
}
