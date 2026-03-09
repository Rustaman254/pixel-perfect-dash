import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { User, Shield, Bell, Key, CreditCard, Save, Eye, EyeOff, Copy, Plus } from "lucide-react";
import { useAppContext } from "@/contexts/AppContext";
import { fetchWithAuth } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "api", label: "API Keys", icon: Key },
    { id: "billing", label: "Billing", icon: CreditCard },
];

const inputClass = "w-full px-3 py-2 rounded-lg border border-border text-sm text-foreground bg-white focus:outline-none focus:ring-2 focus:ring-[#025864]/20 focus:border-[#025864]";
const btnPrimary = "flex items-center gap-2 text-sm font-medium text-white px-5 py-2.5 rounded-lg disabled:opacity-50";

const SettingsPage = () => {
    const { userProfile, refreshData } = useAppContext();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("profile");
    const [showApiKeys, setShowApiKeys] = useState<{ [key: number]: boolean }>({});
    const [loading, setLoading] = useState(false);
    const [apiKeys, setApiKeys] = useState<any[]>([]);
    const [fetchingKeys, setFetchingKeys] = useState(false);
    const [notifs, setNotifs] = useState({ email: true, push: true, sms: false, marketing: false, weeklyReport: true, payoutAlerts: true });

    const [formData, setFormData] = useState({
        businessName: "",
        fullName: "",
        phone: "",
        location: "",
        payoutMethod: "mpesa",
        payoutDetails: ""
    });

    useEffect(() => {
        if (userProfile) {
            setFormData({
                businessName: userProfile.businessName || "",
                fullName: userProfile.fullName || "",
                phone: userProfile.phone || "",
                location: userProfile.location || "",
                payoutMethod: userProfile.payoutMethod || "mpesa",
                payoutDetails: userProfile.payoutDetails || ""
            });
        }
    }, [userProfile]);

    const fetchKeys = async () => {
        try {
            setFetchingKeys(true);
            const data = await fetchWithAuth('/auth/api-keys');
            setApiKeys(data);
        } catch (err: any) {
            console.error("Failed to fetch keys:", err);
        } finally {
            setFetchingKeys(false);
        }
    };

    useEffect(() => {
        if (activeTab === "api") {
            fetchKeys();
        }
    }, [activeTab]);

    const handleSaveProfile = async () => {
        setLoading(true);
        try {
            await fetchWithAuth('/auth/profile', {
                method: 'PUT',
                body: JSON.stringify(formData)
            });
            await refreshData();
            toast({ title: "Success", description: "Profile updated successfully!" });
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateKey = async () => {
        const name = prompt("Enter a label for this API key:", "Default API Key");
        if (name === null) return;
        
        try {
            await fetchWithAuth('/auth/api-keys', {
                method: 'POST',
                body: JSON.stringify({ name })
            });
            fetchKeys();
            toast({ title: "Success", description: "API Key created successfully!" });
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
    };

    const handleDeleteKey = async (id: number) => {
        if (!confirm("Are you sure you want to delete this API key?")) return;
        
        try {
            await fetchWithAuth(`/auth/api-keys/${id}`, { method: 'DELETE' });
            fetchKeys();
            toast({ title: "Key Deleted", description: "API Key has been removed." });
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
    };

    const toggleShowKey = (id: number) => {
        setShowApiKeys(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copied!", description: "API Key copied to clipboard" });
    };

    const toggle = (key: keyof typeof notifs) => setNotifs(prev => ({ ...prev, [key]: !prev[key] }));

    const Toggle = ({ on, onClick }: { on: boolean; onClick: () => void }) => (
        <button onClick={onClick} className={`relative w-11 h-6 rounded-full transition-colors ${on ? '' : 'bg-gray-200'}`} style={on ? { backgroundColor: '#00D47E' } : undefined}>
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? 'left-[22px]' : 'left-0.5'}`} />
        </button>
    );

    return (
        <DashboardLayout>
            <h1 className="text-xl md:text-2xl font-bold text-foreground mb-4">Settings</h1>
            <div className="flex items-center gap-1 overflow-x-auto pb-2 -mb-2">
                {tabs.map((t) => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${activeTab === t.id ? 'text-white font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`} style={activeTab === t.id ? { backgroundColor: '#025864' } : undefined}>
                        <t.icon className="w-4 h-4" />{t.label}
                    </button>
                ))}
            </div>

            {activeTab === "profile" && (
                <div className="bg-card rounded-2xl p-5 border border-border">
                    <h3 className="font-semibold text-foreground mb-4">Business Profile</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm text-muted-foreground block mb-1.5">Business Name</label>
                            <input
                                type="text"
                                value={formData.businessName}
                                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className="text-sm text-muted-foreground block mb-1.5">Full Name</label>
                            <input
                                type="text"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className="text-sm text-muted-foreground block mb-1.5">Phone</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className="text-sm text-muted-foreground block mb-1.5">Location</label>
                            <input
                                type="text"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className="text-sm text-muted-foreground block mb-1.5">Payout Method</label>
                            <select
                                className={inputClass}
                                value={formData.payoutMethod}
                                onChange={(e) => setFormData({ ...formData, payoutMethod: e.target.value })}
                            >
                                <option value="mpesa">M-Pesa</option>
                                <option value="bank">Bank Transfer</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm text-muted-foreground block mb-1.5">Payout Details (Phone/AC)</label>
                            <input
                                type="text"
                                value={formData.payoutDetails}
                                onChange={(e) => setFormData({ ...formData, payoutDetails: e.target.value })}
                                className={inputClass}
                            />
                        </div>
                    </div>
                    <div className="mt-5 pt-4 border-t border-border flex justify-end">
                        <button
                            className={btnPrimary}
                            disabled={loading}
                            onClick={handleSaveProfile}
                            style={{ backgroundColor: '#025864' }}
                        >
                            <Save className="w-4 h-4" />
                            {loading ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </div>
            )}

            {activeTab === "security" && (
                <div className="space-y-4">
                    <div className="bg-card rounded-2xl p-5 border border-border">
                        <h3 className="font-semibold text-foreground mb-4">Change Password</h3>
                        <div className="space-y-3 max-w-md">
                            <div><label className="text-sm text-muted-foreground block mb-1.5">Current Password</label><input type="password" placeholder="••••••••" className={inputClass} /></div>
                            <div><label className="text-sm text-muted-foreground block mb-1.5">New Password</label><input type="password" placeholder="••••••••" className={inputClass} /></div>
                            <div><label className="text-sm text-muted-foreground block mb-1.5">Confirm New Password</label><input type="password" placeholder="••••••••" className={inputClass} /></div>
                        </div>
                        <div className="mt-4 flex justify-end"><button className={btnPrimary} style={{ backgroundColor: '#025864' }}>Update Password</button></div>
                    </div>
                    <div className="bg-card rounded-2xl p-5 border border-border">
                        <h3 className="font-semibold text-foreground mb-2">Two-Factor Authentication</h3>
                        <p className="text-sm text-muted-foreground mb-4">Add an extra layer of security.</p>
                        <button className="text-sm font-medium text-white px-4 py-2 rounded-lg" style={{ backgroundColor: '#025864' }}>Enable 2FA</button>
                    </div>
                </div>
            )}

            {activeTab === "notifications" && (
                <div className="bg-card rounded-2xl p-5 border border-border">
                    <h3 className="font-semibold text-foreground mb-4">Notification Preferences</h3>
                    <div className="space-y-4">
                        {([
                            { key: "email" as const, label: "Email Notifications", desc: "Transaction alerts via email" },
                            { key: "push" as const, label: "Push Notifications", desc: "Browser push for new payments" },
                            { key: "sms" as const, label: "SMS Notifications", desc: "Text messages for important events" },
                            { key: "payoutAlerts" as const, label: "Payout Alerts", desc: "When payouts are processed" },
                            { key: "weeklyReport" as const, label: "Weekly Reports", desc: "Weekly performance summary" },
                            { key: "marketing" as const, label: "Marketing Emails", desc: "Product updates and features" },
                        ]).map((item) => (
                            <div key={item.key} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/30 transition-colors">
                                <div><p className="text-sm font-medium text-foreground">{item.label}</p><p className="text-[11px] text-muted-foreground">{item.desc}</p></div>
                                <Toggle on={notifs[item.key]} onClick={() => toggle(item.key)} />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === "api" && (
                <div className="bg-card rounded-2xl p-5 border border-border">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-foreground">API Keys</h3>
                        <button 
                            onClick={handleCreateKey}
                            className="flex items-center gap-2 text-sm font-medium text-white px-4 py-2 rounded-lg" 
                            style={{ backgroundColor: '#025864' }}
                        >
                            <Plus className="w-4 h-4" />Create Key
                        </button>
                    </div>
                    
                    {fetchingKeys ? (
                        <div className="py-10 text-center text-sm text-muted-foreground">Loading keys...</div>
                    ) : apiKeys.length === 0 ? (
                        <div className="py-10 text-center text-sm text-muted-foreground border border-dashed border-border rounded-xl">
                            No API keys generated yet.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {apiKeys.map((key) => (
                                <div key={key.id} className="p-4 rounded-xl bg-muted/30 border border-border">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium text-foreground">{key.name}</p>
                                            <span className={cn(
                                                "text-[10px] px-2 py-0.5 rounded-full font-bold",
                                                key.status === 'Active' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                                            )}>
                                                {key.status}
                                            </span>
                                        </div>
                                        <button 
                                            onClick={() => handleDeleteKey(key.id)}
                                            className="text-xs text-red-500 hover:text-red-700 font-medium"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <code className="flex-1 text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded font-mono truncate">
                                            {showApiKeys[key.id] ? key.key : `${key.key.substring(0, 10)}••••••••`}
                                        </code>
                                        <button onClick={() => toggleShowKey(key.id)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground">
                                            {showApiKeys[key.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                        <button onClick={() => copyToClipboard(key.key)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground">
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === "billing" && (
                <div className="space-y-4">
                    <div className="bg-card rounded-2xl p-5 border border-border">
                        <h3 className="font-semibold text-foreground mb-2">Current Plan</h3>
                        <div className="flex items-center justify-between p-4 rounded-xl border-2 border-[#025864]/20" style={{ backgroundColor: 'rgba(2,88,100,0.03)' }}>
                            <div><h4 className="text-base font-bold text-foreground">Starter Plan</h4><p className="text-sm text-muted-foreground">Free</p></div>
                            <button className="text-sm font-medium px-4 py-2 rounded-lg border border-border hover:bg-muted text-foreground">Upgrade</button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default SettingsPage;
