import { useEffect, useState } from 'react';
import { fetchWithAuth } from '@/lib/api';
import { BarChart3, TrendingUp, DollarSign, ShoppingBag, Users, Eye, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithAuth('/shopalize/products/dashboard').then(setStats).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-16 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" /></div>;

  const revenue = Number(stats?.totalRevenue || 0);
  const orders = stats?.totalOrders || 0;
  const customers = stats?.totalCustomers || 0;
  const sessions = Math.floor(orders * 12.5);
  const aov = orders > 0 ? Math.round(revenue / orders) : 0;
  const convRate = sessions > 0 ? ((orders / sessions) * 100).toFixed(2) : '0.00';

  // Mock chart data
  const chartDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const chartValues = [0.3, 0.5, 0.8, 0.4, 1.0, 0.7, 0.9];
  const maxVal = Math.max(...chartValues);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-[22px] font-bold text-foreground" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>Analytics</h1><p className="text-sm text-muted-foreground">Last 7 days overview</p></div>
        <div className="flex gap-2">
          <select className="px-3 py-2 border border-border rounded-lg text-sm bg-white outline-none focus:border-primary">
            <option>Last 7 days</option><option>Last 30 days</option><option>Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {[
          { label: 'Total sales', value: `KES ${revenue.toLocaleString()}`, change: '+12.5%', up: true },
          { label: 'Online store sessions', value: String(sessions), change: '-3.1%', up: false },
          { label: 'Conversion rate', value: `${convRate}%`, change: '+0.3%', up: true },
          { label: 'Total orders', value: String(orders), change: '+8.2%', up: true },
          { label: 'Average order value', value: `KES ${aov.toLocaleString()}`, change: '+5.2%', up: true },
          { label: 'Customers', value: String(customers), change: '+4.1%', up: true },
        ].map(m => (
          <div key={m.label} className="bg-white rounded-xl border border-border p-4 shadow-sm">
            <p className="text-[11px] font-medium text-muted-foreground mb-2 truncate">{m.label}</p>
            <p className="text-xl font-bold text-foreground mb-1.5" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>{m.value}</p>
            <div className="flex items-center gap-1">
              {m.up ? <ArrowUpRight className="w-3 h-3 text-success" /> : <ArrowDownRight className="w-3 h-3 text-destructive" />}
              <span className={cn("text-[10px] font-semibold", m.up ? 'text-success' : 'text-destructive')}>{m.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-border shadow-sm p-6">
          <h2 className="text-sm font-bold text-foreground mb-6" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>Sales over time</h2>
          <div className="h-48 flex items-end gap-3">
            {chartValues.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-t-md transition-all" style={{ height: `${(v / maxVal) * 100}%`, backgroundColor: '#7C3AED', minHeight: 8 }} />
                <span className="text-[10px] text-muted-foreground">{chartDays[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sessions by device */}
        <div className="bg-white rounded-xl border border-border shadow-sm p-6">
          <h2 className="text-sm font-bold text-foreground mb-4" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>Sessions by device</h2>
          {[
            { device: 'Mobile', pct: 64, color: '#7C3AED' },
            { device: 'Desktop', pct: 28, color: '#A78BFA' },
            { device: 'Tablet', pct: 8, color: '#C4B5FD' },
          ].map(d => (
            <div key={d.device} className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-foreground">{d.device}</span>
                <span className="text-xs font-semibold text-foreground">{d.pct}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${d.pct}%`, backgroundColor: d.color }} /></div>
            </div>
          ))}
        </div>
      </div>

      {/* Sales by referrer & Top pages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-border shadow-sm p-6">
          <h2 className="text-sm font-bold text-foreground mb-4" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>Sales by traffic source</h2>
          {[
            { source: 'Direct', value: `KES ${Math.round(revenue * 0.45).toLocaleString()}`, pct: 45 },
            { source: 'Social media', value: `KES ${Math.round(revenue * 0.25).toLocaleString()}`, pct: 25 },
            { source: 'Search', value: `KES ${Math.round(revenue * 0.18).toLocaleString()}`, pct: 18 },
            { source: 'Email', value: `KES ${Math.round(revenue * 0.12).toLocaleString()}`, pct: 12 },
          ].map(s => (
            <div key={s.source} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
              <div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#7C3AED' }} /><span className="text-sm text-foreground">{s.source}</span></div>
              <div className="text-right"><p className="text-sm font-semibold text-foreground">{s.value}</p><p className="text-[10px] text-muted-foreground">{s.pct}%</p></div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-border shadow-sm p-6">
          <h2 className="text-sm font-bold text-foreground mb-4" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>Top products by sales</h2>
          {(stats?.topProducts || []).length === 0 ? (
            <div className="text-center py-8"><p className="text-sm text-muted-foreground">No data yet</p></div>
          ) : (
            (stats?.topProducts || []).slice(0, 5).map((p: any, i: number) => (
              <div key={p.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                  <span className="text-sm text-foreground">{p.name}</span>
                </div>
                <span className="text-sm font-semibold text-foreground">KES {Number(p.price).toLocaleString()}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
