import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { User, Shield, Bell, Key, CreditCard, Save, Eye, EyeOff, Copy, Plus } from "lucide-react";
import { useAppContext } from "@/contexts/AppContext";
import { fetchWithAuth } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

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
    const [showApiKey, setShowApiKey] = useState(false);
    const [loading, setLoading] = useState(false);
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
                        <button className="flex items-center gap-2 text-sm font-medium text-white px-4 py-2 rounded-lg" style={{ backgroundColor: '#025864' }}><Plus className="w-4 h-4" />Create Key</button>
                    </div>
                    <div className="space-y-3">
                        <div className="p-4 rounded-xl bg-muted/30 border border-border">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium text-foreground">Live Key</p>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-600">Active</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded font-mono">{showApiKey ? "sk_live_a1b2c3d4e5f6g7h8i9j0..." : "sk_live_••••••••••••••••"}</code>
                                <button onClick={() => setShowApiKey(!showApiKey)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"><Eye className="w-4 h-4" /></button>
                                <button className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"><Copy className="w-4 h-4" /></button>
                            </div>
                        </div>
                    </div>
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
