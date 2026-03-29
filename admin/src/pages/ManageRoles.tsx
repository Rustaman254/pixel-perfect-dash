import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Shield, Plus, Lock, ArrowRight, Trash2, Search, Loader2, Info, CheckCircle2 } from "lucide-react";
import { fetchWithAuth } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

const ManageRoles = () => {
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Create/Edit Role State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [roleName, setRoleName] = useState("");
  const [roleDesc, setRoleDesc] = useState("");
  const [parentRoleId, setParentRoleId] = useState<string>("none");
  const [selectedPerms, setSelectedPerms] = useState<number[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rolesData, permsData] = await Promise.all([
        fetchWithAuth('/admin/roles'),
        fetchWithAuth('/admin/permissions')
      ]);
      setRoles(rolesData);
      setPermissions(permsData);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateDialog = () => {
    setEditingRole(null);
    setRoleName("");
    setRoleDesc("");
    setParentRoleId("none");
    setSelectedPerms([]);
    setIsDialogOpen(true);
  };

  const openEditDialog = async (role: any) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleDesc(role.description || "");
    setParentRoleId(role.parent_role_id?.toString() || "none");
    
    // Fetch linked permissions for this role
    try {
      const linkedPerms = await fetchWithAuth(`/admin/roles/${role.id}/permissions`);
      setSelectedPerms(linkedPerms);
    } catch (e: any) {
      toast({ title: "Error", description: "Failed to load role permissions", variant: "destructive" });
    }
    
    setIsDialogOpen(true);
  };

  const handleSaveRole = async () => {
    if (!roleName) return;
    try {
      setSaving(true);
      let roleId = editingRole?.id;
      
      if (!editingRole) {
        const res = await fetchWithAuth('/admin/roles', {
          method: 'POST',
          body: JSON.stringify({
            name: roleName,
            description: roleDesc,
            parentRoleId: parentRoleId === "none" ? null : parseInt(parentRoleId)
          })
        });
        roleId = res.id;
      } else {
        // PATCH/UPDATE role metadata if needed
      }

      // Sync Permissions
      await fetchWithAuth(`/admin/roles/${roleId}/permissions`, {
        method: 'POST',
        body: JSON.stringify({ permissionIds: selectedPerms })
      });

      toast({ title: "Success", description: "Role configuration updated." });
      setIsDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async (id: number) => {
    if (!confirm("Are you sure you want to deprecate this role?")) return;
    try {
      await fetchWithAuth(`/admin/roles/${id}`, { method: 'DELETE' });
      toast({ title: "Role deprecated", description: "This role is no longer available for new assignments." });
      loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const groupedPermissions = permissions.reduce((acc: any, p: any) => {
    const cat = p.category || 'general';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">RBAC & Permissions</h1>
          <p className="text-slate-500">Define administrative roles and granular permission sets.</p>
        </div>
        <button 
          onClick={openCreateDialog}
          className="bg-[#025864] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#013a42] transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create Role
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Roles List */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#025864]" /> Defined Roles
              </h2>
              <span className="text-[10px] font-bold text-[#025864] bg-[#025864]/10 px-2 py-0.5 rounded-full uppercase">
                {roles.length} Active
              </span>
            </div>
            
            <div className="divide-y divide-slate-50">
              {loading ? (
                <div className="py-12 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-300" />
                </div>
              ) : roles.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">No roles defined.</div>
              ) : roles.map((role) => (
                <div key={role.id} className="p-4 flex items-center justify-between group hover:bg-slate-50/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{role.name}</span>
                      {role.is_system ? (
                        <span className="text-[8px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-full font-black uppercase tracking-widest border border-blue-100">
                          System
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{role.description || "No description provided."}</p>
                    {role.parent_role_id && (
                      <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-400 italic">
                        <ArrowRight className="w-3 h-3" /> Inherits from: 
                        <span className="font-bold text-slate-600">ID {role.parent_role_id}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="font-bold text-[#025864]" onClick={() => openEditDialog(role)}>Configure</Button>
                    {!role.is_system && (
                      <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-500 hover:bg-red-50" onClick={() => handleDeleteRole(role.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Permission Catalog Stats */}
        <div className="space-y-6">
          <div className="bg-[#025864] rounded-3xl p-6 text-white shadow-lg shadow-[#025864]/20 overflow-hidden relative">
            <Shield className="absolute -right-4 -bottom-4 w-32 h-32 text-white/5 rotate-12" />
            <h3 className="text-lg font-bold mb-1">Permission Catalog</h3>
            <p className="text-[#89ced6] text-xs">A comprehensive list of system resources and actions.</p>
            <div className="mt-6 flex items-baseline gap-2">
              <span className="text-4xl font-black">{permissions.length}</span>
              <span className="text-[#89ced6] text-xs font-bold uppercase tracking-widest">Total Atomic Rules</span>
            </div>
            <div className="mt-6 space-y-3">
              {Object.keys(groupedPermissions).map(cat => (
                <div key={cat} className="flex items-center justify-between text-[11px]">
                  <span className="capitalize text-[#89ced6]">{cat}</span>
                  <span className="font-bold">{groupedPermissions[cat].length}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2 mb-3">
              <Info className="w-3.5 h-3.5 text-blue-500" /> Administrative Notice
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Changes to role-permission links take effect immediately on next authorization check. System roles are immutable.
            </p>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col bg-white">
          <DialogHeader>
            <DialogTitle>{editingRole ? "Configure Role" : "Create New Role"}</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2 space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role Name</Label>
                <Input 
                  value={roleName} 
                  onChange={e => setRoleName(e.target.value)} 
                  placeholder="e.g. Compliance Auditor"
                  disabled={editingRole?.is_system}
                />
              </div>
              <div className="space-y-2">
                <Label>Parent Role (Inheritance)</Label>
                <Select value={parentRoleId} onValueChange={setParentRoleId}>
                  <SelectTrigger>
                    <SelectValue placeholder="No Parent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Parent (Standalone)</SelectItem>
                    {roles.filter(r => r.id !== editingRole?.id).map(r => (
                      <SelectItem key={r.id} value={r.id.toString()}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input 
                value={roleDesc} 
                onChange={e => setRoleDesc(e.target.value)} 
                placeholder="Briefly describe what this role can do..."
              />
            </div>

            <div className="space-y-4">
              <Label className="text-sm font-bold text-slate-900">Permission Linking</Label>
              <div className="space-y-6">
                {Object.keys(groupedPermissions).map(cat => (
                  <div key={cat} className="space-y-2">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-[#025864] bg-[#025864]/5 px-2 py-1 rounded">
                      {cat} Domain
                    </h5>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                      {groupedPermissions[cat].map((p: any) => (
                        <div key={p.id} className="flex items-center gap-3">
                          <Checkbox 
                            id={`perm-${p.id}`} 
                            checked={selectedPerms.includes(p.id)}
                            onCheckedChange={(checked) => {
                              if (checked) setSelectedPerms([...selectedPerms, p.id]);
                              else setSelectedPerms(selectedPerms.filter(id => id !== p.id));
                            }}
                          />
                          <label 
                            htmlFor={`perm-${p.id}`} 
                            className="text-xs font-medium text-slate-700 cursor-pointer select-none truncate"
                            title={`${p.resource}:${p.action}`}
                          >
                            {p.description || `${p.resource}:${p.action}`}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button className="bg-[#025864] hover:bg-[#013a42] font-bold" onClick={handleSaveRole} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default ManageRoles;
