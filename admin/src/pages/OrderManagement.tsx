import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { fetchWithAuth, cn } from "@/lib/utils";
import { ShoppingCart, Search, Loader2, MoreHorizontal, Eye, Clock, CheckCircle, Truck, XCircle, Package, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Order {
  id: number;
  projectId: number;
  storeName: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  amount: number;
  currency: string;
  status: string;
  fulfillmentStatus: string;
  paymentStatus: string;
  notes: string;
  createdAt: string;
}

const OrderManagement = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const { toast } = useToast();

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search) params.set('search', search);
      const data = await fetchWithAuth(`/admin/shopalize/orders?${params.toString()}`);
      setOrders(data.orders || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOrders(); }, [statusFilter]);

  const handleUpdateOrder = async (id: number, updates: any) => {
    try {
      await fetchWithAuth(`/admin/shopalize/orders/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      loadOrders();
      toast({ title: "Order updated", description: "Order status has been updated." });
      setEditOpen(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-amber-50 text-amber-600",
      completed: "bg-emerald-50 text-emerald-600",
      cancelled: "bg-red-50 text-red-600",
      processing: "bg-blue-50 text-blue-600",
      refunded: "bg-slate-100 text-slate-600",
    };
    return <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold", styles[status] || "bg-slate-100 text-slate-600")}>{status}</span>;
  };

  const totalRevenue = orders.reduce((s, o) => o.status !== 'cancelled' ? s + o.amount : s, 0);
  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const completedCount = orders.filter(o => o.status === 'completed').length;

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Order Management</h1>
        <p className="text-sm text-slate-500">Manage orders across all stores</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { title: "Total Orders", value: orders.length, icon: ShoppingCart, color: "bg-blue-50 text-blue-600" },
          { title: "Pending", value: pendingCount, icon: Clock, color: "bg-amber-50 text-amber-600" },
          { title: "Completed", value: completedCount, icon: CheckCircle, color: "bg-emerald-50 text-emerald-600" },
          { title: "Revenue", value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, color: "bg-purple-50 text-purple-600" },
        ].map((s) => (
          <div key={s.title} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className={cn("p-1.5 rounded-lg w-fit mb-2", s.color)}><s.icon className="w-4 h-4" /></div>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{s.title}</p>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">{s.value}</h3>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <input type="text" placeholder="Search orders..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && loadOrders()} />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 font-medium outline-none">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Order</th>
                <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Customer</th>
                <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Store</th>
                <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Amount</th>
                <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Status</th>
                <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Date</th>
                <th className="text-right px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={7} className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" /><p className="text-sm text-slate-500">Loading orders...</p></td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={7} className="py-20 text-center"><p className="text-sm text-slate-500">No orders found.</p></td></tr>
              ) : orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                        <ShoppingCart className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">#{order.id}</p>
                        <p className="text-[9px] text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-medium text-slate-700">{order.buyerName || 'Guest'}</p>
                    <p className="text-[10px] text-slate-400">{order.buyerEmail || '-'}</p>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-700">{order.storeName}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-900">{order.currency || '$'}{parseFloat(String(order.amount)).toLocaleString()}</td>
                  <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                  <td className="px-6 py-4 text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                          <MoreHorizontal className="w-5 h-5 text-slate-400" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuLabel>Order Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => { setSelectedOrder(order); setEditOpen(true); }}>
                          <Eye className="w-4 h-4 mr-2" /> View & Edit
                        </DropdownMenuItem>
                        {order.status === 'pending' && (
                          <DropdownMenuItem onClick={() => handleUpdateOrder(order.id, { status: 'completed' })}>
                            <CheckCircle className="w-4 h-4 mr-2" /> Mark Completed
                          </DropdownMenuItem>
                        )}
                        {order.status !== 'cancelled' && (
                          <DropdownMenuItem onClick={() => handleUpdateOrder(order.id, { status: 'cancelled' })} className="text-red-600">
                            <XCircle className="w-4 h-4 mr-2" /> Cancel Order
                          </DropdownMenuItem>
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

      {/* Edit Order Dialog */}
      <EditOrderDialog order={selectedOrder} open={editOpen} onOpenChange={setEditOpen} onSaved={loadOrders} />
    </AdminLayout>
  );
};

const EditOrderDialog = ({ order, open, onOpenChange, onSaved }: { order: Order | null; open: boolean; onOpenChange: (v: boolean) => void; onSaved: () => void }) => {
  const [form, setForm] = useState({ status: 'pending', fulfillmentStatus: 'unfulfilled', paymentStatus: 'pending', notes: '' });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (order && open) {
      setForm({
        status: order.status,
        fulfillmentStatus: order.fulfillmentStatus || 'unfulfilled',
        paymentStatus: order.paymentStatus || 'pending',
        notes: order.notes || '',
      });
    }
  }, [order, open]);

  const handleSave = async () => {
    if (!order) return;
    try {
      setSaving(true);
      await fetchWithAuth(`/admin/shopalize/orders/${order.id}`, {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      toast({ title: "Order updated", description: "Changes saved." });
      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>Order #{order?.id}</DialogTitle>
          <DialogDescription>{order?.buyerName || 'Guest'} - {order?.buyerEmail}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl">
            <div><p className="text-[10px] text-slate-500 uppercase font-bold">Amount</p><p className="text-sm font-bold">${parseFloat(String(order?.amount || 0)).toLocaleString()}</p></div>
            <div><p className="text-[10px] text-slate-500 uppercase font-bold">Store</p><p className="text-sm font-bold">{order?.storeName}</p></div>
          </div>
          <div className="space-y-2">
            <Label>Order Status</Label>
            <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Fulfillment Status</Label>
            <Select value={form.fulfillmentStatus} onValueChange={v => setForm({ ...form, fulfillmentStatus: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="unfulfilled">Unfulfilled</SelectItem>
                <SelectItem value="fulfilled">Fulfilled</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Payment Status</Label>
            <Select value={form.paymentStatus} onValueChange={v => setForm({ ...form, paymentStatus: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <button onClick={() => onOpenChange(false)} className="px-4 py-2 text-slate-500 font-medium">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50">
            {saving ? "Saving..." : "Update Order"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderManagement;
