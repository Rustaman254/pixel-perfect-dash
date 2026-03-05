import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from "recharts";

const data = [
  { name: "18 Oct", value: 4000, positive: true },
  { name: "", value: -2000, positive: false },
  { name: "", value: 3000, positive: true },
  { name: "", value: -1500, positive: false },
  { name: "25 Oct", value: 5000, positive: true },
  { name: "", value: -2500, positive: false },
  { name: "", value: 2000, positive: true },
  { name: "", value: -1000, positive: false },
  { name: "2 Nov", value: 4500, positive: true },
  { name: "", value: -3000, positive: false },
  { name: "", value: 3500, positive: true },
  { name: "", value: -1200, positive: false },
  { name: "9 Nov", value: 5500, positive: true },
  { name: "", value: -2000, positive: false },
  { name: "", value: 4000, positive: true },
  { name: "", value: -1800, positive: false },
];

const CashFlowChart = () => {
  return (
    <div className="bg-card rounded-2xl p-5 col-span-2">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center">
            <span className="text-primary text-[10px]">📊</span>
          </div>
          <h3 className="font-semibold text-foreground">Cash Flow</h3>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <button className="text-foreground font-medium">Weekly</button>
          <button className="text-muted-foreground">Daily</button>
          <button className="text-muted-foreground">⚙ Manage</button>
        </div>
      </div>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(v) => `€ ${(v / 1000).toFixed(0)}k`}
            />
            <Bar dataKey="value" radius={[3, 3, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.positive ? "hsl(var(--chart-positive))" : "hsl(var(--chart-negative))"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CashFlowChart;
