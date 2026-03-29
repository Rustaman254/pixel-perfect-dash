import { useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Combine } from 'lucide-react';

export default function IntegrationsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#0A0A0A] font-sans selection:bg-[#D4F655] selection:text-black">
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-[#F8F9FA]/90 backdrop-blur-md border-b border-gray-200/50">
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-black hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-8 h-8 bg-[#D4F655] rounded-bl-lg rounded-tr-lg flex items-center justify-center relative shadow-sm">
                <ShoppingCart className="w-4 h-4 text-black absolute top-2 left-2" />
              </div>
              <span className="text-xl font-bold tracking-tight">Shopalize Apps & Integrations</span>
            </div>
          </div>
          <button onClick={() => navigate('/signup')} className="text-[15px] font-medium text-black transition-colors px-6 py-2.5 rounded-full bg-[#D4F655] hover:scale-105">
            Get Started
          </button>
        </div>
      </nav>

      <main className="pt-32 pb-24 max-w-[1400px] mx-auto px-6">
        <div className="bg-[#0A0A0A] text-white py-24 rounded-[3rem] px-8 md:px-16 relative overflow-hidden mb-16 shadow-2xl">
          <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-[#D4F655]/10 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="max-w-3xl relative z-10 mb-12">
            <h1 className="text-[50px] md:text-[64px] font-medium leading-[1.05] tracking-tight mb-6">
              Connect the tools<br/>you already use
            </h1>
            <p className="text-gray-400 text-lg md:text-xl max-w-xl leading-relaxed">
              Enhance your store's capability with hundreds of apps seamlessly integrated into the Shopalize ecosystem.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { cat: "Marketing", name: "Mailchimp", desc: "Sync customers to a Mailchimp list automatically." },
            { cat: "Analytics", name: "Google Analytics 4", desc: "Detailed insights into conversions and user behavior." },
            { cat: "Accounting", name: "QuickBooks", desc: "Push orders and customer data into QuickBooks." },
            { cat: "Payments", name: "Stripe Connect", desc: "Accept massive volumes of international payments." },
            { cat: "Shipping", name: "ShipStation", desc: "Print shipping labels and automate fulfillment." },
            { cat: "Social", name: "Facebook Shop", desc: "Sync your catalog with FB Commerce Manager." },
            { cat: "Support", name: "Zendesk", desc: "Turn customer inquiries into support tickets seamlessly." },
            { cat: "Marketing", name: "Klaviyo", desc: "Advanced email and SMS marketing flows tailored for ecommerce." },
          ].map((app, i) => (
            <div key={i} className="bg-white rounded-[2rem] p-8 border border-gray-200/60 hover:shadow-xl transition-shadow flex flex-col justify-between group cursor-pointer">
              <div className="mb-8 flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                  <Combine className="w-5 h-5 text-gray-500" />
                </div>
                <span className="text-xs font-semibold px-3 py-1 bg-gray-100 text-gray-500 rounded-full">{app.cat}</span>
              </div>
              <div>
                <h3 className="text-xl font-medium tracking-tight mb-3 group-hover:text-[#D4F655] transition-colors">{app.name}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{app.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
