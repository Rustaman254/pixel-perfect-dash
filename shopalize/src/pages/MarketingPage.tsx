import { Megaphone, TrendingUp, Users, Globe, Mail, Share2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MarketingPage() {
  const navigate = useNavigate();
  return (
    <>
      <div className="mb-6"><h1 className="text-[22px] font-bold text-foreground" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>Marketing</h1><p className="text-sm text-muted-foreground">Create campaigns and track your marketing performance.</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total sessions', value: '0', icon: TrendingUp, desc: 'Track traffic to your store' },
          { label: 'Conversion rate', value: '0%', icon: Users, desc: 'Visitors who made a purchase' },
          { label: 'Top channel', value: '—', icon: Globe, desc: 'Where your traffic comes from' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-border p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(124,58,237,0.08)' }}><s.icon className="w-5 h-5 text-primary" /></div><div><p className="text-[10px] text-muted-foreground uppercase">{s.label}</p><p className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>{s.value}</p></div></div>
            <p className="text-xs text-muted-foreground">{s.desc}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-border shadow-sm">
        <div className="p-5 border-b border-border"><h2 className="text-sm font-bold text-foreground" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>Create campaign</h2></div>
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
          {[
            { icon: Mail, title: 'Email campaign', desc: 'Send targeted emails to your customers' },
            { icon: Share2, title: 'Social media', desc: 'Share products on social platforms' },
            { icon: Globe, title: 'Google Ads', desc: 'Create ads that appear on Google search' },
          ].map(c => (
            <button key={c.title} className="p-6 text-left hover:bg-secondary/30 transition-colors group">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: 'rgba(124,58,237,0.08)' }}><c.icon className="w-5 h-5 text-primary" /></div>
              <h3 className="text-sm font-semibold text-foreground mb-1">{c.title}</h3>
              <p className="text-xs text-muted-foreground mb-3">{c.desc}</p>
              <span className="text-xs text-primary font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">Create <ArrowRight className="w-3 h-3" /></span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
