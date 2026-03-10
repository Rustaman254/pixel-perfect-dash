import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Search, ChevronDown, ChevronUp, MessageSquare, Mail, Phone, FileText, HelpCircle, ExternalLink, Loader2 } from "lucide-react";
import { fetchWithAuth } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const faqs = [
    { q: "How do I create a payment link?", a: "Navigate to Payment Links, click 'Create New Link', fill in the details (name, price, description), and click 'Create'. Your payment link will be ready to share immediately." },
    { q: "What payment methods are supported?", a: "We support M-Pesa, Visa/Mastercard, AMEX, USDC, USDT, BTC, ETH, and bank transfers across 24+ countries." },
    { q: "How long do payouts take?", a: "M-Pesa payouts are instant. Bank transfers take 1-3 business days. Crypto payouts are processed within 1 hour." },
    { q: "Can I accept multiple currencies?", a: "Yes! Go to Currencies to enable the currencies you want. We auto-convert payments to your preferred settlement currency." },
    { q: "What are the transaction fees?", a: "Fees vary by payment method: M-Pesa 1.5%, Cards 2.9% + $0.30, Crypto 1.0%, Bank Transfer 0.5%." },
    { q: "How do I set up two-factor authentication?", a: "Go to Settings > Security and click 'Enable 2FA'. You can use any authenticator app like Google Authenticator." },
    { q: "How can I export my transaction data?", a: "Go to Transactions page and click 'Export CSV' to download all your transaction data." },
    { q: "How do I integrate the API?", a: "Go to Settings > API Keys to get your live or test keys. Check our API docs for integration guides." },
];

const guides = [
    { title: "Getting Started Guide", desc: "Set up your account and make your first payment link", icon: FileText },
    { title: "API Documentation", desc: "Integrate Ripplify into your platform", icon: ExternalLink },
    { title: "Security Best Practices", desc: "Keep your account and funds secure", icon: HelpCircle },
];

const HelpCenterPage = () => {
    const [search, setSearch] = useState("");
    const [openFaq, setOpenFaq] = useState<number | null>(0);
    const [contactForm, setContactForm] = useState({ name: "", email: "", subject: "", message: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleContactSubmit = async () => {
        if (!contactForm.name || !contactForm.email || !contactForm.subject || !contactForm.message) {
            toast({
                title: "Incomplete Form",
                description: "Please fill in all fields before sending.",
                variant: "destructive"
            });
            return;
        }

        setIsSubmitting(true);
        try {
            await fetchWithAuth('/support', {
                method: 'POST',
                body: JSON.stringify(contactForm)
            });
            toast({
                title: "Message Sent",
                description: "Our support team will get back to you shortly.",
            });
            setContactForm({ name: "", email: "", subject: "", message: "" });
        } catch (error: any) {
            toast({
                title: "Failed to send",
                description: error.message || "An error occurred.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredFaqs = faqs.filter((f) =>
        f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                <h1 className="text-xl md:text-2xl font-bold text-foreground">Help Center</h1>
            </div>

            {/* Search */}
            <div className="flex items-center gap-2 bg-card border border-border rounded-2xl px-4 py-3">
                <Search className="w-5 h-5 text-muted-foreground" />
                <input type="text" placeholder="Search for help..." className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {guides.map((g) => (
                    <div key={g.title} className="bg-card rounded-2xl p-5 border border-border hover:shadow-md transition-shadow cursor-pointer">
                        <g.icon className="w-6 h-6 mb-3" style={{ color: '#025864' }} />
                        <h3 className="text-sm font-semibold text-foreground mb-1">{g.title}</h3>
                        <p className="text-[11px] text-muted-foreground">{g.desc}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* FAQ */}
                <div className="md:col-span-3 bg-card rounded-2xl p-5 border border-border">
                    <h3 className="font-semibold text-foreground mb-4">Frequently Asked Questions</h3>
                    <div className="space-y-2">
                        {filteredFaqs.map((faq, i) => (
                            <div key={i} className="border border-border rounded-xl overflow-hidden">
                                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-muted/30 transition-colors">
                                    <span className="text-sm font-medium text-foreground pr-4">{faq.q}</span>
                                    {openFaq === i ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                                </button>
                                {openFaq === i && (
                                    <div className="px-4 pb-3 text-sm text-muted-foreground border-t border-border pt-3">{faq.a}</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Contact */}
                <div className="md:col-span-2 space-y-4">
                    <div className="bg-card rounded-2xl p-5 border border-border">
                        <h3 className="font-semibold text-foreground mb-4">Contact Support</h3>
                        <div className="space-y-3">
                            <input type="text" placeholder="Your Name" className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#025864]/20 focus:border-[#025864]" value={contactForm.name} onChange={(e) => setContactForm(p => ({ ...p, name: e.target.value }))} />
                            <input type="email" placeholder="Email Address" className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#025864]/20 focus:border-[#025864]" value={contactForm.email} onChange={(e) => setContactForm(p => ({ ...p, email: e.target.value }))} />
                            <input type="text" placeholder="Subject" className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#025864]/20 focus:border-[#025864]" value={contactForm.subject} onChange={(e) => setContactForm(p => ({ ...p, subject: e.target.value }))} />
                            <textarea placeholder="How can we help?" rows={4} className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#025864]/20 focus:border-[#025864] resize-none" value={contactForm.message} onChange={(e) => setContactForm(p => ({ ...p, message: e.target.value }))} />
                            <button 
                                onClick={handleContactSubmit}
                                disabled={isSubmitting}
                                className="w-full flex items-center justify-center gap-2 text-sm font-medium text-white px-4 py-2.5 rounded-lg disabled:opacity-70" 
                                style={{ backgroundColor: '#025864' }}
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                                {isSubmitting ? "Sending..." : "Send Message"}
                            </button>
                        </div>
                    </div>

                    <div className="bg-card rounded-2xl p-5 border border-border">
                        <h3 className="font-semibold text-foreground mb-3">Other Ways to Reach Us</h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <Mail className="w-4 h-4" style={{ color: '#025864' }} />
                                <span className="text-sm text-foreground">support@ripplify.com</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Phone className="w-4 h-4" style={{ color: '#025864' }} />
                                <span className="text-sm text-foreground">+1 (555) 123-4567</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <MessageSquare className="w-4 h-4" style={{ color: '#025864' }} />
                                <span className="text-sm text-foreground">Live chat (9am - 6pm EAT)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default HelpCenterPage;
