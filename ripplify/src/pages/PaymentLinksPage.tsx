import { useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import FeatureGuard from "@/components/FeatureGuard";
import { useToast } from "@/hooks/use-toast";
import { Copy, ExternalLink, MoreHorizontal, Plus, Search, Filter, X, MousePointerClick, Calendar, Clock, Package, Truck, CheckCircle2, AlertTriangle, DollarSign, Share2, Image as ImageIcon, Eye, QrCode, Download, User, Mail, Phone, Heart, BarChart3 } from "lucide-react";
import { useAppContext } from "@/contexts/AppContext";
import type { DealStatus } from "@/contexts/AppContext";
import { fetchWithAuth } from "@/lib/api";
import usePageTitle from "@/hooks/usePageTitle";

const currencies = ["KES", "USD", "EUR", "GBP", "NGN", "TZS", "UGX"];

const slugify = (text: string) =>
    text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const PaymentLinksPage = () => {
    usePageTitle("Payment Links");
    const { links, refreshData } = useAppContext();
    const { toast } = useToast();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<"All" | DealStatus>("All");
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        name: "", price: "", currency: "KES", description: "",
        linkType: "one-time" as "one-time" | "reusable" | "donation", hasExpiry: false, expiryDate: "",
        deliveryDays: "2", buyerName: "", buyerPhone: "", buyerEmail: "", hasPhotos: false,
        category: "product" as "product" | "service", shippingFee: "", minDonation: "",
    });
    const [formError, setFormError] = useState("");
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [selectedLink, setSelectedLink] = useState<any>(null);

    const filtered = links.filter((l) => {
        const matchSearch = l.name.toLowerCase().includes(search.toLowerCase()) || (l.slug && l.slug.includes(search.toLowerCase()));
        const matchStatus = statusFilter === "All" || l.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const resetForm = () => {
        setForm({
            name: "", price: "", currency: "KES", description: "",
            linkType: "one-time", hasExpiry: false, expiryDate: "",
            deliveryDays: "2", buyerName: "", buyerPhone: "", buyerEmail: "", hasPhotos: false,
            category: "product", shippingFee: "", minDonation: "",
        });
        setFormError("");
    };

    const handleCreate = async () => {
        if (!form.name.trim()) { setFormError("Please enter an item name."); return; }
        if (form.linkType !== "donation" && (!form.price.trim() || isNaN(parseFloat(form.price)))) { setFormError("Please enter a valid amount."); return; }
        if (form.linkType === "reusable" && form.hasExpiry && !form.expiryDate) { setFormError("Please select an expiry date."); return; }
        if (form.linkType !== "donation" && (!form.deliveryDays || parseInt(form.deliveryDays) < 1)) { setFormError("Please set expected delivery time."); return; }

        setLoading(true);
        try {
            const cryptoArr = new Uint8Array(4);
            crypto.getRandomValues(cryptoArr);
            const shortId = Array.from(cryptoArr).map(b => b.toString(16).padStart(2, '0')).join('');
            const slug = `${slugify(form.name)}-${shortId}`;

            let expiryLabel: string | null = null;
            let expiryDate: string | null = null;
            if (form.linkType === "one-time") {
                expiryLabel = "1 hour after creation";
            } else if (form.linkType === "donation") {
                expiryLabel = "No expiry";
            } else if (form.hasExpiry && form.expiryDate) {
                expiryDate = form.expiryDate;
                expiryLabel = new Date(form.expiryDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
            } else {
                expiryLabel = "No expiry";
            }

            const payload = {
                name: form.name.trim(),
                slug,
                description: form.description.trim(),
                price: form.price ? parseFloat(form.price) : 0,
                currency: form.currency,
                linkType: form.linkType,
                hasPhotos: form.hasPhotos,
                deliveryDays: form.deliveryDays ? parseInt(form.deliveryDays) : null,
                expiryDate,
                expiryLabel,
                buyerName: form.buyerName.trim(),
                buyerPhone: form.buyerPhone.trim(),
                buyerEmail: form.buyerEmail.trim(),
                category: form.category,
                shippingFee: parseFloat(form.shippingFee) || 0,
                minDonation: form.linkType === "donation" ? (parseFloat(form.minDonation) || 0) : 0,
            };

            const newLink = await fetchWithAuth('/links', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            await refreshData();

            toast({
                title: "Link Created!",
                description: "Link has been copied to your clipboard.",
            });

            const fullUrl = `${window.location.origin}/pay/${newLink.slug}`;
            navigator.clipboard.writeText(fullUrl);
            resetForm();
            setShowModal(false);
        } catch (error: any) {
            setFormError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCopyLink = (url: string) => {
        navigator.clipboard.writeText(url);
        toast({
            title: "Link Copied",
            description: "Payment link copied to clipboard.",
        });
    };

    const handleDeleteLink = async (id: number) => {
        try {
            await fetchWithAuth(`/links/${id}`, { method: 'DELETE' });
            await refreshData();
            toast({
                title: "Link Deleted",
                description: "The payment link has been removed.",
            });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const handleShip = async (id: number) => {
        try {
            await fetchWithAuth(`/links/${id}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status: 'Shipped' })
            });
            await refreshData();
            toast({
                title: "Item Shipped",
                description: "Status updated to Shipped.",
            });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const statusConfig: Record<string, { color: string; icon: React.ElementType }> = {
        Active: { color: "bg-green-50 text-green-600", icon: CheckCircle2 },
        "Waiting for payment": { color: "bg-yellow-50 text-yellow-600", icon: Clock },
        "Funds locked": { color: "bg-blue-50 text-blue-600", icon: DollarSign },
        Shipped: { color: "bg-indigo-50 text-indigo-600", icon: Truck },
        Completed: { color: "bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
        Disputed: { color: "bg-red-50 text-red-600", icon: AlertTriangle },
        Expired: { color: "bg-gray-100 text-gray-500", icon: Clock },
        Used: { color: "bg-purple-50 text-purple-600", icon: Package },
    };

    const activeDeals = links.filter(l => ["Funds locked", "Shipped", "Waiting for payment"].includes(l.status)).length;
    const completedDeals = links.filter(l => l.status === "Completed").length;
    const disputedDeals = links.filter(l => l.status === "Disputed").length;

    const totalRevenue = links.reduce((acc, link) => {
        if (link.linkType === "reusable") {
            return acc + link.totalEarnedValue;
        } else if (link.status === "Completed" || link.status === "Shipped" || link.status === "Funds locked") {
            return acc + parseFloat(link.price.toString().replace(/,/g, ''));
        }
        return acc;
    }, 0);

    const inputClass = "w-full px-3 py-2.5 rounded-lg border border-border text-sm text-foreground bg-white focus:outline-none focus:ring-2 focus:ring-[#025864]/20 focus:border-[#025864]";

    return (
        <DashboardLayout>
            <FeatureGuard featureKey="payment_links">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-foreground">Payment Links</h1>
                    <p className="text-sm text-muted-foreground">Create escrow-protected payment links for safe transactions</p>
                </div>
                <button onClick={() => setShowModal(true)} className="flex items-center gap-2 text-sm font-medium text-white px-4 py-2.5 rounded-lg transition-colors hover:opacity-90" style={{ backgroundColor: '#025864' }}>
                    <Plus className="w-4 h-4" />
                    New Page
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-card rounded-2xl p-5 border border-border">
                    <p className="text-sm text-muted-foreground mb-1">Total Links</p>
                    <h3 className="text-2xl font-bold text-foreground">{links.length}</h3>
                </div>
                <div className="bg-card rounded-2xl p-5 border border-border">
                    <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                    <h3 className="text-2xl font-bold text-emerald-600">KES {totalRevenue.toLocaleString()}</h3>
                </div>
                <div className="bg-card rounded-2xl p-5 border border-border">
                    <p className="text-sm text-muted-foreground mb-1">Active Deals</p>
                    <h3 className="text-2xl font-bold" style={{ color: '#025864' }}>{activeDeals}</h3>
                </div>
                <div className="bg-card rounded-2xl p-5 border border-border">
                    <p className="text-sm text-muted-foreground mb-1">Completed</p>
                    <h3 className="text-2xl font-bold text-success">{completedDeals}</h3>
                </div>
                <div className="bg-card rounded-2xl p-5 border border-border">
                    <p className="text-sm text-muted-foreground mb-1">Disputes</p>
                    <h3 className="text-2xl font-bold text-destructive">{disputedDeals}</h3>
                </div>
            </div>

            {/* Filters + Table */}
            <div className="bg-card rounded-2xl p-5 border border-border">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                    <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 flex-1">
                        <Search className="w-4 h-4 text-muted-foreground" />
                        <input type="text" placeholder="Search deals..." className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground" value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {(["All", "Active", "Funds locked", "Shipped", "Completed", "Disputed", "Expired"] as const).map((s) => (
                            <button key={s} onClick={() => setStatusFilter(s)} className={`text-[11px] px-2.5 py-1.5 rounded-lg transition-colors ${statusFilter === s ? 'text-white' : 'text-muted-foreground hover:text-foreground bg-muted'}`} style={statusFilter === s ? { backgroundColor: '#025864' } : undefined}>
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-[11px] text-muted-foreground uppercase tracking-wider">
                                <th className="text-left font-medium pb-3">Page</th>
                                <th className="text-left font-medium pb-3 hidden md:table-cell">Amount</th>
                                <th className="text-left font-medium pb-3">Clicks</th>
                                <th className="text-left font-medium pb-3 hidden md:table-cell">Type / Expiry</th>
                                <th className="text-left font-medium pb-3">Status</th>
                                <th className="text-right font-medium pb-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((link) => (
                                <tr key={link.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                                    <td className="py-3">
                                        <div className="flex items-start gap-2">
                                            {link.hasPhotos && (
                                                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                                                    <ImageIcon className="w-4 h-4 text-muted-foreground" />
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-foreground truncate">{link.name}</p>
                                                <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-[#025864] hover:underline flex items-center gap-1 truncate">
                                                    <ExternalLink className="w-2.5 h-2.5" />
                                                    {link.url}
                                                </a>
                                                {link.buyerName && (
                                                    <div className="space-y-0.5 mt-1 border-l-2 border-slate-100 pl-2 ml-1">
                                                        <p className="text-[10px] font-bold text-slate-700">{link.buyerName}</p>
                                                        {link.buyerEmail && <p className="text-[9px] text-muted-foreground">{link.buyerEmail}</p>}
                                                        {link.buyerPhone && <p className="text-[9px] text-muted-foreground">{link.buyerPhone}</p>}
                                                    </div>
                                                )}
                                                {link.deliveryDays && (
                                                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                                                        <Clock className="w-3 h-3" /> {link.deliveryDays} d delivery
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 hidden md:table-cell">
                                        <p className="text-sm font-semibold text-foreground">
                                            {link.linkType === "reusable" ? `${link.currency} ${link.totalEarnedValue.toLocaleString()}` : `${link.currency} ${link.price}`}
                                        </p>
                                        {link.linkType === "reusable" && (
                                            <p className="text-[10px] text-muted-foreground mt-1">{link.paymentCount} payment{link.paymentCount !== 1 ? 's' : ''}</p>
                                        )}
                                    </td>
                                    <td className="py-3">
                                        <div className="flex items-center gap-1.5">
                                            <MousePointerClick className="w-3.5 h-3.5 text-muted-foreground" />
                                            <p className="text-sm font-medium text-foreground">{link.clicks.toLocaleString()}</p>
                                        </div>
                                    </td>
                                    <td className="py-3 hidden md:table-cell">
                                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${link.linkType === "one-time" ? "bg-purple-50 text-purple-600" : link.linkType === "donation" ? "bg-pink-50 text-pink-600" : "bg-blue-50 text-blue-600"}`}>
                                            {link.linkType === "one-time" ? "One-time" : link.linkType === "donation" ? "Donation" : "Reusable"}
                                        </span>
                                        {link.expiryLabel && (
                                            <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> {link.expiryLabel}
                                            </p>
                                        )}
                                    </td>
                                    <td className="py-3">
                                        {(() => {
                                            let currentStatus = link.status;

                                            // Handle dynamically determined statuses for one-time links
                                            if (link.linkType === 'one-time') {
                                                if (link.paymentCount > 0) {
                                                    currentStatus = 'Used';
                                                } else {
                                                    const createdTime = new Date(link.createdAt + (link.createdAt.includes('Z') ? '' : ' UTC')).getTime();
                                                    const now = new Date().getTime();
                                                    const ONE_HOUR = 60 * 60 * 1000;
                                                    if (now - createdTime > ONE_HOUR && link.status === 'Active') {
                                                        currentStatus = 'Expired';
                                                    }
                                                }
                                            } else if (link.linkType === 'reusable' && link.expiryDate) {
                                                const expiryTime = new Date(link.expiryDate).getTime();
                                                const now = new Date().getTime();
                                                if (now > expiryTime && link.status === 'Active') {
                                                    currentStatus = 'Expired';
                                                }
                                            }

                                            const config = statusConfig[currentStatus] || statusConfig["Active"];
                                            const Icon = config.icon;

                                            return (
                                                <span className={`text-[11px] font-medium px-2 py-1 rounded-full inline-flex items-center gap-1 ${config.color}`}>
                                                    <Icon className="w-3 h-3" />
                                                    {currentStatus}
                                                </span>
                                            );
                                        })()}
                                    </td>
                                    <td className="py-3">
                                        <div className="flex items-center justify-end gap-1">
                                            {link.status === "Funds locked" && (
                                                <button
                                                    onClick={() => handleShip(link.id)}
                                                    className="px-2 py-1 bg-[#025864] text-white text-[10px] font-bold rounded-md hover:bg-[#013a42] transition-colors flex items-center gap-1 mr-1"
                                                    title="Mark as Shipped"
                                                >
                                                    <Truck className="w-3 h-3" /> Ship
                                                </button>
                                            )}
                                            <Link
                                                to={`/insights/entity/${link.id}`}
                                                className="p-1.5 rounded-md hover:bg-muted transition-colors text-[#025864] hover:text-[#014751]"
                                                title="View Insights"
                                            >
                                                <BarChart3 className="w-3.5 h-3.5" />
                                            </Link>
                                            <button
                                                onClick={() => {
                                                    setSelectedLink(link);
                                                    setShowReviewModal(true);
                                                    document.title = link.name;
                                                }}
                                                className="p-1.5 rounded-md hover:bg-muted transition-colors text-[#025864] hover:text-[#014751]"
                                                title="Review Link"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                            </button>
                                            <a
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                                                title="Visit Link"
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                            <button
                                                onClick={() => handleCopyLink(link.url)}
                                                className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                                                title="Copy link"
                                            >
                                                <Copy className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(link.url);
                                                    toast({
                                                        title: "Link Shared!",
                                                        description: "Payment link copied for sharing.",
                                                    });
                                                }}
                                                className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                                                title="Share"
                                            >
                                                <Share2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteLink(link.id)}
                                                className="p-1.5 rounded-md hover:bg-muted transition-colors text-red-400 hover:text-red-600 hover:bg-red-50"
                                                title="Delete"
                                            >
                                                <MoreHorizontal className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr><td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">No deals found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Deal Modal */}
            {showModal && (
                <>
                    <div className="fixed inset-0 bg-black/40 z-[60]" onClick={() => { setShowModal(false); resetForm(); }} />
                    <div className="fixed inset-0 z-[61] flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-border max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                            {/* Header */}
                            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                                <div>
                                    <h2 className="text-lg font-semibold text-foreground">New Deal</h2>
                                    <p className="text-[11px] text-muted-foreground">Create an escrow-protected payment link</p>
                                </div>
                                <button onClick={() => { setShowModal(false); resetForm(); }} className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground"><X className="w-5 h-5" /></button>
                            </div>

                            {/* Body */}
                            <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1">
                                {formError && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{formError}</div>}

                                {loading && (
                                    <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#025864]"></div>
                                    </div>
                                )}

                                {/* Item Name */}
                                <div>
                                    <label className="text-sm font-medium text-foreground block mb-1.5">Item Name *</label>
                                    <input type="text" placeholder='e.g. "iPhone 12 128GB"' className={inputClass} value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} autoFocus />
                                    {form.name.trim() && <p className="text-[11px] text-[#025864] mt-1 font-medium bg-[#025864]/5 px-2 py-1 rounded-md border border-[#025864]/10 inline-block">🔗 {window.location.origin}/pay/{slugify(form.name)}</p>}
                                </div>

                                {/* Category Selection */}
                                <div>
                                    <label className="text-sm font-medium text-foreground block mb-2">Deal Category</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button type="button" onClick={() => {
                                            const newType = form.linkType === 'donation' ? 'one-time' : form.linkType;
                                            setForm(p => ({ ...p, category: "product", linkType: newType }));
                                        }}
                                            className={`p-3 rounded-xl border-2 text-left transition-colors ${form.category === "product" ? "border-[#025864]" : "border-border hover:border-gray-300"}`}
                                            style={form.category === "product" ? { backgroundColor: 'rgba(2,88,100,0.04)' } : undefined}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Package className="w-4 h-4" style={{ color: form.category === "product" ? '#025864' : '#9ca3af' }} />
                                                <span className="text-sm font-medium text-foreground">Physical Item</span>
                                            </div>
                                            <p className="text-[11px] text-muted-foreground">Tangible goods needing delivery</p>
                                        </button>
                                        <button type="button" onClick={() => setForm(p => ({ ...p, category: "service" }))}
                                            className={`p-3 rounded-xl border-2 text-left transition-colors ${form.category === "service" ? "border-[#025864]" : "border-border hover:border-gray-300"}`}
                                            style={form.category === "service" ? { backgroundColor: 'rgba(2,88,100,0.04)' } : undefined}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <MousePointerClick className="w-4 h-4" style={{ color: form.category === "service" ? '#025864' : '#9ca3af' }} />
                                                <span className="text-sm font-medium text-foreground">Online Service</span>
                                            </div>
                                            <p className="text-[11px] text-muted-foreground">Events, consulting, or digital work</p>
                                        </button>
                                    </div>
                                </div>

                                {/* Link Type - MOVED HERE */}
                                <div>
                                    <label className="text-sm font-medium text-foreground block mb-2">Link Type</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        <button type="button" onClick={() => setForm(p => ({ ...p, linkType: "one-time", hasExpiry: false, expiryDate: "" }))}
                                            className={`p-3 rounded-xl border-2 text-left transition-colors ${form.linkType === "one-time" ? "border-[#025864]" : "border-border hover:border-gray-300"}`}
                                            style={form.linkType === "one-time" ? { backgroundColor: 'rgba(2,88,100,0.04)' } : undefined}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Clock className="w-4 h-4" style={{ color: form.linkType === "one-time" ? '#025864' : '#9ca3af' }} />
                                                <span className="text-sm font-medium text-foreground">One-time</span>
                                            </div>
                                            <p className="text-[11px] text-muted-foreground">Expires in 1 hour or after one payment</p>
                                        </button>
                                        <button type="button" onClick={() => setForm(p => ({ ...p, linkType: "reusable" }))}
                                            className={`p-3 rounded-xl border-2 text-left transition-colors ${form.linkType === "reusable" ? "border-[#025864]" : "border-border hover:border-gray-300"}`}
                                            style={form.linkType === "reusable" ? { backgroundColor: 'rgba(2,88,100,0.04)' } : undefined}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <ExternalLink className="w-4 h-4" style={{ color: form.linkType === "reusable" ? '#025864' : '#9ca3af' }} />
                                                <span className="text-sm font-medium text-foreground">Reusable</span>
                                            </div>
                                            <p className="text-[11px] text-muted-foreground">Multiple uses</p>
                                        </button>
                                        {/* Donation - Only show for service/digital */}
                                        {form.category !== "product" && (
                                            <button
                                                type="button"
                                                onClick={() => setForm(p => ({ ...p, linkType: "donation", hasExpiry: false, expiryDate: "" }))}
                                                className={`p-3 rounded-xl border-2 text-left transition-all ${form.linkType === "donation" ? "border-pink-500" : "border-border hover:border-gray-300"}`}
                                                style={form.linkType === "donation" ? { backgroundColor: 'rgba(236,72,153,0.04)' } : undefined}>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Heart className="w-4 h-4" style={{ color: form.linkType === "donation" ? '#ec4899' : '#9ca3af' }} />
                                                    <span className="text-sm font-medium text-foreground">Donation</span>
                                                </div>
                                                <p className="text-[11px] text-muted-foreground">Accept flexible donations</p>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Amount + Currency + Shipping (if product) */}
                                <div className="space-y-4">
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="col-span-2">
                                            <label className="text-sm font-medium text-foreground block mb-1.5">{form.linkType === "donation" ? "Suggested Amount" : form.category === "product" ? "Item Price *" : "Service Fee *"}</label>
                                            <input type="number" min="0" step="1" placeholder={form.linkType === "donation" ? "0 (optional)" : "45,000"} className={inputClass} value={form.price} onChange={(e) => setForm(p => ({ ...p, price: e.target.value }))} />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-foreground block mb-1.5">Currency</label>
                                            <select className={inputClass} value={form.currency} onChange={(e) => setForm(p => ({ ...p, currency: e.target.value }))}>
                                                {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    {form.category === "product" && (
                                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                            <label className="text-sm font-medium text-foreground block mb-1.5 flex items-center justify-between">
                                                <span>Shipping / Delivery Fee</span>
                                                <span className="text-[10px] text-muted-foreground font-normal">Optional</span>
                                            </label>
                                            <div className="relative">
                                                <Truck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <input type="number" min="0" step="1" placeholder="500" className={inputClass + " pl-9"} value={form.shippingFee} onChange={(e) => setForm(p => ({ ...p, shippingFee: e.target.value }))} />
                                            </div>
                                            <p className="text-[10px] text-muted-foreground mt-1 px-1">This fee will be added to the item price at checkout.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="text-sm font-medium text-foreground block mb-1.5">Description & Delivery Terms</label>
                                    <textarea placeholder="Condition, what's included, delivery details..." rows={2} className={inputClass + " resize-none"} value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} />
                                </div>

                                {/* Expected Delivery */}
                                <div>
                                    <label className="text-sm font-medium text-foreground block mb-1.5">Expected Delivery Time *</label>
                                    <div className="flex items-center gap-2">
                                        <input type="number" min="1" max="30" className={inputClass + " w-20"} value={form.deliveryDays} onChange={(e) => setForm(p => ({ ...p, deliveryDays: e.target.value }))} />
                                        <span className="text-sm text-muted-foreground">days</span>
                                    </div>
                                </div>

                                {/* Photos Toggle */}
                                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                                    <div className="flex items-center gap-2">
                                        <ImageIcon className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-sm text-foreground">Add photos of the item</span>
                                    </div>
                                    <button type="button" onClick={() => setForm(p => ({ ...p, hasPhotos: !p.hasPhotos }))} className={`relative w-10 h-5 rounded-full transition-colors ${form.hasPhotos ? '' : 'bg-gray-200'}`} style={form.hasPhotos ? { backgroundColor: '#00D47E' } : undefined}>
                                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.hasPhotos ? 'left-[21px]' : 'left-0.5'}`} />
                                    </button>
                                </div>

                                {/* One-time & Donation info notices */}
                                {form.linkType === "one-time" && (
                                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] border border-emerald-100">
                                        <Clock className="w-3.5 h-3.5 shrink-0" />
                                        <span>Link expires <strong>1 hour</strong> after creation or after first payment.</span>
                                    </div>
                                )}

                                {form.linkType === "donation" && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-pink-50 text-pink-700 text-sm border border-pink-100">
                                            <Heart className="w-4 h-4 shrink-0" />
                                            <span>Donors can enter any amount. Suggested price is optional.</span>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-foreground block mb-1.5 flex items-center justify-between">
                                                <span>Minimum Donation</span>
                                                <span className="text-[10px] text-muted-foreground font-normal">Optional</span>
                                            </label>
                                            <div className="relative">
                                                <Heart className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <input type="number" min="0" step="1" placeholder="0" className={inputClass} value={form.minDonation} onChange={(e) => setForm(p => ({ ...p, minDonation: e.target.value }))} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Reusable: settable expiry */}
                                {form.linkType === "reusable" && (
                                    <div className="p-3 bg-[#025864]/5 rounded-xl border border-[#025864]/10">
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-sm font-bold text-[#025864]">Set Expiry Date</label>
                                            <button type="button" onClick={() => setForm(p => ({ ...p, hasExpiry: !p.hasExpiry, expiryDate: "" }))} className={`relative w-10 h-5 rounded-full transition-colors ${form.hasExpiry ? '' : 'bg-gray-200'}`} style={form.hasExpiry ? { backgroundColor: '#025864' } : undefined}>
                                                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.hasExpiry ? 'left-[21px]' : 'left-0.5'}`} />
                                            </button>
                                        </div>
                                        {form.hasExpiry && (
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <input type="date" className={inputClass + " pl-9"} value={form.expiryDate} onChange={(e) => setForm(p => ({ ...p, expiryDate: e.target.value }))} min={new Date().toISOString().split('T')[0]} />
                                            </div>
                                        )}
                                        {!form.hasExpiry && <p className="text-[11px] text-muted-foreground">Link will stay active indefinitely.</p>}
                                    </div>
                                )}

                                {/* Buyer Information (Optional) */}
                                {form.linkType === "one-time" && (
                                    <div className="border-t border-border pt-4 space-y-4">
                                        <p className="text-[11px] font-bold uppercase tracking-wider text-[#025864]">Buyer Information (Optional)</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm font-medium text-foreground block mb-1.5">Buyer Name</label>
                                                <div className="relative">
                                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                    <input type="text" placeholder="e.g. David Mwangi" className={inputClass + " pl-9"} value={form.buyerName} onChange={(e) => setForm(p => ({ ...p, buyerName: e.target.value }))} />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-foreground block mb-1.5">Buyer Phone</label>
                                                <div className="relative">
                                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                    <input type="tel" placeholder="+254 7XX XXX XXX" className={inputClass + " pl-9"} value={form.buyerPhone} onChange={(e) => setForm(p => ({ ...p, buyerPhone: e.target.value }))} />
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-foreground block mb-1.5">Buyer Email</label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <input type="email" placeholder="buyer@example.com" className={inputClass + " pl-9"} value={form.buyerEmail} onChange={(e) => setForm(p => ({ ...p, buyerEmail: e.target.value }))} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Buyer info (optional) */}
                                {/* <div className="border-t border-border pt-4">
                                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-3">Buyer Information (Optional)</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[11px] text-muted-foreground block mb-1">Buyer Name</label>
                                            <input type="text" placeholder="e.g. David Mwangi" className={inputClass} value={form.buyerName} onChange={(e) => setForm(p => ({ ...p, buyerName: e.target.value }))} />
                                        </div>
                                        <div>
                                            <label className="text-[11px] text-muted-foreground block mb-1">Buyer Phone</label>
                                            <input type="tel" placeholder="+254 7XX XXX XXX" className={inputClass} value={form.buyerPhone} onChange={(e) => setForm(p => ({ ...p, buyerPhone: e.target.value }))} />
                                        </div>
                                    </div>
                                </div> */}
                            </div>

                            {/* Footer */}
                            <div className="px-5 py-4 border-t border-border flex items-center justify-end gap-3 shrink-0">
                                <button onClick={() => { setShowModal(false); resetForm(); }} className="text-sm px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted transition-colors">Cancel</button>
                                <button onClick={handleCreate} disabled={loading} className="flex items-center gap-2 text-sm font-medium text-white px-5 py-2 rounded-lg hover:opacity-90 transition-colors" style={{ backgroundColor: '#025864' }}>
                                    <Plus className="w-4 h-4" />
                                    {loading ? "Creating..." : "Create & Copy Link"}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Review Link Modal */}
            {showReviewModal && selectedLink && (
                <>
                    <div className="fixed inset-0 bg-black/40 z-[60]" onClick={() => {
                        setShowReviewModal(false);
                        document.title = 'RippliFy';
                    }} />
                    <div className="fixed inset-0 z-[61] flex items-center justify-center p-4">
                        <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300">
                            <div className="p-0">
                                {/* Card Header - Shareable Part */}
                                <div id="qr-card" className="bg-white p-8 space-y-6 text-center">
                                    <div className="flex flex-col items-center gap-3 mb-2">
                                        <div className="w-12 h-12 rounded-xl bg-[#025864] flex items-center justify-center shadow-lg shadow-[#025864]/20">
                                            <QrCode className="w-7 h-7 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-900 tracking-tight">{(useAppContext().userProfile?.businessName?.trim()) || "RippliFy Merchant"}</h3>
                                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Secure Escrow Trade</p>
                                        </div>
                                    </div>

                                    <div className="relative group">
                                        <div className="absolute -inset-4 bg-slate-50 rounded-[24px] group-hover:bg-slate-100 transition-colors -z-10"></div>
                                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mx-auto w-fit">
                                            <img
                                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(selectedLink.url)}`}
                                                alt="Payment QR Code"
                                                className="w-40 h-40"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-sm font-black text-slate-900">{selectedLink.name}</p>
                                        <p className="text-2xl font-black text-[#025864]">{selectedLink.currency} {parseFloat(selectedLink.price).toLocaleString()}</p>
                                    </div>

                                    <div className="pt-2">
                                        <p className="text-[11px] text-slate-400 font-medium truncate bg-slate-50 py-2 px-3 rounded-lg border border-slate-100">{selectedLink.url}</p>
                                    </div>
                                </div>

                                {/* Footer Actions */}
                                <div className="bg-slate-50 p-6 border-t border-slate-100 flex gap-3">
                                    <button
                                        onClick={() => handleCopyLink(selectedLink.url)}
                                        className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Copy className="w-3.5 h-3.5" /> Copy Link
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowReviewModal(false);
                                            document.title = 'RippliFy';
                                        }}
                                        className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
            </FeatureGuard>
        </DashboardLayout>
    );
};

export default PaymentLinksPage;
