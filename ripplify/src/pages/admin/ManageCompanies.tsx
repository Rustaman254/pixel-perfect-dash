import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Search, Filter, MoreHorizontal, Building2, Ban, Trash2, ShieldCheck, Loader2, UserCheck, Eye, Mail, Phone, MapPin, Pencil } from "lucide-react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ManageCompanies = () => {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();
  const [addCompanyOpen, setAddCompanyOpen] = useState(false);
  const [editCompanyOpen, setEditCompanyOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const data = await fetchWithAuth('/admin/companies');
      setCompanies(data);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const handleVerify = async (id: number, isVerified: boolean) => {
    try {
      await fetchWithAuth(`/admin/users/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isVerified })
      });
      loadCompanies();
      toast({
        title: "Company status updated",
        description: `Company has been ${isVerified ? 'verified' : 'unverified'}.`,
      });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDisable = async (id: number, isDisabled: boolean) => {
    try {
      await fetchWithAuth(`/admin/users/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isDisabled })
      });
      loadCompanies();
      toast({
        title: "Company status updated",
        description: `Company has been ${isDisabled ? 'disabled' : 'enabled'}.`,
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

  const getStatusBadge = (company: any) => {
    if (company.isDisabled) {
      return <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-red-50 text-red-600">Disabled</span>;
    }
    if (company.isVerified) {
      return <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-600">Verified</span>;
    }
    return <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-orange-50 text-orange-600">Unverified</span>;
  };

  const filtered = companies.filter(c => {
    const matchesSearch = (c.businessName || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.fullName || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.email || "").toLowerCase().includes(search.toLowerCase());

    if (statusFilter === "all") return matchesSearch;
    if (statusFilter === "disabled") return matchesSearch && c.isDisabled;
    if (statusFilter === "unverified") return matchesSearch && !c.isVerified && !c.isDisabled;
    if (statusFilter === "verified") return matchesSearch && c.isVerified && !c.isDisabled;
    return matchesSearch;
  });

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Company Management</h1>
          <p className="text-slate-500">Monitor and manage registered businesses on the platform.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setAddCompanyOpen(true)}
            className="bg-[#025864] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#013a42] transition-colors flex items-center gap-2"
          >
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
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 font-medium outline-none"
          >
            <option value="all">All Status</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Company</th>
                <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Owner / Contact</th>
                <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Verification</th>
                <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Revenue</th>
                <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Transactions</th>
                <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Status</th>
                <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Joined</th>
                <th className="text-right px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#025864] mx-auto mb-2" />
                    <p className="text-sm text-slate-500 font-medium">Loading registered companies...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center">
                    <p className="text-sm text-slate-500 font-medium">No companies found matching your search.</p>
                  </td>
                </tr>
              ) : filtered.map((company) => (
                <tr key={company.id} className={cn("hover:bg-slate-50/50 transition-colors", company.isDisabled && "opacity-60")}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center border",
                        company.isDisabled ? "bg-red-50 text-red-400 border-red-100" : "bg-slate-50 text-[#025864] border-slate-100"
                      )}>
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{company.businessName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">ID: {company.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-slate-600">{company.fullName || "Unnamed Owner"}</p>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <Mail className="w-3 h-3" /> {company.email}
                    </div>
                    {company.phone && (
                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Phone className="w-3 h-3" /> {company.phone}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase w-8">KYC:</span>
                        <span className={cn(
                          "text-[9px] px-1.5 py-0.5 rounded font-bold",
                          company.kycStatus === 'verified' ? "bg-emerald-50 text-emerald-600" :
                            company.kycStatus === 'pending' ? "bg-yellow-50 text-yellow-600" : "bg-slate-100 text-slate-400"
                        )}>
                          {company.kycStatus || 'none'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase w-8">KYB:</span>
                        <span className={cn(
                          "text-[9px] px-1.5 py-0.5 rounded font-bold",
                          company.kybStatus === 'verified' ? "bg-emerald-50 text-emerald-600" :
                            company.kybStatus === 'pending' ? "bg-yellow-50 text-yellow-600" : "bg-slate-100 text-slate-400"
                        )}>
                          {company.kybStatus || 'none'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-900">KES {(company.totalVolume || 0).toLocaleString()}</p>
                    <p className="text-[10px] text-emerald-600 font-medium">{company.volumePercentage}% of total</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-slate-600">{company.txCount || 0}</p>
                    <p className="text-[10px] text-slate-400">Fees: KES {(company.totalFees || 0).toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(company)}
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
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuLabel>Company Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => {
                          setSelectedCompany(company);
                          setEditCompanyOpen(true);
                        }}>
                          <Pencil className="w-4 h-4 mr-2" /> Edit Company
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleVerify(company.id, !company.isVerified)} className={company.isVerified ? "text-orange-600" : "text-emerald-600"}>
                          <ShieldCheck className="w-4 h-4 mr-2" /> {company.isVerified ? "Revoke Verification" : "Verify Company"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDisable(company.id, !company.isDisabled)} className={company.isDisabled ? "text-emerald-600" : "text-red-600"}>
                          {company.isDisabled ? <UserCheck className="w-4 h-4 mr-2" /> : <Ban className="w-4 h-4 mr-2" />}
                          {company.isDisabled ? "Enable Company" : "Disable Company"}
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

      <AddCompanyModal
        isOpen={addCompanyOpen}
        onClose={() => setAddCompanyOpen(false)}
        onSuccess={loadCompanies}
      />

      <EditCompanyModal
        isOpen={editCompanyOpen}
        company={selectedCompany}
        onClose={() => setEditCompanyOpen(false)}
        onSuccess={loadCompanies}
      />
    </AdminLayout>
  );
};

const AddCompanyModal = ({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess: () => void }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    businessName: '',
    role: 'seller'
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!formData.email || !formData.password || !formData.businessName) {
      toast({ title: "Validation Error", description: "Email, Password, and Business Name are required.", variant: "destructive" });
      return;
    }
    try {
      setSaving(true);
      await fetchWithAuth('/admin/users', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      toast({ title: "Success", description: "Company created successfully" });
      onSuccess();
      onClose();
      setFormData({ email: '', password: '', fullName: '', businessName: '', role: 'seller' });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>Add New Company</DialogTitle>
          <DialogDescription>Register a new business account on the platform.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Business Name</Label>
            <Input value={formData.businessName} onChange={e => setFormData({ ...formData, businessName: e.target.value })} placeholder="Acme Corporation" />
          </div>
          <div className="space-y-2">
            <Label>Owner Full Name</Label>
            <Input value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} placeholder="Jane Smith" />
          </div>
          <div className="space-y-2">
            <Label>Business Email</Label>
            <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="contact@acme.com" />
          </div>
          <div className="space-y-2">
            <Label>Initial Password</Label>
            <Input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="••••••••" />
          </div>
        </div>
        <DialogFooter>
          <button onClick={onClose} className="px-4 py-2 text-slate-500 font-medium">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="bg-[#025864] text-white px-6 py-2 rounded-xl font-bold hover:bg-[#013a42] disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create Company"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const EditCompanyModal = ({ isOpen, company, onClose, onSuccess }: { isOpen: boolean, company: any, onClose: () => void, onSuccess: () => void }) => {
  const [formData, setFormData] = useState({
    fullName: '', phone: '', businessName: '', location: '', payoutMethod: 'mpesa',
    kycStatus: 'none', kybStatus: 'none', transactionLimit: 1000
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (company && isOpen) {
      setFormData({
        fullName: company.fullName || '',
        phone: company.phone || '',
        businessName: company.businessName || '',
        location: company.location || '',
        payoutMethod: company.payoutMethod || 'mpesa',
        kycStatus: company.kycStatus || 'none',
        kybStatus: company.kybStatus || 'none',
        transactionLimit: company.transactionLimit || 1000
      });
    }
  }, [company, isOpen]);

  const handleSubmit = async () => {
    if (!company) return;
    try {
      setSaving(true);
      await fetchWithAuth(`/admin/users/${company.id}`, {
        method: 'PATCH',
        body: JSON.stringify(formData)
      });
      toast({ title: "Success", description: "Company updated successfully" });
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-white">
        <DialogHeader>
          <DialogTitle>Edit Company</DialogTitle>
          <DialogDescription>Update company information.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Business Name</Label>
              <Input value={formData.businessName} onChange={e => setFormData({ ...formData, businessName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Owner Name</Label>
              <Input value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Payout Method</Label>
              <Select value={formData.payoutMethod} onValueChange={v => setFormData({ ...formData, payoutMethod: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mpesa">M-Pesa</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                  <SelectItem value="crypto">Crypto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Transaction Limit (KES)</Label>
              <Input type="number" value={formData.transactionLimit} onChange={e => setFormData({ ...formData, transactionLimit: Number(e.target.value) })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>KYC Status</Label>
              <Select value={formData.kycStatus} onValueChange={v => setFormData({ ...formData, kycStatus: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>KYB Status</Label>
              <Select value={formData.kybStatus} onValueChange={v => setFormData({ ...formData, kybStatus: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <button onClick={onClose} className="px-4 py-2 text-slate-500 font-medium">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="bg-[#025864] text-white px-6 py-2 rounded-xl font-bold hover:bg-[#013a42] disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManageCompanies;
