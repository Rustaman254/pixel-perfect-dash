import { useState } from 'react';
import { Percent, Plus, Search, MoreHorizontal, Pencil, Trash2, Copy, Calendar, Tag, Gift, Filter, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Discount { id: number; code: string; type: 'percentage' | 'fixed'; value: number; minOrder: number; usageLimit: number; used: number; expiresAt: string; isActive: boolean; }

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([
    { id: 1, code: 'WELCOME10', type: 'percentage', value: 10, minOrder: 0, usageLimit: 100, used: 12, expiresAt: '2026-12-31', isActive: true },
    { id: 2, code: 'SAVE500', type: 'fixed', value: 500, minOrder: 2000, usageLimit: 50, used: 5, expiresAt: '2026-06-30', isActive: true },
    { id: 3, code: 'FREESHIP', type: 'percentage', value: 100, minOrder: 5000, usageLimit: 200, used: 0, expiresAt: '', isActive: false },
  ]);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newDiscount, setNewDiscount] = useState({ code: '', type: 'percentage' as const, value: '', minOrder: '', usageLimit: '', expiresAt: '' });
  const [activeMenu, setActiveMenu] = useState<number | null>(null);

  const filtered = discounts.filter(d => d.code.toLowerCase().includes(search.toLowerCase()));

  const handleCreate = () => {
    if (!newDiscount.code || !newDiscount.value) return;
    setDiscounts([...discounts, { id: Date.now(), code: newDiscount.code.toUpperCase(), type: newDiscount.type, value: parseFloat(newDiscount.value), minOrder: parseFloat(newDiscount.minOrder || '0'), usageLimit: parseInt(newDiscount.usageLimit || '0'), used: 0, expiresAt: newDiscount.expiresAt, isActive: true }]);
    setShowCreate(false);
    setNewDiscount({ code: '', type: 'percentage', value: '', minOrder: '', usageLimit: '', expiresAt: '' });
  };

  const deleteDiscount = (id: number) => {
    if(confirm('Are you sure you want to delete this discount?')) {
       setDiscounts(discounts.filter(d => d.id !== id));
    }
    setActiveMenu(null);
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 mt-2 gap-4">
        <div>
           <h1 className="text-3xl font-bold text-black tracking-tight" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>Discounts</h1>
           <p className="text-[15px] text-gray-500 mt-1">Manage promo codes and automatic discounts.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-5 py-2.5 bg-[#D4F655] hover:bg-[#c1e247] shadow-lg shadow-[#D4F655]/20 text-[14px] font-bold text-black rounded-xl transition-all self-start sm:self-auto">
           <Plus className="w-4 h-4" /> Create discount
        </button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity" onClick={() => setShowCreate(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-[#F8F9FA] rounded-[2rem] shadow-2xl w-full max-w-xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
              <div className="p-6 bg-white border-b border-gray-100 flex items-center justify-between">
                 <h2 className="text-xl font-bold text-black" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>Create new discount</h2>
                 <button onClick={() => setShowCreate(false)} className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-200 transition-colors text-gray-500">✕</button>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                  <label className="text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Discount code</label>
                  <input type="text" value={newDiscount.code} onChange={e => setNewDiscount({ ...newDiscount, code: e.target.value.toUpperCase() })} placeholder="e.g. SUMMER20" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[15px] font-bold text-black outline-none focus:bg-white focus:border-black transition-all" />
                  <p className="text-[12px] text-gray-400 font-medium mt-2">Customers will enter this discount code at checkout.</p>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Type</label>
                      <select value={newDiscount.type} onChange={e => setNewDiscount({ ...newDiscount, type: e.target.value as any })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] font-bold text-black outline-none focus:bg-white focus:border-black transition-all cursor-pointer">
                        <option value="percentage">Percentage</option>
                        <option value="fixed">Fixed amount</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Value {newDiscount.type === 'percentage' ? '(%)' : '(KES)'}</label>
                      <input type="number" value={newDiscount.value} onChange={e => setNewDiscount({ ...newDiscount, value: e.target.value })} placeholder="10" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[15px] font-bold text-black outline-none focus:bg-white focus:border-black transition-all" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Minimum order</label>
                      <input type="number" value={newDiscount.minOrder} onChange={e => setNewDiscount({ ...newDiscount, minOrder: e.target.value })} placeholder="0" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] outline-none focus:bg-white focus:border-black transition-all" />
                    </div>
                    <div>
                      <label className="text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Usage limit</label>
                      <input type="number" value={newDiscount.usageLimit} onChange={e => setNewDiscount({ ...newDiscount, usageLimit: e.target.value })} placeholder="Unlimited" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] outline-none focus:bg-white focus:border-black transition-all" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                  <label className="text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Expiry date</label>
                  <input type="date" value={newDiscount.expiresAt} onChange={e => setNewDiscount({ ...newDiscount, expiresAt: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] font-medium text-black outline-none focus:bg-white focus:border-black transition-all uppercase tracking-wider" />
                </div>
              </div>

              <div className="p-6 bg-white border-t border-gray-100 flex gap-4">
                 <button onClick={() => setShowCreate(false)} className="flex-1 py-3.5 bg-white border border-gray-200 rounded-xl text-[14px] font-bold text-gray-600 hover:text-black hover:border-black transition-colors shadow-sm">Cancel</button>
                 <button onClick={handleCreate} disabled={!newDiscount.code || !newDiscount.value} className="flex-1 py-3.5 bg-[#0A0A0A] disabled:opacity-50 text-white rounded-xl text-[14px] font-bold hover:bg-black shadow-lg shadow-black/10 transition-all">Save discount</button>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="bg-white rounded-[2rem] border border-gray-200/60 shadow-sm overflow-hidden">
        <div className="flex flex-col md:flex-row gap-4 p-6 border-b border-gray-100 bg-white">
          <div className="flex-1 relative">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
             <input type="text" placeholder="Search discounts by code..." value={search} onChange={e => setSearch(e.target.value)}
               className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl text-[14px] outline-none focus:border-black focus:bg-white focus:ring-1 focus:ring-black/10 transition-all font-medium text-black placeholder:text-gray-400 placeholder:font-normal" />
          </div>
          <div className="flex gap-2">
             <button className="flex items-center gap-2 px-5 py-3 border border-gray-200 rounded-xl text-[13px] font-bold text-gray-600 hover:bg-gray-50 hover:text-black transition-colors">
               <Filter className="w-4 h-4" /> Filter <ChevronDown className="w-3 h-3" />
             </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-24 text-center">
             <div className="w-20 h-20 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-6"><Gift className="w-8 h-8 text-gray-300" /></div>
             <h3 className="text-2xl font-medium text-black mb-2 tracking-tight">No discounts found</h3>
             <p className="text-[15px] text-gray-500 max-w-sm mx-auto">You haven't created any matching discount codes yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
             <table className="w-full">
               <thead><tr className="bg-gray-50/50 border-b border-gray-100">
                 <th className="px-6 py-4 text-left w-12"><input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black" /></th>
                 <th className="text-left px-3 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Code</th>
                 <th className="text-left px-3 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Status</th>
                 <th className="text-left px-3 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Type</th>
                 <th className="text-left px-3 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Value</th>
                 <th className="text-left px-3 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Usage</th>
                 <th className="text-left px-3 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Expires</th>
                 <th className="w-12 text-center px-4 py-4"></th>
               </tr></thead>
               <tbody className="divide-y divide-gray-100">
                 {filtered.map(d => (
                   <tr key={d.id} className="hover:bg-gray-50 transition-colors group">
                     <td className="px-6 py-4"><input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black" /></td>
                     <td className="px-3 py-4">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center group-hover:bg-[#0A0A0A] transition-colors"><Tag className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" /></div>
                           <span className="text-[14px] font-bold text-black border-b border-transparent group-hover:border-black transition-colors">{d.code}</span>
                        </div>
                     </td>
                     <td className="px-3 py-4 whitespace-nowrap">
                        <span className={cn("text-[11px] px-3 py-1.5 rounded-full font-bold uppercase tracking-wider border", d.isActive ? 'bg-[#D4F655]/20 text-black border-[#D4F655]/50' : 'bg-gray-100 text-gray-500 border-gray-200')}>{d.isActive ? 'Active' : 'Inactive'}</span>
                     </td>
                     <td className="px-3 py-4 text-[13px] font-medium text-gray-500 capitalize">{d.type === 'percentage' ? 'Percentage' : 'Fixed Amount'}</td>
                     <td className="px-3 py-4 text-[14px] font-bold text-black">{d.type === 'percentage' ? `${d.value}%` : `KES ${d.value}`}</td>
                     <td className="px-3 py-4 text-[13px] font-medium text-gray-500">{d.used} {d.usageLimit > 0 ? <span className="text-gray-400">/ {d.usageLimit}</span> : 'claimed'}</td>
                     <td className="px-3 py-4 text-[13px] font-medium text-gray-500">{d.expiresAt ? new Date(d.expiresAt).toLocaleDateString() : '—'}</td>
                     <td className="px-4 py-4 text-center relative">
                        <button onClick={() => setActiveMenu(activeMenu === d.id ? null : d.id)} className="p-2 rounded-xl hover:bg-white border border-transparent hover:border-gray-200 text-gray-400 hover:text-black shadow-sm transition-all"><MoreHorizontal className="w-5 h-5" /></button>
                        {activeMenu === d.id && (<><div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)} />
                          <div className="absolute right-8 top-12 w-48 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                             <button onClick={() => { navigator.clipboard.writeText(d.code); setActiveMenu(null); }} className="w-full px-5 py-3 text-left text-[13px] font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-3"><Copy className="w-4 h-4 text-gray-400" /> Get sharable link</button>
                             <button onClick={() => { setActiveMenu(null); }} className="w-full px-5 py-3 text-left text-[13px] font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-3"><Pencil className="w-4 h-4 text-gray-400" /> Edit code</button>
                             <div className="h-px bg-gray-100 my-2" />
                             <button onClick={() => deleteDiscount(d.id)} className="w-full px-5 py-3 text-left text-[13px] font-bold text-red-600 hover:bg-red-50 flex items-center gap-3"><Trash2 className="w-4 h-4 text-red-400" /> Delete</button>
                          </div></>)}
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        )}
      </div>
    </>
  );
}
