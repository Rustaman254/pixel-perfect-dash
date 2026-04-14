import { ShieldAlert, AlertTriangle, Clock, HelpCircle, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "@/contexts/AppContext";

const AccountStatusBanner = () => {
    const { userProfile } = useAppContext();
    const navigate = useNavigate();

    if (!userProfile || userProfile.role === 'admin') return null;

    const status = userProfile.accountStatus || 'active';
    const isDisabled = userProfile.isDisabled || status === 'disabled';
    const isSuspended = userProfile.isSuspended || status === 'suspended';
    const isUnverified = !userProfile.isVerified || status === 'unverified';

    // Fully active and verified - no banner
    if (!isDisabled && !isSuspended && (userProfile.isVerified && status === 'active')) return null;

    // DISABLED - RED (dark red strip)
    if (isDisabled) {
        return (
            <div className="bg-gradient-to-r from-red-700 to-red-600 text-white px-5 py-3.5 shadow-sm">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                            <ShieldAlert className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-extrabold tracking-tight">Account Disabled</p>
                            <p className="text-xs text-red-100">All actions are blocked. Contact support to appeal your case.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigate('/help-center')}
                            className="flex items-center gap-1.5 text-xs font-bold text-red-700 bg-white px-3.5 py-2 rounded-lg hover:bg-red-50 transition-colors"
                        >
                            <HelpCircle className="w-3.5 h-3.5" /> Help Center
                        </button>
                        <a
                            href="mailto:support@ripplify.com"
                            className="flex items-center gap-1.5 text-xs font-bold text-white bg-white/20 border border-white/30 px-3.5 py-2 rounded-lg hover:bg-white/30 transition-colors"
                        >
                            <Mail className="w-3.5 h-3.5" /> Email Support
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    // SUSPENDED - ORANGE (orange strip)
    if (isSuspended) {
        return (
            <div className="bg-gradient-to-r from-orange-600 to-amber-500 text-white px-5 py-3.5 shadow-sm">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-extrabold tracking-tight">Account Suspended</p>
                            <p className="text-xs text-orange-100">
                                {userProfile.suspendReason
                                    ? `Reason: "${userProfile.suspendReason}". `
                                    : "Your account has been temporarily suspended. "}
                                Contact support to resolve.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigate('/help-center')}
                            className="flex items-center gap-1.5 text-xs font-bold text-orange-700 bg-white px-3.5 py-2 rounded-lg hover:bg-orange-50 transition-colors"
                        >
                            <HelpCircle className="w-3.5 h-3.5" /> Help Center
                        </button>
                        <a
                            href="mailto:support@ripplify.com"
                            className="flex items-center gap-1.5 text-xs font-bold text-white bg-white/20 border border-white/30 px-3.5 py-2 rounded-lg hover:bg-white/30 transition-colors"
                        >
                            <Mail className="w-3.5 h-3.5" /> Email Support
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    // UNVERIFIED - AMBER/YELLOW (amber strip)
    if (isUnverified || !userProfile.isVerified) {
        const limit = userProfile.transactionLimit || 1000;
        return (
            <div className="bg-gradient-to-r from-amber-500 to-yellow-400 text-white px-5 py-3.5 shadow-sm">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                            <Clock className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-extrabold tracking-tight">Account Not Verified</p>
                            <p className="text-xs text-amber-100">
                                Transaction limit: <strong>KES {limit.toLocaleString()}</strong>. Complete KYC verification to unlock full access.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/settings')}
                        className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-white px-3.5 py-2 rounded-lg hover:bg-amber-50 transition-colors"
                    >
                        Verify Now
                    </button>
                </div>
            </div>
        );
    }

    return null;
};

export default AccountStatusBanner;
