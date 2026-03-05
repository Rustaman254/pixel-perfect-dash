const stats = [
  {
    title: "Business account",
    period: "Last 30 days",
    amount: "€ 8.672,20",
    change: "16.0%",
    changeUp: true,
    sub: "vs. 7,120,14 Last Period",
  },
  {
    title: "Total Saving",
    period: "Last 30 days",
    amount: "€ 3.765,35",
    change: "12%",
    changeUp: true,
    sub: "vs. 4,116,50 Last Period",
  },
  {
    title: "Tax Reserve",
    period: "Last 30 days",
    amount: "€ 14.376,16",
    change: "25.2%",
    changeUp: false,
    sub: "vs. 10,236,46 Last Period",
  },
];

const StatsCards = () => {
  return (
    <div className="grid grid-cols-3 gap-4">
      {stats.map((stat) => (
        <div key={stat.title} className="bg-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-foreground">{stat.title}</h4>
            <span className="text-[11px] text-muted-foreground">{stat.period}</span>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <h3 className="text-xl font-bold text-foreground">{stat.amount}</h3>
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
