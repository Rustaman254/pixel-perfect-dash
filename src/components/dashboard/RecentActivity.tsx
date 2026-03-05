import { Filter, ArrowUpDown, MoreHorizontal } from "lucide-react";

const activities = [
  {
    initials: "🇰🇪",
    name: "James Kamau",
    type: "M-Pesa",
    date: "Mar 2, 2025",
    amount: "$120.00",
    amountSub: "KES 15,480",
    status: "Success",
    method: "M-Pesa",
    methodSub: "+254 ***890",
    color: "bg-primary/20 text-primary",
  },
  {
    initials: "🇺🇸",
    name: "Sarah Miller",
    type: "Card",
    date: "Mar 1, 2025",
    amount: "$450.00",
    amountSub: "",
    status: "Success",
    method: "Visa Card",
    methodSub: "**** 4521",
    color: "bg-primary/20 text-primary",
  },
  {
    initials: "🇬🇧",
    name: "Tom Wilson",
    type: "Crypto",
    date: "Feb 28, 2025",
    amount: "$1,200.00",
    amountSub: "1,200 USDC",
    status: "Pending",
    method: "USDC",
    methodSub: "0x7a3...f82",
    color: "bg-warning/20 text-warning",
  },
  {
    initials: "🇳🇬",
    name: "Adewale Obi",
    type: "M-Pesa",
    date: "Feb 27, 2025",
    amount: "$85.00",
    amountSub: "NGN 131,750",
    status: "Success",
    method: "Bank Transfer",
    methodSub: "GTBank ****102",
    color: "bg-primary/20 text-primary",
  },
];

const RecentActivity = () => {
  return (
    <div className="bg-card rounded-2xl p-4 md:p-5 flex-1 min-w-0">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground text-sm md:text-base">Recent Payments</h3>
        <div className="flex items-center gap-2 md:gap-3 text-sm text-muted-foreground">
          <button className="flex items-center gap-1 hover:text-foreground transition-colors">
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filter</span>
          </button>
          <button className="flex items-center gap-1 hover:text-foreground transition-colors">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sort</span>
          </button>
          <button className="hover:text-foreground transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Mobile card view */}
      <div className="md:hidden space-y-3">
        {activities.map((a) => (
          <div key={a.name} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
            <span className="text-2xl">{a.initials}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{a.name}</p>
              <p className="text-[11px] text-muted-foreground">{a.type} · {a.date}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">{a.amount}</p>
              <span className={`text-[11px] font-medium ${a.status === "Success" ? "text-success" : "text-warning"}`}>{a.status}</span>
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
          {activities.map((a) => (
            <tr key={a.name} className="border-t border-border">
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
                <span className={`text-xs font-medium ${a.status === "Success" ? "text-success" : "text-warning"}`}>
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
    </div>
  );
};

export default RecentActivity;
