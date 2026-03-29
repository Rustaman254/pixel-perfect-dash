import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { fetchWithAuth } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, CheckCircle, Clock } from "lucide-react";

interface Ticket {
  id: number;
  userId: number | null;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
}

const ManageSupport = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<{subject: string, message: string} | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const data = await fetchWithAuth('/support/admin');
      setTickets(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load support tickets",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id: number) => {
    try {
      await fetchWithAuth(`/support/admin/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'Resolved' })
      });
      
      toast({
        title: "Ticket Resolved",
        description: "The support ticket has been marked as resolved."
      });
      
      // Update local state
      setTickets(prev => prev.map(t => t.id === id ? { ...t, status: 'Resolved' } : t));
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update ticket status",
        variant: "destructive"
      });
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Support Tickets</h1>
        <p className="text-slate-500 mt-1">Manage user queries and support requests</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">User Details</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Subject & Message</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Status</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Date</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Loading tickets...</td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No support tickets found</td>
                </tr>
              ) : (
                tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{ticket.name}</div>
                      <div className="text-sm text-slate-500">{ticket.email}</div>
                    </td>
                    <td className="px-6 py-4 cursor-pointer max-w-xs" onClick={() => setSelectedMessage({ subject: ticket.subject, message: ticket.message })}>
                      <div className="font-medium text-slate-900 truncate" title={ticket.subject}>{ticket.subject}</div>
                      <div className="text-sm text-slate-500 truncate" title="Click to view full message">{ticket.message}</div>
                    </td>
                    <td className="px-6 py-4">
                      {ticket.status === 'Resolved' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Resolved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                          <Clock className="w-3.5 h-3.5" />
                          Open
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {ticket.status !== 'Resolved' && (
                        <button
                          onClick={() => handleResolve(ticket.id)}
                          className="px-3 py-1.5 bg-[#012a30] text-white text-xs font-medium rounded-lg hover:bg-[#012a30]/90 transition-colors"
                        >
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800">{selectedMessage.subject}</h3>
              <button 
                onClick={() => setSelectedMessage(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6 text-slate-600 text-sm whitespace-pre-wrap">
              {selectedMessage.message}
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setSelectedMessage(null)}
                className="px-4 py-2 bg-slate-200 text-slate-800 font-medium rounded-lg text-sm hover:bg-slate-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default ManageSupport;
