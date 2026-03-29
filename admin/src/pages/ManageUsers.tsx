import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Search, Filter, MoreHorizontal, UserCheck, UserMinus, Trash2, Mail, Phone, Shield, Loader2, Building2, Ban, Eye, Pencil, MapPin, CreditCard, Key, Activity, AlertTriangle, Flag } from "lucide-react";
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
import { cn } from "@/lib/utils";
import UserRoleManager from "@/components/UserRoleManager";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ManageUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [roleManagerOpen, setRoleManagerOpen] = useState(false);
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [viewUserOpen, setViewUserOpen] = useState(false);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [userFeatures, setUserFeatures] = useState<any[]>([]);
  const [loadingFeatures, setLoadingFeatures] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await fetchWithAuth('/admin/users');
      setUsers(data);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleVerify = async (id: number, isVerified: boolean) => {
    try {
      await fetchWithAuth(`/admin/users/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isVerified })
      });
      loadUsers();
      toast({
        title: "User status updated",
        description: `Account has been ${isVerified ? 'verified' : 'unverified'}.`,
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
      loadUsers();
      toast({
        title: "User status updated",
        description: `Account has been ${isDisabled ? 'disabled' : 'enabled'}.`,
      });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleSuspend = async (id: number, isSuspended: boolean) => {
    try {
      const reason = isSuspended ? prompt("Enter suspension reason (optional):") || "" : "";
      await fetchWithAuth(`/admin/users/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isSuspended, suspendReason: reason })
      });
      loadUsers();
      toast({
        title: "User status updated",
        description: `Account has been ${isSuspended ? 'suspended' : 'unsuspended'}.`,
      });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const loadUserFeatures = async (userId: number) => {
    setLoadingFeatures(true);
    try {
      const data = await fetchWithAuth(`/admin/users/${userId}/features`);
      setUserFeatures(data);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoadingFeatures(false);
    }
  };

  const toggleUserFeature = async (featureKey: string, currentlyEnabled: boolean) => {
    if (!selectedUser) return;
    try {
      await fetchWithAuth(`/admin/users/${selectedUser.id}/features`, {
        method: 'PUT',
        body: JSON.stringify({
          featureKey,
          isEnabled: !currentlyEnabled,
          reason: currentlyEnabled ? 'Disabled by admin' : ''
        })
      });
      loadUserFeatures(selectedUser.id);
      toast({
        title: "Feature updated",
        description: `${featureKey} has been ${currentlyEnabled ? 'disabled' : 'enabled'} for this user.`,
      });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this user? This cannot be undone.")) return;
    try {
      await fetchWithAuth(`/admin/users/${id}`, { method: 'DELETE' });
      loadUsers();
      toast({
        title: "User deleted",
        description: `User has been removed from the platform.`,
      });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const viewUserDetails = async (userId: number) => {
    try {
      setLoadingDetails(true);
      setViewUserOpen(true);
      const data = await fetchWithAuth(`/admin/users/${userId}`);
      setUserDetails(data);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setViewUserOpen(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.businessName || '').toLowerCase().includes(search.toLowerCase());

    if (statusFilter === "all") return matchesSearch;
    if (statusFilter === "disabled") return matchesSearch && (u.isDisabled || u.accountStatus === 'disabled');
    if (statusFilter === "suspended") return matchesSearch && (u.isSuspended || u.accountStatus === 'suspended');
    if (statusFilter === "unverified") return matchesSearch && !u.isVerified && !u.isDisabled && !u.isSuspended;
    if (statusFilter === "verified") return matchesSearch && u.isVerified && !u.isDisabled && !u.isSuspended;
    return matchesSearch;
  });

  const getStatusBadge = (user: any) => {
    if (user.isDisabled || user.accountStatus === 'disabled') {
      return <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-red-50 text-red-600">Disabled</span>;
    }
    if (user.isSuspended || user.accountStatus === 'suspended') {
      return <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-orange-50 text-orange-600">Suspended</span>;
    }
    if (user.isVerified) {
      return <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-600">Verified</span>;
    }
    return <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-600">Unverified</span>;
  };

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-500">Manage all registered users and their account statuses.</p>
        </div>
        <button
          onClick={() => setCreateUserOpen(true)}
          className="bg-[#025864] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#013a42] transition-colors flex items-center gap-2"
        >
          <Shield className="w-4 h-4" /> Add User
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, or business..."
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
            <option value="suspended">Suspended</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">User</th>
                <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Contact</th>
                <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">KYC/KYB</th>
                <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Status</th>
                <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Joined</th>
                <th className="text-right px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#025864] mx-auto mb-2" />
                    <p className="text-sm text-slate-500 font-medium">Loading platform users...</p>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <p className="text-sm text-slate-500 font-medium">No users found matching your search.</p>
                  </td>
                </tr>
              ) : filteredUsers.map((user) => (
                <tr key={user.id} className={cn("hover:bg-slate-50/50 transition-colors", user.isDisabled && "opacity-60")}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center font-bold uppercase",
                        user.isDisabled ? "bg-red-50 text-red-400" : "bg-[#025864]/10 text-[#025864]"
                      )}>
                        {(user.fullName || user.email).charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{user.fullName || "Unnamed User"}</p>
                        <p className="text-[10px] text-slate-400 font-mono">ID: {user.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Mail className="w-3 h-3" /> {user.email}
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <Phone className="w-3 h-3" /> {user.phone}
                        </div>
                      )}
                      {user.businessName && (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#025864]">
                          <Building2 className="w-3 h-3" /> {user.businessName}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase w-8">KYC:</span>
                        <span className={cn(
                          "text-[9px] px-1.5 py-0.5 rounded font-bold",
                          user.kycStatus === 'verified' ? "bg-emerald-50 text-emerald-600" :
                            user.kycStatus === 'pending' ? "bg-yellow-50 text-yellow-600" : "bg-slate-100 text-slate-400"
                        )}>
                          {user.kycStatus || 'none'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase w-8">KYB:</span>
                        <span className={cn(
                          "text-[9px] px-1.5 py-0.5 rounded font-bold",
                          user.kybStatus === 'verified' ? "bg-emerald-50 text-emerald-600" :
                            user.kybStatus === 'pending' ? "bg-yellow-50 text-yellow-600" : "bg-slate-100 text-slate-400"
                        )}>
                          {user.kybStatus || 'none'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(user)}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {user.rbacRoles ? user.rbacRoles.split(',').map((r: string, idx: number) => (
                        <span key={idx} className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">
                          {r}
                        </span>
                      )) : (
                        <span className="text-[9px] text-slate-400 uppercase font-bold tracking-tighter italic">No Roles</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                          <MoreHorizontal className="w-5 h-5 text-slate-400" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuLabel>User Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => viewUserDetails(user.id)}>
                          <Eye className="w-4 h-4 mr-2" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setSelectedUser(user);
                          setEditUserOpen(true);
                        }}>
                          <Pencil className="w-4 h-4 mr-2" /> Edit User
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setSelectedUser(user);
                          setRoleManagerOpen(true);
                        }}>
                          <Shield className="w-4 h-4 mr-2" /> Manage Roles
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setSelectedUser(user);
                          loadUserFeatures(user.id);
                          setFeaturesOpen(true);
                        }}>
                          <Flag className="w-4 h-4 mr-2" /> Manage Features
                        </DropdownMenuItem>
                        {!user.isSuperAdmin && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleVerify(user.id, !user.isVerified)} className={user.isVerified ? "text-orange-600" : "text-emerald-600"}>
                              <UserCheck className="w-4 h-4 mr-2" /> {user.isVerified ? "Unverify Account" : "Verify Account"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDisable(user.id, !user.isDisabled)} className={user.isDisabled ? "text-emerald-600" : "text-red-600"}>
                              {user.isDisabled ? <UserCheck className="w-4 h-4 mr-2" /> : <Ban className="w-4 h-4 mr-2" />}
                              {user.isDisabled ? "Enable Account" : "Disable Account"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSuspend(user.id, !user.isSuspended)} className={user.isSuspended ? "text-emerald-600" : "text-orange-600"}>
                              {user.isSuspended ? <UserCheck className="w-4 h-4 mr-2" /> : <AlertTriangle className="w-4 h-4 mr-2" />}
                              {user.isSuspended ? "Unsuspend Account" : "Suspend Account"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDelete(user.id)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                              <Trash2 className="w-4 h-4 mr-2" /> Delete Permanently
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedUser && (
        <UserRoleManager
          userId={selectedUser.id}
          userName={selectedUser.fullName || selectedUser.email}
          isOpen={roleManagerOpen}
          onClose={() => setRoleManagerOpen(false)}
          onUpdate={loadUsers}
        />
      )}

      {/* View Details Modal */}
      <Dialog open={viewUserOpen} onOpenChange={setViewUserOpen}>
        <DialogContent className="max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {loadingDetails ? (
            <div className="py-12 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#025864]" />
              <p className="text-sm text-slate-500 mt-2">Loading user details...</p>
            </div>
          ) : userDetails ? (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#025864]/10 flex items-center justify-center text-[#025864] font-bold text-2xl uppercase">
                  {(userDetails.fullName || userDetails.email).charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{userDetails.fullName || "Unnamed"}</h3>
                  <p className="text-sm text-slate-500">{userDetails.email}</p>
                  <div className="flex gap-2 mt-1">
                    {getStatusBadge(userDetails)}
                    <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full font-bold text-slate-600">{userDetails.role}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1"><Phone className="w-3 h-3" /> Phone</div>
                  <p className="text-sm font-bold text-slate-900">{userDetails.phone || "N/A"}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1"><Building2 className="w-3 h-3" /> Business</div>
                  <p className="text-sm font-bold text-slate-900">{userDetails.businessName || "N/A"}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1"><MapPin className="w-3 h-3" /> Location</div>
                  <p className="text-sm font-bold text-slate-900">{userDetails.location || "N/A"}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1"><CreditCard className="w-3 h-3" /> Payout</div>
                  <p className="text-sm font-bold text-slate-900">{userDetails.payoutMethod || "N/A"}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-[#025864]/5 rounded-xl text-center">
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Transactions</p>
                  <p className="text-lg font-bold text-[#025864]">{userDetails.stats?.transactionCount || 0}</p>
                </div>
                <div className="p-3 bg-[#025864]/5 rounded-xl text-center">
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Volume</p>
                  <p className="text-lg font-bold text-[#025864]">KES {(userDetails.stats?.totalVolume || 0).toLocaleString()}</p>
                </div>
                <div className="p-3 bg-[#025864]/5 rounded-xl text-center">
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Links</p>
                  <p className="text-lg font-bold text-[#025864]">{userDetails.stats?.linkCount || 0}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">Transaction Limit</div>
                  <p className="text-sm font-bold text-slate-900">KES {(userDetails.transactionLimit || 1000).toLocaleString()}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">Pending Payouts</div>
                  <p className="text-sm font-bold text-slate-900">{userDetails.stats?.pendingPayouts || 0}</p>
                </div>
              </div>

              {userDetails.stats?.apiKeys?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">API Keys</p>
                  <div className="space-y-1">
                    {userDetails.stats.apiKeys.map((key: any) => (
                      <div key={key.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Key className="w-3 h-3 text-slate-400" />
                          <span className="text-xs font-medium text-slate-700">{key.name}</span>
                        </div>
                        <span className={cn(
                          "text-[9px] px-1.5 py-0.5 rounded font-bold",
                          key.status === 'Active' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                        )}>
                          {key.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
          <DialogFooter>
            <button onClick={() => setViewUserOpen(false)} className="px-4 py-2 text-slate-500 font-medium">Close</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={editUserOpen}
        user={selectedUser}
        onClose={() => setEditUserOpen(false)}
        onSuccess={loadUsers}
      />

      <AddUserModal
        isOpen={createUserOpen}
        onClose={() => setCreateUserOpen(false)}
        onSuccess={loadUsers}
      />

      {/* Manage Features Dialog */}
      <Dialog open={featuresOpen} onOpenChange={setFeaturesOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Manage Features</DialogTitle>
            <DialogDescription>
              Enable or disable specific features for {selectedUser?.fullName || selectedUser?.email || 'this user'}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[400px] overflow-y-auto py-2">
            {loadingFeatures ? (
              <div className="py-8 text-center text-sm text-slate-400">Loading features...</div>
            ) : userFeatures.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">No features found.</div>
            ) : (
              userFeatures.map((f: any) => (
                <div key={f.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{f.name}</p>
                    <p className="text-[10px] text-slate-400">{f.description}</p>
                    {f.userOverride && (
                      <p className="text-[10px] text-orange-500 font-medium mt-0.5">
                        {f.effectiveIsEnabled ? '' : 'Disabled for this user'}
                        {f.overrideReason ? ` — ${f.overrideReason}` : ''}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => toggleUserFeature(f.key, f.effectiveIsEnabled)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      f.effectiveIsEnabled ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      f.effectiveIsEnabled ? 'left-5.5 translate-x-0' : 'left-0.5'
                    }`} />
                  </button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

    </AdminLayout>
  );
};

// Edit User Modal
const EditUserModal = ({ isOpen, user, onClose, onSuccess }: { isOpen: boolean, user: any, onClose: () => void, onSuccess: () => void }) => {
  const [formData, setFormData] = useState({
    fullName: '', phone: '', businessName: '', location: '', payoutMethod: 'mpesa',
    kycStatus: 'none', kybStatus: 'none', transactionLimit: 1000
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        fullName: user.fullName || '',
        phone: user.phone || '',
        businessName: user.businessName || '',
        location: user.location || '',
        payoutMethod: user.payoutMethod || 'mpesa',
        kycStatus: user.kycStatus || 'none',
        kybStatus: user.kybStatus || 'none',
        transactionLimit: user.transactionLimit || 1000
      });
    }
  }, [user, isOpen]);

  const handleSubmit = async () => {
    if (!user) return;
    try {
      setSaving(true);
      await fetchWithAuth(`/admin/users/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify(formData)
      });
      toast({ title: "Success", description: "User updated successfully" });
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
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>Update user profile information.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Business Name</Label>
            <Input value={formData.businessName} onChange={e => setFormData({ ...formData, businessName: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Location</Label>
            <Input value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
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

// Add User Modal
const AddUserModal = ({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess: () => void }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    businessName: '',
    role: 'seller',
    roleId: ''
  });
  const [roles, setRoles] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchWithAuth('/admin/roles').then(setRoles).catch(console.error);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!formData.email || !formData.password) return;
    try {
      setSaving(true);
      await fetchWithAuth('/admin/users', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      toast({ title: "Success", description: "User created successfully" });
      onSuccess();
      onClose();
      setFormData({ email: '', password: '', fullName: '', businessName: '', role: 'seller', roleId: '' });
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
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>Create a new platform user and assign an initial role.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} placeholder="John Doe" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="john@example.com" />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="••••••••" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Legacy Role</Label>
              <Select value={formData.role} onValueChange={v => setFormData({ ...formData, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="seller">Seller</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>RBAC Role</Label>
              <Select value={formData.roleId} onValueChange={v => setFormData({ ...formData, roleId: v })}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  {roles.map(r => <SelectItem key={r.id} value={r.id.toString()}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Business Name (Optional)</Label>
            <Input value={formData.businessName} onChange={e => setFormData({ ...formData, businessName: e.target.value })} placeholder="Acme Corp" />
          </div>
        </div>
        <DialogFooter>
          <button onClick={onClose} className="px-4 py-2 text-slate-500 font-medium">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="bg-[#025864] text-white px-6 py-2 rounded-xl font-bold hover:bg-[#013a42] disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create User"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManageUsers;
