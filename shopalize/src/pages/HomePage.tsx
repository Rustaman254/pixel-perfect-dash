import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useStore } from '@/store'
import { templates } from '@/data/templates'
import { SectionWrapper } from '@/components/landing/SectionWrapper'
import { FeatureCard } from '@/components/landing/FeatureCard'
import { TestimonialCard } from '@/components/landing/TestimonialCard'
import { PricingCard } from '@/components/landing/PricingCard'
import LoginModal from '@/components/LoginModal'
import {
  ShoppingCart, ArrowRight, Sparkles, Rocket, CheckCircle2, Globe,
  Paintbrush, Settings, Users, Shield, Zap, Menu, X, Star
} from 'lucide-react'

export default function HomePage() {
  const navigate = useNavigate();
  const { createProject, canCreateProject, isLoggedIn } = useStore();
  const [showLogin, setShowLogin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleCreateStore = () => {
    if (!canCreateProject()) {
      setShowLogin(true);
      return;
    }
    navigate('/gallery');
  };

  const handleQuickStart = () => {
    if (!canCreateProject()) {
      setShowLogin(true);
      return;
    }
    const template = templates[0];
    const project = createProject(template, 'My Store');
    if (project) {
      navigate(`/editor/${project.id}`);
    } else {
      setShowLogin(true);
    }
  };

  const navLinks = [
    { label: 'Home', href: '#' },
    { label: 'Templates', href: '/gallery' },
    { label: 'Resources', href: '#features' },
    { label: 'Community', href: '#testimonials' },
    { label: 'About', href: '#about' },
  ];

  return (
    <div className="min-h-screen bg-[#0A0E21] text-white overflow-x-hidden">

      {/* ========== NAVBAR ========== */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#222222]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="#" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#8A61E0] flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white">Shopalize</span>
            </a>

            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(link => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => {
                    if (link.href.startsWith('/')) {
                      e.preventDefault();
                      navigate(link.href);
                    }
                  }}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/[0.04]"
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Button
                variant="accent"
                size="sm"
                className="rounded-full px-5"
                onClick={() => isLoggedIn ? navigate('/dashboard') : setShowLogin(true)}
              >
                Sign up
              </Button>
            </div>

            <button
              className="md:hidden p-2 text-gray-400 hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden pb-4 border-t border-white/[0.06] mt-2 pt-4 space-y-1">
              {navLinks.map(link => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => {
                    if (link.href.startsWith('/')) {
                      e.preventDefault();
                      navigate(link.href);
                    }
                    setMobileMenuOpen(false);
                  }}
                  className="block px-4 py-2.5 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-white/[0.04]"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-2 px-4">
                <Button
                  variant="accent"
                  size="sm"
                  className="w-full rounded-full"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowLogin(true);
                  }}
                >
                  Sign up
                </Button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ========== HERO SECTION ========== */}
      <SectionWrapper className="pt-12 md:pt-20 pb-0">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#8A61E0]/30 bg-[#8A61E0]/10 px-4 py-1.5 text-sm text-[#B99AE6] mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              AI-Powered Store Builder
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold leading-[1.1] tracking-tight mb-6">
              Start your dream store with{' '}
              <span className="text-[#8A61E0]">
                AI
              </span>
              .{' '}
              <br className="hidden sm:block" />
              Zero code, maximum speed.
            </h1>
            <p className="text-gray-400 text-base sm:text-lg leading-relaxed mb-8 max-w-md">
              Launch a beautiful e-commerce store in minutes. Choose a template, customize with our visual editor, and go live — no developers needed.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="accent"
                size="lg"
                className="rounded-full text-sm h-12 px-7"
                onClick={handleCreateStore}
              >
                Start free, no login
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
              <Button
                variant="accent-outline"
                size="lg"
                className="rounded-full text-sm h-12 px-7"
                onClick={handleQuickStart}
              >
                <Sparkles className="w-4 h-4 mr-1.5" />
                Start with AI
              </Button>
            </div>
            <div className="flex items-center gap-4 mt-6 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#8A61E0]" />
                No credit card
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#8A61E0]" />
                Free forever plan
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#8A61E0]" />
                3 free projects
              </span>
            </div>
          </div>

          {/* Editor mockup */}
          <div className="relative">
            <div className="relative rounded-2xl border border-white/[0.06] bg-[#222222] overflow-hidden shadow-2xl shadow-black/40">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-[#2a2a2a]">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-3 py-1 rounded-md bg-[#0A0E21] text-[11px] text-gray-500 font-mono">
                    mystore.shopalize.com
                  </div>
                </div>
              </div>
              <div className="relative bg-[#0A0E21] p-6 min-h-[320px]">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-[#8A61E0]/30" />
                      <div className="h-3 w-20 rounded bg-white/10" />
                    </div>
                    <div className="flex gap-3">
                      <div className="h-2.5 w-12 rounded bg-white/10" />
                      <div className="h-2.5 w-12 rounded bg-white/10" />
                      <div className="h-2.5 w-12 rounded bg-white/10" />
                    </div>
                  </div>
                  <div className="rounded-xl bg-[#222222] border border-white/[0.06] p-8 text-center">
                    <div className="h-5 w-48 mx-auto rounded bg-white/10 mb-3" />
                    <div className="h-3 w-64 mx-auto rounded bg-white/5 mb-5" />
                    <div className="h-9 w-28 mx-auto rounded-full bg-[#8A61E0]" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="rounded-xl border border-white/[0.06] bg-[#222222] overflow-hidden">
                        <div className="aspect-square bg-[#0A0E21]" />
                        <div className="p-3 space-y-2">
                          <div className="h-2.5 w-full rounded bg-white/10" />
                          <div className="h-2.5 w-12 rounded bg-[#8A61E0]/30" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SectionWrapper>

      {/* ========== TRUSTED BRANDS ========== */}
      <SectionWrapper className="py-16 md:py-20">
        <p className="text-center text-sm text-gray-500 mb-8 uppercase tracking-widest">
          Trusted by 10,000+ businesses worldwide
        </p>
        <div className="flex flex-wrap justify-center items-center gap-x-10 gap-y-6 opacity-40">
          {['Shopify', 'Stripe', 'Vercel', 'Notion', 'Figma', 'Linear', 'Webflow', 'Supabase'].map(brand => (
            <div key={brand} className="flex items-center gap-2 text-gray-400">
              <div className="w-5 h-5 rounded bg-current opacity-50" />
              <span className="text-sm font-medium tracking-wide">{brand}</span>
            </div>
          ))}
        </div>
      </SectionWrapper>

      {/* ========== SETUP STEPS ========== */}
      <SectionWrapper id="about">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="relative order-2 lg:order-1">
            <div className="rounded-2xl border border-white/[0.06] bg-[#222222] overflow-hidden p-6 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-[#8A61E0] flex items-center justify-center text-white text-xs font-bold">
                  S
                </div>
                <div>
                  <div className="h-2.5 w-24 rounded bg-white/15 mb-1.5" />
                  <div className="h-2 w-16 rounded bg-white/5" />
                </div>
              </div>
              <div className="space-y-3">
                {['Store Settings', 'Payment Gateway', 'Shipping Rules', 'Domain Setup'].map((item, i) => (
                  <div key={item} className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-[#0A0E21]">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${i < 2 ? 'bg-[#8A61E0]/30 text-[#8A61E0]' : 'border border-white/20'}`}>
                      {i < 2 && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                    <span className="text-sm text-gray-300">{item}</span>
                    {i < 2 && (
                      <span className="ml-auto text-xs text-[#8A61E0] bg-[#8A61E0]/10 px-2 py-0.5 rounded-full">Done</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-[#222222] px-4 py-1.5 text-sm text-gray-400 mb-6">
              <Rocket className="w-3.5 h-3.5 text-[#8A61E0]" />
              How it works
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold leading-tight mb-6">
              Set up your store in{' '}
              <span className="text-[#8A61E0]">
                3 easy steps
              </span>
            </h2>
            <p className="text-gray-400 mb-8 max-w-md leading-relaxed">
              From zero to live store in under 10 minutes. No technical skills required.
            </p>
            <div className="space-y-6">
              {[
                { step: '01', title: 'Sign up', desc: 'Create your free account in seconds. No credit card needed to get started.' },
                { step: '02', title: 'Choose features', desc: 'Pick a template and customize every detail with our drag-and-drop editor.' },
                { step: '03', title: 'Go live', desc: 'Connect your domain and hit publish. Your store is ready to sell.' },
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#8A61E0]/15 border border-[#8A61E0]/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-[#8A61E0]">{item.step}</span>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">{item.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionWrapper>

      {/* ========== FEATURES SECTION ========== */}
      <SectionWrapper id="features">
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-[#222222] px-4 py-1.5 text-sm text-gray-400 mb-5">
            <Star className="w-3.5 h-3.5 text-[#8A61E0]" />
            Features
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Everything you need to{' '}
            <span className="text-[#8A61E0]">
              sell online
            </span>
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto leading-relaxed">
            Powerful tools designed to help you build, manage, and grow your e-commerce business.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 md:gap-6">
          <FeatureCard
            icon={Rocket}
            title="Start with Shopalize"
            description="Get your store up and running in minutes with our AI-powered setup wizard. Choose from 12+ templates designed for every industry."
          />
          <FeatureCard
            icon={Settings}
            title="Site Management"
            description="Manage products, orders, and customers from one intuitive dashboard. Track analytics and optimize your store performance."
          />
          <FeatureCard
            icon={Globe}
            title="Navigation"
            description="Build intuitive menus and navigation structures. Create multi-level dropdowns, mega menus, and mobile-friendly navigation."
          />
          <FeatureCard
            icon={Paintbrush}
            title="Design & Layout"
            description="Fully customizable themes with real-time preview. Adjust colors, fonts, spacing, and layouts without touching code."
          />
          <FeatureCard
            icon={Globe}
            title="SEO Optimized"
            description="Built-in SEO tools to help your store rank higher. Auto-generated sitemaps, meta tags, and structured data."
          />
          <FeatureCard
            icon={Shield}
            title="Secure & Fast"
            description="Enterprise-grade security with SSL, PCI compliance, and lightning-fast CDN. Your store loads in under 2 seconds."
          />
        </div>
      </SectionWrapper>

      {/* ========== PRICING SECTION ========== */}
      <SectionWrapper>
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-[#222222] px-4 py-1.5 text-sm text-gray-400 mb-6">
              <Zap className="w-3.5 h-3.5 text-[#8A61E0]" />
              Pricing
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold leading-tight mb-4">
              Easy monthly paying{' '}
              <span className="text-[#8A61E0]">
                process
              </span>
            </h2>
            <p className="text-gray-400 mb-8 max-w-md leading-relaxed">
              Simple, transparent pricing that scales with your business. No hidden fees, cancel anytime.
            </p>
            <div className="space-y-4">
              {[
                'Unlimited products & bandwidth',
                'Free SSL certificate included',
                'Custom domain support',
                '24/7 customer support',
                'Advanced analytics dashboard',
                'Abandoned cart recovery',
                'Multi-currency support',
                'API access for integrations',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#8A61E0]/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#8A61E0]" />
                  </div>
                  <span className="text-sm text-gray-300">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
            <PricingCard
              title="Starter"
              price="$0"
              period="/forever"
              features={[
                { text: 'Up to 3 projects', included: true },
                { text: 'Basic templates', included: true },
                { text: 'Community support', included: true },
                { text: 'Custom domain', included: false },
                { text: 'Analytics dashboard', included: false },
              ]}
              cta="Get Started Free"
              onCtaClick={handleCreateStore}
            />
            <PricingCard
              title="Professional"
              price="$19"
              period="/month"
              features={[
                { text: 'Unlimited projects', included: true },
                { text: 'All premium templates', included: true },
                { text: 'Priority support', included: true },
                { text: 'Custom domain', included: true },
                { text: 'Analytics dashboard', included: true },
              ]}
              cta="Start Pro Trial"
              popular
              onCtaClick={() => setShowLogin(true)}
            />
          </div>
        </div>
      </SectionWrapper>

      {/* ========== TESTIMONIALS SECTION ========== */}
      <SectionWrapper id="testimonials">
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-[#222222] px-4 py-1.5 text-sm text-gray-400 mb-5">
            <Users className="w-3.5 h-3.5 text-[#8A61E0]" />
            Testimonials
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Loved by{' '}
            <span className="text-[#8A61E0]">
              store owners
            </span>
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto leading-relaxed">
            See what our customers have to say about building their stores with Shopalize.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <TestimonialCard
            name="Sarah Johnson"
            role="Founder, Bloom Boutique"
            quote="Shopalize helped me launch my fashion store in just 2 hours. The templates are gorgeous and the editor is incredibly intuitive."
            thumbnail="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600"
          />
          <TestimonialCard
            name="Marcus Chen"
            role="CEO, TechGadgets Pro"
            quote="We migrated from Shopify and couldn't be happier. The visual editor is so much better, and we saved over $200/month."
            thumbnail="https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=600"
          />
          <TestimonialCard
            name="Emily Rodriguez"
            role="Owner, Organic Living"
            quote="The AI features are mind-blowing. It generated my entire product catalog descriptions in seconds. Highly recommend!"
            thumbnail="https://images.unsplash.com/photo-1542838132-92c53300491e?w=600"
          />
        </div>
      </SectionWrapper>

      {/* ========== CTA SECTION ========== */}
      <SectionWrapper>
        <div className="relative rounded-3xl border border-white/[0.06] bg-[#222222] p-8 md:p-16 text-center overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-[#8A61E0]/10 rounded-full blur-[100px]" />
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight">
              Ready to go live?
              <br />
              Just hit{' '}
              <span className="text-[#8A61E0]">
                publish
              </span>
              .
            </h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">
              Join thousands of entrepreneurs who launched their dream stores with Shopalize.
            </p>
            <Button
              variant="accent"
              size="lg"
              className="rounded-full text-sm h-12 px-10"
              onClick={handleCreateStore}
            >
              Create Your Store Now
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </SectionWrapper>

      {/* ========== FOOTER ========== */}
      <footer className="border-t border-white/[0.06] bg-[#070a1f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-12">
            <div className="col-span-2 md:col-span-1">
              <a href="#" className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#8A61E0] flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold text-white">Shopalize</span>
              </a>
              <p className="text-sm text-gray-500 leading-relaxed mb-6 max-w-xs">
                Build beautiful e-commerce stores in minutes. No code required. Powered by AI.
              </p>
              <div className="flex gap-3">
                {[
                  { label: 'Twitter', path: 'M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z' },
                  { label: 'GitHub', path: 'M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22' },
                  { label: 'LinkedIn', path: 'M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zM4 6a2 2 0 100-4 2 2 0 000 4z' },
                  { label: 'Instagram', path: 'M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 01-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 017.8 2m-.2 2A3.6 3.6 0 004 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 003.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 110 2.5 1.25 1.25 0 010-2.5M12 7a5 5 0 110 10 5 5 0 010-10m0 2a3 3 0 100 6 3 3 0 000-6z' },
                ].map((social) => (
                  <a
                    key={social.label}
                    href="#"
                    aria-label={social.label}
                    className="w-9 h-9 rounded-lg border border-white/[0.06] bg-[#222222] flex items-center justify-center text-gray-500 hover:text-white hover:border-[#8A61E0]/30 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d={social.path} />
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Contact & About</h4>
              <ul className="space-y-2.5">
                {['About Us', 'Careers', 'Blog', 'Press Kit', 'Contact Support'].map(link => (
                  <li key={link}>
                    <a href="#" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Technical</h4>
              <ul className="space-y-2.5">
                {['Documentation', 'API Reference', 'Changelog', 'System Status', 'Integrations'].map(link => (
                  <li key={link}>
                    <a href="#" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Terms</h4>
              <ul className="space-y-2.5">
                {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'GDPR', 'Security'].map(link => (
                  <li key={link}>
                    <a href="#" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-white/[0.06] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-600">&copy; {new Date().getFullYear()} Shopalize. All rights reserved.</p>
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <a href="#" className="hover:text-gray-400 transition-colors">Privacy</a>
              <span className="text-gray-800">|</span>
              <a href="#" className="hover:text-gray-400 transition-colors">Terms</a>
              <span className="text-gray-800">|</span>
              <a href="#" className="hover:text-gray-400 transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>

      <LoginModal open={showLogin} onOpenChange={setShowLogin} />
    </div>
  );
}
