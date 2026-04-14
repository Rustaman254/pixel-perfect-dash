import { useAppContext } from "@/contexts/AppContext";
import { useDisabledFeatures, FEATURE_LABELS } from "@/hooks/useFeature";
import { AlertTriangle, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * Shows on the dashboard when any features are disabled for this user.
 */
const DisabledFeaturesBanner = () => {
    const disabled = useDisabledFeatures();
    const { userProfile } = useAppContext();
    const navigate = useNavigate();

    if (!userProfile || userProfile.role === 'admin') return null;
    if (disabled.length === 0) return null;

    return (
        <div className="bg-gradient-to-r from-slate-700 to-slate-600 text-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center shrink-0 mt-0.5">
                    <Lock className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                    <p className="text-sm font-extrabold tracking-tight">Features Restricted</p>
                    <p className="text-xs text-slate-300 mt-0.5 mb-2">
                        The following features have been disabled for your account:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {disabled.map(key => (
                            <span key={key} className="text-[10px] font-bold px-2 py-1 bg-white/15 rounded-full text-white">
                                {FEATURE_LABELS[key] || key}
                            </span>
                        ))}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2">
                        Contact support if you believe this is an error.
                    </p>
                </div>
                <button
                    onClick={() => navigate('/help-center')}
                    className="text-xs font-bold text-white bg-white/15 hover:bg-white/25 px-3 py-2 rounded-lg transition-colors shrink-0"
                >
                    Get Help
                </button>
            </div>
        </div>
    );
};

export default DisabledFeaturesBanner;
