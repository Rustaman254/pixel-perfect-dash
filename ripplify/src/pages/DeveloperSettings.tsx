import React, { useState, useEffect } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Plus, Trash2, Globe, Shield, Key } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const DeveloperSettings = () => {
    const [clients, setClients] = useState<any[]>([]);
    const [name, setName] = useState("");
    const [redirectUri, setRedirectUri] = useState("");
    const [loading, setLoading] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${API_URL}/oauth/clients`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                setClients(data);
            }
        } catch (error) {
            console.error("Error fetching clients:", error);
        }
    };

    const handleCreateClient = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${API_URL}/oauth/clients`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ name, redirectUri })
            });
            const data = await response.json();
            if (response.ok) {
                toast.success("OAuth Client created successfully");
                setClients([...clients, data]);
                setName("");
                setRedirectUri("");
            } else {
                toast.error(data.message || "Failed to create client");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClient = async (id: number) => {
        if (!confirm("Are you sure you want to delete this OAuth client?")) return;
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${API_URL}/oauth/clients/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                toast.success("Client deleted");
                setClients(clients.filter(c => c.id !== id));
            }
        } catch (error) {
            toast.error("Failed to delete client");
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <TopBar />
                <main className="p-6 space-y-8 max-w-5xl mx-auto w-full">
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-indigo-600" />
                            OAuth 2.0 Clients
                        </h2>
                        <p className="text-slate-500 mb-6">
                            Create and manage OAuth clients for your partner integrations.
                        </p>

                        <form onSubmit={handleCreateClient} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 p-4 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Application Name</label>
                                <Input 
                                    placeholder="e.g. My External App" 
                                    value={name} 
                                    onChange={(e) => setName(e.target.value)} 
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Redirect URI</label>
                                <Input 
                                    placeholder="https://yourapp.com/callback" 
                                    value={redirectUri} 
                                    onChange={(e) => setRedirectUri(e.target.value)} 
                                    required
                                />
                            </div>
                            <div className="md:col-span-2 flex justify-end">
                                <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
                                    <Plus className="w-4 h-4 mr-2" />
                                    {loading ? "Creating..." : "Create Client"}
                                </Button>
                            </div>
                        </form>

                        <div className="space-y-4">
                            {clients.length === 0 ? (
                                <div className="text-center py-10 border-2 border-dashed rounded-lg bg-slate-50 text-slate-400">
                                    No OAuth clients found.
                                </div>
                            ) : (
                                clients.map((client) => (
                                    <Card key={client.id} className="overflow-hidden border-slate-200">
                                        <CardHeader className="bg-slate-50 py-3 px-4 border-b">
                                            <div className="flex justify-between items-center">
                                                <CardTitle className="text-lg flex items-center gap-2">
                                                    <Globe className="w-4 h-4 text-slate-500" />
                                                    {client.name}
                                                </CardTitle>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleDeleteClient(client.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-4 space-y-3">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                                                        <Key className="w-3 h-3" /> Client ID
                                                    </p>
                                                    <code className="text-xs bg-slate-100 p-1.5 rounded block truncate" title={client.clientId}>
                                                        {client.clientId}
                                                    </code>
                                                </div>
                                                {client.clientSecret && (
                                                    <div>
                                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                                                            <Key className="w-3 h-3" /> Client Secret
                                                        </p>
                                                        <code className="text-xs bg-slate-100 p-1.5 rounded block truncate" title={client.clientSecret}>
                                                            {client.clientSecret}
                                                        </code>
                                                        <p className="text-[10px] text-amber-600 mt-1 italic">Save this secret, it won't be shown again.</p>
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                                                        <Globe className="w-3 h-3" /> Redirect URI
                                                    </p>
                                                    <p className="text-xs text-slate-700 truncate">{client.redirectUri}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DeveloperSettings;
