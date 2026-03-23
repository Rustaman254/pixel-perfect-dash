import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Check, ShieldCheck, Clock, AlertCircle, Package, Truck, CheckCircle2, ArrowRight, User, Mail, Phone, Lock, ChevronDown, ChevronUp, Image as ImageIcon, ChevronRight, Heart, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { publicFetch } from "@/lib/api";
import Logo from "@/components/Logo";

const PublicPaymentPage = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [step, setStep] = useState(1);
    const [showDetails, setShowDetails] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [link, setLink] = useState<any>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const [buyerInfo, setBuyerInfo] = useState({
        fullName: "",
        email: "",
        phone: ""
    });
    const [isEditingInfo, setIsEditingInfo] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);

    const [paymentMethod, setPaymentMethod] = useState("mpesa");
    const [mpesaPhone, setMpesaPhone] = useState("");
    const [donationAmount, setDonationAmount] = useState("");
    const [cryptoDepositInfo, setCryptoDepositInfo] = useState<any>(null);

    const [verifyingPayment, setVerifyingPayment] = useState(false);

    // IntaSend state
    const [intasendInvoiceId, setIntasendInvoiceId] = useState<string | null>(null);
    const [intasendStep, setIntasendStep] = useState<string | null>(null); // 'stk_waiting', 'checkout_redirect'
    const [mpesaNumber, setMpesaNumber] = useState("");

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const orderTrackingId = searchParams.get('OrderTrackingId');
        const merchantReference = searchParams.get('OrderMerchantReference');

        if (orderTrackingId && merchantReference) {
            setVerifyingPayment(true);
        }

        // Auto-fill M-Pesa phone if available
        if (step === 3 && buyerInfo.phone && !mpesaNumber) {
            setMpesaNumber(buyerInfo.phone);
        }

        const fetchLink = async () => {
            try {
                if (!slug) return;
                const data = await publicFetch(`/links/public/${slug}`);
                setLink(data);

                const savedBuyer = localStorage.getItem(`buyer_info_${slug}`);

                if (data.isExpired) {
                    // One-time link is expired or used
                    if (data.expirationReason === 'already-used') {
                        // Check if this device is the buyer
                        if (savedBuyer) {
                            const parsed = JSON.parse(savedBuyer);
                            setBuyerInfo(parsed);
                            setStep(4);
                        } else {
                            setError("This one-time payment link has already been used.");
                        }
                    } else if (data.expirationReason === 'time-expired') {
                        setError("This payment link has expired (1-hour time limit).");
                    }
                    return;
                }

                // Skip to tracking if already paid/shipped (for non-expired links or status change)
                if (['Funds locked', 'Shipped', 'Completed'].includes(data.status)) {
                    if (savedBuyer) {
                        const parsed = JSON.parse(savedBuyer);
                        setBuyerInfo(parsed);
                        setStep(4);
                    } else if (data.buyerName) {
                        setBuyerInfo({
                            fullName: data.buyerName,
                            email: data.buyerEmail || "",
                            phone: data.buyerPhone || ""
                        });
                        setStep(4);
                    } else {
                        setStep(4);
                    }
                } else if (data.buyerName && step === 1) {
                    // Pre-filled info exists, set it and eventually skip to confirmation
                    setBuyerInfo({
                        fullName: data.buyerName,
                        email: data.buyerEmail || "",
                        phone: data.buyerPhone || ""
                    });
                }
                if (orderTrackingId && merchantReference) {
                    // We just returned from PesaPal, wait a bit or check status directly
                    // Usually the IPN handles it, but we can poll for a few seconds
                    setTimeout(() => {
                        setVerifyingPayment(false);
                    }, 3000);
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchLink();

        // Polling for updates every 5 seconds if in tracking step or link is paid
        const interval = setInterval(() => {
            if (slug) {
                publicFetch(`/links/public/${slug}`)
                    .then(data => {
                        setLink(data);
                        if (data.linkType === 'donation' && data.price > 0) {
                            setDonationAmount(data.price.toString());
                        }
                        if (['Funds locked', 'Shipped', 'Completed'].includes(data.status)) {
                            setStep(4);
                        }
                    })
                    .catch(console.error);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [slug]);

    if (verifyingPayment) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-sm border border-slate-100">
                    <div className="w-16 h-16 bg-[#025864]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Clock className="w-8 h-8 text-[#025864] animate-spin" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Verifying Payment</h2>
                    <p className="text-slate-500 text-sm">Please wait while we confirm your transaction with IntaSend...</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#025864]"></div>
            </div>
        );
    }

    if (error || !link) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full text-center space-y-4">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h1 className="text-xl font-bold text-slate-900">{error === 'Payment link not found' ? 'Link Not Found' : 'Link Unavailable'}</h1>
                    <p className="text-slate-600">{error || "This payment link might be expired, deleted, or the URL is incorrect."}</p>
                    <button onClick={() => navigate("/")} className="text-[#025864] font-medium hover:underline">Return to Ripplify</button>
                </div>
            </div>
        );
    }

    // Resolve the seller display name — businessName defaults to '' in the DB so we trim+fallback to fullName
    const sellerName = (link.businessName && link.businessName.trim())
        || (link.fullName && link.fullName.trim())
        || 'Private Seller';

    const handleNextStep = () => {
        if (step === 1) {
            if (link.linkType === 'donation') {
                // Donations skip buyer details, go straight to payment
                setStep(2);
                setIsEditingInfo(true);
            } else if (link.buyerName && !isEditingInfo) {
                setStep(2);
            } else {
                setStep(2);
                setIsEditingInfo(true);
            }
        } else if (step === 2) {
            if (!buyerInfo.fullName || !buyerInfo.email || !buyerInfo.phone) {
                toast({
                    title: "Missing Info",
                    description: "Please fill in all your details to continue.",
                    variant: "destructive"
                });
                return;
            }
            // Initialize mpesaNumber from buyerInfo.phone if empty
            if (!mpesaNumber && buyerInfo.phone) {
                setMpesaNumber(buyerInfo.phone);
            }
            setStep(3);
        }
    };

    const handlePayment = async () => {
        try {
            const isDonation = link.linkType === 'donation';
            const payAmount = isDonation
                ? (parseFloat(donationAmount) || 0)
                : link.price + (link.category === 'product' ? (link.shippingFee || 0) : 0);

            if (payAmount <= 0) {
                toast({ title: "Invalid Amount", description: "Please enter a valid amount.", variant: "destructive" });
                return;
            }

            const body: any = {
                buyerName: buyerInfo.fullName,
                buyerEmail: buyerInfo.email,
                buyerPhone: buyerInfo.phone,
                amount: payAmount,
                currency: link.currency,
                type: isDonation ? 'Donation' : 'Payment',
                paymentMethod,
                network: link.currency === 'USDA' ? 'cardano' : 'polygon'
            };

            // For M-Pesa, attach the phone number
            if (paymentMethod === 'mpesa') {
                body.mpesaPhone = mpesaNumber || buyerInfo.phone;
            }

            const data = await publicFetch(`/transactions/public/${slug}`, {
                method: 'POST',
                body: JSON.stringify(body)
            });

            if (data.cryptoDepositInfo) {
                setCryptoDepositInfo(data.cryptoDepositInfo);
            } else if (data.paymentType === 'mpesa_stk') {
                // M-Pesa STK Push sent — show waiting UI
                if (data.invoiceId) setIntasendInvoiceId(data.invoiceId);
                setIntasendStep('stk_waiting');
                toast({
                    title: "Check Your Phone",
                    description: "An M-Pesa STK push has been sent. Enter your M-Pesa PIN to complete payment.",
                });
            } else if (data.paymentType === 'checkout' && data.checkout_url) {
                // Card/Bank — redirect to IntaSend hosted checkout
                localStorage.setItem(`buyer_info_${slug}`, JSON.stringify(buyerInfo));
                if (data.invoiceId) setIntasendInvoiceId(data.invoiceId);
                window.location.href = data.checkout_url;
            } else if (data.redirect_url) {
                localStorage.setItem(`buyer_info_${slug}`, JSON.stringify(buyerInfo));
                window.location.href = data.redirect_url;
            } else {
                throw new Error("Failed to initialize payment");
            }
        } catch (err: any) {
            toast({
                title: "Payment Initialization Failed",
                description: err.message,
                variant: "destructive"
            });
        }
    };

    const handleConfirmReceived = async () => {
        if (!slug || actionLoading) return;
        setActionLoading(true);
        try {
            const updated = await publicFetch(`/links/public/${slug}/confirm`, { method: 'PUT' });
            setLink((prev: any) => ({ ...prev, status: updated.status || 'Completed' }));
            toast({ title: "Delivery Confirmed!", description: "Funds released to seller. Thank you!" });
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        } finally {
            setActionLoading(false);
        }
    };

    const handleReportProblem = async () => {
        if (!slug || actionLoading) return;
        setActionLoading(true);
        try {
            const updated = await publicFetch(`/links/public/${slug}/dispute`, { method: 'PUT' });
            setLink((prev: any) => ({ ...prev, status: updated.status || 'Disputed' }));
            toast({ title: "Problem Reported", description: "Our team will review your dispute shortly.", variant: "destructive" });
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-20 flex flex-col">
            <main className="flex-grow max-w-4xl mx-auto px-4 pt-8 md:pt-16 w-full">
                {/* Branding Section */}
                <div className="flex flex-col items-center mb-10 text-center animate-in fade-in slide-in-from-top-4 duration-700">
                    {link.businessLogo ? (
                        <img
                            src={link.businessLogo}
                            alt={sellerName}
                            className="h-16 w-auto object-contain mb-4 rounded-xl shadow-sm"
                        />
                    ) : (
                        <div className="flex items-center gap-3">
                            <Logo showText={false} size={40} />
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{sellerName}</h2>
                        </div>
                    )}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-7 space-y-6">
                        {step === 1 && (
                            <div className="bg-white rounded-[32px] md:rounded-[24px] shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="p-6 md:p-8 space-y-6">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-[#025864] border border-slate-200 overflow-hidden font-bold">
                                                    {sellerName[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 leading-none mb-0.5">Sellers Information</p>
                                                    <h3 className="text-sm font-bold text-slate-900">{sellerName}</h3>
                                                </div>
                                            </div>
                                        </div>
                                        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight">{link.name}</h1>
                                        <div className="flex items-center gap-4 pt-1">
                                            <div className="text-3xl font-black text-[#025864]">
                                                {link.linkType === 'donation'
                                                    ? (link.price > 0 ? `${link.currency} ${link.price.toLocaleString()}` : 'Any Amount')
                                                    : `${link.currency} ${link.price.toLocaleString()}`
                                                }
                                            </div>
                                            <span className={`px-2.5 py-1 text-[11px] font-bold rounded-md flex items-center gap-1 ${link.linkType === 'donation' ? 'bg-pink-50 text-pink-600' : 'bg-slate-100 text-slate-600'}`}>
                                                {link.linkType === 'donation' ? 'Donation' : link.linkType === 'reusable' ? 'Reusable Link' : 'One-time Link'}
                                            </span>
                                            {link.status === 'Active' && (
                                                <span className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-emerald-50 text-emerald-600 flex items-center gap-1">
                                                    <CheckCircle2 className="w-3 h-3" /> Active
                                                </span>
                                            )}
                                            {link.expiryLabel && (
                                                <span className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-amber-50 text-amber-600 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> Expires: {link.expiryLabel}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {link.description && (
                                        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Item Details</h4>
                                            <p className="text-slate-700 leading-relaxed text-sm">{link.description}</p>
                                        </div>
                                    )}
                                    {/* Donation-specific: custom amount input */}
                                    {link.linkType === 'donation' && (
                                        <div className="bg-pink-50 rounded-2xl p-5 border border-pink-100 space-y-3">
                                            <h4 className="text-xs font-bold text-pink-400 uppercase tracking-wider">Enter Donation Amount</h4>
                                            <div className="flex items-center gap-3">
                                                <span className="text-lg font-bold text-slate-700">{link.currency}</span>
                                                <input
                                                    type="number"
                                                    min={link.minDonation || 1}
                                                    step="1"
                                                    placeholder={link.price > 0 ? link.price.toString() : "Enter amount"}
                                                    className="w-full px-4 py-3 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-400 text-lg font-bold text-slate-900"
                                                    value={donationAmount}
                                                    onChange={(e) => setDonationAmount(e.target.value)}
                                                />
                                            </div>
                                            {link.minDonation > 0 && (
                                                <p className="text-[11px] text-pink-600">Minimum donation: {link.currency} {link.minDonation.toLocaleString()}</p>
                                            )}
                                        </div>
                                    )}
                                    {link.linkType !== 'donation' && (
                                        <div className="space-y-4 py-2">
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                                                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900">Secure Escrow Protection</p>
                                                    <p className="text-xs text-slate-500">Your funds are held safely by RippliFy until you confirm receipt of the item.</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                                                    <Truck className="w-4 h-4 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900">Estimated Delivery</p>
                                                    <p className="text-xs text-slate-500">The seller typically delivers within {link.deliveryDays || 3} days.</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {link.linkType === 'donation' && (
                                        <div className="space-y-4 py-2">
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center shrink-0">
                                                    <Heart className="w-4 h-4 text-pink-500" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900">Support This Cause</p>
                                                    <p className="text-xs text-slate-500">Your donation goes directly to {sellerName}. Thank you for your generosity!</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <button onClick={handleNextStep} className={`w-full font-bold py-4 rounded-2xl flex md:flex items-center justify-center gap-2 transition-all group text-white ${link.linkType === 'donation' ? 'bg-pink-500 hover:bg-pink-600' : 'bg-[#025864] hover:bg-[#014751]'} ${step === 1 ? 'md:flex hidden' : ''}`}>
                                        {link.linkType === 'donation' ? 'Donate Now' : 'Buy Now with Escrow'}
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="bg-white rounded-[32px] md:rounded-[24px] shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="p-6 md:p-8 space-y-6">
                                    <div className="flex items-center gap-4 mb-2">
                                        <button onClick={() => setStep(1)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                            <ChevronRight className="w-5 h-5 rotate-180" />
                                        </button>
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-900">
                                                {link.buyerName && !isEditingInfo ? "Confirm Your Details" : "Shipping Information"}
                                            </h2>
                                            <p className="text-xs text-slate-500">
                                                {link.buyerName && !isEditingInfo ? "Please verify the information provided by the seller." : "Where should the seller contact you?"}
                                            </p>
                                        </div>
                                    </div>

                                    {!isEditingInfo && link.buyerName ? (
                                        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-slate-200"><User className="w-5 h-5 text-slate-400" /></div>
                                                <div>
                                                    <p className="text-[10px] uppercase font-bold text-slate-400">Full Name</p>
                                                    <p className="text-sm font-bold text-slate-900">{buyerInfo.fullName}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-slate-200"><Mail className="w-5 h-5 text-slate-400" /></div>
                                                <div>
                                                    <p className="text-[10px] uppercase font-bold text-slate-400">Email Address</p>
                                                    <p className="text-sm font-bold text-slate-900">{buyerInfo.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-slate-200"><Phone className="w-5 h-5 text-slate-400" /></div>
                                                <div>
                                                    <p className="text-[10px] uppercase font-bold text-slate-400">Phone Number</p>
                                                    <p className="text-sm font-bold text-slate-900">{buyerInfo.phone}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => setIsEditingInfo(true)} className="w-full py-2 text-xs font-bold text-[#025864] hover:underline">Edit my Information</button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Full Name</label>
                                                <div className="relative">
                                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                    <input
                                                        type="text"
                                                        placeholder="David Mwangi"
                                                        className="w-full pl-11 pr-4 py-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#025864]/20 focus:border-[#025864] text-sm"
                                                        value={buyerInfo.fullName}
                                                        onChange={(e) => setBuyerInfo(p => ({ ...p, fullName: e.target.value }))}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Email Address</label>
                                                <div className="relative">
                                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                    <input
                                                        type="email"
                                                        placeholder="david@example.com"
                                                        className="w-full pl-11 pr-4 py-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#025864]/20 focus:border-[#025864] text-sm"
                                                        value={buyerInfo.email}
                                                        onChange={(e) => setBuyerInfo(p => ({ ...p, email: e.target.value }))}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Phone Number</label>
                                                <div className="relative">
                                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none border-r border-slate-200 pr-3">
                                                        <span className="text-sm font-bold text-slate-400">+254</span>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        placeholder="712 345 678"
                                                        className="w-full pl-24 pr-4 py-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#025864]/20 focus:border-[#025864] text-sm font-bold text-slate-900"
                                                        value={buyerInfo.phone.startsWith('+254') ? buyerInfo.phone.slice(4) : buyerInfo.phone}
                                                        onChange={(e) => {
                                                            let val = e.target.value.replace(/\D/g, '');
                                                            if (val.startsWith('0')) val = val.slice(1);
                                                            if (val.startsWith('254')) val = val.slice(3);
                                                            if (val.length <= 9) {
                                                                setBuyerInfo(prev => ({ ...prev, phone: val ? `+254${val}` : '' }));
                                                                if (!mpesaNumber) setMpesaNumber(val ? `+254${val}` : '');
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <button onClick={handleNextStep} className={`w-full bg-[#025864] hover:bg-[#014751] text-white font-bold py-4 rounded-2xl transition-all ${step === 2 ? 'md:block hidden' : ''}`}>
                                        {link.buyerName && !isEditingInfo ? "Confirm & Continue" : "Continue to Payment"}
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="bg-white rounded-[32px] md:rounded-[24px] shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="p-6 md:p-8 space-y-6">
                                    <div className="flex items-center gap-4 mb-2">
                                        <button onClick={() => setStep(2)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                            <ChevronRight className="w-5 h-5 rotate-180" />
                                        </button>
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-900">Secure Payment</h2>
                                            <p className="text-xs text-slate-500">Select your preferred payment method</p>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        {(link.enabledMethods?.includes('mpesa') || !link.enabledMethods) && (
                                            <button onClick={() => setPaymentMethod("mpesa")} className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${paymentMethod === 'mpesa' ? 'border-[#025864] bg-[#025864]/5' : 'border-slate-100 hover:border-slate-200'}`}>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center font-bold text-emerald-600 font-mono text-xs">M</div>
                                                    <div className="text-left">
                                                        <p className="font-bold text-slate-900">M-Pesa</p>
                                                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">Safaricom M-Pesa STK Push</p>
                                                    </div>
                                                </div>
                                                {paymentMethod === 'mpesa' && <div className="w-5 h-5 rounded-full bg-[#025864] flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>}
                                            </button>
                                        )}

                                        {(link.enabledMethods?.includes('card') || !link.enabledMethods) && (
                                            <button onClick={() => setPaymentMethod("card")} className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${paymentMethod === 'card' ? 'border-[#025864] bg-[#025864]/5' : 'border-slate-100 hover:border-slate-200'}`}>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center"><Lock className="w-5 h-5 text-indigo-600" /></div>
                                                    <div className="text-left">
                                                        <p className="font-bold text-slate-900">Card Payment</p>
                                                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">Visa, Mastercard via IntaSend</p>
                                                    </div>
                                                </div>
                                                {paymentMethod === 'card' && <div className="w-5 h-5 rounded-full bg-[#025864] flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>}
                                            </button>
                                        )}

                                        {(link.enabledMethods?.includes('bank') || !link.enabledMethods) && (
                                            <button onClick={() => setPaymentMethod("bank")} className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${paymentMethod === 'bank' ? 'border-[#025864] bg-[#025864]/5' : 'border-slate-100 hover:border-slate-200'}`}>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center"><ImageIcon className="w-5 h-5 text-blue-600" /></div>
                                                    <div className="text-left">
                                                        <p className="font-bold text-slate-900">Bank Transfer</p>
                                                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">KCB, Equity, Co-op, NCBA & more</p>
                                                    </div>
                                                </div>
                                                {paymentMethod === 'bank' && <div className="w-5 h-5 rounded-full bg-[#025864] flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>}
                                            </button>
                                        )}

                                        {(link.enabledMethods?.includes('crypto') || !link.enabledMethods) && (
                                            <button onClick={() => setPaymentMethod("crypto")} className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${paymentMethod === 'crypto' ? 'border-[#025864] bg-[#025864]/5' : 'border-slate-100 hover:border-slate-200'}`}>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center font-bold text-purple-600">₿</div>
                                                    <div className="text-left">
                                                        <p className="font-bold text-slate-900">Crypto (Stablecoins)</p>
                                                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">USDC / USDA</p>
                                                    </div>
                                                </div>
                                                {paymentMethod === 'crypto' && <div className="w-5 h-5 rounded-full bg-[#025864] flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>}
                                            </button>
                                        )}
                                    </div>

                                    {paymentMethod === 'mpesa' && !intasendStep && (
                                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">M-Pesa Phone Number</label>
                                                <div className="relative">
                                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none border-r border-slate-200 pr-3">
                                                        <span className="text-sm font-bold text-slate-400">+254</span>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        placeholder="712 345 678"
                                                        className="w-full bg-white border border-slate-200 rounded-xl pl-24 pr-4 py-3 text-sm focus:ring-2 focus:ring-[#025864]/20 focus:border-[#025864] outline-none transition-all font-bold text-slate-900"
                                                        value={mpesaNumber.startsWith('+254') ? mpesaNumber.slice(4) : mpesaNumber}
                                                        onChange={(e) => {
                                                            let val = e.target.value.replace(/\D/g, '');
                                                            if (val.startsWith('0')) val = val.slice(1);
                                                            if (val.startsWith('254')) val = val.slice(3);
                                                            if (val.length <= 9) {
                                                                setMpesaNumber(val ? `+254${val}` : '');
                                                            }
                                                        }}
                                                    />
                                                </div>
                                                <p className="text-[10px] text-slate-400 mt-2">You will receive an M-Pesa STK push on your phone to complete payment.</p>
                                            </div>
                                        </div>
                                    )}

                                    {(paymentMethod === 'card' || paymentMethod === 'bank') && !intasendStep && (
                                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="flex items-center gap-2">
                                                <Lock className="w-3.5 h-3.5 text-slate-400" />
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Secure {paymentMethod === 'card' ? 'Card' : 'Bank'} Payment</span>
                                            </div>
                                            <p className="text-sm text-slate-600">You will be redirected to IntaSend's secure checkout page to complete your {paymentMethod === 'card' ? 'card' : 'bank transfer'} payment.</p>
                                            {paymentMethod === 'bank' && (
                                                <div className="text-[10px] text-slate-500 space-y-1">
                                                    <p className="font-bold text-slate-600">Supported Kenyan Banks:</p>
                                                    <p>KCB Bank, Equity Bank, Co-operative Bank, NCBA, Absa Kenya, Standard Chartered, I&M Bank, DTB, Stanbic Bank, Family Bank & more</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100 flex gap-4">
                                        <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-emerald-900 leading-none">Safe Trade Active</p>
                                        </div>
                                    </div>

                                    {!cryptoDepositInfo ? (
                                        <button onClick={handlePayment} className={`w-full font-bold py-4 rounded-2xl transition-all shadow-lg text-white ${link.linkType === 'donation' ? 'bg-pink-500 hover:bg-pink-600 shadow-pink-200' : 'bg-[#025864] hover:bg-[#014751] shadow-[#025864]/20'} ${step === 3 && !cryptoDepositInfo ? 'md:block hidden' : ''}`}>
                                            {link.linkType === 'donation'
                                                ? `Donate ${link.currency} ${(parseFloat(donationAmount) || 0).toLocaleString()}`
                                                : `Pay ${link.currency} ${(link.price + (link.category === 'product' ? (link.shippingFee || 0) : 0)).toLocaleString()} Securely`
                                            }
                                        </button>
                                    ) : (
                                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            <h3 className="font-bold text-slate-900">Send Payment via {cryptoDepositInfo.network.toUpperCase()}</h3>
                                            <p className="text-sm text-slate-600">Please send exactly <strong className="text-slate-900">{link.currency} {(link.price + (link.category === 'product' ? (link.shippingFee || 0) : 0)).toLocaleString()}</strong></p>
                                            <div className="bg-white border shadow-sm p-4 rounded-lg break-all font-mono text-sm text-slate-700">
                                                {cryptoDepositInfo.address}
                                            </div>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(cryptoDepositInfo.address);
                                                    toast({ title: "Address copied to clipboard" });
                                                }}
                                                className="flex items-center justify-center gap-2 w-full py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors text-slate-700"
                                            >
                                                <Copy className="w-4 h-4" /> Copy Deposit Address
                                            </button>
                                            <p className="text-[10px] text-slate-400">Your payment will be automatically detected once confirmed on the blockchain.</p>
                                        </div>
                                    )}

                                    {intasendStep === 'stk_waiting' && (
                                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
                                                <Phone className="w-8 h-8 text-emerald-600 animate-pulse" />
                                            </div>
                                            <h3 className="font-bold text-slate-900">Waiting for M-Pesa Payment</h3>
                                            <p className="text-sm text-slate-600">An STK push has been sent to your phone. Please enter your M-Pesa PIN to complete the transaction.</p>
                                            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                                                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                                Listening for payment confirmation...
                                            </div>
                                            <button
                                                onClick={async () => {
                                                    if (!intasendInvoiceId) return;
                                                    setActionLoading(true);
                                                    try {
                                                        const res = await publicFetch(`/transactions/intasend/status/${intasendInvoiceId}`);
                                                        if (res.state === 'COMPLETE') {
                                                            localStorage.setItem(`buyer_info_${slug}`, JSON.stringify(buyerInfo));
                                                            setStep(4);
                                                            toast({ title: "Payment Confirmed!", description: "Your M-Pesa payment was successful." });
                                                        } else if (res.state === 'FAILED') {
                                                            toast({ title: "Payment Failed", description: "The payment was not completed. Please try again.", variant: "destructive" });
                                                            setIntasendStep(null);
                                                        } else {
                                                            toast({ title: "Still Waiting", description: "Payment not yet confirmed. Please complete the STK push on your phone." });
                                                        }
                                                    } catch (err: any) {
                                                        toast({ title: "Error", description: err.message, variant: "destructive" });
                                                    } finally {
                                                        setActionLoading(false);
                                                    }
                                                }}
                                                disabled={actionLoading}
                                                className="w-full bg-[#025864] text-white font-bold py-4 rounded-2xl hover:bg-[#014751] transition-all disabled:opacity-50"
                                            >
                                                {actionLoading ? "Checking..." : "I've Completed Payment — Verify"}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="bg-white rounded-[32px] md:rounded-[24px] shadow-sm border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                                <div className="p-8 md:p-12 text-center space-y-6">
                                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                        {link.status === 'Completed' ? <CheckCircle2 className="w-10 h-10 text-emerald-600" /> : <Package className="w-10 h-10 text-emerald-600" />}
                                    </div>

                                    <div className="space-y-2">
                                        <h2 className="text-2xl font-black text-slate-900">
                                            {link.linkType === 'donation' && "Thank You!"}
                                            {link.linkType !== 'donation' && link.status === 'Funds locked' && "Payment Secured!"}
                                            {link.linkType !== 'donation' && link.status === 'Shipped' && "Item Shipped!"}
                                            {link.linkType !== 'donation' && link.status === 'Completed' && "Deal Completed!"}
                                        </h2>
                                        <p className="text-slate-600 leading-relaxed max-w-sm mx-auto">
                                            {link.linkType === 'donation' && <>Your donation has been received! Thank you for supporting <strong>{link.businessName || sellerName}</strong>.</>}
                                            {link.linkType !== 'donation' && link.status === 'Funds locked' && <>Your payment is now held in RippliFy Escrow. We've notified <strong>{link.businessName || "the seller"}</strong> to begin shipping.</>}
                                            {link.linkType !== 'donation' && link.status === 'Shipped' && <>Good news! <strong>{link.businessName || "The seller"}</strong> has shipped your item. It's on its way to you.</>}
                                            {link.linkType !== 'donation' && link.status === 'Completed' && <>This transaction is complete. Thank you for using RippliFy Escrow!</>}
                                        </p>
                                    </div>

                                    {/* Tracking Progress */}
                                    <div className="max-w-xs mx-auto py-2">
                                        <div className="relative flex items-center justify-between">
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-slate-100 -z-10"></div>
                                            <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-emerald-500 -z-10 transition-all duration-1000`}
                                                style={{ width: link.status === 'Funds locked' ? '0%' : link.status === 'Shipped' ? '50%' : '100%' }}></div>

                                            <div className="flex flex-col items-center gap-2">
                                                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center bg-white ${['Funds locked', 'Shipped', 'Completed'].includes(link.status) ? 'border-emerald-500 text-emerald-500' : 'border-slate-200 text-slate-300'}`}>
                                                    <Check className="w-4 h-4" />
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-500">Paid</span>
                                            </div>

                                            <div className="flex flex-col items-center gap-2">
                                                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center bg-white ${['Shipped', 'Completed'].includes(link.status) ? 'border-emerald-500 text-emerald-500' : 'border-slate-200 text-slate-300'}`}>
                                                    {['Shipped', 'Completed'].includes(link.status) ? <Check className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-500">Shipped</span>
                                            </div>

                                            <div className="flex flex-col items-center gap-2">
                                                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center bg-white ${link.status === 'Completed' ? 'border-emerald-500 text-emerald-500' : 'border-slate-200 text-slate-300'}`}>
                                                    {link.status === 'Completed' ? <CheckCircle2 className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-500">Received</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 divide-y divide-slate-200/50">
                                        <div className="pb-4 space-y-2">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                {link.status === 'Shipped' ? "Expected Soon" : "Expected Delivery"}
                                            </p>
                                            <p className="text-sm font-bold text-slate-800 flex items-center justify-center gap-2">
                                                <Clock className="w-4 h-4 text-[#025864]" />
                                                By {new Date(new Date(link.updatedAt || Date.now()).getTime() + (link.deliveryDays || 3) * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { month: "long", day: "numeric" })}
                                            </p>
                                        </div>
                                        <div className="pt-4 space-y-3">
                                            <div className="flex gap-2">
                                                {link.status === 'Shipped' && (
                                                    <button
                                                        onClick={handleConfirmReceived}
                                                        disabled={actionLoading}
                                                        className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors disabled:opacity-60"
                                                    >
                                                        {actionLoading ? "Processing..." : "✓ Confirm Received"}
                                                    </button>
                                                )}
                                                {link.status === 'Funds locked' && (
                                                    <button className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold cursor-default">Waiting for Shipment</button>
                                                )}
                                                {link.status === 'Completed' && (
                                                    <button onClick={() => setShowReceipt(true)} className="flex-1 py-3 bg-[#025864] text-white rounded-xl text-xs font-bold hover:bg-[#014751] transition-colors">View Receipt</button>
                                                )}
                                                {link.status === 'Disputed' && (
                                                    <button className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold cursor-default">⚠ Dispute Submitted</button>
                                                )}
                                                {link.status !== 'Completed' && link.status !== 'Disputed' && (
                                                    <button
                                                        onClick={handleReportProblem}
                                                        disabled={actionLoading}
                                                        className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-colors disabled:opacity-60"
                                                    >
                                                        {actionLoading ? "Processing..." : "Report Problem"}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-slate-400">Keep this tab open to track your deal or check your email for updates.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-5 hidden lg:block sticky top-28">
                        <div className="bg-white rounded-[24px] shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-6 space-y-6">
                                <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-4">Safe Deal Summary</h3>
                                <div className="space-y-4">
                                    <div className="flex gap-4">
                                        <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-100"><ImageIcon className="w-6 h-6 text-slate-300" /></div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-slate-900 leading-tight">{link.name}</p>
                                            <p className="text-xs text-slate-500 uppercase tracking-wider">{link.linkType === 'one-time' ? 'One-time Sale' : 'Service Link'}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-3 pt-2">
                                        <div className="flex justify-between text-sm"><span className="text-slate-500">Item Price</span><span className="font-bold">{link.currency} {link.price.toLocaleString()}</span></div>
                                        {link.category === 'product' && link.shippingFee > 0 && (
                                            <div className="flex justify-between text-sm"><span className="text-slate-500">Shipping Fee</span><span className="font-bold">{link.currency} {link.shippingFee.toLocaleString()}</span></div>
                                        )}
                                        <div className="flex justify-between text-sm"><span className="text-slate-500">Escrow Fee</span><span className="text-emerald-600 font-bold">Free</span></div>
                                        <div className="pt-3 border-t border-slate-100 flex justify-between items-center"><span className="font-bold text-slate-900">Total Secure Amount</span><span className="text-xl font-black text-[#025864]">{link.currency} {(link.price + (link.category === 'product' ? (link.shippingFee || 0) : 0)).toLocaleString()}</span></div>
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                                    <div className="flex gap-3"><ShieldCheck className="w-4 h-4 text-[#025864] shrink-0" /><p className="text-[11px] text-slate-600 leading-relaxed font-medium">The seller won't be paid until you confirm receipt. Full refund if item never arrives.</p></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {showReceipt && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-8 space-y-8">
                            <div className="flex flex-col items-center text-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-[#025864] flex items-center justify-center">
                                    <ShieldCheck className="w-10 h-10 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900">RippliFy Receipt</h2>
                                    <p className="text-xs text-slate-500 font-medium">Transaction Secured with Escrow</p>
                                </div>
                            </div>

                            <div className="space-y-4 bg-slate-50 rounded-2xl p-6 border border-slate-100">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-400 font-bold uppercase tracking-wider">Product</span>
                                    <span className="font-bold text-slate-900">{link.name}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-400 font-bold uppercase tracking-wider">Seller</span>
                                    <span className="font-bold text-slate-900">{sellerName}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-400 font-bold uppercase tracking-wider">Buyer</span>
                                    <span className="font-bold text-slate-900">{buyerInfo.fullName}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-400 font-bold uppercase tracking-wider">Status</span>
                                    <span className="font-bold text-emerald-600 px-2 py-0.5 bg-emerald-50 rounded-full">Completed</span>
                                </div>
                                <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                                    <span className="text-sm font-bold text-slate-900">Total Paid</span>
                                    <span className="text-xl font-black text-[#025864]">{link.currency} {link.price.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="text-center space-y-4">
                                <p className="text-[10px] text-slate-400 leading-relaxed px-4">This receipt serves as proof that the trade was successfully completed and funds were released to the seller after your confirmation.</p>
                                <div className="flex gap-3">
                                    <button onClick={() => window.print()} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-xs font-bold hover:bg-black transition-colors">Print Receipt</button>
                                    <button onClick={() => setShowReceipt(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl text-xs font-bold hover:bg-slate-200 transition-colors">Close</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <footer className="mt-auto py-12 px-6 flex flex-col items-center bg-transparent">
                <div className="flex flex-col items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Powered by</span>
                        <Logo size={20} textClassName="text-xs font-black" />
                    </div>
                </div>
                <p className="mt-4 text-[9px] text-[#025864] font-bold uppercase tracking-[0.3em] opacity-40">
                    By sokoStack
                </p>
            </footer>

            {/* Mobile Sticky Action Bar */}
            {step < 4 && !cryptoDepositInfo && (
                <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-100 p-4 pb-8 md:hidden z-40 animate-in slide-in-from-bottom duration-500">
                    <div className="max-w-md mx-auto">
                        {step === 1 && (
                            <button onClick={handleNextStep} className={`w-full font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all text-white ${link.linkType === 'donation' ? 'bg-pink-500' : 'bg-[#025864]'}`}>
                                {link.linkType === 'donation' ? 'Donate Now' : 'Buy Now with Escrow'}
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        )}
                        {step === 2 && (
                            <button onClick={handleNextStep} className="w-full bg-[#025864] text-white font-bold py-4 rounded-2xl">
                                {link.buyerName && !isEditingInfo ? "Confirm & Continue" : "Continue to Payment"}
                            </button>
                        )}
                        {step === 3 && (
                            <button onClick={handlePayment} className={`w-full font-bold py-4 rounded-2xl text-white ${link.linkType === 'donation' ? 'bg-pink-500' : 'bg-[#025864]'}`}>
                                {link.linkType === 'donation'
                                    ? `Donate ${link.currency} ${(parseFloat(donationAmount) || 0).toLocaleString()}`
                                    : `Pay ${link.currency} ${(link.price + (link.category === 'product' ? (link.shippingFee || 0) : 0)).toLocaleString()}`
                                }
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PublicPaymentPage;
