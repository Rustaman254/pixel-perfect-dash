import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { fetchWithAuth, cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Settings, Loader2, Save, Package, ShoppingCart, Truck, Mail, Globe, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ShopalizeSettings {
  platformName: string;
  currency: string;
  timezone: string;
  orderPrefix: string;
  taxRate: number;
  shippingEnabled: boolean;
  inventoryTracking: boolean;
  autoFulfillOrders: boolean;
  emailNotifications: boolean;
  lowStockThreshold: number;
  maxProductsPerStore: number;
  allowCustomDomains: boolean;
}

const ShopalizeSettings = () => {
  const [settings, setSettings] = useState<ShopalizeSettings>({
    platformName: 'Shopalize',
    currency: 'USD',
    timezone: 'UTC',
    orderPrefix: 'ORD-',
    taxRate: 0,
    shippingEnabled: true,
    inventoryTracking: true,
    autoFulfillOrders: false,
    emailNotifications: true,
    lowStockThreshold: 5,
    maxProductsPerStore: 1000,
    allowCustomDomains: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchWithAuth('/admin/shopalize/settings');
        if (data && Object.keys(data).length > 0) {
          setSettings(prev => ({ ...prev, ...data }));
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await fetchWithAuth('/admin/shopalize/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      toast({ title: "Settings saved", description: "Shopalize settings have been updated." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const Toggle = ({ label, description, value, onChange }: { label: string; description: string; value: boolean; onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
      <div>
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <button onClick={() => onChange(!value)} className={cn("relative w-11 h-6 rounded-full transition-colors", value ? "bg-emerald-500" : "bg-slate-300")}>
        <span className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform", value ? "left-5.5" : "left-0.5")} />
      </button>
    </div>
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Shopalize Settings</h1>
          <p className="text-sm text-slate-500">Configure platform-wide e-commerce settings</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-blue-50 rounded-lg"><Globe className="w-4 h-4 text-blue-600" /></div>
            <h3 className="font-bold text-slate-900">General</h3>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Platform Name</Label>
              <Input value={settings.platformName} onChange={e => setSettings({ ...settings, platformName: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Default Currency</Label>
                <Select value={settings.currency} onValueChange={v => setSettings({ ...settings, currency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="KES">KES (KSh)</SelectItem>
                    <SelectItem value="NGN">NGN (₦)</SelectItem>
                    <SelectItem value="ZAR">ZAR (R)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Select value={settings.timezone} onValueChange={v => setSettings({ ...settings, timezone: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="America/New_York">Eastern Time</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    <SelectItem value="Europe/London">London</SelectItem>
                    <SelectItem value="Africa/Nairobi">Nairobi</SelectItem>
                    <SelectItem value="Africa/Lagos">Lagos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Order Prefix</Label>
                <Input value={settings.orderPrefix} onChange={e => setSettings({ ...settings, orderPrefix: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Tax Rate (%)</Label>
                <Input type="number" value={settings.taxRate} onChange={e => setSettings({ ...settings, taxRate: Number(e.target.value) })} />
              </div>
            </div>
          </div>
        </div>

        {/* Store Limits */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-purple-50 rounded-lg"><Package className="w-4 h-4 text-purple-600" /></div>
            <h3 className="font-bold text-slate-900">Store Limits</h3>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Max Products Per Store</Label>
              <Input type="number" value={settings.maxProductsPerStore} onChange={e => setSettings({ ...settings, maxProductsPerStore: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Low Stock Alert Threshold</Label>
              <Input type="number" value={settings.lowStockThreshold} onChange={e => setSettings({ ...settings, lowStockThreshold: Number(e.target.value) })} />
              <p className="text-[10px] text-slate-400">Alert store owners when inventory falls below this number</p>
            </div>
          </div>
        </div>

        {/* Feature Toggles */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-emerald-50 rounded-lg"><Shield className="w-4 h-4 text-emerald-600" /></div>
            <h3 className="font-bold text-slate-900">Feature Toggles</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Toggle label="Shipping Enabled" description="Allow stores to configure shipping options" value={settings.shippingEnabled} onChange={v => setSettings({ ...settings, shippingEnabled: v })} />
            <Toggle label="Inventory Tracking" description="Track product inventory levels automatically" value={settings.inventoryTracking} onChange={v => setSettings({ ...settings, inventoryTracking: v })} />
            <Toggle label="Auto-Fulfill Orders" description="Automatically mark orders as fulfilled" value={settings.autoFulfillOrders} onChange={v => setSettings({ ...settings, autoFulfillOrders: v })} />
            <Toggle label="Email Notifications" description="Send email notifications for order updates" value={settings.emailNotifications} onChange={v => setSettings({ ...settings, emailNotifications: v })} />
            <Toggle label="Custom Domains" description="Allow stores to use custom domain names" value={settings.allowCustomDomains} onChange={v => setSettings({ ...settings, allowCustomDomains: v })} />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ShopalizeSettings;
