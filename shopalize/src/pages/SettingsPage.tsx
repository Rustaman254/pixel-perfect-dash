import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Save, Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const { userProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    storeName: userProfile?.businessName || userProfile?.fullName || '',
    email: userProfile?.email || '', phone: userProfile?.phone || '', location: userProfile?.location || '',
    currency: 'KES', timezone: 'Africa/Nairobi',
  });

  const handleSave = async () => { setSaving(true); setTimeout(() => setSaving(false), 1000); };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>Settings</h1><p className="text-sm text-muted-foreground mt-0.5">Manage your store settings.</p></div>
        <button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
        </button>
      </div>
      <div className="space-y-4 max-w-2xl">
        <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
          <h3 className="text-sm font-bold text-foreground mb-4" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>Store Details</h3>
          <div className="space-y-4">
            <div><label className="text-sm font-medium text-muted-foreground mb-1.5 block">Store name</label><input type="text" value={form.storeName} onChange={e => setForm({ ...form, storeName: e.target.value })} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-white" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium text-muted-foreground mb-1.5 block">Email</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-white" /></div>
              <div><label className="text-sm font-medium text-muted-foreground mb-1.5 block">Phone</label><input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-white" /></div>
            </div>
            <div><label className="text-sm font-medium text-muted-foreground mb-1.5 block">Location</label><input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-white" /></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
          <h3 className="text-sm font-bold text-foreground mb-4" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>Localization</h3>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm font-medium text-muted-foreground mb-1.5 block">Currency</label>
              <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm outline-none focus:border-primary bg-white">
                <option value="KES">KES - Kenyan Shilling</option><option value="USD">USD - US Dollar</option><option value="EUR">EUR - Euro</option><option value="GBP">GBP - British Pound</option>
              </select></div>
            <div><label className="text-sm font-medium text-muted-foreground mb-1.5 block">Timezone</label>
              <select value={form.timezone} onChange={e => setForm({ ...form, timezone: e.target.value })} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm outline-none focus:border-primary bg-white">
                <option value="Africa/Nairobi">East Africa Time (EAT)</option><option value="UTC">UTC</option>
              </select></div>
          </div>
        </div>
      </div>
    </>
  );
}
