import { useEffect, useState } from 'react';
import { fetchWithAuth } from '@/lib/api';
import { Search, ShoppingBag, Filter, Loader2, Eye, MoreHorizontal, CheckCircle2, Clock, XCircle, Truck, CreditCard, Download, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Order {
  id: number; buyerName: string; buyerEmail: string; buyerPhone: string;
  amount: number; currency: string; status: string; createdAt: string;
  fulfillmentStatus?: string; paymentStatus?: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<number[]>([]);
  const [activeMenu, setActiveMenu] = useState<number | null>(null);
  const [viewOrder, setViewOrder] = useState<Order | null>(null);

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    try { const d = await fetchWithAuth('/shopalize/orders'); setOrders(Array.isArray(d) ? d : []); } catch { setOrders([]); }
    setLoading(false);
  };

  const updateStatus = async (id: number, status: string) => {
    setOrders(orders.map(o => o.id === id ? { ...o, status } : o));
    setActiveMenu(null);
  };

  const filtered = orders.filter(o => {
    const matchesSearch = !search || o.buyerName?.toLowerCase().includes(search.toLowerCase()) || o.buyerEmail?.toLowerCase().includes(search.toLowerCase()) || String(o.id).includes(search);
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = { all: orders.length, pending: orders.filter(o => o.status === 'pending').length, completed: orders.filter(o => o.status === 'completed').length, cancelled: orders.filter(o => o.status === 'cancelled').length };

  const fulfillmentStatus = (o: Order) => {
    if (o.status === 'completed') return { label: 'Fulfilled', color: 'bg-[#D6FAE8] text-success', icon: CheckCircle2 };
    if (o.status === 'cancelled') return { label: 'Cancelled', color: 'bg-red-50 text-destructive', icon: XCircle };
    return { label: 'Unfulfilled', color: 'bg-amber-50 text-amber-600', icon: Clock };
  };

  const paymentStatusInfo = (o: Order) => {
    if (o.status === 'completed') return { label: 'Paid', color: 'bg-[#D6FAE8] text-success' };
    if (o.status === 'cancelled') return { label: 'Refunded', color: 'bg-red-50 text-destructive' };
    return { label: 'Pending', color: 'bg-amber-50 text-amber-600' };
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-[22px] font-bold text-foreground" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>Orders</h1><p className="text-sm text-muted-foreground">{orders.length} order{orders.length !== 1 ? 's' : ''}</p></div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted"><Download className="w-4 h-4" /> Export</button>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-border">
        {[
          { key: 'all', label: `All (${statusCounts.all})` },
          { key: 'pending', label: `Unfulfilled (${statusCounts.pending})` },
          { key: 'completed', label: `Fulfilled (${statusCounts.completed})` },
          { key: 'cancelled', label: `Cancelled (${statusCounts.cancelled})` },
        ].map(tab => (
          <button key={tab.key} onClick={() => setStatusFilter(tab.key)}
            className={cn("px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
              statusFilter === tab.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}>{tab.label}</button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-border shadow-sm">
        {/* Search & Filters */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Search orders by name, email, or number..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-muted border border-border rounded-lg text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20" />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted">
            <Filter className="w-4 h-4" /> Filter <ChevronDown className="w-3 h-3" />
          </button>
          <button className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted">
            More actions <ChevronDown className="w-3 h-3" />
          </button>
        </div>

        {/* Bulk Actions */}
        {selected.length > 0 && (
          <div className="flex items-center gap-3 px-5 py-2.5 bg-accent border-b border-border">
            <span className="text-xs font-semibold text-primary">{selected.length} selected</span>
            <button className="text-xs text-primary hover:underline">Mark as fulfilled</button>
            <button className="text-xs text-primary hover:underline">Capture payments</button>
            <button className="text-xs text-destructive hover:underline">Cancel orders</button>
          </div>
        )}

        {loading ? (
          <div className="p-16 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" /><p className="text-sm text-muted-foreground">Loading orders...</p></div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4"><ShoppingBag className="w-8 h-8 text-muted-foreground" /></div>
            <h3 className="text-lg font-bold text-foreground mb-1" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>No orders yet</h3>
            <p className="text-sm text-muted-foreground">Orders will appear here when customers make purchases.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead><tr className="bg-secondary/50">
              <th className="px-5 py-2.5 text-left"><input type="checkbox" className="rounded border-border" onChange={e => setSelected(e.target.checked ? filtered.map(o => o.id) : [])} /></th>
              <th className="text-left px-2 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase">Order</th>
              <th className="text-left px-2 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase">Date</th>
              <th className="text-left px-2 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase">Customer</th>
              <th className="text-left px-2 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase">Payment</th>
              <th className="text-left px-2 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase">Fulfillment</th>
              <th className="text-right px-2 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase">Total</th>
              <th className="w-10"></th>
            </tr></thead>
            <tbody className="divide-y divide-border">
              {filtered.map(order => {
                const fs = fulfillmentStatus(order);
                const ps = paymentStatusInfo(order);
                const FsIcon = fs.icon;
                return (
                  <tr key={order.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-5 py-3"><input type="checkbox" className="rounded border-border" checked={selected.includes(order.id)} onChange={e => { if (e.target.checked) setSelected([...selected, order.id]); else setSelected(selected.filter(id => id !== order.id)); }} /></td>
                    <td className="px-2 py-3 text-xs font-medium text-primary cursor-pointer hover:underline" onClick={() => setViewOrder(order)}>#{order.id}</td>
                    <td className="px-2 py-3 text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td className="px-2 py-3">
                      <p className="text-xs font-medium text-foreground">{order.buyerName || 'Guest'}</p>
                      <p className="text-[10px] text-muted-foreground">{order.buyerEmail}</p>
                    </td>
                    <td className="px-2 py-3"><span className={cn("text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase", ps.color)}>{ps.label}</span></td>
                    <td className="px-2 py-3">
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase inline-flex items-center gap-1", fs.color)}>
                        <FsIcon className="w-3 h-3" /> {fs.label}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-right text-xs font-semibold text-foreground">{order.currency || 'KES'} {Number(order.amount).toLocaleString()}</td>
                    <td className="px-2 py-3 relative">
                      <button onClick={() => setActiveMenu(activeMenu === order.id ? null : order.id)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><MoreHorizontal className="w-4 h-4" /></button>
                      {activeMenu === order.id && (<><div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)} />
                        <div className="absolute right-0 top-10 w-48 bg-white rounded-xl shadow-xl border border-border py-1.5 z-50">
                          <button onClick={() => { setViewOrder(order); setActiveMenu(null); }} className="w-full px-4 py-2 text-left text-xs text-foreground hover:bg-muted flex items-center gap-2"><Eye className="w-3.5 h-3.5 text-muted-foreground" /> View details</button>
                          <button onClick={() => updateStatus(order.id, 'completed')} className="w-full px-4 py-2 text-left text-xs text-foreground hover:bg-muted flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-success" /> Mark as fulfilled</button>
                          <button onClick={() => updateStatus(order.id, 'pending')} className="w-full px-4 py-2 text-left text-xs text-foreground hover:bg-muted flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-amber-500" /> Mark as unfulfilled</button>
                          <hr className="my-1 border-border" />
                          <button onClick={() => updateStatus(order.id, 'cancelled')} className="w-full px-4 py-2 text-left text-xs text-destructive hover:bg-red-50 flex items-center gap-2"><XCircle className="w-3.5 h-3.5" /> Cancel order</button>
                        </div></>)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border">
          <p className="text-xs text-muted-foreground">{filtered.length} of {orders.length} orders</p>
          <div className="flex items-center gap-1">
            <button className="px-3 py-1 rounded-lg text-xs text-muted-foreground hover:bg-muted">Previous</button>
            <button className="px-3 py-1 rounded-lg text-xs bg-primary text-white">1</button>
            <button className="px-3 py-1 rounded-lg text-xs text-muted-foreground hover:bg-muted">Next</button>
          </div>
        </div>
      </div>

      {/* Order Detail Modal */}
      {viewOrder && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setViewOrder(null)} />
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white z-50 shadow-2xl overflow-y-auto animate-fade-in">
            <div className="sticky top-0 bg-white border-b border-border p-5 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>Order #{viewOrder.id}</h2>
              <button onClick={() => setViewOrder(null)} className="text-muted-foreground hover:text-foreground text-sm">Close</button>
            </div>
            <div className="p-5 space-y-5">
              {/* Status */}
              <div className="flex gap-2">
                <span className={cn("text-xs px-3 py-1 rounded-full font-semibold uppercase", paymentStatusInfo(viewOrder).color)}>{paymentStatusInfo(viewOrder).label}</span>
                <span className={cn("text-xs px-3 py-1 rounded-full font-semibold uppercase", fulfillmentStatus(viewOrder).color)}>{fulfillmentStatus(viewOrder).label}</span>
              </div>
              {/* Customer */}
              <div className="bg-secondary/50 rounded-xl p-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Customer</h3>
                <p className="text-sm font-medium text-foreground">{viewOrder.buyerName || 'Guest'}</p>
                <p className="text-xs text-muted-foreground">{viewOrder.buyerEmail}</p>
                {viewOrder.buyerPhone && <p className="text-xs text-muted-foreground">{viewOrder.buyerPhone}</p>}
              </div>
              {/* Payment */}
              <div className="bg-secondary/50 rounded-xl p-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Payment</h3>
                <div className="flex justify-between">
                  <span className="text-sm text-foreground">Subtotal</span>
                  <span className="text-sm font-semibold text-foreground">{viewOrder.currency || 'KES'} {Number(viewOrder.amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between mt-2 pt-2 border-t border-border">
                  <span className="text-sm font-semibold text-foreground">Total</span>
                  <span className="text-sm font-bold text-foreground">{viewOrder.currency || 'KES'} {Number(viewOrder.amount).toLocaleString()}</span>
                </div>
              </div>
              {/* Actions */}
              <div className="space-y-2">
                <button onClick={() => { updateStatus(viewOrder.id, 'completed'); setViewOrder(null); }}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary/90 flex items-center justify-center gap-2">
                  <Truck className="w-4 h-4" /> Mark as fulfilled
                </button>
                <button onClick={() => { updateStatus(viewOrder.id, 'cancelled'); setViewOrder(null); }}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-destructive border border-destructive/20 hover:bg-red-50">
                  Cancel order
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
