import { useNavigate } from "react-router-dom";
import { useAppContext } from "@/contexts/AppContext";

const StatsCards = () => {
  const navigate = useNavigate();
  const { transactions, links } = useAppContext();

  const mpesaPayments = transactions.filter(t => t.type === 'Payment' && t.status === 'Completed').length;
  const mpesaVolume = transactions.filter(t => t.type === 'Payment' && t.status === 'Completed')
    .reduce((acc, t) => acc + t.amount, 0);

  const activeLinks = links.filter(l => l.status === 'Active').length;
  const totalClicks = links.reduce((acc, l) => acc + l.clicks, 0);

  const stats = [
    {
      title: "M-Pesa Volume",
      emoji: "📱",
      period: "Total",
      amount: `KES ${mpesaVolume.toLocaleString()}`,
      change: "Stable",
      changeUp: true,
      sub: `${mpesaPayments} successful payments`,
    },
    {
      title: "Payment Links",
      emoji: "🔗",
      period: "Current",
      amount: `${activeLinks}`,
      change: "Active",
      changeUp: true,
      sub: "Active payment links",
    },
    {
      title: "Total Engagement",
      emoji: "📊",
      period: "All time",
      amount: `${totalClicks.toLocaleString()}`,
      change: "Clicks",
      changeUp: true,
      sub: "Total link visits",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
      {stats.map((stat) => (
        <div
          key={stat.title}
          onClick={() => navigate("/payment-links")}
          className="bg-card rounded-2xl p-4 md:p-5 border border-border cursor-pointer hover:bg-muted/30 transition-colors group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-base">{stat.emoji}</span>
              <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{stat.title}</h4>
            </div>
            <span className="text-[11px] text-muted-foreground">{stat.period}</span>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <h3 className="text-lg md:text-xl font-bold text-foreground">{stat.amount}</h3>
            <span className={`text-xs font-medium ${stat.changeUp ? "text-success" : "text-destructive"}`}>
              {stat.change}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">{stat.sub}</p>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
