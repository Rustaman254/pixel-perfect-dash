import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchWithAuth } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Shield, Trash2, Clock, Globe, Plus } from "lucide-react";

interface UserRoleManagerProps {
  userId: number;
  userName: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const UserRoleManager = ({ userId, userName, isOpen, onClose, onUpdate }: UserRoleManagerProps) => {
  const [assignedRoles, setAssignedRoles] = useState<any[]>([]);
  const [availableRoles, setAvailableRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // New assignment state
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [scopeId, setScopeId] = useState("global");
  const [scopeType, setScopeType] = useState("platform");
  const [expiresAt, setExpiresAt] = useState("");

  const { toast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [userRoles, allRoles] = await Promise.all([
        fetchWithAuth(`/admin/users/${userId}/roles`),
        fetchWithAuth(`/admin/roles`)
      ]);
      setAssignedRoles(userRoles);
      setAvailableRoles(allRoles);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, userId]);

  const handleAssign = async () => {
    if (!selectedRoleId) return;
    try {
      setSaving(true);
      await fetchWithAuth(`/admin/users/${userId}/roles`, {
        method: 'POST',
        body: JSON.stringify({
          roleId: parseInt(selectedRoleId),
          scopeId,
          scopeType,
          expiresAt: expiresAt || null
        })
      });
      toast({ title: "Role assigned", description: "The role has been successfully assigned to the user." });
      loadData();
      onUpdate();
      // Reset form
      setSelectedRoleId("");
      setScopeId("global");
      setExpiresAt("");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async (roleId: number, scope: string) => {
    try {
      setSaving(true);
      await fetchWithAuth(`/admin/users/${userId}/roles/${roleId}?scopeId=${scope}`, {
        method: 'DELETE'
      });
      toast({ title: "Role revoked", description: "The role was removed from the user." });
      loadData();
      onUpdate();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#025864]" />
            Manage Roles for {userName}
          </DialogTitle>
          <DialogDescription>
            Assign or revoke roles. Roles can be scoped to specific tenants or have an expiration date.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Active Roles */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3">Active Role Assignments</h3>
            <div className="space-y-2">
              {loading ? (
                <p className="text-xs text-slate-500 italic">Loading assignments...</p>
              ) : assignedRoles.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No special roles assigned. User has default permissions.</p>
              ) : assignedRoles.map((asgn, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{asgn.roleName}</span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-[#025864]/10 text-[#025864] rounded uppercase font-bold">
                        {asgn.scope_type || 'platform'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3" /> {asgn.scope_id}
                      </span>
                      {asgn.expires_at && (
                        <span className="flex items-center gap-1 text-orange-600 font-medium">
                          <Clock className="w-3 h-3" /> Expires: {new Date(asgn.expires_at).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleRevoke(asgn.role_id, asgn.scope_id || 'global')}
                    disabled={saving}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Add New Role */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Assign New Role</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Role</Label>
                <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map(role => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Scope (ID)</Label>
                <Input 
                  value={scopeId} 
                  onChange={e => setScopeId(e.target.value)} 
                  placeholder="e.g. global, tenant-uuid"
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Scope Type</Label>
                <Select value={scopeType} onValueChange={setScopeType}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="platform">Platform</SelectItem>
                    <SelectItem value="tenant">Tenant</SelectItem>
                    <SelectItem value="team">Team</SelectItem>
                    <SelectItem value="resource">Resource</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Expiration (Optional)</Label>
                <Input 
                  type="datetime-local" 
                  value={expiresAt} 
                  onChange={e => setExpiresAt(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>
            <Button 
              className="w-full bg-[#025864] hover:bg-[#013a42] h-10 font-bold"
              onClick={handleAssign}
              disabled={saving || !selectedRoleId}
            >
              <Plus className="w-4 h-4 mr-2" /> Assign Role
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserRoleManager;
