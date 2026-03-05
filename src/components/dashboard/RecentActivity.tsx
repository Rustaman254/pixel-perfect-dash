import { Filter, ArrowUpDown, MoreHorizontal } from "lucide-react";

const activities = [
  {
    initials: "TL",
    name: "Theo Lawrence",
    type: "Add",
    date: "Oct 18, 2024",
    amount: "€ 500,00",
    amountSub: "",
    status: "Success",
    method: "Credit Card",
    methodSub: "**** 3560",
    color: "bg-primary/20 text-primary",
  },
  {
    initials: "AM",
    name: "Amy March",
    type: "Sent",
    date: "May 24, 2024",
    amount: "- € 250,00",
    amountSub: "80 USD",
    status: "Pending",
    method: "Bank Transfer",
    methodSub: "**** 2285",
    color: "bg-warning/20 text-warning",
  },
];

const RecentActivity = () => {
  return (
    <div className="bg-card rounded-2xl p-5 flex-1">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Recent Activity</h3>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <button className="flex items-center gap-1 hover:text-foreground transition-colors">
            <Filter className="w-3.5 h-3.5" />
            Filter
          </button>
          <button className="flex items-center gap-1 hover:text-foreground transition-colors">
            <ArrowUpDown className="w-3.5 h-3.5" />
            Sort
          </button>
          <button className="hover:text-foreground transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
      <table className="w-full">
        <thead>
          <tr className="text-[11px] text-muted-foreground uppercase tracking-wider">
            <th className="text-left font-medium pb-3">Type</th>
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
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${a.color}`}>
                    {a.initials}
                  </div>
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
