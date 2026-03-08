import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const MyCards = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAddCard = () => {
    navigate("/payment-methods");
    toast({
      title: "Add New Card",
      description: "Redirecting to payment methods to add a new card.",
    });
  };

  return (
    <div className="bg-card rounded-2xl p-4 md:p-5 w-full md:w-[280px] shrink-0 border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground text-sm md:text-base">My Cards</h3>
        <button 
          onClick={() => navigate("/payment-methods")}
          className="text-sm text-primary font-medium hover:underline transition-all"
        >
          See All →
        </button>
      </div>
      {/* Visa Card */}
      <div className="rounded-xl p-5 text-primary-foreground relative overflow-hidden mb-3 cursor-pointer group"
        style={{ background: "linear-gradient(135deg, #013a42, #025864)" }}
        onClick={() => navigate("/payment-methods")}
      >
        <div className="flex items-center justify-between mb-8">
          <span className="text-sm font-bold tracking-widest opacity-90">VISA</span>
          <span className="text-xs opacity-70 group-hover:opacity-100 transition-opacity">**** **** **** 2104</span>
        </div>
        <div>
          <p className="text-2xl font-bold">$4,540.20</p>
        </div>
        <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full border border-primary-foreground/10 group-hover:scale-110 transition-transform" />
        <div className="absolute -right-2 -bottom-8 w-20 h-20 rounded-full border border-primary-foreground/10 group-hover:scale-110 transition-transform" />
      </div>

      {/* Add Card */}
      <button 
        onClick={handleAddCard}
        className="w-full rounded-xl border-2 border-dashed border-border p-4 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add New Card
      </button>
    </div>
  );
};

export default MyCards;
