import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { TerminalSquare, Key, Link2, Copy, Check, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchWithAuth } from "@/lib/api";

const sections = [
    { id: "intro", label: "Introduction", icon: TerminalSquare },
    { id: "auth", label: "Authentication", icon: Key },
    { id: "links", label: "Payment Links", icon: Link2 },
];

const DeveloperDocsPage = () => {
    const [activeSection, setActiveSection] = useState("intro");
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
                    <div className="md:col-span-1 border border-slate-200 bg-white rounded-2xl p-4 sticky top-24">
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
                                                            <div>
                                                                <p className="text-sm font-medium text-slate-900">{key.name}</p>
                                                                <p className="text-xs font-mono text-slate-500 mt-1">{key.key.substring(0, 8)}...{key.key.substring(key.key.length - 4)}</p>
                                                            </div>
                                                            <button 
                                                                onClick={() => handleCopy(key.key, `api-key-${key.id}`)}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-md transition-colors"
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
                                            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full uppercase tracking-wider">POST</span>
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
