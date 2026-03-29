import { useState } from 'react';
import { 
  ArrowRight, Play, Plus, Minus, ArrowUpRight, 
  ChevronLeft, ChevronRight, TrendingUp,
  MapPin, Phone, ShoppingCart, Mail
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  import('react').then(({ useEffect }) => {
     useEffect(() => {
        const handleScroll = () => {
           setScrolled(window.scrollY > 80);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
     }, []);
  });

  const faqs = [
    {
      q: "Do I need coding skills to build my store?",
      a: "No coding skills are required! Shopalize provides an intuitive drag-and-drop builder, pre-designed templates, and easy-to-use customization tools so you can launch your store in minutes."
    },
    { 
      q: "What payment gateways are supported?", 
      a: "We integrate with over 100+ payment gateways globally, including PayPal, Stripe, Square, and Apple Pay, allowing you to accept payments from customers anywhere." 
    },
    { 
      q: "Can I use my own custom domain?", 
      a: "Absolutely. You can easily connect your existing domain or purchase a new one directly through the Shopalize dashboard to give your store a professional brand identity." 
    },
    { 
      q: "Is there a free trial available?", 
      a: "Yes, we offer a 14-day free trial with full access to all essential tools. You can build your store, add products, and even start making sales before choosing a plan." 
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#0A0A0A] font-sans selection:bg-[#D4F655] selection:text-black">
      {/* Navigation */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'py-4' : 'py-0 border-b border-gray-200/50 bg-[#F8F9FA]/90 backdrop-blur-md'}`}>
        <div className={`mx-auto flex items-center justify-between transition-all duration-300 ${scrolled ? 'max-w-[1000px] h-16 px-6 bg-[#1A1A1A] text-white rounded-[2rem] shadow-2xl shadow-black/10' : 'max-w-[1400px] h-20 px-6 bg-transparent'}`}>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className={`w-8 h-8 rounded-bl-lg rounded-tr-lg flex items-center justify-center relative shadow-sm transition-colors ${scrolled ? 'bg-white' : 'bg-[#D4F655]'}`}>
              <ShoppingCart className={`w-4 h-4 absolute top-2 left-2 ${scrolled ? 'text-black' : 'text-black'}`} />
            </div>
            <span className={`text-xl font-bold tracking-tight transition-colors ${scrolled ? 'text-white' : 'text-black'}`}>Shopalize</span>
          </div>
          
          <ul className={`hidden lg:flex items-center gap-8 text-[15px] font-medium transition-colors ${scrolled ? 'text-white/80' : 'text-gray-600'}`}>
            <li className={`cursor-pointer transition-colors ${scrolled ? 'hover:text-white' : 'hover:text-black'}`} onClick={() => navigate('/gallery')}>Themes</li>
            <li className={`cursor-pointer transition-colors ${scrolled ? 'hover:text-white' : 'hover:text-black'}`}>Pricing</li>
            <li className={`cursor-pointer transition-colors ${scrolled ? 'hover:text-white' : 'hover:text-black'}`}>Resources <span className="text-[10px] ml-1">▼</span></li>
            <li className={`cursor-pointer transition-colors ${scrolled ? 'hover:text-white' : 'hover:text-black'}`}>Integrations</li>
          </ul>

          <div className="hidden md:flex items-center gap-4">
             <button onClick={() => navigate('/login')} className={`text-[15px] font-medium transition-colors ${scrolled ? 'text-white/80 hover:text-white' : 'text-gray-600 hover:text-black'}`}>Log in</button>
             <button onClick={() => navigate('/signup')} className={`flex items-center gap-3 border px-2 py-2 pr-6 rounded-full hover:shadow-md transition-all group ${scrolled ? 'bg-[#D4F655] border-[#D4F655] text-black' : 'bg-white border-gray-200 text-black'}`}>
                <div className={`text-white p-2 rounded-full transition-colors ${scrolled ? 'bg-black text-[#D4F655] group-hover:bg-white group-hover:text-black' : 'bg-black group-hover:bg-[#D4F655] group-hover:text-black'}`}>
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <span className="text-[15px] font-medium">Start free trial</span>
             </button>
          </div>
        </div>
      </nav>

      <main className="pt-32">
        {/* Hero Section */}
        <section className="max-w-[1400px] mx-auto px-6 pb-24 grid lg:grid-cols-2 gap-16 items-center">
          <div className="max-w-2xl">
            <h1 className="text-[56px] lg:text-[72px] font-medium leading-[1.05] tracking-tight mb-8">
              The easiest way to<br/>build and grow your<br/>online store
            </h1>
            <p className="text-lg text-gray-500 mb-12 max-w-lg leading-relaxed">
              Create a stunning storefront, manage inventory, and process payments globally with the all-in-one ecommerce platform.
            </p>
            <div className="flex flex-wrap items-center gap-6">
              <button onClick={() => navigate('/signup')} className="bg-black text-white px-8 py-4 rounded-full font-medium flex items-center gap-3 hover:bg-gray-800 transition-colors">
                Start selling <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={() => navigate('/gallery')} className="font-medium flex items-center gap-2 hover:text-gray-600 transition-colors">
                View Themes
                <div className="w-8 border-b-2 border-black ml-2" />
              </button>
            </div>
            
            <div className="mt-16 flex items-center gap-8 text-sm text-gray-500 font-medium">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#D4F655]" />
                Powering next-gen retail
              </div>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full bg-gray-300 border-2 border-[#F8F9FA]" />
                  <div className="w-6 h-6 rounded-full bg-gray-400 border-2 border-[#F8F9FA]" />
                </div>
                <span>500k+ merchants</span>
              </div>
            </div>
          </div>

          <div className="relative h-[600px]">
            {/* Top Right Card */}
            <div className="absolute top-0 right-0 lg:right-10 w-[240px] h-[240px] bg-[#E8E8E8] rounded-[2rem] rounded-tl-[8rem] flex justify-end p-6">
              <div className="w-14 h-14 bg-black rounded-full flex items-center justify-center -mr-4 -mt-4 shadow-xl">
                <TrendingUp className="w-6 h-6 text-[#D4F655]" />
              </div>
            </div>

            {/* Middle Stat Card */}
            <div className="absolute top-12 right-0 lg:right-0 bg-white p-8 rounded-[2rem] shadow-xl shadow-black/5 w-[320px] z-10 border border-gray-100">
              <h3 className="text-5xl font-medium tracking-tight mb-4">$2B+</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">
                Gross merchandise volume<br/>processed securely this year
              </p>
              <div className="space-y-4">
                <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-black w-[92%]" />
                </div>
                <div className="flex items-center justify-between text-xs text-black font-medium">
                  <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#D4F655]"/> Uptime Guarantee</span>
                  <span>99.99%</span>
                </div>
              </div>
            </div>

            {/* Bottom Dark Card */}
            <div className="absolute bottom-10 right-0 lg:-right-4 bg-black text-white p-8 rounded-[2rem] w-[420px] flex justify-between items-end border border-gray-800 shadow-2xl">
              <div className="max-w-[160px]">
                <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-2">Live Analytics</div>
                <p className="font-medium text-[17px] leading-tight text-gray-200">Track sales & manage<br/>inventory efficiently</p>
              </div>
              <div className="flex items-end gap-2 h-24">
                <div className="w-8 bg-[#D4F655] rounded-t-sm h-12 truncate filter blur-[2px] opacity-80" />
                <div className="w-8 bg-[#D4F655] rounded-t-sm h-16" />
                <div className="w-8 bg-[#D4F655] rounded-t-sm h-20" />
                <div className="w-8 bg-[#D4F655] rounded-t-sm h-24 shadow-[0_0_15px_rgba(212,246,85,0.3)]" />
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Best Service */}
        <section className="max-w-[1400px] mx-auto px-6 py-24 border-t border-gray-200/60">
          <div className="grid lg:grid-cols-2 gap-16 mb-20 items-end">
            <h2 className="text-[40px] font-medium leading-[1.1] tracking-tight">
              Everything you need to<br/>succeed online
            </h2>
            <p className="text-gray-500 max-w-md leading-relaxed">
              From beautiful visual storefronts to powerful inventory management, Shopalize provides the complete, scalable toolkit for modern ecommerce brands ready to grow.
            </p>
          </div>

          <div className="grid md:grid-cols-[400px_1fr] gap-6">
            <div className="bg-black rounded-[2.5rem] p-10 text-white relative overflow-hidden flex flex-col justify-between min-h-[320px]">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
              <div className="relative z-10">
                <h3 className="text-6xl font-medium tracking-tight flex items-start gap-1">
                  10<span className="text-5xl mt-1">M</span><span className="text-[#D4F655] text-5xl mt-1">+</span>
                </h3>
                <p className="text-gray-400 mt-2">Products actively sold globally</p>
              </div>
              
              <div className="flex items-center gap-4 relative z-10">
                <div className="flex -space-x-3">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-12 h-12 rounded-full bg-gray-300 border-2 border-black overflow-hidden flex justify-center items-center">
                       <span className="text-black text-xs font-bold">S</span>
                    </div>
                  ))}
                </div>
                <div className="text-xl font-medium">+</div>
              </div>
            </div>

            <div className="bg-[#D1D1D1] rounded-[2.5rem] relative min-h-[320px] flex items-center justify-center group overflow-hidden">
               {/* Pattern overlay */}
               <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-black via-transparent to-transparent bg-[length:20px_20px]" />
               <h3 className="text-4xl font-medium tracking-[0.2em] text-white/50 z-10 mix-blend-overlay">SEE IN ACTION</h3>
               
               <button className="absolute bottom-8 right-8 w-16 h-16 bg-[#D4F655] rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                 <Play className="w-6 h-6 text-black ml-1" fill="currentColor" />
               </button>
            </div>
          </div>
        </section>

        {/* Section 3: Portfolio (Themes) */}
        <section className="bg-[#0A0A0A] text-white py-32 rounded-[3rem] mx-4 mb-24 px-6 relative overflow-hidden">
           {/* Subtle glow effect */}
           <div className="absolute top-0 left-1/4 w-1/2 h-1/2 bg-[#D4F655]/5 rounded-full blur-[120px] pointer-events-none" />
           <div className="max-w-[1400px] mx-auto relative z-10">
             <div className="max-w-3xl mb-16">
               <h2 className="text-[44px] font-medium leading-[1.15] tracking-tight">
                 Beautiful storefronts built on Shopalize to engage and convert customers.
               </h2>
             </div>

             <div className="flex flex-wrap items-center gap-3 mb-16">
                <button className="bg-[#D4F655] text-black px-6 py-2.5 rounded-full text-sm font-medium">All Themes [45]</button>
                <button className="border border-white/20 hover:border-white/50 text-white/80 px-6 py-2.5 rounded-full text-sm font-medium transition-colors">Fashion [15]</button>
                <button className="border border-white/20 hover:border-white/50 text-white/80 px-6 py-2.5 rounded-full text-sm font-medium transition-colors">Electronics [12]</button>
                <button className="border border-white/20 hover:border-white/50 text-white/80 px-6 py-2.5 rounded-full text-sm font-medium transition-colors">Beauty [18]</button>
             </div>

             <div className="grid md:grid-cols-3 gap-6">
                {/* Visual Circle Card */}
                <div onClick={() => navigate('/gallery')} className="bg-[#1A1A1A] rounded-[2rem] aspect-square flex items-center justify-center border border-white/5 group relative overflow-hidden cursor-pointer">
                   <div className="w-[80%] h-[80%] rounded-full bg-[#E8E8E8] flex items-center justify-center transition-transform duration-700 ease-out group-hover:scale-105">
                      <div className="w-24 h-24 bg-[#D4F655] rounded-full flex items-center justify-center text-black text-xs font-bold uppercase tracking-wider shadow-xl shadow-[#D4F655]/30 text-center leading-none">
                         View<br/>Gallery
                      </div>
                   </div>
                </div>

                {/* Theme Card 1 */}
                <div className="bg-[#A3A3A3] rounded-[2rem] aspect-square p-8 flex flex-col justify-end relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60" />
                  <div className="relative z-10">
                    <p className="text-white/70 text-sm mb-2 font-medium">Minimalist Fashion Theme</p>
                    <h4 className="text-white text-2xl font-medium">Aura Boutique</h4>
                  </div>
                </div>

                {/* Theme Card 2 */}
                <div className="bg-[#C4C4C4] rounded-[2rem] aspect-square p-8 flex flex-col justify-end relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60" />
                  <div className="relative z-10">
                    <p className="text-white/70 text-sm mb-2 font-medium">Tech & Gadgets Layout</p>
                    <h4 className="text-white text-2xl font-medium">Electro Future</h4>
                  </div>
                </div>
             </div>
           </div>
        </section>

        {/* Section 4: Testimonial */}
        <section className="max-w-[1200px] mx-auto px-6 py-12 mb-24">
           <h3 className="text-[32px] md:text-[40px] font-medium leading-[1.3] tracking-tight mb-16 text-center lg:text-left text-gray-800">
             "Shopalize made it incredibly easy to launch my online store. The drag-and-drop editor saved me weeks of coding, and the included analytics tools let me optimize campaigns instantly. I had my first sale within 24 hours!"
           </h3>

           <div className="flex items-center justify-between border-t border-gray-200/60 pt-8">
              <div className="flex items-center gap-4">
                 <div className="w-14 h-14 bg-gray-300 rounded-full" />
                 <div>
                   <h4 className="font-bold text-lg">Sarah K.</h4>
                   <p className="text-sm text-gray-500 font-medium">Founder, Aura Boutique</p>
                 </div>
              </div>
              
              <div className="flex items-center gap-3">
                 <button className="w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center hover:bg-black hover:text-white transition-colors">
                   <ChevronLeft className="w-5 h-5" />
                 </button>
                 <button className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center hover:bg-[#D4F655] hover:text-black transition-colors">
                   <ChevronRight className="w-5 h-5" />
                 </button>
              </div>
           </div>
        </section>

        {/* Section 5: FAQs */}
        <section className="bg-white py-24 mb-24">
          <div className="max-w-[1400px] mx-auto px-6 grid md:grid-cols-[400px_1fr] gap-16">
            <div>
              <h2 className="text-[40px] font-medium leading-[1.1] tracking-tight mb-4">
                Platform FAQs
              </h2>
              <p className="text-gray-500 mb-8 leading-relaxed text-[15px]">
                As a leading ecommerce solution, we provide robust support and straightforward answers. Our ecosystem is built to scale with your retail ambitions...
              </p>
              <button className="bg-transparent border border-gray-300 text-black px-6 py-3 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors">
                Help Center
              </button>
            </div>
            
            <div className="space-y-4">
              {faqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div key={idx} className="border-b border-gray-200/70 pb-6 mb-6 last:mb-0 last:pb-0 last:border-0 relative">
                    <button 
                      className="w-full flex items-start justify-between text-left group"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                    >
                      <h4 className={`text-[19px] pr-8 leading-snug font-medium transition-colors ${isOpen ? 'text-black' : 'text-gray-600 hover:text-black'}`}>
                        {faq.q}
                      </h4>
                      <div className="mt-1 flex-shrink-0">
                        {isOpen ? <Minus className="w-5 h-5 text-black" /> : <Plus className="w-5 h-5 text-gray-400 group-hover:text-black" />}
                      </div>
                    </button>
                    <div className={`mt-4 text-gray-500 leading-relaxed text-[15px] pr-12 transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100 max-h-[500px]' : 'opacity-0 max-h-0 overflow-hidden'}`}>
                      {faq.a}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Section 6: Features App Ecosystem */}
        <section className="max-w-[1400px] mx-auto px-6 mb-24">
           <div className="grid md:grid-cols-2 gap-10 mb-16 items-end">
              <h2 className="text-[40px] font-medium leading-[1.1] tracking-tight">
                Powerful tools to manage<br/>your store & increase<br/>revenue
              </h2>
              <div className="max-w-md ml-auto">
                 <p className="text-gray-500 mb-8 leading-relaxed text-[15px]">
                    Our robust back-end capabilities ensure that your online store is fast, secure, 
                    scalable, and responsive to user needs. Integrate seamlessly with fulfillment networks...
                 </p>
                 <button className="border border-gray-300 text-black px-6 py-2.5 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors" onClick={() => navigate('/dashboard')}>
                    View Features
                 </button>
              </div>
           </div>

           <div className="grid md:grid-cols-3 gap-6">
              {[
                { 
                  iconColor: 'bg-blue-500', 
                  title: 'Built-in Marketing & SEO Tools',
                  preview: 'Drive organic traffic automatically and generate high-converting email sequences from day one...',
                  date: 'Growth'
                },
                { 
                  iconColor: 'bg-orange-500', 
                  title: 'Advanced Store Analytics',
                  preview: 'A look into your real-time customer data shaping how you fulfill orders and re-stock inventory...',
                  date: 'Data'
                },
                { 
                  iconColor: 'bg-purple-500', 
                  title: 'Global Payments Integration',
                  preview: 'What businesses need to know to extract the maximum ROI when selling across international borders...',
                  date: 'Commerce'
                }
              ].map((card, i) => (
                <div key={i} className="bg-white rounded-[2rem] p-8 border border-gray-200/60 hover:shadow-xl transition-shadow flex flex-col justify-between group">
                   <div>
                     <div className="flex justify-between items-center mb-6">
                        <div className={`w-8 h-8 rounded-lg ${card.iconColor} flex items-center justify-center opacity-90`}>
                           <div className="w-3 h-3 bg-white/30 rounded-full" />
                        </div>
                        <span className="text-xs text-gray-400 font-medium">{card.date}</span>
                     </div>
                     <h3 className="text-xl font-medium leading-tight mb-4 group-hover:text-[#D4F655] transition-colors">{card.title}</h3>
                     <p className="text-sm text-gray-500 leading-relaxed">{card.preview}</p>
                   </div>
                   
                   <div className="mt-8 flex justify-end">
                      <button className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center group-hover:bg-[#D4F655] group-hover:text-black transition-colors">
                         <ArrowRight className="w-5 h-5 -rotate-45" />
                      </button>
                   </div>
                </div>
              ))}
           </div>
        </section>

        {/* Section 7: CTA */}
        <section className="max-w-[1400px] mx-auto px-6 mb-24">
           <div className="bg-[#0A0A0A] rounded-[3rem] p-16 md:p-24 flex flex-col md:flex-row items-center justify-between relative overflow-hidden group">
              <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-[#D4F655]/10 rounded-full blur-[100px] -translate-y-1/2" />
              <h2 className="text-4xl md:text-6xl font-medium text-white tracking-tight relative z-10 mb-8 md:mb-0">
                Ready to start selling ?
              </h2>
              <button onClick={() => navigate('/signup')} className="bg-white text-black px-8 py-4 rounded-full font-medium flex items-center gap-3 hover:bg-[#D4F655] transition-colors relative z-10 shrink-0">
                Start free trial <ArrowRight className="w-4 h-4 text-gray-500" />
              </button>
           </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white pt-20 pb-10 border-t border-gray-200/50">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-[#D4F655] rounded-bl-lg rounded-tr-lg flex items-center justify-center relative">
                  <ShoppingCart className="w-4 h-4 text-black absolute top-2 left-2" />
                </div>
                <span className="text-xl font-bold tracking-tight">Shopalize</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed max-w-sm mb-8">
                Empowering entrepreneurs to design, build, and grow global businesses. Let's create your storefront today.
              </p>
              <div className="flex items-center gap-4 text-gray-400 font-medium text-sm">
                <span className="hover:text-black cursor-pointer transition-colors">Tw</span>
                <span className="hover:text-black cursor-pointer transition-colors">Fb</span>
                <span className="hover:text-black cursor-pointer transition-colors">Ig</span>
                <span className="hover:text-black cursor-pointer transition-colors">In</span>
              </div>
            </div>

            <div className="lg:pl-12">
              <h4 className="font-medium text-[17px] mb-6 border-b border-gray-100 pb-2">Platform</h4>
              <ul className="space-y-4 text-sm text-gray-500">
                <li className="hover:text-black cursor-pointer transition-colors">Features</li>
                <li className="hover:text-black cursor-pointer transition-colors" onClick={() => navigate('/pricing')}>Pricing</li>
                <li className="hover:text-black cursor-pointer transition-colors">App Store</li>
                <li className="hover:text-black cursor-pointer transition-colors">Start Trial</li>
                <li className="hover:text-black cursor-pointer transition-colors">Log In</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-[17px] mb-6 border-b border-gray-100 pb-2">Resources</h4>
              <ul className="space-y-4 text-sm text-gray-500">
                <li className="hover:text-black cursor-pointer transition-colors">Help Center</li>
                <li className="hover:text-black cursor-pointer transition-colors">Developer Docs</li>
                <li className="hover:text-black cursor-pointer transition-colors">Community</li>
                <li className="hover:text-black cursor-pointer transition-colors">Ecommerce Blog</li>
                <li className="hover:text-black cursor-pointer transition-colors">Free Tools</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-[17px] mb-6 border-b border-gray-100 pb-2">Contact</h4>
              <ul className="space-y-5 text-sm text-gray-500">
                <li className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-gray-400 shrink-0" />
                  <span className="hover:text-black cursor-pointer transition-colors">+1 (800) 123 4567</span>
                </li>
                <li className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gray-400 shrink-0" />
                  <span className="hover:text-black cursor-pointer transition-colors">support@shopalize.com</span>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                  <span className="leading-snug">100 Tech Hub Blvd.<br/>San Francisco, CA 94107</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-gray-200/50 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-400">
            <p>© 2026 Shopalize. All rights reserved.</p>
            <div className="flex gap-6">
              <span className="hover:text-black cursor-pointer transition-colors">Privacy Policy</span>
              <span className="hover:text-black cursor-pointer transition-colors">Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
