import AdminLayout from "@/components/admin/AdminLayout";
import { useState, useEffect } from "react";
import { fetchWithAuth } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Save, Settings, Info, Percent, Wallet, Plus, Trash2, Layers, DollarSign, Clock, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

const SystemSettings = () => {
    const [settings, setSettings] = useState<any[]>([]);
    const [feeConfig, setFeeConfig] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    // Fee config state
    const [feeMode, setFeeMode] = useState<string>('flat');
    const [flatFee, setFlatFee] = useState('1');
    const [minWithdrawal, setMinWithdrawal] = useState('500');
    const [escrowDays, setEscrowDays] = useState('3');
    const [tiers, setTiers] = useState<any[]>([]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [settingsData, feesData] = await Promise.all([
                fetchWithAuth('/admin/settings'),
                fetchWithAuth('/admin/fees'),
            ]);
            setSettings(settingsData);
            setFeeConfig(feesData);
            setFeeMode(feesData.mode || 'flat');
            setFlatFee(feesData.flatFee || '1');
            setMinWithdrawal(feesData.minWithdrawal || '500');
            setEscrowDays(feesData.escrowDays || '3');
            setTiers(feesData.tiers || []);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const handleUpdateSetting = async (key: string, value: string) => {
        try {
            setSaving(true);
            await fetchWithAuth('/admin/settings', {
                method: 'PUT',
                body: JSON.stringify({ key, value })
            });
            toast({ title: "Success", description: `${key} updated.` });
            loadData();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const handleSaveFees = async () => {
        try {
            setSaving(true);
            await fetchWithAuth('/admin/fees', {
                method: 'PUT',
                body: JSON.stringify({
                    mode: feeMode,
                    flatFee,
                    minWithdrawal,
                    escrowDays,
                    tiers: feeMode === 'tiered' ? tiers : undefined,
                })
            });
            toast({ title: "Saved", description: "Fee configuration updated. Changes apply to new transactions." });
            loadData();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const addTier = () => {
        setTiers([...tiers, { minAmount: 0, maxAmount: 0, feePercent: 1, label: '' }]);
    };

    const removeTier = (index: number) => {
        setTiers(tiers.filter((_, i) => i !== index));
    };

    const updateTier = (index: number, field: string, value: any) => {
        setTiers(tiers.map((t, i) => i === index ? { ...t, [field]: value } : t));
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
                <p className="text-slate-500">Configure platform fees, payouts, and system behavior.</p>
            </div>

            {/* Fee Configuration */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm mb-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-emerald-50 rounded-2xl">
                        <Percent className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">Fee Configuration</h3>
                        <p className="text-xs text-slate-500">How platform fees are calculated on transactions.</p>
                    </div>
                </div>

                {/* Fee Mode Toggle */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setFeeMode('flat')}
                        className={cn(
                            "flex-1 p-4 rounded-2xl border-2 text-left transition-all",
                            feeMode === 'flat' ? "border-[#025864] bg-[#025864]/5" : "border-slate-100 hover:border-slate-200"
                        )}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <DollarSign className="w-4 h-4 text-[#025864]" />
                            <p className="text-sm font-bold">Flat Percentage</p>
                        </div>
                        <p className="text-xs text-slate-500">Same fee % for all transaction amounts.</p>
                    </button>
                    <button
                        onClick={() => setFeeMode('tiered')}
                        className={cn(
                            "flex-1 p-4 rounded-2xl border-2 text-left transition-all",
                            feeMode === 'tiered' ? "border-[#025864] bg-[#025864]/5" : "border-slate-100 hover:border-slate-200"
                        )}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <Layers className="w-4 h-4 text-[#025864]" />
                            <p className="text-sm font-bold">Tiered Pricing</p>
                        </div>
                        <p className="text-xs text-slate-500">Different fees based on amount ranges (like PayHero).</p>
                    </button>
                </div>

                {/* Flat Fee */}
                {feeMode === 'flat' && (
                    <div className="p-4 bg-slate-50 rounded-2xl mb-4">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Platform Fee (%)</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="number"
                                step="0.1"
                                value={flatFee}
                                onChange={e => setFlatFee(e.target.value)}
                                className="w-32 px-4 py-3 bg-white border border-slate-200 rounded-xl text-lg font-bold focus:outline-none focus:ring-2 focus:ring-[#025864]"
                            />
                            <span className="text-lg font-bold text-slate-400">%</span>
                            <p className="text-xs text-slate-500 ml-4">Applied to every completed transaction.</p>
                        </div>
                    </div>
                )}

                {/* Tiered Fees */}
                {feeMode === 'tiered' && (
                    <div className="space-y-3 mb-4">
                        <div className="grid grid-cols-12 gap-2 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <div className="col-span-3">Label</div>
                            <div className="col-span-3">Min Amount (KES)</div>
                            <div className="col-span-3">Max Amount (KES)</div>
                            <div className="col-span-2">Fee (%)</div>
                            <div className="col-span-1"></div>
                        </div>
                        {tiers.map((tier, i) => (
                            <div key={i} className="grid grid-cols-12 gap-2 items-center">
                                <input
                                    type="text"
                                    value={tier.label}
                                    onChange={e => updateTier(i, 'label', e.target.value)}
                                    placeholder="Label"
                                    className="col-span-3 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#025864]"
                                />
                                <input
                                    type="number"
                                    value={tier.minAmount}
                                    onChange={e => updateTier(i, 'minAmount', parseFloat(e.target.value) || 0)}
                                    placeholder="Min"
                                    className="col-span-3 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#025864]"
                                />
                                <input
                                    type="number"
                                    value={tier.maxAmount}
                                    onChange={e => updateTier(i, 'maxAmount', parseFloat(e.target.value) || 0)}
                                    placeholder="Max"
                                    className="col-span-3 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#025864]"
                                />
                                <div className="col-span-2 flex items-center gap-1">
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={tier.feePercent}
                                        onChange={e => updateTier(i, 'feePercent', parseFloat(e.target.value) || 0)}
                                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#025864]"
                                    />
                                    <span className="text-xs text-slate-400">%</span>
                                </div>
                                <button onClick={() => removeTier(i)} className="col-span-1 p-2 text-red-400 hover:text-red-600">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        <button
                            onClick={addTier}
                            className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-sm font-medium text-slate-500 hover:border-[#025864] hover:text-[#025864] flex items-center justify-center gap-1"
                        >
                            <Plus className="w-4 h-4" /> Add Tier
                        </button>

                        <div className="p-3 bg-blue-50 rounded-xl flex gap-3 mt-2">
                            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-blue-700">
                                Tiered fees work like PayHero: a transaction of KES 5,000 with tiers [0-1000: 1.5%, 1001-10000: 1%] would be charged 1%.
                                The tier matching the full transaction amount determines the fee.
                            </p>
                        </div>
                    </div>
                )}

                <button
                    onClick={handleSaveFees}
                    disabled={saving}
                    className="px-6 py-3 bg-[#025864] text-white rounded-xl font-bold hover:bg-[#013a42] transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                    <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Fee Configuration"}
                </button>
            </div>

            {/* Payout Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-blue-50 rounded-2xl">
                            <Wallet className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900">Min Withdrawal (KES)</h3>
                            <p className="text-xs text-slate-500">Minimum amount sellers can withdraw.</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="number"
                            value={minWithdrawal}
                            onChange={e => setMinWithdrawal(e.target.value)}
                            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-[#025864]"
                        />
                        <button onClick={() => handleUpdateSetting('min_withdrawal', minWithdrawal)} disabled={saving} className="px-4 py-3 bg-[#025864] text-white rounded-xl font-bold disabled:opacity-50">
                            <Save className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-orange-50 rounded-2xl">
                            <Clock className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900">Escrow Period (Days)</h3>
                            <p className="text-xs text-slate-500">Days before funds are released to sellers.</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="number"
                            value={escrowDays}
                            onChange={e => setEscrowDays(e.target.value)}
                            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-[#025864]"
                        />
                        <button onClick={() => handleUpdateSetting('escrow_days', escrowDays)} disabled={saving} className="px-4 py-3 bg-[#025864] text-white rounded-xl font-bold disabled:opacity-50">
                            <Save className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Other Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {settings.filter(s => !['platform_fee', 'fee_mode', 'min_withdrawal', 'escrow_days'].includes(s.key)).map((setting) => (
                    <div key={setting.key} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-slate-50 rounded-2xl text-[#025864]">
                                <Settings className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 capitalize">{setting.key.replace(/_/g, ' ')}</h3>
                                <p className="text-xs text-slate-400">Updated: {new Date(setting.updatedAt).toLocaleString()}</p>
                            </div>
                        </div>
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
                                    handleUpdateSetting(setting.key, val);
                                }}
                                disabled={saving}
                                className="px-4 py-2.5 bg-[#025864] text-white rounded-xl font-bold hover:bg-[#013a42] transition-colors disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Payout Summary */}
            <div className="bg-slate-900 p-8 rounded-3xl text-white mt-6">
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-4 bg-white/10 rounded-2xl">
                        <CreditCard className="w-8 h-8 text-emerald-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">Payout Configuration Summary</h2>
                        <p className="text-white/60 text-sm">How fees and payouts currently work.</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                        <p className="text-xs text-white/40 mb-1 font-bold">Fee Mode</p>
                        <p className="text-lg font-bold text-emerald-400 capitalize">{feeMode}</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                        <p className="text-xs text-white/40 mb-1 font-bold">Flat Fee</p>
                        <p className="text-lg font-bold text-emerald-400">{flatFee}%</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                        <p className="text-xs text-white/40 mb-1 font-bold">Min Withdrawal</p>
                        <p className="text-lg font-bold text-emerald-400">KES {Number(minWithdrawal).toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                        <p className="text-xs text-white/40 mb-1 font-bold">Escrow</p>
                        <p className="text-lg font-bold text-emerald-400">T + {escrowDays} Days</p>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default SystemSettings;
