import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Globe, Server, Link2, Shield, Activity, Search, Plus, Trash2, 
  CheckCircle, XCircle, AlertTriangle, Clock, ExternalLink, RefreshCw,
  ChevronDown, Filter, Download, Zap, Eye, Settings, RefreshCw as SyncIcon,
  AlertCircle, Wifi, WifiOff, Lock, LockOpen, DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchWithAuth, fetchWithDnsAuth } from '@/lib/api';

interface Subdomain {
  id: number;
  subdomain: string;
  domain: string;
  project_id: number;
  user_id: number;
  target: string;
  ip_address: string;
  ssl_enabled: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

interface CustomDomain {
  id: number;
  domain: string;
  project_id: number;
  user_id: number;
  target: string;
  ssl_enabled: boolean;
  verification_status: string;
  status: string;
  expiration_date: string;
  created_at: string;
}

interface DNSStats {
  total: number;
  active: number;
  pending: number;
  ssl_enabled: number;
}

export default function DNSPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'subdomains' | 'domains' | 'analytics'>('subdomains');
  const [subdomains, setSubdomains] = useState<Subdomain[]>([]);
  const [customDomains, setCustomDomains] = useState<CustomDomain[]>([]);
  const [stats, setStats] = useState<DNSStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSubdomain, setNewSubdomain] = useState({ subdomain: '', target: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [subsRes, domainsRes] = await Promise.all([
        fetchWithDnsAuth('/subdomains'),
        fetchWithDnsAuth('/domains'),
      ]);
      setSubdomains(subsRes);
      setCustomDomains(domainsRes);
    } catch (err) {
      console.error('Failed to load DNS data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubdomain = async () => {
    if (!newSubdomain.subdomain || !newSubdomain.target) return;
    
    setCreating(true);
    try {
      await fetchWithAuth('/shopalize/domains/subdomains', {
        method: 'POST',
        body: JSON.stringify({
          storeId: newSubdomain.subdomain,
          storeName: newSubdomain.subdomain,
        }),
      });
      setNewSubdomain({ subdomain: '', target: '' });
      setShowAddModal(false);
      loadData();
    } catch (err) {
      console.error('Failed to create subdomain:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleToggleSSL = async (subdomain: Subdomain) => {
    try {
      await fetchWithAuth(`/shopalize/domains/subdomains/${subdomain.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ssl_enabled: !subdomain.ssl_enabled }),
      });
      loadData();
    } catch (err) {
      console.error('Failed to toggle SSL:', err);
    }
  };

  const handleDeleteSubdomain = async (id: number) => {
    if (!confirm('Are you sure you want to delete this subdomain?')) return;
    
    try {
      await fetchWithAuth(`/shopalize/domains/subdomains/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err) {
      console.error('Failed to delete subdomain:', err);
    }
  };

  const filteredSubdomains = subdomains.filter(s => {
    const matchesSearch = s.subdomain.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         s.domain.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredDomains = customDomains.filter(d => {
    const matchesSearch = d.domain.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-black tracking-tight" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>
            DNS Management
          </h1>
          <p className="text-gray-500 mt-1">Manage subdomains, custom domains, and DNS settings</p>
        </div>
        <div className="flex gap-3">
          <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-50">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-[#0A0A0A] hover:bg-black text-white rounded-xl text-sm font-bold">
            <Plus className="w-4 h-4" /> Add Subdomain
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <Globe className="w-5 h-5 text-gray-400" />
            <span className="text-xs text-gray-400 uppercase">Total</span>
          </div>
          <p className="text-3xl font-bold">{stats?.total || 0}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-xs text-gray-400 uppercase">Active</span>
          </div>
          <p className="text-3xl font-bold text-green-600">{stats?.active || 0}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-5 h-5 text-yellow-500" />
            <span className="text-xs text-gray-400 uppercase">Pending</span>
          </div>
          <p className="text-3xl font-bold text-yellow-600">{stats?.pending || 0}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <Shield className="w-5 h-5 text-blue-500" />
            <span className="text-xs text-gray-400 uppercase">SSL Enabled</span>
          </div>
          <p className="text-3xl font-bold text-blue-600">{stats?.ssl_enabled || 0}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('subdomains')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-bold transition-all",
            activeTab === 'subdomains' ? "bg-white shadow-sm text-black" : "text-gray-500 hover:text-black"
          )}
        >
          Subdomains
        </button>
        <button
          onClick={() => setActiveTab('domains')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-bold transition-all",
            activeTab === 'domains' ? "bg-white shadow-sm text-black" : "text-gray-500 hover:text-black"
          )}
        >
          Custom Domains
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-bold transition-all",
            activeTab === 'analytics' ? "bg-white shadow-sm text-black" : "text-gray-500 hover:text-black"
          )}
        >
          Analytics
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:border-black outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:border-black outline-none"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : activeTab === 'subdomains' ? (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Subdomain</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Target</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">SSL</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Created</th>
                <th className="text-right px-6 py-4 text-xs font-bold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubdomains.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No subdomains found
                  </td>
                </tr>
              ) : (
                filteredSubdomains.map((sub) => (
                  <tr key={sub.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{sub.subdomain}.{sub.domain}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{sub.target}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-bold uppercase",
                        sub.status === 'active' && "bg-green-100 text-green-700",
                        sub.status === 'pending' && "bg-yellow-100 text-yellow-700",
                        sub.status === 'suspended' && "bg-red-100 text-red-700"
                      )}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleSSL(sub)}
                        className={cn(
                          "p-2 rounded-lg transition-colors",
                          sub.ssl_enabled ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
                        )}
                      >
                        {sub.ssl_enabled ? <Lock className="w-4 h-4" /> : <LockOpen className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {new Date(sub.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 hover:bg-gray-100 rounded-lg">
                          <Settings className="w-4 h-4 text-gray-400" />
                        </button>
                        <button 
                          onClick={() => handleDeleteSubdomain(sub.id)}
                          className="p-2 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : activeTab === 'domains' ? (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Domain</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Target</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">SSL</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Verification</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                <th className="text-right px-6 py-4 text-xs font-bold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDomains.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No custom domains found
                  </td>
                </tr>
              ) : (
                filteredDomains.map((domain) => (
                  <tr key={domain.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link2 className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{domain.domain}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{domain.target}</td>
                    <td className="px-6 py-4">
                      {domain.ssl_enabled ? (
                        <span className="flex items-center gap-1 text-green-600 text-sm font-bold">
                          <Lock className="w-3 h-3" /> Enabled
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-gray-400 text-sm">
                          <LockOpen className="w-3 h-3" /> Disabled
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-bold uppercase",
                        domain.verification_status === 'verified' && "bg-green-100 text-green-700",
                        domain.verification_status === 'pending' && "bg-yellow-100 text-yellow-700",
                        domain.verification_status === 'failed' && "bg-red-100 text-red-700"
                      )}>
                        {domain.verification_status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-bold uppercase",
                        domain.status === 'active' && "bg-green-100 text-green-700",
                        domain.status === 'pending' && "bg-yellow-100 text-yellow-700",
                        domain.status === 'expired' && "bg-red-100 text-red-700"
                      )}>
                        {domain.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 hover:bg-gray-100 rounded-lg">
                          <Settings className="w-4 h-4 text-gray-400" />
                        </button>
                        <button className="p-2 hover:bg-red-50 rounded-lg">
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <div className="text-center text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>DNS Analytics</p>
            <p className="text-sm mt-2">Real-time DNS query monitoring and analytics</p>
            <button className="mt-4 px-4 py-2 bg-[#0A0A0A] text-white rounded-lg text-sm font-bold">
              View Full Analytics
            </button>
          </div>
        </div>
      )}

      {/* Add Subdomain Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Add Subdomain</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-1">Subdomain</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={newSubdomain.subdomain}
                    onChange={(e) => setNewSubdomain({ ...newSubdomain, subdomain: e.target.value })}
                    placeholder="mystore"
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-l-xl focus:border-black outline-none"
                  />
                  <span className="px-4 py-2 bg-gray-100 border border-l-0 border-gray-200 rounded-r-xl text-gray-500 text-sm">
                    .shopalize.com
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-1">Target IP</label>
                <input
                  type="text"
                  value={newSubdomain.target}
                  onChange={(e) => setNewSubdomain({ ...newSubdomain, target: e.target.value })}
                  placeholder="1.2.3.4"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-black outline-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2 rounded-xl font-bold text-gray-500 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSubdomain}
                disabled={creating || !newSubdomain.subdomain || !newSubdomain.target}
                className="flex-1 py-2 rounded-xl font-bold bg-[#0A0A0A] text-white hover:bg-black disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
