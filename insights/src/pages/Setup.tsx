import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useState } from "react";
import { 
    Copy, Check, Terminal, Globe, Code2, 
    ShieldCheck, Zap, Layers, UserPlus, LineChart,
    Sparkles, Activity, Wand2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/contexts/AppContext";
import { cn } from "@/lib/utils";
import usePageTitle from "@/hooks/usePageTitle";

const SetupPage = () => {
    usePageTitle("Setup");
    const { userProfile } = useAppContext();
    const { toast } = useToast();
    const [copied, setCopied] = useState(false);

    const projectId = userProfile?.id || '...';
    
    // Fall back to localhost if not specified in .env
    const backendRoot = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
    
    const htmlSnippet = `<!-- Ripplify Insights -->
<script>
  window.ripplifyProjectId = "${projectId}";
</script>
<script src="${backendRoot}/insight.js" async></script>
<!-- End Ripplify Insights -->`;

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast({
            title: "Copied to clipboard",
            description: "Analytics will start flowing immediately.",
        });
        setTimeout(() => setCopied(false), 3000);
    };

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto">
                <div className="mb-12 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                        <Sparkles className="w-3 h-3" /> Automatic Tracking Enabled
                    </div>
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">Zero-Config Setup</h1>
                    <p className="text-slate-500 text-lg max-w-2xl mx-auto">Copy the snippet below and paste it into your header. No manual event tracking or complex BI setup required.</p>
                </div>

                <div className="bg-slate-900 rounded-[3rem] overflow-hidden shadow-2xl border border-slate-800 mb-10 group">
                    <div className="px-8 py-6 bg-slate-800/50 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-400/20 group-hover:bg-rose-500 transition-colors"></div>
                                <div className="w-3 h-3 rounded-full bg-amber-400/20 group-hover:bg-amber-500 transition-colors"></div>
                                <div className="w-3 h-3 rounded-full bg-emerald-400/20 group-hover:bg-emerald-500 transition-colors"></div>
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 ml-4 uppercase tracking-widest italic group-hover:text-indigo-400 transition-colors">insight.js v2.0-autonomous</span>
                        </div>
                        <button 
                            onClick={() => copyToClipboard(htmlSnippet)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-2xl text-xs font-bold transition-all shadow-lg active:scale-95"
                        >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            {copied ? 'Copied Snippet' : 'Copy Installation Code'}
                        </button>
                    </div>
                    <div className="p-10 font-mono text-sm text-indigo-300 leading-relaxed overflow-x-auto selection:bg-indigo-500/30">
                        {htmlSnippet}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                    <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                            <Zap className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-slate-900 mb-1 leading-tight">Autonomous Feature Detection</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">We automatically identify buttons, links, and forms as "features" without manual tracking code.</p>
                    </div>
                    <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                            <Activity className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-slate-900 mb-1 leading-tight">Heatmaps & Rage Clicks</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">Capture user frustration and engagement hotspots automatically across your entire site.</p>
                    </div>
                    <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
                        <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                            <Wand2 className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-slate-900 mb-1 leading-tight">AI Insights Engine</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">Receive automated recommendations to simplify, move, or maintain specific site features.</p>
                    </div>
                </div>

                <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white flex flex-col md:flex-row items-center gap-10 shadow-2xl shadow-indigo-200">
                    <div className="w-20 h-20 rounded-3xl bg-white/20 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-10 h-10" />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h3 className="text-2xl font-bold mb-2">Privacy & Compliance by Design</h3>
                        <p className="text-indigo-100 text-sm leading-relaxed max-w-md">
                            Ripplify Insights masks all sensitive user input by default. No passwords or credit card numbers are ever stored on our servers.
                        </p>
                    </div>
                    <button className="px-8 py-4 bg-white text-indigo-600 rounded-2xl text-sm font-black shadow-lg hover:shadow-xl transition-all active:scale-95">
                        LEARN MORE
                    </button>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default SetupPage;
