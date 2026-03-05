const stats = [
  {
    title: "M-Pesa",
    emoji: "📱",
    period: "Last 30 days",
    amount: "$12,450.00",
    change: "28.3%",
    changeUp: true,
    sub: "432 transactions",
  },
  {
    title: "Card Payments",
    emoji: "💳",
    period: "Last 30 days",
    amount: "$24,680.50",
    change: "18.6%",
    changeUp: true,
    sub: "891 transactions",
  },
  {
    title: "Crypto",
    emoji: "₿",
    period: "Last 30 days",
    amount: "$11,190.00",
    change: "42.1%",
    changeUp: true,
    sub: "USDC · USDT · USDA · BTC",
  },
];

const StatsCards = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
      {stats.map((stat) => (
        <div key={stat.title} className="bg-card rounded-2xl p-4 md:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-base">{stat.emoji}</span>
              <h4 className="text-sm font-medium text-foreground">{stat.title}</h4>
            </div>
            <span className="text-[11px] text-muted-foreground">{stat.period}</span>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <h3 className="text-lg md:text-xl font-bold text-foreground">{stat.amount}</h3>
            <span className={`text-xs font-medium ${stat.changeUp ? "text-success" : "text-destructive"}`}>
              {stat.change} {stat.changeUp ? "↑" : "↓"}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">{stat.sub}</p>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
