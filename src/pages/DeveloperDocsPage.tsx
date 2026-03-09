import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { TerminalSquare, Key, Link2, Copy, Check, ChevronRight, Layout, Code2, Globe, ShieldCheck, ShoppingBag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchWithAuth } from "@/lib/api";
import { cn } from "@/lib/utils";
import CheckoutWidget from "@/components/CheckoutWidget";

const sections = [
    { id: "intro", label: "Introduction", icon: TerminalSquare },
    { id: "auth", label: "Authentication", icon: Key },
    { id: "links", label: "Payment Links", icon: Link2 },
    { id: "widget", label: "Checkout Widget", icon: Layout },
];

const platforms = [
    { id: "html", label: "HTML/JS", icon: Code2 },
    { id: "react", label: "React/Next.js", icon: Layout },
    { id: "wordpress", label: "WordPress", icon: Globe, comingSoon: true },
    { id: "shopify", label: "Shopify", icon: ShoppingBag, comingSoon: true },
    { id: "flutter", label: "Flutter", icon: TerminalSquare, comingSoon: true },
];

const DeveloperDocsPage = () => {
    const [activeSection, setActiveSection] = useState("intro");
    const [activePlatform, setActivePlatform] = useState("html");
    const { toast } = useToast();
    const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});
    const [apiKeys, setApiKeys] = useState<{ id: number, name: string, key: string, status: string }[]>([]);
    
    const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

    useEffect(() => {
        const loadApiKeys = async () => {
            try {
                const keys = await fetchWithAuth('/auth/api-keys');
                setApiKeys(keys);
            } catch (error) {
                console.error("Failed to fetch API keys:", error);
            }
        };
        loadApiKeys();
    }, []);

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedStates({ ...copiedStates, [id]: true });
        toast({
            title: "Copied to clipboard",
            description: "The code snippet has been copied to your clipboard.",
        });
        setTimeout(() => setCopiedStates({ ...copiedStates, [id]: false }), 2000);
    };

    const CodeBlock = ({ id, code, language = "json" }: { id: string, code: string, language?: string }) => (
        <div className="relative group rounded-xl overflow-hidden bg-slate-900 border border-slate-800 my-4">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-800/50 border-b border-slate-800">
                <span className="text-xs font-mono text-slate-400">{language}</span>
                <button
                    onClick={() => handleCopy(code, id)}
                    className="p-1.5 hover:bg-slate-700 rounded-md transition-colors text-slate-400 hover:text-white"
                >
                    {copiedStates[id] ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
            </div>
            <div className="p-4 overflow-x-auto">
                <pre className="text-sm font-mono text-slate-300">
                    <code>{code}</code>
                </pre>
            </div>
        </div>
    );

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto mb-10">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Developer Documentation</h1>
                    <p className="text-slate-500 mt-2">Integrate RippliFy's secure escrow and payment links into your application.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
                    {/* Sidebar Nav */}
                    <div className="md:col-span-1 border border-slate-200 bg-white rounded-2xl p-4 sticky top-6">
                        <nav className="space-y-1">
                            {sections.map(section => (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveSection(section.id)}
                                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${activeSection === section.id
                                        ? "bg-[#025864]/10 text-[#025864] font-semibold"
                                        : "hover:bg-slate-50 text-slate-600 font-medium"
                                        }`}
                                >
                                    <div className="flex items-center gap-3 text-sm">
                                        <section.icon className={`w-4 h-4 ${activeSection === section.id ? "text-[#025864]" : "text-slate-400"}`} />
                                        {section.label}
                                    </div>
                                    {activeSection === section.id && <ChevronRight className="w-4 h-4 text-[#025864]" />}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Content Section */}
                    <div className="md:col-span-3">
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-10 shadow-sm">
                            {activeSection === 'intro' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="space-y-2">
                                        <h2 className="text-2xl font-bold text-slate-900">Welcome to the RippliFy API</h2>
                                        <p className="text-slate-600 leading-relaxed">
                                            The RippliFy API is organized around REST. Our API has predictable resource-oriented URLs, returns JSON-encoded responses, and uses standard HTTP response codes, authentication, and verbs.
                                        </p>
                                    </div>

                                    <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl flex gap-4">
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                                            <span className="text-blue-600 font-bold">i</span>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-blue-900">Base URL</h4>
                                            <p className="text-sm text-blue-800 mt-1 font-mono bg-blue-100/50 p-2 rounded-lg inline-block">{API_BASE_URL}</p>
                                            <p className="text-xs text-blue-700 mt-2">All API requests must be made over HTTPS in production. Calls made over plain HTTP will fail outside of localhost.</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                                        <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                                            <Globe className="w-6 h-6 text-[#025864] mb-3" />
                                            <h4 className="font-bold text-slate-900">Global Reach</h4>
                                            <p className="text-xs text-slate-500 mt-1">Accept payments in KES, USD, and more with instant currency conversion.</p>
                                        </div>
                                        <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                                            <ShieldCheck className="w-6 h-6 text-emerald-600 mb-3" />
                                            <h4 className="font-bold text-slate-900">Escrow Protection</h4>
                                            <p className="text-xs text-slate-500 mt-1">Funds are held securely until delivery is confirmed by the buyer.</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeSection === 'auth' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="space-y-2">
                                        <h2 className="text-2xl font-bold text-slate-900">Authentication</h2>
                                        <p className="text-slate-600 leading-relaxed">
                                            RippliFy uses API keys to authenticate requests. You can view and manage your API keys in the Developer Settings of your dashboard.
                                        </p>
                                    </div>
                                    
                                    <div className="mt-6 border-t border-slate-100 pt-6">
                                        <h3 className="text-lg font-bold text-slate-900 mb-3">Bearer Token</h3>
                                        <p className="text-sm text-slate-600 mb-4">
                                            Your API requests must include your API key in the `Authorization` header as a Bearer token. Let's see how that looks in practice:
                                        </p>
                                        
                                        {apiKeys.length > 0 && (
                                            <div className="mb-6">
                                                <h4 className="text-sm font-semibold text-slate-800 mb-3">Your API Keys</h4>
                                                <div className="space-y-3">
                                                    {apiKeys.map(key => (
                                                        <div key={key.id} className="flex items-center justify-between border border-slate-200 rounded-lg p-3 bg-slate-50">
                                                            <div className="flex items-center gap-3">
                                                                <div>
                                                                    <p className="text-sm font-medium text-slate-900">{key.name}</p>
                                                                    <p className="text-xs font-mono text-slate-500 mt-1">{key.key.substring(0, 8)}...{key.key.substring(key.key.length - 4)}</p>
                                                                </div>
                                                                <span className={cn(
                                                                    "text-[10px] px-2 py-0.5 rounded-full font-bold",
                                                                    key.status === 'Active' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                                                                )}>
                                                                    {key.status}
                                                                </span>
                                                            </div>
                                                            <button 
                                                                onClick={() => handleCopy(key.key, `api-key-${key.id}`)}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#025864] bg-[#025864]/5 border border-[#025864]/20 hover:bg-[#025864]/10 rounded-md transition-colors"
                                                            >
                                                                {copiedStates[`api-key-${key.id}`] ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                                                {copiedStates[`api-key-${key.id}`] ? "Copied" : "Copy Key"}
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <CodeBlock
                                            id="auth-curl"
                                            language="bash"
                                            code={`curl -X GET ${API_BASE_URL}/links/my \\
  -H "Authorization: Bearer YOUR_API_KEY_HERE"`}
                                        />
                                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mt-4">
                                            <p className="text-sm text-amber-900 font-medium">Keep your keys safe!</p>
                                            <p className="text-xs text-amber-800 mt-1">Do not share your secret API keys in publicly accessible areas such as GitHub, client-side code, and so forth.</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeSection === 'links' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="space-y-2">
                                        <h2 className="text-2xl font-bold text-slate-900">Payment Links</h2>
                                        <p className="text-slate-600 leading-relaxed">
                                            Payment Links are at the core of RippliFy's escrow service. These endpoints allow you to securely generate checkout URLs for your buyers.
                                        </p>
                                    </div>

                                    <div className="border-t border-slate-100 pt-8">
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full uppercase tracking-wider">POST</span>
                                            <h3 className="text-lg font-bold text-slate-900 font-mono">/links</h3>
                                        </div>
                                        <p className="text-sm text-slate-600 mb-6">Create a new safe payment link associated with your account.</p>

                                        <h4 className="text-sm font-semibold text-slate-900 mb-3">Request Body</h4>
                                        <CodeBlock
                                            id="create-link-req"
                                            language="json"
                                            code={`{
  "name": "Vintage Leather Jacket",
  "description": "Mint condition, size M.",
  "price": 450,
  "currency": "KES",
  "linkType": "one-time",
  "deliveryDays": 3,
  "hasPhotos": true
}`}
                                        />

                                        <h4 className="text-sm font-semibold text-slate-900 mt-6 mb-3">Response</h4>
                                        <CodeBlock
                                            id="create-link-res"
                                            language="json"
                                            code={`{
  "id": 14,
  "userId": 3,
  "name": "Vintage Leather Jacket",
  "slug": "vintage-leather-jacket-abc12",
  "description": "Mint condition, size M.",
  "price": 450,
  "currency": "KES",
  "linkType": "one-time",
  "status": "Active",
  "deliveryDays": 3,
  "createdAt": "2026-03-08T12:00:00.000Z",
  "url": "http://localhost:5173/pay/vintage-leather-jacket-abc12"
}`}
                                        />
                                    </div>

                                    <div className="border-t border-slate-100 pt-8">
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-full uppercase tracking-wider">GET</span>
                                            <h3 className="text-lg font-bold text-slate-900 font-mono">/links/my</h3>
                                        </div>
                                        <p className="text-sm text-slate-600 mb-6">Retrieve all payment links created by your account.</p>
                                    </div>

                                    <div className="border-t border-slate-100 pt-8">
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="px-3 py-1 bg-red-100 text-red-800 text-[10px] font-bold rounded-full uppercase tracking-wider">DELETE</span>
                                            <h3 className="text-lg font-bold text-slate-900 font-mono">/links/:id</h3>
                                        </div>
                                        <p className="text-sm text-slate-600 mb-6">Deactivate and delete a specific payment link.</p>
                                    </div>
                                </div>
                            )}

                            {activeSection === 'widget' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="space-y-2">
                                        <h2 className="text-2xl font-bold text-slate-900">Checkout Widget</h2>
                                        <p className="text-slate-600 leading-relaxed">
                                            Integrate RippliFy's checkout flow directly into your existing website using our premium checkout widget. It's designed to build trust and increase conversions.
                                        </p>
                                    </div>

                                    <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100">
                                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Live Preview</h3>
                                        <div className="max-w-md mx-auto">
                                            <CheckoutWidget 
                                                amount={450} 
                                                currency="KES" 
                                                productName="Sample Product" 
                                                onCheckout={() => toast({ title: "Widget Clicked", description: "This would open the checkout flow." })}
                                            />
                                            <div className="grid grid-cols-2 gap-3 mt-4">
                                                <CheckoutWidget 
                                                    amount={45} 
                                                    currency="USD" 
                                                    productName="Sample Product" 
                                                    variant="outline"
                                                    onCheckout={() => {}}
                                                />
                                                <CheckoutWidget 
                                                    amount={120} 
                                                    currency="GBP" 
                                                    productName="Sample Product" 
                                                    variant="compact"
                                                    onCheckout={() => {}}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                                                <Link2 className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900">What is a Slug?</h4>
                                                <p className="text-sm text-slate-600 mt-1">
                                                    A slug is a unique, URL-friendly identifier for your payment link. It usually looks like <code className="text-blue-600 font-bold bg-blue-100/50 px-1.5 py-0.5 rounded">premium-item-123</code>. You can find the slug in your Dashboard under the "Link" column or at the end of your public payment URL.
                                                </p>
                                                <div className="flex gap-4 mt-3">
                                                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Examples:</div>
                                                    <code className="text-[11px] bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-500">iphone-13-pro</code>
                                                    <code className="text-[11px] bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-500">consultation-fee</code>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <h3 className="text-xl font-bold text-slate-900">How to Integrate</h3>
                                            <div className="flex bg-slate-100 p-1 rounded-lg gap-1">
                                                {platforms.map(platform => (
                                                    <button
                                                        key={platform.id}
                                                        onClick={() => setActivePlatform(platform.id)}
                                                        className={cn(
                                                            "px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-2",
                                                            activePlatform === platform.id
                                                                ? "bg-white text-[#025864] shadow-sm"
                                                                : "text-slate-500 hover:text-slate-700"
                                                        )}
                                                    >
                                                        <platform.icon className="w-3.5 h-3.5" />
                                                        {platform.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            {activePlatform === 'html' && (
                                                <div className="space-y-6 animate-in fade-in duration-300">
                                                    <div className="flex gap-4">
                                                        <div className="w-8 h-8 rounded-full bg-[#025864] text-white flex items-center justify-center shrink-0 font-bold text-sm">1</div>
                                                        <div>
                                                            <h4 className="font-bold text-slate-900">Include the SDK</h4>
                                                            <p className="text-sm text-slate-500 mt-1">Add our lightweight script to your page header.</p>
                                                            <CodeBlock
                                                                id="widget-sdk"
                                                                language="html"
                                                                code={`<script src="http://localhost:8080/ripplify-widget.js"></script>`}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-4">
                                                        <div className="w-8 h-8 rounded-full bg-[#025864] text-white flex items-center justify-center shrink-0 font-bold text-sm">2</div>
                                                        <div>
                                                            <h4 className="font-bold text-slate-900">Initialize the Button</h4>
                                                            <p className="text-sm text-slate-500 mt-1">Place a container where you want the button to appear and initialize it with your slug.</p>
                                                            <CodeBlock
                                                                id="widget-init"
                                                                language="html"
                                                                code={`<div id="ripplify-button-container"></div>
 
 <script>
  function initRipplify() {
    Ripplify.Buttons({
      slug: "your-payment-link-slug",
      label: "Pay with RippliFy"
    }).render("#ripplify-button-container");
  }
</script>
<script src="http://localhost:8080/ripplify-widget.js" onload="initRipplify()"></script>`}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-4">
                                                        <div className="w-8 h-8 rounded-full bg-[#025864] text-white flex items-center justify-center shrink-0 font-bold text-sm">3</div>
                                                        <div>
                                                            <h4 className="font-bold text-slate-900">Full HTML Boilerplate</h4>
                                                            <p className="text-sm text-slate-500 mt-1">Copy this complete example to test your integration quickly.</p>
                                                            <CodeBlock
                                                                id="html-boilerplate"
                                                                language="html"
                                                                code={`<!DOCTYPE html>
<html>
<head>
  <title>RippliFy Checkout Test</title>
  <!-- 1. Include the SDK -->
  <script src="http://localhost:8080/ripplify-widget.js" onload="initRipplify()"></script>
  <script>
    function initRipplify() {
      // 3. Render the button using your link slug
      Ripplify.Buttons({
        slug: "ventoline-evohalor-200ml-nc7ik",
        label: "Secure Checkout"
      }).render("#my-checkout-button");
    }
  </script>
</body>
</html>`}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {activePlatform === 'react' && (
                                                <div className="space-y-6 animate-in fade-in duration-300">
                                                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                                                        <h4 className="font-bold text-slate-900 mb-4">React Hook / Component Pattern</h4>
                                                        <p className="text-sm text-slate-600 mb-4">You can create a reusable RippliFy button component in your React or Next.js app.</p>
                                                        
                                                        <CodeBlock
                                                            id="react-widget"
                                                            language="tsx"
                                                            code={`import { useEffect } from 'react';

const RipplifyButton = ({ slug }) => {
  useEffect(() => {
    // Load SDK if not already present
    if (!window.Ripplify) {
      const script = document.createElement('script');
      script.src = "http://localhost:8080/ripplify-widget.js";
      script.async = true;
      script.onload = () => initButton();
      document.head.appendChild(script);
    } else {
      initButton();
    }

    function initButton() {
      if (window.Ripplify) {
        window.Ripplify.Buttons({
          slug: slug,
          label: "Pay with RippliFy"
        }).render("#ripplify-btn");
      }
    }
  }, [slug]);

  return <div id="ripplify-btn"></div>;
};

export default RipplifyButton;`}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {platforms.find(p => p.id === activePlatform)?.comingSoon && (
                                                <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-300 animate-in zoom-in-95 duration-300">
                                                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
                                                        {React.createElement(platforms.find(p => p.id === activePlatform)!.icon, { className: "w-8 h-8 text-slate-400" })}
                                                    </div>
                                                    <h4 className="text-xl font-bold text-slate-900 capitalize">{activePlatform} Integration</h4>
                                                    <p className="text-slate-500 mt-2">We are hard at work building this integration. Stay tuned!</p>
                                                    <div className="mt-6 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold uppercase tracking-wider">
                                                        Coming Soon
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default DeveloperDocsPage;
