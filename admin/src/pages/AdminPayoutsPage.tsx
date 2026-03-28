import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Search, Filter, MoreHorizontal, CheckCircle2, XCircle, Clock, Loader2, Mail, Building2, CreditCard, Banknote } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchWithAuth } from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const bankNames: { [key: string]: string } = {
    "01": "KCB",
    "11": "Co-operative Bank",
    "63": "Diamond Trust Bank",
    "03": "ABSA",
    "07": "Standard Chartered",
    "68": "Equity Bank",
    "60": "Family Bank",
    "12": "I&M Bank",
    "31": "Stanbic Bank",
    "55": "Guardian Bank"
};

const formatDetails = (method: string, details: string) => {
    if (method !== 'bank') return details;
    const [code, account] = details.split(' - ');
    const name = bankNames[code] || code;
    return `${name} (A/C: ${account})`;
};

const AdminPayoutsPage = () => {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const loadPayouts = async () => {
    try {
      setLoading(true);
      const data = await fetchWithAuth('/admin/payouts');
      setPayouts(data);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayouts();
  }, []);

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      setLoading(true);
      await fetchWithAuth(`/admin/payouts/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      toast({ title: "Success", description: `Payout marked as ${status}` });
      loadPayouts();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const filteredPayouts = payouts.filter(p =>
    (p.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.method || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.details || '').toLowerCase().includes(search.toLowerCase())
  );

  const statusColor: Record<string, string> = {
    Completed: "bg-emerald-50 text-emerald-600",
    Processing: "bg-yellow-50 text-yellow-600",
    Failed: "bg-red-50 text-red-600",
  };

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Platform Payouts</h1>
          <p className="text-slate-500">Monitor and manage all seller withdrawal requests.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by user, email, or details..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#025864]/10 focus:border-[#025864] transition-all"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-100 transition-colors">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Seller</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Fee</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Method</th>
                <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Status</th>
                <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Date</th>
                <th className="text-right px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#025864] mx-auto mb-2" />
                    <p className="text-sm text-slate-500 font-medium">Loading payouts...</p>
                  </td>
                </tr>
              ) : filteredPayouts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <p className="text-sm text-slate-500 font-medium">No payouts found matching your search.</p>
                  </td>
                </tr>
              ) : filteredPayouts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#025864]/10 flex items-center justify-center text-[#025864] font-bold uppercase text-xs">
                        {(p.businessName || p.fullName || p.email).charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{p.businessName || p.fullName || "Unnamed User"}</p>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                          <Mail className="w-3 h-3" /> {p.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm font-bold text-slate-900">{p.currency} {Number(p.amount).toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm font-medium text-emerald-600">+{p.currency} {Number(p.fee || 0).toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                        {p.method === 'mpesa' ? <CreditCard className="w-4 h-4 text-emerald-600" /> : <Banknote className="w-4 h-4 text-blue-600" />}
                        <div>
                            <p className="text-xs font-bold text-slate-700 capitalize">{p.method}</p>
                            <p className="text-[10px] text-slate-400 font-mono italic">{formatDetails(p.method, p.details)}</p>
                        </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "text-[10px] px-2.5 py-1 rounded-full font-bold",
                      statusColor[p.status] || 'bg-gray-50 text-gray-500'
                    )}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                          <MoreHorizontal className="w-5 h-5 text-slate-400" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Payout Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleUpdateStatus(p.id, 'Completed')}>
                          <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" /> Mark as Completed
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateStatus(p.id, 'Failed')}>
                          <XCircle className="w-4 h-4 mr-2 text-red-600" /> Mark as Failed
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminPayoutsPage;
