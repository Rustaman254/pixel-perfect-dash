import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  ShoppingCart, ArrowRight, Zap, Globe, Palette, BarChart3, Shield, CheckCircle2,
  Menu, X, Star, ChevronRight
} from 'lucide-react';
import { useState } from 'react';

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [mobileMenu, setMobileMenu] = useState(false);

  const features = [
    { icon: Zap, title: 'Lightning Fast', desc: 'Build your store in minutes with our intuitive builder. No coding required.' },
    { icon: Palette, title: 'Beautiful Themes', desc: 'Professionally designed templates that look stunning on every device.' },
    { icon: Globe, title: 'Sell Everywhere', desc: 'Reach customers worldwide with integrated payments and multi-currency support.' },
    { icon: BarChart3, title: 'Smart Analytics', desc: 'Track sales, understand customers, and grow with real-time insights.' },
    { icon: Shield, title: 'Secure & Reliable', desc: 'Enterprise-grade security keeps your store and customer data safe 24/7.' },
    { icon: ShoppingCart, title: 'Easy Checkout', desc: 'Frictionless checkout experience that converts visitors into loyal customers.' },
  ];

  const testimonials = [
    { name: 'Sarah K.', role: 'Fashion Store Owner', text: 'Shopalize made it incredibly easy to launch my online store. I had my first sale within 24 hours!', rating: 5 },
    { name: 'James M.', role: 'Electronics Seller', text: 'The analytics dashboard gives me insights I never had before. Sales increased by 40%.', rating: 5 },
    { name: 'Amina W.', role: 'Handmade Crafts', text: 'Beautiful templates and so easy to customize. My customers love the shopping experience.', rating: 5 },
  ];

  const purple = '#7C3AED';
  const purpleDark = '#6D28D9';

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Roobert, Helvetica Neue, sans-serif' }}>
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md z-50 border-b" style={{ borderColor: '#e2e8f0' }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <ShoppingCart className="w-7 h-7" style={{ color: purple }} />
            <span className="text-xl font-bold" style={{ color: '#333', fontFamily: 'Rebond Grotesque, sans-serif' }}>Shopalize</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm hover:text-foreground font-medium transition-colors" style={{ color: '#999' }}>Features</a>
            <a href="#testimonials" className="text-sm hover:text-foreground font-medium transition-colors" style={{ color: '#999' }}>Testimonials</a>
            <a href="#pricing" className="text-sm hover:text-foreground font-medium transition-colors" style={{ color: '#999' }}>Pricing</a>
          </div>
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <button onClick={() => navigate('/dashboard')} className="text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors" style={{ backgroundColor: purple }} onMouseEnter={e => (e.target as HTMLElement).style.backgroundColor = purpleDark} onMouseLeave={e => (e.target as HTMLElement).style.backgroundColor = purple}>Dashboard</button>
            ) : (
              <>
                <button onClick={() => navigate('/login')} className="text-sm font-medium px-4 py-2 transition-colors" style={{ color: '#333' }}>Log in</button>
                <button onClick={() => navigate('/signup')} className="text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors" style={{ backgroundColor: purple }} onMouseEnter={e => (e.target as HTMLElement).style.backgroundColor = purpleDark} onMouseLeave={e => (e.target as HTMLElement).style.backgroundColor = purple}>Start free trial</button>
              </>
            )}
          </div>
          <button className="md:hidden p-2" onClick={() => setMobileMenu(!mobileMenu)}>{mobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}</button>
        </div>
        {mobileMenu && (
          <div className="md:hidden bg-white border-t px-6 py-4 space-y-3" style={{ borderColor: '#e2e8f0' }}>
            <button onClick={() => navigate('/login')} className="w-full text-left text-sm py-2 font-medium" style={{ color: '#333' }}>Log in</button>
            <button onClick={() => navigate('/signup')} className="w-full text-white py-3 rounded-xl text-sm font-semibold" style={{ backgroundColor: purple }}>Start free trial</button>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6" style={{ background: 'linear-gradient(180deg, #f3e8ff 0%, #ffffff 100%)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6" style={{ backgroundColor: 'rgba(124,58,237,0.1)', color: purple }}>
            <Zap className="w-3 h-3" /> Launch your store in minutes
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6" style={{ color: '#1a1a1a', fontFamily: 'Rebond Grotesque, sans-serif' }}>
            The easiest way to<br /><span style={{ color: purple }}>sell online</span>
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: '#999' }}>
            Create a stunning online store, manage products, track orders, and grow your business — all from one powerful platform.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => navigate('/signup')} className="w-full sm:w-auto text-white px-8 py-4 rounded-2xl text-base font-semibold transition-all flex items-center justify-center gap-2" style={{ backgroundColor: purple, boxShadow: '0 10px 30px rgba(124,58,237,0.3)' }} onMouseEnter={e => (e.target as HTMLElement).style.backgroundColor = purpleDark} onMouseLeave={e => (e.target as HTMLElement).style.backgroundColor = purple}>
              Start free trial <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => navigate('/gallery')} className="w-full sm:w-auto bg-white px-8 py-4 rounded-2xl text-base font-semibold transition-all flex items-center justify-center gap-2" style={{ color: '#333', border: '1px solid #e2e8f0' }}>
              Browse templates <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="max-w-5xl mx-auto mt-16">
          <div className="bg-white rounded-3xl shadow-2xl border overflow-hidden" style={{ borderColor: '#e2e8f0', boxShadow: '0 25px 50px rgba(124,58,237,0.08)' }}>
            <div className="h-10 flex items-center px-4 gap-2" style={{ backgroundColor: purple }}>
              <div className="w-3 h-3 rounded-full bg-white/20" /><div className="w-3 h-3 rounded-full bg-white/20" /><div className="w-3 h-3 rounded-full bg-white/20" />
              <span className="text-white/50 text-xs ml-4">shopalize.sokostack.xyz</span>
            </div>
            <div className="p-6" style={{ backgroundColor: '#f5f7f9' }}>
              <div className="grid grid-cols-4 gap-4 mb-4">
                {['Sales', 'Orders', 'Products', 'Customers'].map((l, i) => (
                  <div key={l} className="bg-white rounded-xl p-4 border" style={{ borderColor: '#e2e8f0' }}>
                    <p className="text-[10px] font-medium mb-1" style={{ color: '#999' }}>{l}</p>
                    <p className="text-xl font-bold" style={{ color: '#333', fontFamily: 'Rebond Grotesque, sans-serif' }}>{['KES 45,200', '128', '24', '89'][i]}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 bg-white rounded-xl p-4 border" style={{ borderColor: '#e2e8f0' }}>
                  <p className="text-xs font-semibold mb-3" style={{ color: '#333' }}>Recent Orders</p>
                  {[1,2,3].map(i => (
                    <div key={i} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: '#f0f0f0' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: '#f5f7f9' }} />
                        <div><div className="h-2.5 w-20 rounded mb-1" style={{ backgroundColor: '#f5f7f9' }} /><div className="h-2 w-12 rounded" style={{ backgroundColor: '#f5f7f9' }} /></div>
                      </div>
                      <div className="h-4 w-16 rounded-full" style={{ backgroundColor: 'rgba(124,58,237,0.1)' }} />
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-xl p-4 border" style={{ borderColor: '#e2e8f0' }}>
                  <p className="text-xs font-semibold mb-3" style={{ color: '#333' }}>Quick Actions</p>
                  <div className="space-y-2">
                    {['Add product', 'View orders', 'Customize'].map(a => (
                      <div key={a} className="text-xs px-3 py-2 rounded-lg font-medium" style={{ color: purple, backgroundColor: 'rgba(124,58,237,0.05)' }}>→ {a}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#1a1a1a', fontFamily: 'Rebond Grotesque, sans-serif' }}>Everything you need to sell online</h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: '#999' }}>Powerful features designed to help you build, manage, and grow your online store.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="group p-8 rounded-2xl border transition-all duration-300 bg-white hover:shadow-xl" style={{ borderColor: '#e2e8f0' }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-colors" style={{ backgroundColor: 'rgba(124,58,237,0.08)' }}>
                  <f.icon className="w-6 h-6" style={{ color: purple }} />
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: '#1a1a1a', fontFamily: 'Rebond Grotesque, sans-serif' }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#999' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-6" style={{ backgroundColor: '#f5f7f9' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#1a1a1a', fontFamily: 'Rebond Grotesque, sans-serif' }}>Loved by entrepreneurs</h2>
            <p className="text-lg" style={{ color: '#999' }}>Join thousands of businesses growing with Shopalize.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 border hover:shadow-lg transition-shadow" style={{ borderColor: '#e2e8f0' }}>
                <div className="flex gap-1 mb-4">{Array.from({ length: t.rating }).map((_, j) => <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />)}</div>
                <p className="text-sm leading-relaxed mb-6" style={{ color: '#333' }}>"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: purple }}>{t.name.charAt(0)}</div>
                  <div><p className="text-sm font-semibold" style={{ color: '#333' }}>{t.name}</p><p className="text-xs" style={{ color: '#999' }}>{t.role}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#1a1a1a', fontFamily: 'Rebond Grotesque, sans-serif' }}>Simple, transparent pricing</h2>
          <p className="text-lg mb-12" style={{ color: '#999' }}>Start free. Upgrade when you're ready.</p>
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl p-8 border text-left" style={{ borderColor: '#e2e8f0' }}>
              <h3 className="text-lg font-bold mb-1" style={{ color: '#1a1a1a', fontFamily: 'Rebond Grotesque, sans-serif' }}>Starter</h3>
              <p className="text-sm mb-6" style={{ color: '#999' }}>Perfect for getting started</p>
              <p className="text-4xl font-bold mb-1" style={{ color: '#1a1a1a', fontFamily: 'Rebond Grotesque, sans-serif' }}>Free</p>
              <p className="text-sm mb-6" style={{ color: '#999' }}>forever</p>
              <ul className="space-y-3 mb-8">
                {['Up to 10 products', 'Basic themes', 'Order management', 'Email support'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm" style={{ color: '#999' }}><CheckCircle2 className="w-4 h-4 text-success" /> {f}</li>
                ))}
              </ul>
              <button onClick={() => navigate('/signup')} className="w-full py-3 rounded-xl border font-semibold text-sm transition-colors hover:bg-secondary" style={{ borderColor: purple, color: purple }}>Get started</button>
            </div>
            <div className="rounded-2xl p-8 text-left text-white relative overflow-hidden" style={{ backgroundColor: purple }}>
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full -mr-10 -mt-10" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
              <h3 className="text-lg font-bold mb-1" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>Pro</h3>
              <p className="text-sm text-white/70 mb-6">For growing businesses</p>
              <p className="text-4xl font-bold mb-1" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>$19</p>
              <p className="text-sm text-white/70 mb-6">per month</p>
              <ul className="space-y-3 mb-8">
                {['Unlimited products', 'Premium themes', 'Advanced analytics', 'Priority support', 'Custom domain', 'Marketing tools'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white/80"><CheckCircle2 className="w-4 h-4 text-emerald-300" /> {f}</li>
                ))}
              </ul>
              <button onClick={() => navigate('/signup')} className="w-full py-3 rounded-xl bg-white font-semibold text-sm transition-colors" style={{ color: purple }}>Start free trial</button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6" style={{ background: `linear-gradient(135deg, #5B21B6, ${purple})` }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>Ready to start selling?</h2>
          <p className="text-lg text-white/70 mb-10">Join thousands of businesses already using Shopalize.</p>
          <button onClick={() => navigate('/signup')} className="bg-white text-base font-semibold px-10 py-4 rounded-2xl transition-all flex items-center gap-2 mx-auto shadow-xl" style={{ color: purple }}>
            Create your store <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t" style={{ backgroundColor: '#f5f7f9', borderColor: '#e2e8f0' }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2"><ShoppingCart className="w-5 h-5" style={{ color: purple }} /><span className="text-sm font-bold" style={{ color: '#333', fontFamily: 'Rebond Grotesque, sans-serif' }}>Shopalize</span></div>
          <p className="text-xs" style={{ color: '#999' }}>© 2026 Shopalize by Sokostack. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
