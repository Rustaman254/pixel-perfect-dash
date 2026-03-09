import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ShieldCheck, X, Check, ArrowRight } from "lucide-react";

const OAuthConsentPage = () => {
    const [searchParams] = useSearchParams();
    const [clientInfo, setClientInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const API_URL = "http://localhost:3001/api";

    useEffect(() => {
        fetchAuthorizeData();
    }, []);

    const fetchAuthorizeData = async () => {
        try {
            const token = localStorage.getItem("token");
            const clientId = searchParams.get("client_id");
            const redirectUri = searchParams.get("redirect_uri");
            const responseType = searchParams.get("response_type");
            const state = searchParams.get("state");

            const response = await fetch(`${API_URL}/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=${responseType}&state=${state}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                setClientInfo(data);
            } else {
                setError(data.message || "Authorization request failed");
            }
        } catch (error) {
            setError("Failed to fetch authorization details");
        } finally {
            setLoading(false);
        }
    };

    const handleConsent = async (approved: boolean) => {
        if (!approved) {
            toast.error("Authorization denied");
            // In a real app, redirect with error
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${API_URL}/oauth/consent`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    client_id: searchParams.get("client_id"),
                    redirect_uri: searchParams.get("redirect_uri"),
                    state: searchParams.get("state"),
                    consent: true
                })
            });

            const data = await response.json();
            if (response.ok) {
                const { code, state, redirectUri } = data;
                const finalUrl = `${redirectUri}?code=${code}${state ? `&state=${state}` : ""}`;
                window.location.href = finalUrl;
            } else {
                toast.error(data.message || "Consent processing failed");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    if (error) return <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <X className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Authorization Error</h2>
        <p className="text-slate-500 mb-6">{error}</p>
        <Button onClick={() => window.history.back()} variant="outline">Go Back</Button>
    </div>;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="bg-indigo-600 p-6 text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                        <ShieldCheck className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-1">RippliFy Authorization</h1>
                    <p className="text-indigo-100">{clientInfo?.clientName} wants to access your account</p>
                </div>

                <div className="p-8">
                    <p className="text-slate-600 mb-6 text-center">
                        Integrating with <strong>{clientInfo?.clientName}</strong> will allow them to:
                    </p>

                    <div className="space-y-4 mb-8">
                        <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Check className="w-4 h-4 text-indigo-600" />
                            </div>
                            <div>
                                <p className="font-semibold text-slate-800 leading-tight">Read User Profile</p>
                                <p className="text-sm text-slate-500">Access your business name, email, and full name.</p>
                            </div>
                        </div>
                    </div>

                    <p className="text-xs text-slate-400 text-center mb-8">
                        By clicking Authorize, you allow {clientInfo?.clientName} to use your information in accordance with their terms of service and privacy policy.
                    </p>

                    <div className="flex flex-col gap-3">
                        <Button 
                            onClick={() => handleConsent(true)}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-lg rounded-xl shadow-md transition-all hover:scale-[1.02]"
                        >
                            Authorize Application
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                        <Button 
                            onClick={() => handleConsent(false)}
                            variant="ghost"
                            className="w-full h-12 text-slate-500 hover:text-red-600 rounded-xl"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
                
                <div className="bg-slate-50 p-4 border-t text-center">
                    <p className="text-xs text-slate-400">
                        Securely logged in as <span className="font-medium text-slate-600">you@example.com</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default OAuthConsentPage;
