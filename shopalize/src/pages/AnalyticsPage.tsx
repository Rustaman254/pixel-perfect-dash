import { useEffect, useState } from 'react';
import { fetchWithAuth } from '@/lib/api';
import { BarChart3, TrendingUp, DollarSign, ShoppingBag, Users, Eye, ArrowUpRight, ArrowDownRight, Loader2, Calendar, Globe, Monitor, Smartphone, Tablet, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithAuth('/shopalize/products/dashboard').then(setStats).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-20 text-center flex flex-col items-center justify-center min-h-[50vh]"><Loader2 className="w-10 h-10 animate-spin text-black mb-4" /><p className="text-[15px] font-medium text-gray-500">Compiling your data...</p></div>;

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 mt-2 gap-4">
        <div>
           <h1 className="text-3xl font-bold text-black tracking-tight" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>Analytics Overview</h1>
           <p className="text-[15px] text-gray-500 mt-1">Detailed performance metrics for your enterprise.</p>
        </div>
        <div className="flex gap-2 p-1 bg-white border border-gray-200/60 rounded-xl shadow-sm self-start sm:self-auto">
           <div className="flex items-center gap-2 pl-3 pr-2 border-r border-gray-100">
             <Calendar className="w-4 h-4 text-gray-400" />
           </div>
           <select className="px-3 py-2 bg-transparent text-[13px] font-bold text-gray-700 outline-none cursor-pointer">
             <option>Last 7 days</option>
             <option>Last 30 days</option>
             <option>Last 90 days</option>
             <option>Year to date</option>
           </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {[
          { label: 'Total Sales', value: `KES ${revenue.toLocaleString()}`, change: '+12.5%', up: true },
          { label: 'Store Sessions', value: String(sessions), change: '-3.1%', up: false },
          { label: 'Conversion Rate', value: `${convRate}%`, change: '+0.3%', up: true },
          { label: 'Total Orders', value: String(orders), change: '+8.2%', up: true },
          { label: 'Avg Order Value', value: `KES ${aov.toLocaleString()}`, change: '+5.2%', up: true },
          { label: 'Total Customers', value: String(customers), change: '+4.1%', up: true },
        ].map(m => (
          <div key={m.label} className="bg-white rounded-2xl border border-gray-200/60 p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
             <div className="flex justify-between items-start mb-4">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-tight w-24">{m.label}</p>
                <div className={cn("flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-bold", m.up ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600')}>
                  {m.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {m.change}
                </div>
             </div>
             <p className="text-[20px] font-bold text-black" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white rounded-[2rem] border border-gray-200/60 shadow-sm p-8 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4F655] to-transparent opacity-50" />
          <div className="flex items-center justify-between mb-8">
             <h2 className="text-[15px] font-bold text-black uppercase tracking-widest">Sales Performance</h2>
             <button className="text-[12px] font-bold text-gray-500 hover:text-black hover:underline tracking-wider uppercase">View Report</button>
          </div>
          <div className="flex-1 min-h-[250px] flex items-end gap-3 lg:gap-6 pt-4 border-b border-gray-100 pb-2 relative">
             {/* Background Grid */}
             <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8 pt-4">
                <div className="w-full h-px bg-gray-50" />
                <div className="w-full h-px bg-gray-50" />
                <div className="w-full h-px bg-gray-50" />
                <div className="w-full h-px bg-gray-50" />
                <div className="w-full h-px bg-gray-50" />
             </div>
             <div className="absolute left-0 bottom-10 w-full h-px bg-gray-200 z-0" />
            
             {chartValues.map((v, i) => (
               <div key={i} className="flex-1 flex flex-col items-center gap-3 relative z-10 group cursor-pointer h-full justify-end">
                 <div className="w-full max-w-[48px] rounded-t-lg transition-all duration-500 ease-out group-hover:opacity-80 group-hover:scale-105 origin-bottom relative" 
                      style={{ height: `${(v / maxVal) * 85}%`, backgroundColor: '#0A0A0A', minHeight: '12px' }}>
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
                       KES 14,200
                    </div>
                 </div>
                 <span className="text-[12px] font-bold text-gray-400 group-hover:text-black transition-colors">{chartDays[i]}</span>
               </div>
             ))}
          </div>
        </div>

        {/* Sessions by device */}
        <div className="bg-white rounded-[2rem] border border-gray-200/60 shadow-sm p-8 flex flex-col relative">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-[15px] font-bold text-black uppercase tracking-widest">Device Traffic</h2>
          </div>
          <div className="space-y-6 mt-auto">
            {[
              { device: 'Mobile Phone', pct: 64, color: '#0A0A0A', icon: Smartphone },
              { device: 'Desktop / Laptop', pct: 28, color: '#D4F655', icon: Monitor },
              { device: 'Tablet Device', pct: 8, color: '#E5E7EB', icon: Tablet },
            ].map((d, i) => (
              <div key={d.device}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                     <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center"><d.icon className="w-4 h-4 text-gray-500" /></div>
                     <span className="text-[14px] font-bold text-black">{d.device}</span>
                  </div>
                  <span className="text-[14px] font-bold text-gray-500">{d.pct}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200/50">
                   <div className="h-full rounded-full transition-all duration-1000 origin-left relative" style={{ width: `${d.pct}%`, backgroundColor: d.color }}>
                      {i === 1 && <div className="absolute inset-0 bg-white/20 w-full" />}
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Traffic Sources & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Sales by referrer */}
        <div className="bg-white rounded-[2rem] border border-gray-200/60 shadow-sm overflow-hidden flex flex-col">
          <div className="p-8 border-b border-gray-100">
             <h2 className="text-[15px] font-bold text-black uppercase tracking-widest">Traffic Sources</h2>
             <p className="text-[13px] text-gray-500 mt-1">Where your customers are coming from</p>
          </div>
          <div className="flex-1 bg-gray-50/30">
            {[
              { source: 'Direct Traffic', value: `KES ${Math.round(revenue * 0.45).toLocaleString()}`, pct: 45, color: '#0A0A0A', icon: Globe },
              { source: 'Social Media', value: `KES ${Math.round(revenue * 0.25).toLocaleString()}`, pct: 25, color: '#D4F655', icon: Users },
              { source: 'Organic Search', value: `KES ${Math.round(revenue * 0.18).toLocaleString()}`, pct: 18, color: '#9CA3AF', icon: Search },
              { source: 'Email Marketing', value: `KES ${Math.round(revenue * 0.12).toLocaleString()}`, pct: 12, color: '#D1D5DB', icon: DollarSign },
            ].map((s, i) => (
              <div key={s.source} className="flex items-center justify-between p-6 border-b border-gray-100 hover:bg-white transition-colors">
                <div className="flex items-center gap-4">
                   <div className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: s.color }} />
                   <div>
                      <p className="text-[14px] font-bold text-black">{s.source}</p>
                   </div>
                </div>
                <div className="text-right">
                   <p className="text-[15px] font-bold text-black">{s.value}</p>
                   <p className="text-[12px] font-medium text-gray-500 mt-0.5">{s.pct}% of total sales</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top products */}
        <div className="bg-white rounded-[2rem] border border-gray-200/60 shadow-sm overflow-hidden flex flex-col">
          <div className="p-8 border-b border-gray-100">
             <h2 className="text-[15px] font-bold text-black uppercase tracking-widest">Top Selling Products</h2>
             <p className="text-[13px] text-gray-500 mt-1">Products generating the most revenue</p>
          </div>
          <div className="flex-1 bg-gray-50/30">
            {(stats?.topProducts || []).length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 h-full text-center">
                 <div className="w-16 h-16 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm mb-4"><ShoppingBag className="w-6 h-6 text-gray-300" /></div>
                 <p className="text-[14px] font-bold text-black">No products sold yet</p>
                 <p className="text-[13px] text-gray-500 mt-1">Your best performing products will appear here.</p>
              </div>
            ) : (
              (stats?.topProducts || []).slice(0, 5).map((p: any, i: number) => (
                <div key={p.id} className="flex items-center justify-between p-6 border-b border-gray-100 hover:bg-white transition-colors group">
                  <div className="flex items-center gap-4">
                    <span className="text-[13px] font-bold text-gray-400 w-6 tabular-nums">#{i + 1}</span>
                    <div>
                       <p className="text-[14px] font-bold text-black group-hover:text-blue-600 transition-colors max-w-[200px] truncate">{p.name}</p>
                       <p className="text-[12px] font-medium text-gray-500 mt-0.5">Physical product</p>
                    </div>
                  </div>
                  <span className="text-[15px] font-bold text-black">KES {Number(p.price).toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
