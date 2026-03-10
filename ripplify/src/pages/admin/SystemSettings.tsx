import AdminLayout from "@/components/admin/AdminLayout";
import { useState, useEffect } from "react";
import { fetchWithAuth } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Save, Settings, Info, Percent, Wallet } from "lucide-react";

const SystemSettings = () => {
    const [settings, setSettings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const { toast } = useToast();

    const loadSettings = async () => {
        try {
            setLoading(true);
            const data = await fetchWithAuth('/admin/settings');
            setSettings(data);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSettings();
    }, []);

    const handleUpdate = async (key: string, value: string) => {
        try {
            setSaving(key);
            await fetchWithAuth('/admin/settings', {
                method: 'PUT',
                body: JSON.stringify({ key, value })
            });
            toast({ title: "Success", description: `${key} updated successfully.` });
            loadSettings();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setSaving(null);
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-[400px]">
                    <p className="animate-pulse text-slate-500">Loading system settings...</p>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">System Settings</h1>
                <p className="text-slate-500">Global configuration for Ripplify platform fees and payouts.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {settings.map((setting) => (
                    <div key={setting.key} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-slate-50 rounded-2xl text-[#025864]">
                                {setting.key.includes('fee') ? <Percent className="w-5 h-5" /> : <Settings className="w-5 h-5" />}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 capitalize">{setting.key.replace('_', ' ')}</h3>
                                <p className="text-xs text-slate-500">Last updated: {new Date(setting.updatedAt).toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Value</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        defaultValue={setting.value}
                                        id={`input-${setting.key}`}
                                        className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#025864]/10 focus:border-[#025864]"
                                    />
                                    <button 
                                        onClick={() => {
                                            const val = (document.getElementById(`input-${setting.key}`) as HTMLInputElement)?.value;
                                            handleUpdate(setting.key, val);
                                        }}
                                        disabled={saving === setting.key}
                                        className="px-4 py-2.5 bg-[#025864] text-white rounded-xl font-bold hover:bg-[#013a42] transition-colors disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {saving === setting.key ? "..." : <Save className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            
                            <div className="p-3 bg-blue-50/50 rounded-xl flex gap-3">
                                <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                <p className="text-[11px] text-blue-700">
                                    {setting.key === 'platform_fee' 
                                        ? "This fee is deducted from every successful transaction on the platform (percentage)."
                                        : "This is a fixed fee charged for every withdrawal request processed."}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}

                <div className="bg-slate-900 p-8 rounded-3xl text-white md:col-span-2">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-4 bg-white/10 rounded-2xl">
                            <Wallet className="w-8 h-8 text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Global Payout Configuration</h2>
                            <p className="text-white/60 text-sm">Configure how and when funds are released to sellers.</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                            <p className="text-xs text-white/40 mb-1 font-bold">Escrow Period</p>
                            <p className="text-lg font-bold text-emerald-400">T + 3 Days</p>
                        </div>
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                            <p className="text-xs text-white/40 mb-1 font-bold">Min Withdrawal</p>
                            <p className="text-lg font-bold text-emerald-400">KES 500</p>
                        </div>
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                            <p className="text-xs text-white/40 mb-1 font-bold">Payout Status</p>
                            <p className="text-lg font-bold text-emerald-400">Live</p>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default SystemSettings;
