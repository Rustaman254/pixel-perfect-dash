import { Megaphone, TrendingUp, Users, Globe, Mail, Share2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MarketingPage() {
  const navigate = useNavigate();
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 mt-2 gap-4">
        <div>
           <h1 className="text-3xl font-bold text-black tracking-tight" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>Marketing</h1>
           <p className="text-[15px] text-gray-500 mt-1">Create campaigns and track your marketing performance.</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-[#0A0A0A] hover:bg-black text-white text-[13px] font-bold rounded-xl shadow-md transition-all self-start sm:self-auto">
           <Megaphone className="w-4 h-4" /> New Campaign
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { label: 'Total sessions', value: '0', icon: TrendingUp, desc: 'Track traffic to your store' },
          { label: 'Conversion rate', value: '0%', icon: Users, desc: 'Visitors who made a purchase' },
          { label: 'Top channel', value: '—', icon: Globe, desc: 'Where your traffic comes from' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-200/60 p-6 shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center group-hover:bg-[#0A0A0A] group-hover:border-black transition-colors">
                   <s.icon className="w-5 h-5 text-gray-400 group-hover:text-[#D4F655] transition-colors" />
                </div>
                <div>
                   <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-tight mb-1">{s.label}</p>
                   <p className="text-2xl font-bold text-black" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>{s.value}</p>
                </div>
            </div>
            <p className="text-[13px] text-gray-500 font-medium pt-3 border-t border-gray-100">{s.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-200/60 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-100">
           <h2 className="text-[15px] font-bold text-black uppercase tracking-widest">Create campaign</h2>
           <p className="text-[13px] text-gray-500 mt-1">Reach your customers where they are.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 bg-gray-50/30">
          {[
            { icon: Mail, title: 'Email marketing', desc: 'Send targeted emails and newsletters to your subscribers and past customers', color: '#0A0A0A', highlight: '#D4F655' },
            { icon: Share2, title: 'Social media', desc: 'Create integrated campaigns across Facebook, Instagram, and TikTok', color: '#3B82F6', highlight: '#EBF5FF' },
            { icon: Globe, title: 'Search ads', desc: 'Create Google Ads campaigns that appear when customers search for products', color: '#10B981', highlight: '#ECFDF5' },
          ].map(c => (
            <button key={c.title} className="p-8 text-left hover:bg-white transition-colors group">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm transition-transform group-hover:scale-105" style={{ backgroundColor: c.color }}>
                 <c.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-[16px] font-bold text-black mb-2">{c.title}</h3>
              <p className="text-[13px] text-gray-500 font-medium mb-6 leading-relaxed line-clamp-2">{c.desc}</p>
              <div className="flex items-center gap-2 text-[13px] font-bold text-black group-hover:underline">
                 Create campaign <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
