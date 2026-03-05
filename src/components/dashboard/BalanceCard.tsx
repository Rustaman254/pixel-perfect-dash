import { Plus, Send, ArrowDownLeft, MoreHorizontal } from "lucide-react";

const BalanceCard = () => {
  return (
    <div className="rounded-2xl p-6 text-primary-foreground"
      style={{ background: "linear-gradient(135deg, hsl(170 50% 20%), hsl(162 63% 30%))" }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-80 mb-1">Total Balance</p>
          <div className="flex items-baseline gap-3">
            <h2 className="text-3xl font-bold">€ 320.845,20</h2>
            <span className="text-sm font-medium text-emerald-300">15.8% ↑</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 bg-emerald-400 hover:bg-emerald-500 text-foreground font-medium text-sm px-4 py-2 rounded-lg transition-colors">
            <Plus className="w-4 h-4" />
            Add
          </button>
          <button className="flex items-center gap-1.5 bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground text-sm px-4 py-2 rounded-lg backdrop-blur-sm transition-colors">
            <Send className="w-4 h-4" />
            Send
          </button>
          <button className="flex items-center gap-1.5 bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground text-sm px-4 py-2 rounded-lg backdrop-blur-sm transition-colors">
            <ArrowDownLeft className="w-4 h-4" />
            Request
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
