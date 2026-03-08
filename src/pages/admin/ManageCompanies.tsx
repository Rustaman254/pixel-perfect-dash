import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Search, Filter, MoreHorizontal, Building2, Ban, Trash2, ExternalLink, ShieldCheck, Globe, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchWithAuth } from "@/lib/api";
import { useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const ManageCompanies = () => {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const data = await fetchWithAuth('/admin/users');
      // Filter for users that have a business name
      setCompanies(data.filter((u: any) => u.businessName && u.businessName.trim() !== ""));
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const handleStatus = async (id: number, isVerified: boolean) => {
    try {
      await fetchWithAuth(`/admin/users/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isVerified })
      });
      loadCompanies();
      toast({
        title: "Company status updated",
        description: `Verification status has been changed.`,
      });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this company? This will remove all their data.")) return;
    try {
      await fetchWithAuth(`/admin/users/${id}`, { method: 'DELETE' });
      loadCompanies();
      toast({
        title: "Company deleted",
        description: `Company has been removed from the platform.`,
      });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const filtered = companies.filter(c =>
    (c.businessName || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.fullName || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Company Management</h1>
          <p className="text-slate-500">Monitor and manage registered businesses on the platform.</p>
        </div>
        <div className="flex gap-2">
          <button className="bg-white text-slate-600 border border-slate-200 px-6 py-3 rounded-xl font-bold hover:bg-slate-50 transition-colors">
            Export List
          </button>
          <button className="bg-[#025864] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#013a42] transition-colors flex items-center gap-2">
            <Building2 className="w-4 h-4" /> Add Company
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search companies or owners..."
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
                <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Company</th>
                <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Owner / Email</th>
                <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Status</th>
                <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Joined</th>
                <th className="text-right px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#025864] mx-auto mb-2" />
                    <p className="text-sm text-slate-500 font-medium">Loading registered companies...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <p className="text-sm text-slate-500 font-medium">No companies found matching your search.</p>
                  </td>
                </tr>
              ) : filtered.map((company) => (
                <tr key={company.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                        <Building2 className="w-5 h-5 text-[#025864]" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{company.businessName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">ID: {company.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-slate-600">{company.fullName || "Unnamed Owner"}</p>
                    <p className="text-[10px] text-slate-400">{company.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-bold",
                      company.isVerified ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"
                    )}>
                      {company.isVerified ? "Verified" : "Pending"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {new Date(company.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                          <MoreHorizontal className="w-5 h-5 text-slate-400" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Management</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleStatus(company.id, !company.isVerified)} className={company.isVerified ? "text-orange-600" : "text-emerald-600"}>
                          <ShieldCheck className="w-4 h-4 mr-2" /> {company.isVerified ? "Revoke Verification" : "Verify Company"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDelete(company.id)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                          <Trash2 className="w-4 h-4 mr-2" /> Delete Company
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

export default ManageCompanies;
