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
    if (o.status === 'completed') return { label: 'Fulfilled', color: 'bg-[#D4F655]/20 text-black border-[#D4F655]/50', icon: CheckCircle2 };
    if (o.status === 'cancelled') return { label: 'Cancelled', color: 'bg-red-50 text-red-700 border-red-100', icon: XCircle };
    return { label: 'Unfulfilled', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Clock };
  };

  const paymentStatusInfo = (o: Order) => {
    if (o.status === 'completed') return { label: 'Paid', color: 'bg-[#D4F655]/20 text-black border-[#D4F655]/50' };
    if (o.status === 'cancelled') return { label: 'Refunded', color: 'bg-red-50 text-red-700 border-red-100' };
    return { label: 'Pending', color: 'bg-amber-100 text-amber-800 border-amber-200' };
  };

  return (
    <>
      <div className="flex items-center justify-between mb-8 mt-2">
        <div>
           <h1 className="text-3xl font-bold text-black tracking-tight" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>Orders</h1>
           <p className="text-[15px] text-gray-500 mt-1">{orders.length} order{orders.length !== 1 ? 's' : ''} total</p>
        </div>
        <div className="flex gap-2 border border-gray-200/60 bg-white p-1 rounded-xl shadow-sm">
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-black hover:text-white rounded-lg text-[13px] font-semibold text-gray-600 transition-colors">
             <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-2 mb-6">
        {[
          { key: 'all', label: `All (${statusCounts.all})` },
          { key: 'pending', label: `Unfulfilled (${statusCounts.pending})` },
          { key: 'completed', label: `Fulfilled (${statusCounts.completed})` },
          { key: 'cancelled', label: `Cancelled (${statusCounts.cancelled})` },
        ].map(tab => (
          <button key={tab.key} onClick={() => setStatusFilter(tab.key)}
            className={cn("px-5 py-2.5 rounded-full text-[13px] font-bold transition-all duration-200",
              statusFilter === tab.key ? "bg-[#0A0A0A] text-white shadow-md shadow-black/10" : "bg-white border border-gray-200 text-gray-500 hover:text-black hover:border-black/20"
            )}>{tab.label}</button>
        ))}
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-200/60 shadow-sm overflow-hidden">
        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 p-6 border-b border-gray-100 bg-white">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search orders by name, email, or number..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl text-[14px] outline-none focus:border-black focus:bg-white focus:ring-1 focus:ring-black/10 transition-all font-medium text-black placeholder:text-gray-400 placeholder:font-normal" />
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-5 py-3 border border-gray-200 rounded-xl text-[13px] font-bold text-gray-600 hover:bg-gray-50 hover:text-black transition-colors">
              <Filter className="w-4 h-4" /> Filter <ChevronDown className="w-3 h-3" />
            </button>
            <button className="flex items-center gap-2 px-5 py-3 border border-gray-200 rounded-xl text-[13px] font-bold text-gray-600 hover:bg-gray-50 hover:text-black transition-colors hidden sm:flex">
              More actions <ChevronDown className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selected.length > 0 && (
          <div className="flex items-center gap-4 px-6 py-3 bg-[#D4F655]/10 border-b border-[#D4F655]/20">
            <span className="text-[13px] font-bold text-black border-r border-[#D4F655]/30 pr-4">{selected.length} selected</span>
            <button className="text-[13px] font-bold text-black hover:underline cursor-pointer">Mark as fulfilled</button>
            <button className="text-[13px] font-bold text-black hover:underline cursor-pointer">Capture payments</button>
            <button className="text-[13px] font-bold text-red-600 hover:underline cursor-pointer">Cancel orders</button>
          </div>
        )}

        {loading ? (
          <div className="p-20 text-center flex flex-col items-center justify-center">
             <Loader2 className="w-8 h-8 animate-spin text-black mb-4" />
             <p className="text-[15px] font-medium text-gray-500">Loading orders...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-24 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-6"><ShoppingBag className="w-8 h-8 text-gray-300" /></div>
            <h3 className="text-2xl font-medium text-black mb-2 tracking-tight">No orders yet</h3>
            <p className="text-[15px] text-gray-500 max-w-sm mx-auto">Orders will appear here when customers make purchases from your storefront.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-left w-12"><input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black" onChange={e => setSelected(e.target.checked ? filtered.map(o => o.id) : [])} /></th>
                <th className="text-left px-3 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Order ID</th>
                <th className="text-left px-3 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Date</th>
                <th className="text-left px-3 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Customer</th>
                <th className="text-left px-3 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Payment</th>
                <th className="text-left px-3 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Fulfillment</th>
                <th className="text-right px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Total</th>
                <th className="w-12 text-center px-4 py-4"></th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(order => {
                  const fs = fulfillmentStatus(order);
                  const ps = paymentStatusInfo(order);
                  const FsIcon = fs.icon;
                  return (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-5"><input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black" checked={selected.includes(order.id)} onChange={e => { if (e.target.checked) setSelected([...selected, order.id]); else setSelected(selected.filter(id => id !== order.id)); }} /></td>
                      <td className="px-3 py-5 text-[14px] font-bold text-black border-l-4 border-transparent group-hover:border-[#D4F655] cursor-pointer" onClick={() => setViewOrder(order)}>#{order.id}</td>
                      <td className="px-3 py-5 text-[13px] text-gray-500 font-medium whitespace-nowrap">{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                      <td className="px-3 py-5 whitespace-nowrap">
                        <p className="text-[14px] font-bold text-black">{order.buyerName || 'Guest'}</p>
                        <p className="text-[12px] font-medium text-gray-500 mt-0.5">{order.buyerEmail}</p>
                      </td>
                      <td className="px-3 py-5 whitespace-nowrap"><span className={cn("text-[11px] px-3 py-1.5 rounded-full font-bold uppercase tracking-wider border", ps.color)}>{ps.label}</span></td>
                      <td className="px-3 py-5 whitespace-nowrap">
                        <span className={cn("text-[11px] px-3 py-1.5 rounded-full font-bold uppercase tracking-wider inline-flex items-center gap-1.5 border", fs.color)}>
                          <FsIcon className="w-3.5 h-3.5" /> {fs.label}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right text-[15px] font-bold text-black whitespace-nowrap">{order.currency || 'KES'} {Number(order.amount).toLocaleString()}</td>
                      <td className="px-4 py-5 text-center relative">
                        <button onClick={() => setActiveMenu(activeMenu === order.id ? null : order.id)} className="p-2 rounded-xl hover:bg-white border border-transparent hover:border-gray-200 text-gray-400 hover:text-black shadow-sm transition-all"><MoreHorizontal className="w-5 h-5" /></button>
                        {activeMenu === order.id && (<><div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)} />
                          <div className="absolute right-8 top-12 w-56 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                            <button onClick={() => { setViewOrder(order); setActiveMenu(null); }} className="w-full px-5 py-3 text-left text-[13px] font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-3"><Eye className="w-4 h-4 text-gray-400" /> View details</button>
                            <button onClick={() => updateStatus(order.id, 'completed')} className="w-full px-5 py-3 text-left text-[13px] font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-black" /> Mark as fulfilled</button>
                            <button onClick={() => updateStatus(order.id, 'pending')} className="w-full px-5 py-3 text-left text-[13px] font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-3"><Clock className="w-4 h-4 text-amber-500" /> Mark as unfulfilled</button>
                            <div className="h-px bg-gray-100 my-2" />
                            <button onClick={() => updateStatus(order.id, 'cancelled')} className="w-full px-5 py-3 text-left text-[13px] font-bold text-red-600 hover:bg-red-50 flex items-center gap-3"><XCircle className="w-4 h-4 text-red-400" /> Cancel order</button>
                          </div></>)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/30">
          <p className="text-[13px] font-semibold text-gray-500">Showing {filtered.length} of {orders.length} orders</p>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 rounded-xl text-[13px] font-bold text-gray-500 bg-white border border-gray-200 hover:text-black hover:border-black transition-colors disabled:opacity-50 disabled:pointer-events-none">Previous</button>
            <button className="px-4 py-2 rounded-xl text-[13px] font-bold bg-[#0A0A0A] text-white shadow-md">1</button>
            <button className="px-4 py-2 rounded-xl text-[13px] font-bold text-gray-500 bg-white border border-gray-200 hover:text-black hover:border-black transition-colors disabled:opacity-50 disabled:pointer-events-none">Next</button>
          </div>
        </div>
      </div>

      {/* Order Detail Side Modal */}
      {viewOrder && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity" onClick={() => setViewOrder(null)} />
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-[#F8F9FA] z-50 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-200 p-6 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-black" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>Order #{viewOrder.id}</h2>
              <button onClick={() => setViewOrder(null)} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-black hover:text-white transition-colors text-gray-500">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 space-y-8">
              {/* Status Header */}
              <div className="flex gap-3">
                <span className={cn("text-[12px] px-4 py-2 rounded-xl font-bold uppercase tracking-widest border shadow-sm", paymentStatusInfo(viewOrder).color)}>{paymentStatusInfo(viewOrder).label}</span>
                <span className={cn("text-[12px] px-4 py-2 rounded-xl font-bold uppercase tracking-widest border shadow-sm", fulfillmentStatus(viewOrder).color)}>{fulfillmentStatus(viewOrder).label}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                  <h3 className="text-[11px] font-bold text-gray-400 tracking-widest uppercase mb-4 flex items-center gap-2">
                     <div className="w-6 h-6 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center"><Search className="w-3 h-3" /></div> Customer Details
                  </h3>
                  <div className="flex items-center gap-4 mb-4">
                     <div className="w-12 h-12 rounded-full bg-[#D4F655] flex items-center justify-center text-lg font-bold text-black border-2 border-white shadow-sm">
                        {(viewOrder.buyerName || viewOrder.buyerEmail || 'G').charAt(0).toUpperCase()}
                     </div>
                     <div>
                        <p className="text-[16px] font-bold text-black leading-none mb-1">{viewOrder.buyerName || 'Guest'}</p>
                        <p className="text-[13px] text-gray-500 font-medium">{viewOrder.buyerEmail}</p>
                     </div>
                  </div>
                  {viewOrder.buyerPhone && <p className="text-[13px] text-gray-500 font-medium pt-3 border-t border-gray-100">{viewOrder.buyerPhone}</p>}
                </div>

                {/* Date/Info */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                  <h3 className="text-[11px] font-bold text-gray-400 tracking-widest uppercase mb-4 flex items-center gap-2">
                     <div className="w-6 h-6 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center"><Clock className="w-3 h-3" /></div> Timeline
                  </h3>
                  <div className="space-y-4">
                     <div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Placed on</p>
                        <p className="text-[14px] font-bold text-black">{new Date(viewOrder.createdAt).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                     </div>
                     <div className="h-px bg-gray-100 w-full" />
                     <div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Payment Method</p>
                        <p className="text-[14px] font-bold text-black flex items-center gap-2"><CreditCard className="w-4 h-4 text-gray-400" /> Credit Card</p>
                     </div>
                  </div>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-200 shadow-sm">
                <h3 className="text-[11px] font-bold text-gray-400 tracking-widest uppercase mb-6 flex items-center gap-2">
                   <div className="w-6 h-6 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center"><ShoppingBag className="w-3 h-3" /></div> Payment Summary
                </h3>
                 <div className="space-y-4">
                  <div className="flex justify-between items-center text-[15px]">
                    <span className="text-gray-500 font-medium">Subtotal</span>
                    <span className="font-bold text-black">{viewOrder.currency || 'KES'} {Number(viewOrder.amount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-[15px]">
                    <span className="text-gray-500 font-medium">Tax</span>
                    <span className="font-bold text-black">{viewOrder.currency || 'KES'} 0</span>
                  </div>
                  <div className="flex justify-between items-center text-[15px]">
                    <span className="text-gray-500 font-medium">Shipping</span>
                    <span className="font-bold text-black">{viewOrder.currency || 'KES'} 0</span>
                  </div>
                  <div className="h-px bg-gray-100 my-4" />
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-black">Total</span>
                    <span className="text-2xl font-bold text-black">{viewOrder.currency || 'KES'} {Number(viewOrder.amount).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="space-y-3 pt-6 border-t border-gray-200">
                <button onClick={() => { updateStatus(viewOrder.id, 'completed'); setViewOrder(null); }}
                  className="w-full py-4 rounded-xl text-[15px] font-bold text-black bg-[#D4F655] hover:bg-[#c1e247] shadow-lg shadow-[#D4F655]/20 flex items-center justify-center gap-2 transition-all">
                  <Truck className="w-5 h-5" /> Mark as fulfilled
                </button>
                <button onClick={() => { updateStatus(viewOrder.id, 'cancelled'); setViewOrder(null); }}
                  className="w-full py-4 rounded-xl text-[15px] font-bold text-red-600 border border-red-200 bg-white hover:bg-red-50 flex items-center justify-center gap-2 transition-all">
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
