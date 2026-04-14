import { ReactNode } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { FEATURE_LABELS } from "@/hooks/useFeature";
import { Lock, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface FeatureGuardProps {
    featureKey: string;
    children: ReactNode;
}

/**
 * Wraps a page/section. If the feature is disabled, shows a message instead of the content.
 */
const FeatureGuard = ({ featureKey, children }: FeatureGuardProps) => {
    const { isFeatureEnabled, userProfile } = useAppContext();
    const navigate = useNavigate();

    // Admins always see content
    if (userProfile?.role === 'admin') return <>{children}</>;

    const enabled = isFeatureEnabled(featureKey);
    if (enabled) return <>{children}</>;

    const label = FEATURE_LABELS[featureKey] || featureKey;

    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="max-w-md text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-5">
                    <Lock className="w-8 h-8 text-slate-400" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">{label} is Disabled</h2>
                <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                    The <strong>{label}</strong> feature has been disabled for your account by the administrator.
                    You cannot access this feature at this time.
                </p>
                <div className="flex items-center justify-center gap-3">
                    <button
                        onClick={() => navigate('/help-center')}
                        className="flex items-center gap-1.5 text-sm font-bold text-white bg-[#025864] hover:bg-[#014a52] px-4 py-2.5 rounded-xl transition-colors"
                    >
                        <HelpCircle className="w-4 h-4" /> Contact Support
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-1.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl transition-colors"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FeatureGuard;
