import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '@/lib/api';
import {
  ShoppingBag, Package, Users, DollarSign, TrendingUp, TrendingDown,
  ArrowUpRight, Plus, ExternalLink, Loader2, Eye, RefreshCw, Percent,
  ShoppingCart, Globe, BarChart3, ArrowRight, Repeat, Target
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');

  useEffect(() => {
    setLoading(true);
    fetchWithAuth('/shopalize/products/dashboard')
      .then(setStats)
      .catch(() => setStats({ totalOrders: 0, totalProducts: 0, totalCustomers: 0, totalRevenue: 0, pendingOrders: 0, recentOrders: [], topProducts: [] }))
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) return <div className="flex items-center justify-center p-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const revenue = Number(stats?.totalRevenue || 0);
  const orders = stats?.totalOrders || 0;
  const customers = stats?.totalCustomers || 0;
  const products = stats?.totalProducts || 0;
  const sessions = Math.floor(orders * 12.5);
  const conversionRate = sessions > 0 ? ((orders / sessions) * 100).toFixed(1) : '0.0';
  const aov = orders > 0 ? Math.round(revenue / orders) : 0;
  const returningRate = customers > 0 ? '32.4' : '0.0';

  const periods = [
    { label: 'Today', value: 'today' },
    { label: 'Last 7 days', value: '7d' },
    { label: 'Last 30 days', value: '30d' },
    { label: 'Last 90 days', value: '90d' },
  ];

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-foreground" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>Dashboard</h1>
          <p className="text-sm text-muted-foreground">Overview of your store performance</p>
        </div>
        <div className="flex items-center gap-2">
          {periods.map(p => (
            <button key={p.value} onClick={() => setPeriod(p.value)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                period === p.value ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"
              )}>{p.label}</button>
          ))}
        </div>
      </div>

      {/* Total Sales Card - Hero */}
      <div className="rounded-xl p-6 text-white mb-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #5B21B6, #7C3AED)' }}>
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-16 -mt-16" />
        <div className="flex items-start justify-between relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-white/70" />
              <p className="text-white/70 text-sm font-medium">Total sales</p>
            </div>
            <p className="text-4xl font-bold tracking-tight mb-3" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>
              KES {revenue.toLocaleString()}
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 bg-white/20 px-2.5 py-1 rounded-full">
                <TrendingUp className="w-3 h-3" />
                <span className="text-xs font-semibold">+12.5%</span>
              </div>
              <span className="text-white/60 text-xs">vs previous period</span>
            </div>
          </div>
          <div className="hidden md:grid grid-cols-3 gap-6">
            <div className="text-right">
              <p className="text-white/50 text-[11px] mb-0.5">Online store</p>
              <p className="text-lg font-bold">KES {Math.round(revenue * 0.7).toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-white/50 text-[11px] mb-0.5">POS</p>
              <p className="text-lg font-bold">KES {Math.round(revenue * 0.2).toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-white/50 text-[11px] mb-0.5">Buy Button</p>
              <p className="text-lg font-bold">KES {Math.round(revenue * 0.1).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid - Shopify Style */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
        {[
          { label: 'Total sales', value: `KES ${revenue.toLocaleString()}`, change: '+12.5%', up: true, icon: DollarSign },
          { label: 'Returning customer rate', value: `${returningRate}%`, change: '+2.1%', up: true, icon: Repeat },
          { label: 'Conversion rate', value: `${conversionRate}%`, change: '+0.3%', up: true, icon: Target },
          { label: 'Average order value', value: `KES ${aov.toLocaleString()}`, change: '+5.2%', up: true, icon: ShoppingCart },
          { label: 'Total orders', value: String(orders), change: '+8.2%', up: true, icon: ShoppingBag },
          { label: 'Online store sessions', value: String(sessions), change: '-3.1%', up: false, icon: Eye },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-xl border border-border p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-medium text-muted-foreground truncate">{card.label}</p>
            </div>
            <p className="text-xl font-bold text-foreground tracking-tight mb-1.5" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>{card.value}</p>
            <div className="flex items-center gap-1">
              {card.up ? <ArrowUpRight className="w-3 h-3 text-success" /> : <TrendingDown className="w-3 h-3 text-destructive" />}
              <span className={cn("text-[10px] font-semibold", card.up ? 'text-success' : 'text-destructive')}>{card.change}</span>
              <span className="text-[10px] text-muted-foreground ml-0.5">vs prior</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-border shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 className="text-sm font-bold text-foreground" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>Recent orders</h2>
            <button onClick={() => navigate('/orders')} className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold">View all <ArrowRight className="w-3 h-3" /></button>
          </div>
          {(stats?.recentOrders || []).length === 0 ? (
            <div className="p-10 text-center">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3"><ShoppingBag className="w-6 h-6 text-muted-foreground" /></div>
              <p className="text-sm font-medium text-foreground">No orders yet</p>
              <p className="text-xs text-muted-foreground mt-1">Orders appear here when customers purchase.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead><tr className="bg-secondary/50">
                <th className="text-left px-5 py-2 text-[10px] font-semibold text-muted-foreground uppercase">Order</th>
                <th className="text-left px-5 py-2 text-[10px] font-semibold text-muted-foreground uppercase">Customer</th>
                <th className="text-left px-5 py-2 text-[10px] font-semibold text-muted-foreground uppercase">Status</th>
                <th className="text-right px-5 py-2 text-[10px] font-semibold text-muted-foreground uppercase">Total</th>
              </tr></thead>
              <tbody className="divide-y divide-border">
                {(stats?.recentOrders || []).map((o: any) => (
                  <tr key={o.id} className="hover:bg-secondary/30 cursor-pointer" onClick={() => navigate('/orders')}>
                    <td className="px-5 py-2.5 text-xs font-medium text-primary">#{o.id}</td>
                    <td className="px-5 py-2.5 text-xs text-foreground">{o.buyerName || o.buyerEmail || 'Guest'}</td>
                    <td className="px-5 py-2.5">
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase",
                        o.status === 'completed' ? 'bg-[#D6FAE8] text-success' :
                        o.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                        'bg-red-50 text-destructive'
                      )}>{o.status}</span>
                    </td>
                    <td className="px-5 py-2.5 text-right text-xs font-semibold text-foreground">KES {Number(o.amount).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Sales by channel + Top products */}
        <div className="space-y-4">
          {/* Sales by channel */}
          <div className="bg-white rounded-xl border border-border shadow-sm p-5">
            <h2 className="text-sm font-bold text-foreground mb-4" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>Sales by channel</h2>
            {[
              { name: 'Online Store', pct: 72, color: '#7C3AED' },
              { name: 'Buy Button', pct: 18, color: '#A78BFA' },
              { name: 'POS', pct: 10, color: '#C4B5FD' },
            ].map(ch => (
              <div key={ch.name} className="mb-3 last:mb-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-foreground">{ch.name}</span>
                  <span className="text-xs font-semibold text-foreground">{ch.pct}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${ch.pct}%`, backgroundColor: ch.color }} />
                </div>
              </div>
            ))}
          </div>

          {/* Top products */}
          <div className="bg-white rounded-xl border border-border shadow-sm">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-sm font-bold text-foreground" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>Top products</h2>
              <button onClick={() => navigate('/products')} className="text-xs text-primary hover:underline font-semibold">View all</button>
            </div>
            {(stats?.topProducts || []).length === 0 ? (
              <div className="p-8 text-center"><Package className="w-8 h-8 text-muted-foreground mx-auto mb-2" /><p className="text-xs text-muted-foreground">No products yet</p></div>
            ) : (
              <div className="divide-y divide-border">
                {(stats?.topProducts || []).slice(0, 5).map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between px-5 py-3 hover:bg-secondary/30">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center"><Package className="w-4 h-4 text-muted-foreground" /></div>
                      <span className="text-xs font-medium text-foreground truncate max-w-[120px]">{p.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-foreground">KES {Number(p.price).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-border shadow-sm p-5">
        <h2 className="text-sm font-bold text-foreground mb-4" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>Quick actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Add product', icon: Plus, path: '/products/new' },
            { label: 'View orders', icon: ShoppingBag, path: '/orders' },
            { label: 'Customize theme', icon: Globe, path: '/online-store' },
            { label: 'View analytics', icon: BarChart3, path: '/analytics' },
          ].map(action => (
            <button key={action.label} onClick={() => navigate(action.path)}
              className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-primary/30 hover:bg-accent transition-all group">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-accent group-hover:bg-primary/10 transition-colors">
                <action.icon className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
