import { useState } from "react";
import { Filter, ArrowUpDown, MoreHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAppContext } from "@/contexts/AppContext";

const RecentActivity = () => {
  const { transactions } = useAppContext();
  const [filter, setFilter] = useState<"All" | "Success" | "Pending">("All");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSort = () => {
    setSortOrder(prev => prev === "asc" ? "desc" : "asc");
    toast({
      title: "Sorted",
      description: `Activities sorted by date (${sortOrder === "asc" ? "descending" : "ascending"}).`,
    });
  };

  const handleRowClick = (id: number) => {
    navigate(`/transactions`);
  };

  const mappedActivities = transactions.map(t => ({
    id: t.id,
    initials: "🛒",
    name: t.buyerName || "Anonymous Buyer",
    type: t.type,
    date: new Date(t.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    amount: `${t.currency} ${t.amount.toLocaleString()}`,
    amountSub: "",
    status: t.status === "Completed" || t.status === "Funds locked" ? "Success" : (t.status === "Pending" ? "Pending" : "Failed"),
    method: "M-Pesa",
    methodSub: t.buyerPhone || "",
    color: "bg-primary/20 text-primary",
  }));

  const filtered = mappedActivities
    .filter(a => filter === "All" || a.status === filter)
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

  return (
    <div className="bg-card rounded-2xl p-4 md:p-5 flex-1 min-w-0 border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground text-sm md:text-base">Recent Payments</h3>
        <div className="flex items-center gap-2 md:gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md">
            <Filter className="w-3.5 h-3.5" />
            <select
              className="bg-transparent outline-none text-[11px] font-medium"
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
            >
              <option value="All">All</option>
              <option value="Success">Success</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
          <button
            onClick={handleSort}
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sort</span>
          </button>
          <button
            onClick={() => toast({ title: "More Options", description: "Extended activity controls." })}
            className="hover:text-foreground transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">No recent payments found.</div>
      ) : (
        <>
          {/* Mobile card view */}
          <div className="md:hidden space-y-3">
            {filtered.map((a) => (
              <div
                key={a.id}
                onClick={() => handleRowClick(a.id)}
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <span className="text-2xl">{a.initials}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{a.name}</p>
                  <p className="text-[11px] text-muted-foreground">{a.type} · {a.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">{a.amount}</p>
                  <span className={cn("text-[11px] font-medium", a.status === "Success" ? "text-success" : (a.status === "Pending" ? "text-warning" : "text-destructive"))}>{a.status}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <table className="w-full hidden md:table">
            <thead>
              <tr className="text-[11px] text-muted-foreground uppercase tracking-wider">
                <th className="text-left font-medium pb-3">Customer</th>
                <th className="text-left font-medium pb-3">Amount</th>
                <th className="text-left font-medium pb-3">Status</th>
                <th className="text-left font-medium pb-3">Method</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr
                  key={a.id}
                  onClick={() => handleRowClick(a.id)}
                  className="border-t border-border cursor-pointer hover:bg-muted/30 transition-colors"
                >
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{a.initials}</span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{a.name}</p>
                        <p className="text-[11px] text-muted-foreground">{a.type} · {a.date}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3">
                    <p className="text-sm font-medium text-foreground">{a.amount}</p>
                    {a.amountSub && <p className="text-[11px] text-muted-foreground">{a.amountSub}</p>}
                  </td>
                  <td className="py-3">
                    <span className={cn("text-xs font-medium", a.status === "Success" ? "text-success" : (a.status === "Pending" ? "text-warning" : "text-destructive"))}>
                      {a.status}
                    </span>
                  </td>
                  <td className="py-3">
                    <p className="text-sm text-foreground">{a.method}</p>
                    <p className="text-[11px] text-muted-foreground">{a.methodSub}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default RecentActivity;
