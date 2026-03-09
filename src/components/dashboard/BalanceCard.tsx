import { Link2, Send, ArrowDownLeft, MoreHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/contexts/AppContext";

const BalanceCard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { links, payouts } = useAppContext();

  const totalEarnings = links.reduce((acc, link) => acc + (link.totalEarnedValue || 0), 0);
  
  const withdrawnSum = payouts
    .filter(p => ["Processing", "Completed"].includes(p.status))
    .reduce((acc, p) => acc + p.amount, 0);
    
  const availableBalance = totalEarnings - withdrawnSum;

  const handleAction = (label: string) => {
    toast({
      title: "Action triggered",
      description: `${label} action is not fully implemented yet, but the button is now working!`,
    });
  };

  return (
    <div className="rounded-2xl p-5 md:p-6 text-primary-foreground border border-border"
      style={{ background: "linear-gradient(135deg, #013a42, #025864)" }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm opacity-80 mb-1">Available for Payout</p>
          <div className="flex items-baseline gap-3">
            <h2 className="text-2xl md:text-3xl font-bold">KES {availableBalance.toLocaleString()}</h2>
            <span className="text-xs font-medium text-emerald-300">Total Revenue: KES {totalEarnings.toLocaleString()}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/payment-links")}
            className="flex items-center gap-1.5 bg-emerald-400 hover:bg-emerald-500 text-foreground font-medium text-sm px-3 md:px-4 py-2 rounded-lg transition-colors"
          >
            <Link2 className="w-4 h-4" />
            <span>Create Link</span>
          </button>
          <button
            onClick={() => navigate("/payouts")}
            className="flex items-center gap-1.5 bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground text-sm px-3 md:px-4 py-2 rounded-lg backdrop-blur-sm transition-colors"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Withdraw Now</span>
          </button>
          <button
            onClick={() => handleAction("Request Payment")}
            className="flex items-center gap-1.5 bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground text-sm px-3 md:px-4 py-2 rounded-lg backdrop-blur-sm transition-colors"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Request</span>
          </button>
          <button
            onClick={() => handleAction("More Options")}
            className="bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground p-2 rounded-lg backdrop-blur-sm transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BalanceCard;
