import { Wallet as WalletIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/contexts/AppContext";

const MyCards = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { wallets } = useAppContext();
  
  const primaryWallet = wallets?.find(w => w.currency_code === 'KES') || (wallets && wallets.length > 0 ? wallets[0] : null);
  const balance = primaryWallet ? primaryWallet.balance : 0;
  const currency = primaryWallet ? primaryWallet.currency_code : 'KES';

  return (
    <div className="bg-card rounded-2xl p-4 md:p-5 w-full md:w-[280px] shrink-0 border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground text-sm md:text-base">My Wallets</h3>
        <button 
          onClick={() => navigate("/wallets")}
          className="text-sm text-primary font-medium hover:underline transition-all"
        >
          See All →
        </button>
      </div>

      {primaryWallet ? (
        <div className="rounded-xl p-5 text-primary-foreground relative overflow-hidden mb-3 cursor-pointer group"
          style={{ background: "linear-gradient(135deg, #013a42, #025864)" }}
          onClick={() => navigate("/wallets")}
        >
          <div className="flex items-center justify-between mb-8">
            <span className="text-sm font-bold tracking-widest opacity-90">{currency} WALLET</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-black/20 text-emerald-300">
              {primaryWallet.intasend_wallet_id ? "IntaSend Live" : "Local"}
            </span>
          </div>
          <div>
            <p className="text-2xl font-bold">{currency} {Number(balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full border border-primary-foreground/10 group-hover:scale-110 transition-transform" />
          <div className="absolute -right-2 -bottom-8 w-20 h-20 rounded-full border border-primary-foreground/10 group-hover:scale-110 transition-transform" />
        </div>
      ) : (
        <div className="rounded-xl p-5 border border-dashed border-border mb-3 flex items-center justify-center h-[126px] bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors"
             onClick={() => navigate('/wallets')}>
            <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                <WalletIcon className="w-4 h-4" /> Setup Wallet
            </p>
        </div>
      )}

      {/* Action */}
      <button 
        onClick={() => navigate("/wallets")}
        className="w-full rounded-xl border border-border bg-muted/30 p-3.5 flex items-center justify-center gap-2 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
      >
        <WalletIcon className="w-4 h-4 text-primary" />
        Manage Wallets
      </button>
    </div>
  );
};

export default MyCards;
