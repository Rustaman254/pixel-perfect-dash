import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Check, ArrowRight } from 'lucide-react';

export default function PricingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [annual, setAnnual] = useState(true);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const plans = [
    {
      name: 'Starter',
      description: 'Everything you need to create your store and start selling.',
      price: annual ? '0' : '0',
      period: 'forever',
      features: [
        'Up to 10 products',
        'Basic Storefront templates',
        'Standard checkout',
        'Community support',
        'Shopalize subdomain (yourstore.shopalize.com)'
      ],
      buttonText: 'Start for free',
      highlighted: false
    },
    {
      name: 'Professional',
      description: 'Advanced tools to scale your brand and increase conversions.',
      price: annual ? '29' : '39',
      period: 'per month',
      features: [
        'Unlimited products',
        'Premium luxury templates (e.g. Aurum, Lumière)',
        'Custom domain integration',
        'Advanced analytics dashboard',
        'Abandoned cart recovery',
        'Priority 24/7 support'
      ],
      buttonText: 'Start free 14-day trial',
      highlighted: true
    },
    {
      name: 'Enterprise',
      description: 'Dedicated infrastructure for high-volume merchants.',
      price: 'Custom',
      period: 'reach out to sales',
      features: [
        'Everything in Professional',
        'Dedicated success manager',
        'Custom API limits',
        '99.99% uptime SLA',
        'White-glove migration',
        'B2B Wholesale channels'
      ],
      buttonText: 'Contact Sales',
      highlighted: false
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#0A0A0A] font-sans selection:bg-[#D4F655] selection:text-black pb-24">
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
            <li className={`cursor-pointer font-bold ${scrolled ? 'text-white' : 'text-black'}`}>Pricing</li>
          </ul>

          <div className="hidden md:flex items-center gap-4">
             <button onClick={() => navigate('/login')} className={`text-[15px] font-medium transition-colors ${scrolled ? 'text-white/80 hover:text-white' : 'text-gray-600 hover:text-black'}`}>Log in</button>
             <button onClick={() => navigate('/signup')} className={`px-5 py-2.5 rounded-full font-medium transition-all ${scrolled ? 'bg-[#D4F655] text-black hover:bg-white' : 'bg-black text-white hover:bg-black/80'}`}>
                Start free trial
             </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="pt-40 max-w-[1000px] mx-auto text-center px-6 mb-16">
         <h1 className="text-[56px] font-medium leading-[1.1] tracking-tight mb-6" style={{ fontFamily: 'Rebond Grotesque, sans-serif' }}>
           Pricing built for scale
         </h1>
         <p className="text-[17px] text-gray-500 max-w-2xl mx-auto leading-relaxed mb-12">
           Whether you're testing an idea or processing millions in GMV, Shopalize has a tier architected for your growth. No hidden fees.
         </p>

         {/* Billing Toggle */}
         <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-sm font-bold ${!annual ? 'text-black' : 'text-gray-400'}`}>Monthly</span>
            <button 
              onClick={() => setAnnual(!annual)}
              className="w-14 h-8 bg-[#0A0A0A] rounded-full relative transition-colors duration-300"
            >
              <div className={`w-6 h-6 bg-[#D4F655] rounded-full absolute top-1 transition-all duration-300 shadow-sm ${annual ? 'left-7 bg-[#D4F655]' : 'left-1 bg-white'}`} />
            </button>
            <span className={`text-sm font-bold flex items-center gap-2 ${annual ? 'text-black' : 'text-gray-400'}`}>
              Annually <span className="text-[10px] uppercase tracking-wider bg-[#D4F655]/20 text-black border border-[#D4F655]/50 px-2 py-0.5 rounded-full">Save 25%</span>
            </span>
         </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-[1200px] mx-auto px-6 grid md:grid-cols-3 gap-8">
         {plans.map((plan) => (
           <div 
             key={plan.name} 
             className={`rounded-[2.5rem] p-8 md:p-10 flex flex-col relative transition-transform duration-300 hover:-translate-y-2 ${
               plan.highlighted 
                 ? 'bg-[#0A0A0A] text-white shadow-2xl shadow-black/20 border-2 border-[#D4F655]/20' 
                 : 'bg-white text-black border border-gray-200/60 shadow-xl shadow-black/5'
             }`}
           >
             {plan.highlighted && (
               <div className="absolute top-0 inset-x-0 flex justify-center -mt-3.5">
                  <span className="bg-[#D4F655] text-black text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-sm">
                    Most Popular
                  </span>
               </div>
             )}
             
             <h3 className="text-2xl font-bold tracking-tight mb-3">{plan.name}</h3>
             <p className={`text-sm leading-relaxed mb-8 ${plan.highlighted ? 'text-gray-400' : 'text-gray-500'}`}>
               {plan.description}
             </p>
             
             <div className="mb-8 flex items-end gap-2">
               {plan.price === 'Custom' ? (
                 <span className="text-5xl font-medium tracking-tight">Custom</span>
               ) : (
                 <>
                   <span className="text-5xl font-medium tracking-tight">${plan.price}</span>
                   <span className={`text-sm font-medium pb-2 ${plan.highlighted ? 'text-gray-400' : 'text-gray-500'}`}>/{plan.period}</span>
                 </>
               )}
             </div>

             <button 
               onClick={() => navigate('/signup')} 
               className={`w-full py-4 rounded-xl font-bold text-[15px] flex items-center justify-center gap-2 transition-all group ${
                 plan.highlighted
                   ? 'bg-[#D4F655] text-black hover:bg-[#c1e247] shadow-lg shadow-[#D4F655]/20'
                   : 'bg-gray-100 text-black hover:bg-black hover:text-white'
               }`}
             >
               {plan.buttonText}
               {plan.highlighted && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /> }
             </button>

             <div className="mt-10 pt-8 border-t border-inherit opacity-80 flex-1">
               <ul className="space-y-4">
                 {plan.features.map((feat, i) => (
                   <li key={i} className="flex items-start gap-3">
                     <Check className={`w-5 h-5 shrink-0 ${plan.highlighted ? 'text-[#D4F655]' : 'text-black'}`} />
                     <span className={`text-sm font-medium ${plan.highlighted ? 'text-gray-300' : 'text-gray-600'}`}>{feat}</span>
                   </li>
                 ))}
               </ul>
             </div>
           </div>
         ))}
      </div>
      
      {/* Logos Strip */}
      <div className="max-w-[1000px] mx-auto mt-32 px-6 text-center">
         <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-8">Trusted by scaling brands globally</p>
         <div className="flex flex-wrap items-center justify-center gap-12 md:gap-20 opacity-40 grayscale">
            <h2 className="text-2xl font-bold font-serif italic tracking-tighter">VOGUE</h2>
            <h2 className="text-xl font-bold uppercase tracking-widest outline-text">Suprema</h2>
            <h2 className="text-2xl font-black italic tracking-tighter">NEXUS</h2>
            <h2 className="text-2xl font-serif tracking-widest relative after:content-[''] after:absolute after:bottom-1 after:left-0 after:right-0 after:h-0.5 after:bg-black">Atelier</h2>
         </div>
      </div>
    </div>
  );
}
