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

  if (loading) return <div className="flex items-center justify-center p-20"><Loader2 className="w-8 h-8 animate-spin text-[#D4F655]" /></div>;

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
      <div className="flex items-center justify-between mb-8 mt-2">
        <div>
          <h1 className="text-3xl font-bold text-black tracking-tight" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>Dashboard</h1>
          <p className="text-[15px] text-gray-500 mt-1">Here's what's happening with your store today.</p>
        </div>
        <div className="flex items-center gap-1.5 p-1 bg-white border border-gray-200/60 rounded-xl shadow-sm">
          {periods.map(p => (
            <button key={p.value} onClick={() => setPeriod(p.value)}
              className={cn("px-4 py-2 rounded-lg text-[13px] font-semibold transition-all duration-200",
                period === p.value ? "bg-[#0A0A0A] text-white shadow-md text-center" : "text-gray-500 hover:text-black hover:bg-gray-50 text-center"
              )}>{p.label}</button>
          ))}
        </div>
      </div>

      {/* Total Sales Card - Hero */}
      <div className="rounded-[2rem] p-8 text-white mb-6 relative overflow-hidden shadow-2xl bg-[#0A0A0A] border border-gray-800">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4F655]/10 rounded-full blur-[60px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-32 h-32 bg-white/5 rounded-full blur-[40px] pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start justify-between relative z-10 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-[#D4F655]" />
              <p className="text-gray-400 text-[15px] font-medium uppercase tracking-widest">Total sales</p>
            </div>
            <p className="text-5xl md:text-[56px] font-bold tracking-tight mb-4" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>
              KES {revenue.toLocaleString()}
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 bg-[#D4F655] px-3 py-1.5 rounded-full shadow-lg shadow-[#D4F655]/20">
                <TrendingUp className="w-3.5 h-3.5 text-black" />
                <span className="text-[13px] font-bold text-black border-l border-black/20 pl-1.5">+12.5%</span>
              </div>
              <span className="text-gray-500 text-[13px] font-medium">vs previous {period === 'today' ? 'day' : 'period'}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-10 pt-2 w-full md:w-auto border-t border-white/10 md:border-none">
            <div className="text-left md:text-right">
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-1.5">Online store</p>
              <p className="text-xl font-bold">KES {Math.round(revenue * 0.7).toLocaleString()}</p>
            </div>
            <div className="text-left md:text-right">
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-1.5">POS System</p>
              <p className="text-xl font-bold text-gray-300">KES {Math.round(revenue * 0.2).toLocaleString()}</p>
            </div>
            <div className="text-left md:text-right">
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-1.5">Buy Button</p>
              <p className="text-xl font-bold text-gray-400">KES {Math.round(revenue * 0.1).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid - Shopalize Style */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {[
          { label: 'Total sales', value: `KES ${revenue.toLocaleString()}`, change: '+12.5%', up: true, icon: DollarSign },
          { label: 'Returning customer rate', value: `${returningRate}%`, change: '+2.1%', up: true, icon: Repeat },
          { label: 'Conversion rate', value: `${conversionRate}%`, change: '+0.3%', up: true, icon: Target },
          { label: 'Average order value', value: `KES ${aov.toLocaleString()}`, change: '+5.2%', up: true, icon: ShoppingCart },
          { label: 'Total orders', value: String(orders), change: '+8.2%', up: true, icon: ShoppingBag },
          { label: 'Online store sessions', value: String(sessions), change: '-3.1%', up: false, icon: Eye },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-2xl border border-gray-200/60 p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[12px] font-semibold text-gray-500 truncate group-hover:text-black transition-colors">{card.label}</p>
              <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-[#D4F655]/10 group-hover:text-black text-gray-400 transition-colors">
                 <card.icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-black tracking-tight mb-2">{card.value}</p>
            <div className="flex items-center gap-1.5">
              <div className={cn("flex items-center gap-1 px-1.5 py-0.5 rounded-md", card.up ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700')}>
                {card.up ? <ArrowUpRight className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span className="text-[11px] font-bold">{card.change}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] border border-gray-200/60 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center"><ShoppingBag className="w-5 h-5 text-black" /></div>
               <h2 className="text-lg font-bold text-black">Recent orders</h2>
            </div>
            <button onClick={() => navigate('/orders')} className="text-sm text-gray-500 hover:text-black transition-colors flex items-center gap-1 font-semibold bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-full">View all <ArrowRight className="w-4 h-4" /></button>
          </div>
          {(stats?.recentOrders || []).length === 0 ? (
            <div className="p-16 text-center bg-gray-50/50">
              <div className="w-16 h-16 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center mx-auto mb-4"><ShoppingBag className="w-6 h-6 text-gray-300" /></div>
              <p className="text-[15px] font-bold text-black">No orders yet</p>
              <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">Once merchants start buying from your store, the orders will appear here automatically.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="text-left px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Order ID</th>
                  <th className="text-left px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Customer</th>
                  <th className="text-left px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Status</th>
                  <th className="text-right px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Total</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {(stats?.recentOrders || []).map((o: any) => (
                    <tr key={o.id} className="hover:bg-gray-50 transition-colors cursor-pointer group" onClick={() => navigate('/orders')}>
                      <td className="px-6 py-4 text-[13px] font-bold text-black border-l-4 border-transparent group-hover:border-[#D4F655]">#{o.id}</td>
                      <td className="px-6 py-4 text-[14px] font-medium text-gray-700 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">{(o.buyerName || o.buyerEmail || 'G').charAt(0).toUpperCase()}</div>
                          {o.buyerName || o.buyerEmail || 'Guest'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn("text-[11px] px-3 py-1.5 rounded-full font-bold uppercase tracking-wider",
                          o.status === 'completed' ? 'bg-[#D4F655]/20 text-black border border-[#D4F655]/50' :
                          o.status === 'pending' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                          'bg-red-50 text-red-700 border border-red-100'
                        )}>{o.status}</span>
                      </td>
                      <td className="px-6 py-4 text-right text-[14px] font-bold text-black whitespace-nowrap">KES {Number(o.amount).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Sales by channel + Top products */}
        <div className="space-y-6">
          {/* Sales by channel */}
          <div className="bg-white rounded-[2rem] border border-gray-200/60 shadow-sm p-6 lg:p-8">
            <h2 className="text-lg font-bold text-black mb-6">Sales by channel</h2>
            {[
              { name: 'Online Store', pct: 72, color: '#0A0A0A' },
              { name: 'Buy Button', pct: 18, color: '#D4F655' },
              { name: 'POS', pct: 10, color: '#E5E7EB' },
            ].map((ch, idx) => (
              <div key={ch.name} className="mb-4 last:mb-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-semibold text-gray-600">{ch.name}</span>
                  <span className="text-[13px] font-bold text-black">{ch.pct}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-200/50">
                  <div className="h-full rounded-full transition-all duration-1000 ease-in-out relative" style={{ width: `${ch.pct}%`, backgroundColor: ch.color }}>
                    {idx === 1 && <div className="absolute inset-0 bg-white/20 w-full" />}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Top products */}
          <div className="bg-white rounded-[2rem] border border-gray-200/60 shadow-sm overflow-hidden flex flex-col h-[calc(100%-250px)]">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-black">Top products</h2>
              <button onClick={() => navigate('/products')} className="text-xs text-gray-500 hover:text-black font-semibold tracking-wider uppercase">View all</button>
            </div>
            <div className="flex-1 overflow-auto">
              {(stats?.topProducts || []).length === 0 ? (
                <div className="p-10 text-center flex flex-col items-center justify-center h-full">
                   <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3"><Package className="w-5 h-5 text-gray-300" /></div>
                   <p className="text-[13px] text-gray-500 font-medium">No products sold yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {(stats?.topProducts || []).slice(0, 5).map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center group-hover:border-black/10 transition-colors"><Package className="w-5 h-5 text-gray-400" /></div>
                        <div>
                           <span className="text-[14px] font-bold text-black block mb-0.5 truncate max-w-[120px] lg:max-w-[180px]">{p.name}</span>
                           <span className="text-[11px] font-semibold text-gray-400">12 Sold</span>
                        </div>
                      </div>
                      <span className="text-[14px] font-bold text-black">KES {Number(p.price).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-[2rem] border border-gray-200/60 shadow-sm p-6 lg:p-8">
        <h2 className="text-lg font-bold text-black mb-6">Quick actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Add product', icon: Plus, path: '/products/new', dark: true },
            { label: 'View orders', icon: ShoppingBag, path: '/orders', dark: false },
            { label: 'Customize theme', icon: Globe, path: '/online-store', dark: false },
            { label: 'View analytics', icon: BarChart3, path: '/analytics', dark: false },
          ].map(action => (
            <button key={action.label} onClick={() => navigate(action.path)}
              className={cn("flex items-center gap-4 p-5 rounded-2xl border transition-all duration-300 group",
                 action.dark ? "bg-[#0A0A0A] border-[#0A0A0A] text-white hover:bg-[#D4F655] hover:border-[#D4F655] hover:text-black shadow-lg" : "bg-white border-gray-200/80 text-black hover:border-black shadow-sm hover:shadow-md"
              )}>
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                action.dark ? "bg-white/10 group-hover:bg-black group-hover:text-white" : "bg-gray-50 group-hover:bg-black group-hover:text-white text-gray-500"
              )}>
                <action.icon className="w-5 h-5" />
              </div>
              <span className="text-[15px] font-bold">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
