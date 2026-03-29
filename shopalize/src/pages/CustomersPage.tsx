import { useEffect, useState } from 'react';
import { fetchWithAuth } from '@/lib/api';
import { Search, Users, Filter, Loader2, Eye, Mail, ShoppingBag, DollarSign, ChevronDown, Download, MapPin, Calendar, Clock, Phone, XCircle } from 'lucide-react';
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
      <div className="flex items-center justify-between mb-8 mt-2">
        <div>
           <h1 className="text-3xl font-bold text-black tracking-tight" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>Customers</h1>
           <p className="text-[15px] text-gray-500 mt-1">{customers.length} total customer{customers.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 bg-white hover:border-black text-[13px] font-bold text-gray-700 rounded-xl shadow-sm transition-all">
             <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { label: 'TOTAL CUSTOMERS', value: String(customers.length), icon: Users },
          { label: 'TOTAL LIFETIME VALUE', value: `KES ${totalSpent.toLocaleString()}`, icon: DollarSign },
          { label: 'AVG ORDERS / CUSTOMER', value: avgOrders, icon: ShoppingBag },
        ].map(s => (
          <div key={s.label} className="bg-[#0A0A0A] rounded-[2rem] border border-gray-800 p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4F655]/10 rounded-full blur-[40px] pointer-events-none group-hover:bg-[#D4F655]/20 transition-colors duration-500" />
            <div className="flex items-center gap-3 mb-4 relative z-10">
               <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"><s.icon className="w-5 h-5 text-gray-300" /></div>
               <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{s.label}</span>
            </div>
            <p className="text-3xl font-bold text-white relative z-10" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-200/60 shadow-sm overflow-hidden">
        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4 p-6 border-b border-gray-100 bg-white">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search customers by name or email..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl text-[14px] outline-none focus:border-black focus:bg-white focus:ring-1 focus:ring-black/10 transition-all font-medium text-black placeholder:text-gray-400 placeholder:font-normal" />
          </div>
          <div className="flex gap-2">
             <button className="flex items-center gap-2 px-5 py-3 border border-gray-200 rounded-xl text-[13px] font-bold text-gray-600 hover:bg-gray-50 hover:text-black transition-colors">
               <Filter className="w-4 h-4" /> Filter <ChevronDown className="w-3 h-3" />
             </button>
             <button className="flex items-center gap-2 px-5 py-3 border border-gray-200 rounded-xl text-[13px] font-bold text-gray-600 hover:bg-gray-50 hover:text-black transition-colors hidden sm:flex">
                Sort <ChevronDown className="w-3 h-3" />
             </button>
          </div>
        </div>

        {loading ? (
             <div className="p-20 text-center flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-black mb-4" />
                <p className="text-[15px] font-medium text-gray-500">Loading customers...</p>
             </div>
        ) : filtered.length === 0 ? (
          <div className="p-24 text-center">
             <div className="w-20 h-20 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-6"><Users className="w-8 h-8 text-gray-300" /></div>
             <h3 className="text-2xl font-medium text-black mb-2 tracking-tight">No customers yet</h3>
             <p className="text-[15px] text-gray-500 max-w-sm mx-auto">Customers will appear here automatically when they place an order or create an account on your store.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-left w-12"><input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black" /></th>
                <th className="text-left px-3 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Customer</th>
                <th className="text-left px-3 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Email</th>
                <th className="text-left px-3 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap hidden md:table-cell">Location</th>
                <th className="text-right px-3 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Orders</th>
                <th className="text-right px-3 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Amount spent</th>
                <th className="w-12 text-center px-4 py-4"></th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors cursor-pointer group" onClick={() => setSelectedCustomer(c)}>
                    <td className="px-6 py-4"><input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black" onClick={(e) => e.stopPropagation()} /></td>
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#0A0A0A] flex items-center justify-center text-[13px] font-bold text-[#D4F655] shadow-sm">
                           {(c.name || c.email || '?').charAt(0).toUpperCase()}
                        </div>
                        <span className="text-[14px] font-bold text-black border-b border-transparent group-hover:border-black transition-colors">{c.name || 'External Buyer'}</span>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-[13px] font-medium text-gray-500">{c.email}</td>
                    <td className="px-3 py-4 text-[13px] font-medium text-gray-500 hidden md:table-cell"><span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-gray-300" /> —</span></td>
                    <td className="px-3 py-4 text-right text-[14px] font-bold text-black">{c.orders || 0}</td>
                    <td className="px-3 py-4 text-right text-[14px] font-bold text-black">KES {(c.totalSpent || 0).toLocaleString()}</td>
                    <td className="px-4 py-4 text-center">
                       <button className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-black hover:bg-white shadow-sm border border-transparent hover:border-gray-200 transition-all mx-auto opacity-0 group-hover:opacity-100">
                          <Eye className="w-4 h-4" />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Placeholder */}
        {filtered.length > 0 && (
           <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/30">
             <p className="text-[13px] font-semibold text-gray-500">Showing {filtered.length} of {customers.length} customers</p>
             <div className="flex items-center gap-2">
               <button className="px-4 py-2 rounded-xl text-[13px] font-bold text-gray-500 bg-white border border-gray-200 hover:text-black hover:border-black transition-colors disabled:opacity-50 disabled:pointer-events-none">Previous</button>
               <button className="px-4 py-2 rounded-xl text-[13px] font-bold bg-[#0A0A0A] text-white shadow-md">1</button>
               <button className="px-4 py-2 rounded-xl text-[13px] font-bold text-gray-500 bg-white border border-gray-200 hover:text-black hover:border-black transition-colors disabled:opacity-50 disabled:pointer-events-none">Next</button>
             </div>
           </div>
        )}
      </div>

      {/* Customer Detail Side Modal */}
      {selectedCustomer && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity" onClick={() => setSelectedCustomer(null)} />
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-[480px] bg-[#F8F9FA] z-50 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-200 p-6 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-black" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>Customer Overview</h2>
              <button onClick={() => setSelectedCustomer(null)} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-black hover:text-white transition-colors text-gray-500">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              
              {/* Profile Header */}
              <div className="flex flex-col items-center text-center p-6 bg-white rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-[#0A0A0A] to-gray-800" />
                <div className="w-24 h-24 rounded-full bg-[#D4F655] flex items-center justify-center text-3xl font-bold text-black border-4 border-white shadow-lg relative z-10 mb-4 mt-8">
                  {(selectedCustomer.name || selectedCustomer.email || '?').charAt(0).toUpperCase()}
                </div>
                <h3 className="text-2xl font-bold text-black mb-1">{selectedCustomer.name || 'Guest User'}</h3>
                <p className="text-[14px] text-gray-500 font-medium flex items-center gap-1.5"><MapPin className="w-4 h-4" /> Unknown Location</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                   <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2"><ShoppingBag className="w-3 h-3" /> Total Orders</p>
                   <p className="text-3xl font-bold text-black">{selectedCustomer.orders}</p>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                   <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2"><DollarSign className="w-3 h-3" /> Amount Spent</p>
                   <p className="text-xl font-bold text-[#0A0A0A]">KES {selectedCustomer.totalSpent.toLocaleString()}</p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
                <h3 className="text-[12px] font-bold text-black uppercase tracking-widest mb-2 border-b border-gray-100 pb-3">Contact Information</h3>
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center"><Mail className="w-4 h-4 text-gray-500" /></div>
                   <div>
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Email Address</p>
                      <a href={`mailto:${selectedCustomer.email}`} className="text-[14px] font-bold text-[#1a0dab] hover:underline">{selectedCustomer.email}</a>
                   </div>
                </div>
                {selectedCustomer.phone && (
                   <div className="flex items-center gap-4 pt-3 border-t border-gray-50">
                      <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center"><Phone className="w-4 h-4 text-gray-500" /></div>
                      <div>
                         <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Phone Number</p>
                         <a href={`tel:${selectedCustomer.phone}`} className="text-[14px] font-bold text-black hover:underline">{selectedCustomer.phone}</a>
                      </div>
                   </div>
                )}
              </div>

              {/* Timeline */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-[12px] font-bold text-black uppercase tracking-widest mb-6 border-b border-gray-100 pb-3">Activity Timeline</h3>
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-gray-200 before:to-transparent">
                  <div className="relative flex items-start gap-4">
                     <div className="w-6 h-6 rounded-full bg-[#0A0A0A] flex items-center justify-center border-4 border-white shadow-sm mt-0.5 z-10"><Calendar className="w-2.5 h-2.5 text-white" /></div>
                     <div>
                        <p className="text-[14px] font-bold text-black mb-1">Customer created</p>
                        <p className="text-[12px] font-medium text-gray-500 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {selectedCustomer.createdAt ? new Date(selectedCustomer.createdAt).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' }) : 'Unknown date'}</p>
                     </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4">
                 <button className="w-full py-4 rounded-xl text-[14px] font-bold text-black bg-white border border-gray-200 hover:border-black shadow-sm transition-all flex items-center justify-center gap-2">
                    View all orders from customer
                 </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
