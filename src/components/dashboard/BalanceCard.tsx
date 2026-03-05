import { Link2, Send, ArrowDownLeft, MoreHorizontal } from "lucide-react";

const BalanceCard = () => {
  return (
    <div className="rounded-2xl p-5 md:p-6 text-primary-foreground"
      style={{ background: "linear-gradient(135deg, hsl(170 50% 20%), hsl(162 63% 30%))" }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm opacity-80 mb-1">Total Earnings</p>
          <div className="flex items-baseline gap-3">
            <h2 className="text-2xl md:text-3xl font-bold">$48,320.50</h2>
            <span className="text-sm font-medium text-emerald-300">22.4% ↑</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 bg-emerald-400 hover:bg-emerald-500 text-foreground font-medium text-sm px-3 md:px-4 py-2 rounded-lg transition-colors">
            <Link2 className="w-4 h-4" />
            <span>Create Link</span>
          </button>
          <button className="flex items-center gap-1.5 bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground text-sm px-3 md:px-4 py-2 rounded-lg backdrop-blur-sm transition-colors">
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Withdraw</span>
          </button>
          <button className="flex items-center gap-1.5 bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground text-sm px-3 md:px-4 py-2 rounded-lg backdrop-blur-sm transition-colors">
            <ArrowDownLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Request</span>
          </button>
          <button className="bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground p-2 rounded-lg backdrop-blur-sm transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BalanceCard;
