import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

const IncomeExpenseCards = () => {
  return (
    <div className="space-y-4">
      {/* Income */}
      <div className="bg-card rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
            <ArrowDownLeft className="w-5 h-5 text-accent-foreground" />
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-1">Income</p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-2xl font-bold text-foreground">€ 12.378,20</h3>
          <span className="text-sm font-medium text-success">45.0% ↑</span>
        </div>
      </div>

      {/* Expense */}
      <div className="bg-card rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5 text-accent-foreground" />
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-1">Expense</p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-2xl font-bold text-foreground">€ 5.788,21</h3>
          <span className="text-sm font-medium text-destructive">12.5% ↓</span>
        </div>
      </div>
    </div>
  );
};

export default IncomeExpenseCards;
