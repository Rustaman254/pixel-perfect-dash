import { MousePointerClick, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";

const IncomeExpenseCards = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      {/* Link Clicks */}
      <div 
        onClick={() => navigate("/analytics")}
        className="bg-card rounded-2xl p-4 md:p-5 border border-border cursor-pointer hover:bg-muted/30 transition-colors group"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center group-hover:bg-accent/80 transition-colors">
            <MousePointerClick className="w-5 h-5 text-accent-foreground" />
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-1">Link Clicks</p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-xl md:text-2xl font-bold text-foreground">12,482</h3>
          <span className="text-sm font-medium text-success">32.1% ↑</span>
        </div>
      </div>

      {/* Conversions */}
      <div 
        onClick={() => navigate("/analytics")}
        className="bg-card rounded-2xl p-4 md:p-5 border border-border cursor-pointer hover:bg-muted/30 transition-colors group"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center group-hover:bg-accent/80 transition-colors">
            <ShoppingCart className="w-5 h-5 text-accent-foreground" />
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-1">Conversions</p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-xl md:text-2xl font-bold text-foreground">1,847</h3>
          <span className="text-sm font-medium text-success">14.8% ↑</span>
        </div>
      </div>
    </div>
  );
};

export default IncomeExpenseCards;
