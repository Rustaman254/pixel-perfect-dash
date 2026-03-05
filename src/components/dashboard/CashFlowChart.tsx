import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from "recharts";

const data = [
  { name: "Week 1", value: 6200, positive: true },
  { name: "", value: -1800, positive: false },
  { name: "", value: 4500, positive: true },
  { name: "", value: -900, positive: false },
  { name: "Week 2", value: 8300, positive: true },
  { name: "", value: -2100, positive: false },
  { name: "", value: 5400, positive: true },
  { name: "", value: -1500, positive: false },
  { name: "Week 3", value: 7100, positive: true },
  { name: "", value: -3200, positive: false },
  { name: "", value: 6800, positive: true },
  { name: "", value: -1100, positive: false },
  { name: "Week 4", value: 9200, positive: true },
  { name: "", value: -2400, positive: false },
  { name: "", value: 7500, positive: true },
  { name: "", value: -1700, positive: false },
];

const CashFlowChart = () => {
  return (
    <div className="bg-card rounded-2xl p-4 md:p-5 col-span-1 md:col-span-2">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center">
            <span className="text-primary text-[10px]">📊</span>
          </div>
          <h3 className="font-semibold text-foreground text-sm md:text-base">Revenue Flow</h3>
        </div>
        <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm">
          <button className="text-foreground font-medium">Weekly</button>
          <button className="text-muted-foreground hidden sm:block">Daily</button>
          <button className="text-muted-foreground">⚙</button>
        </div>
      </div>
      <div className="h-[180px] md:h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Bar dataKey="value" radius={[3, 3, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.positive ? "hsl(var(--chart-positive))" : "hsl(var(--chart-negative))"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CashFlowChart;
