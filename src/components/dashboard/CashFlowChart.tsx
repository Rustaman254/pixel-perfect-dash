import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { fetchWithAuth } from "@/lib/api";

const CashFlowChart = () => {
  const [view, setView] = useState<"weekly" | "daily">("daily");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchStats = async () => {
    try {
      const response = await fetchWithAuth('/transactions/stats');
      const statsArray = response.stats || [];
      const formattedData = statsArray.map((s: any) => ({
        name: s.date,
        value: s.revenue,
        positive: true
      }));
      setData(formattedData);
    } catch (err: any) {
      console.error("Failed to fetch stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const handleSettings = () => {
    toast({
      title: "Chart Settings",
      description: "Chart configuration options will appear here.",
    });
  };

  if (loading && data.length === 0) {
    return (
      <div className="bg-card rounded-2xl p-4 md:p-5 col-span-1 md:col-span-2 border border-border h-[280px] flex items-center justify-center">
        <p className="text-sm text-muted-foreground animate-pulse">Loading charts...</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-4 md:p-5 col-span-1 md:col-span-2 border border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center">
            <span className="text-primary text-[10px]">📊</span>
          </div>
          <h3 className="font-semibold text-foreground text-sm md:text-base">Revenue Flow</h3>
        </div>
        <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm">
          <button 
            onClick={() => setView("weekly")}
            className={cn("transition-colors", view === "weekly" ? "text-foreground font-medium" : "text-muted-foreground")}
          >
            Weekly
          </button>
          <button 
            onClick={() => setView("daily")}
            className={cn("transition-colors hidden sm:block", view === "daily" ? "text-foreground font-medium" : "text-muted-foreground")}
          >
            Daily
          </button>
          <button 
            onClick={handleSettings}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            ⚙
          </button>
        </div>
      </div>
      <div className="h-[180px] md:h-[200px]">
        {data.length === 0 ? (
            <div className="h-full flex items-center justify-center border border-dashed border-border rounded-xl bg-muted/20">
                <p className="text-xs text-muted-foreground">No transaction data yet.</p>
            </div>
        ) : (
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(val) => val.split('-').slice(1).join('/')} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `KES ${(v / 1000).toFixed(0)}k`} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: '1px solid hsl(var(--border))', fontSize: '12px' }}
                        itemStyle={{ color: '#025864' }}
                    />
                    <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.positive ? "#00D47E" : "#FF4d4d"} />
                    ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default CashFlowChart;
