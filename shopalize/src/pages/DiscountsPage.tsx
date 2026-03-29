import { useState } from 'react';
import { Percent, Plus, Search, MoreHorizontal, Pencil, Trash2, Copy, Calendar, Tag } from 'lucide-react';
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

  const filtered = discounts.filter(d => d.code.toLowerCase().includes(search.toLowerCase()));

  const handleCreate = () => {
    if (!newDiscount.code || !newDiscount.value) return;
    setDiscounts([...discounts, { id: Date.now(), code: newDiscount.code.toUpperCase(), type: newDiscount.type, value: parseFloat(newDiscount.value), minOrder: parseFloat(newDiscount.minOrder || '0'), usageLimit: parseInt(newDiscount.usageLimit || '0'), used: 0, expiresAt: newDiscount.expiresAt, isActive: true }]);
    setShowCreate(false);
    setNewDiscount({ code: '', type: 'percentage', value: '', minOrder: '', usageLimit: '', expiresAt: '' });
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-[22px] font-bold text-foreground" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>Discounts</h1><p className="text-sm text-muted-foreground">{discounts.length} discount{discounts.length !== 1 ? 's' : ''}</p></div>
        <button onClick={() => setShowCreate(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2"><Plus className="w-4 h-4" /> Create discount</button>
      </div>

      {/* Create Modal */}
      {showCreate && (<><div className="fixed inset-0 bg-black/40 z-50" onClick={() => setShowCreate(false)} />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-fade-in">
            <h2 className="text-lg font-bold text-foreground mb-4" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>Create discount code</h2>
            <div className="space-y-4">
              <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Discount code</label><input type="text" value={newDiscount.code} onChange={e => setNewDiscount({ ...newDiscount, code: e.target.value.toUpperCase() })} placeholder="e.g. SUMMER20" className="w-full px-3 py-2.5 border border-border rounded-lg text-sm outline-none focus:border-primary" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Type</label>
                  <select value={newDiscount.type} onChange={e => setNewDiscount({ ...newDiscount, type: e.target.value as any })} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm outline-none focus:border-primary bg-white">
                    <option value="percentage">Percentage</option><option value="fixed">Fixed amount</option>
                  </select></div>
                <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Value {newDiscount.type === 'percentage' ? '(%)' : '(KES)'}</label><input type="number" value={newDiscount.value} onChange={e => setNewDiscount({ ...newDiscount, value: e.target.value })} placeholder="10" className="w-full px-3 py-2.5 border border-border rounded-lg text-sm outline-none focus:border-primary" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Min order (KES)</label><input type="number" value={newDiscount.minOrder} onChange={e => setNewDiscount({ ...newDiscount, minOrder: e.target.value })} placeholder="0" className="w-full px-3 py-2.5 border border-border rounded-lg text-sm outline-none focus:border-primary" /></div>
                <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Usage limit</label><input type="number" value={newDiscount.usageLimit} onChange={e => setNewDiscount({ ...newDiscount, usageLimit: e.target.value })} placeholder="Unlimited" className="w-full px-3 py-2.5 border border-border rounded-lg text-sm outline-none focus:border-primary" /></div>
              </div>
              <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Expiry date</label><input type="date" value={newDiscount.expiresAt} onChange={e => setNewDiscount({ ...newDiscount, expiresAt: e.target.value })} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm outline-none focus:border-primary" /></div>
              <div className="flex gap-3 pt-2"><button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted">Cancel</button><button onClick={handleCreate} className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90">Create</button></div>
            </div>
          </div>
        </div></>)}

      <div className="bg-white rounded-xl border border-border shadow-sm">
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <div className="flex-1 relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input type="text" placeholder="Search discounts..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-muted border border-border rounded-lg text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20" /></div>
        </div>
        <table className="w-full"><thead><tr className="bg-secondary/50">
          <th className="text-left px-5 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase">Code</th>
          <th className="text-left px-2 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase">Type</th>
          <th className="text-left px-2 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase">Value</th>
          <th className="text-left px-2 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase">Usage</th>
          <th className="text-left px-2 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase">Expires</th>
          <th className="text-left px-2 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase">Status</th>
          <th className="w-10"></th>
        </tr></thead>
        <tbody className="divide-y divide-border">
          {filtered.map(d => (
            <tr key={d.id} className="hover:bg-secondary/30">
              <td className="px-5 py-3"><div className="flex items-center gap-2"><Tag className="w-3.5 h-3.5 text-muted-foreground" /><span className="text-sm font-mono font-semibold text-foreground">{d.code}</span></div></td>
              <td className="px-2 py-3 text-xs text-muted-foreground capitalize">{d.type === 'percentage' ? 'Percentage' : 'Fixed amount'}</td>
              <td className="px-2 py-3 text-xs font-semibold text-foreground">{d.type === 'percentage' ? `${d.value}%` : `KES ${d.value}`}</td>
              <td className="px-2 py-3 text-xs text-muted-foreground">{d.used}{d.usageLimit > 0 ? ` / ${d.usageLimit}` : ''}</td>
              <td className="px-2 py-3 text-xs text-muted-foreground">{d.expiresAt ? new Date(d.expiresAt).toLocaleDateString() : 'No expiry'}</td>
              <td className="px-2 py-3"><span className={cn("text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase", d.isActive ? 'bg-[#D6FAE8] text-success' : 'bg-muted text-muted-foreground')}>{d.isActive ? 'Active' : 'Inactive'}</span></td>
              <td className="px-2 py-3"><button className="p-1 rounded hover:bg-muted text-muted-foreground"><MoreHorizontal className="w-4 h-4" /></button></td>
            </tr>
          ))}
        </tbody></table>
      </div>
    </>
  );
}
