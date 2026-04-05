import { useState } from 'react';
import { ArrowRight, CreditCard, BarChart3, ShoppingCart, Shield, Server, Users, CheckCircle2, Zap, Globe, ArrowUpRight, Menu, X } from 'lucide-react';

const PRODUCTS = [
  {
    name: "Ripplify",
    description: "Payment processing & transaction management",
    url: "https://ripplify.sokostack.xyz",
    icon: CreditCard,
    color: "from-blue-500 to-cyan-500",
    category: "Finance"
  },
  {
    name: "Shopalize",
    description: "Build online stores without coding",
    url: "https://shopalize.sokostack.xyz",
    icon: ShoppingCart,
    color: "from-orange-500 to-red-500",
    category: "Sales"
  },
  {
    name: "Watchtower",
    description: "Analytics & user behavior tracking",
    url: "https://watchtower.sokostack.xyz",
    icon: BarChart3,
    color: "from-green-500 to-emerald-500",
    category: "Intelligence"
  },
  {
    name: "Sokostack DNS",
    description: "Enterprise DNS infrastructure",
    url: "https://dns.sokostack.xyz",
    icon: Server,
    color: "from-purple-500 to-pink-500",
    category: "Infrastructure"
  },
  {
    name: "Admin Panel",
    description: "Manage users & system settings",
    url: "https://admin.sokostack.xyz",
    icon: Shield,
    color: "from-red-500 to-pink-500",
    category: "Management"
  },
  {
    name: "Authentication",
    description: "SSO & user authentication",
    url: "https://auth.sokostack.xyz",
    icon: Users,
    color: "from-teal-500 to-cyan-500",
    category: "Security"
  }
];

const FEATURES = [
  {
    title: "Lightning Fast",
    description: "All operations complete in under 90ms",
    icon: Zap,
    color: "bg-amber-500"
  },
  {
    title: "Bank-Level Security",
    description: "Enterprise encryption & SOC 2 compliance",
    icon: Shield,
    color: "bg-blue-500"
  },
  {
    title: "99.9% Uptime",
    description: "Guaranteed reliability for your business",
    icon: Server,
    color: "bg-green-500"
  },
  {
    title: "Global Scale",
    description: "195 countries supported worldwide",
    icon: Globe,
    color: "bg-purple-500"
  }
];

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#0a0e17] text-white font-sans overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative z-50 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-semibold">Sokostack</span>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <div className="relative">
                <button 
                  onMouseEnter={() => setActiveDropdown('apps')}
                  onMouseLeave={() => setActiveDropdown(null)}
                  className="text-gray-400 hover:text-white text-sm font-medium transition-colors flex items-center gap-1"
                >
                  Products
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {activeDropdown === 'apps' && (
                  <div 
                    onMouseEnter={() => setActiveDropdown('apps')}
                    onMouseLeave={() => setActiveDropdown(null)}
                    className="absolute top-full left-0 mt-2 w-[500px] bg-[#111827]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4"
                  >
                    <div className="grid grid-cols-2 gap-2">
                      {PRODUCTS.map((product) => {
                        const IconComponent = product.icon;
                        return (
                          <a
                            key={product.name}
                            href={product.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group"
                          >
                            <div className={`w-10 h-10 bg-gradient-to-br ${product.color} rounded-lg flex items-center justify-center`}>
                              <IconComponent className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <div className="font-medium text-sm">{product.name}</div>
                              <div className="text-xs text-gray-500">{product.category}</div>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Pricing</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Solutions</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Community</a>
            </nav>

            {/* CTA */}
            <div className="flex items-center gap-4">
              <a href="https://auth.sokostack.xyz/web/login" className="hidden md:block text-gray-400 hover:text-white text-sm font-medium transition-colors">
                Sign in
              </a>
              <a href="https://auth.sokostack.xyz/web/signup" className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
                Get Started
              </a>
              <button 
                onClick={() => setMenuOpen(!menuOpen)} 
                className="md:hidden text-white"
              >
                {menuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden relative z-50 bg-[#111827] border-b border-white/10 p-4">
          <div className="space-y-4">
            <a href="#" className="block text-gray-400 hover:text-white text-sm">Products</a>
            <a href="#" className="block text-gray-400 hover:text-white text-sm">Pricing</a>
            <a href="#" className="block text-gray-400 hover:text-white text-sm">Solutions</a>
            <a href="#" className="block text-gray-400 hover:text-white text-sm">Community</a>
            <a href="https://auth.sokostack.xyz/web/login" className="block text-gray-400 hover:text-white text-sm">Sign in</a>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-8">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-sm text-gray-400">Now serving 195 countries worldwide</span>
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight mb-6">
                <span className="bg-gradient-to-r from-white via-blue-100 to-gray-400 bg-clip-text text-transparent">
                  All your business
                </span>
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  on one platform
                </span>
              </h1>
              <p className="text-lg text-gray-400 mb-10 max-w-xl mx-auto lg:mx-0">
                Simple, efficient, yet affordable! Comprehensive suite of tools for payments, infrastructure, analytics, and e-commerce.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <a 
                  href="https://auth.sokostack.xyz/web/signup"
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl text-base font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  Start Free Trial <ArrowRight className="w-5 h-5" />
                </a>
                <a 
                  href="#"
                  className="w-full sm:w-auto border border-white/20 text-white px-8 py-4 rounded-xl text-base font-medium hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
                >
                  Watch Demo
                </a>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 mt-16 pt-8 border-t border-white/10">
                <div>
                  <div className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">50k+</div>
                  <div className="text-sm text-gray-500 mt-1">Active Businesses</div>
                </div>
                <div>
                  <div className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">500M+</div>
                  <div className="text-sm text-gray-500 mt-1">Transactions</div>
                </div>
                <div>
                  <div className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">99.9%</div>
                  <div className="text-sm text-gray-500 mt-1">Uptime</div>
                </div>
              </div>
            </div>

            {/* Right Content - Floating Cards */}
            <div className="relative hidden lg:block">
              {/* Main Card */}
              <div className="relative z-10 bg-gradient-to-br from-[#1a2235] to-[#111827] border border-white/10 rounded-3xl p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold">Ripplify</div>
                      <div className="text-sm text-gray-500">Payment Processing</div>
                    </div>
                  </div>
                  <span className="bg-green-500/20 text-green-400 text-xs px-3 py-1 rounded-full">Active</span>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
                    <span className="text-gray-400">Total Revenue</span>
                    <span className="font-semibold text-green-400">+$24,500</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
                    <span className="text-gray-400">Transactions</span>
                    <span className="font-semibold">1,234</span>
                  </div>
                  <div className="h-32 flex items-end gap-2">
                    {[40, 65, 45, 80, 55, 70, 90, 75, 60, 85, 70, 95].map((height, i) => (
                      <div 
                        key={i} 
                        className="flex-1 bg-gradient-to-t from-blue-500 to-purple-500 rounded-t-lg"
                        style={{ height: `${height}%` }}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-6 -right-6 bg-[#1a2235] border border-white/10 rounded-2xl p-4 shadow-xl animate-bounce" style={{ animationDuration: '3s' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">Payment Success</div>
                    <div className="text-xs text-gray-500">Just now</div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-8 -left-8 bg-[#1a2235] border border-white/10 rounded-2xl p-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">New User</div>
                    <div className="text-xs text-gray-500">2 minutes ago</div>
                  </div>
                </div>
              </div>

              {/* Decorative circles */}
              <div className="absolute top-1/2 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-2xl"></div>
              <div className="absolute bottom-0 left-1/2 w-24 h-24 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full blur-2xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="relative z-10 py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-blue-500/10 text-blue-400 text-sm font-medium rounded-full mb-4 border border-blue-500/20">
              Our Solutions
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Everything you need to scale
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Powerful tools designed to help your business grow. From payments to analytics, we've got you covered.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PRODUCTS.map((product) => {
              const IconComponent = product.icon;
              return (
                <a
                  key={product.name}
                  href={product.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative bg-gradient-to-br from-[#1a2235] to-[#111827] border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all hover:-translate-y-1"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
                  <div className="relative z-10">
                    <div className={`w-14 h-14 bg-gradient-to-br ${product.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                      <IconComponent className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-400 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed mb-4">{product.description}</p>
                    <div className="flex items-center gap-2 text-blue-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Learn more <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-20 bg-[#0d1117]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block px-4 py-1.5 bg-purple-500/10 text-purple-400 text-sm font-medium rounded-full mb-4 border border-purple-500/20">
                Why Choose Us
              </span>
              <h2 className="text-3xl lg:text-4xl font-bold mb-6">
                Built for scale,<br />designed for simplicity
              </h2>
              <div className="space-y-6">
                {FEATURES.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <div key={feature.title} className="flex gap-4">
                      <div className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{feature.title}</h3>
                        <p className="text-sm text-gray-400">{feature.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-[#1a2235] to-[#111827] border border-white/10 rounded-3xl p-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-2xl p-6 text-center">
                    <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">$0</div>
                    <div className="text-sm text-gray-500 mt-2">Setup Fees</div>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-6 text-center">
                    <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">24/7</div>
                    <div className="text-sm text-gray-500 mt-2">Support</div>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-6 text-center">
                    <div className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">API</div>
                    <div className="text-sm text-gray-500 mt-2">First Class</div>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-6 text-center">
                    <div className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">SSO</div>
                    <div className="text-sm text-gray-500 mt-2">Included</div>
                  </div>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-2xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-br from-[#1a2235] to-[#111827] border border-white/10 rounded-3xl p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-cyan-500/10"></div>
            <div className="relative z-10">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                Ready to transform your business?
              </h2>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Join thousands of businesses already using Sokostack to streamline operations and drive growth.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a 
                  href="https://auth.sokostack.xyz/web/signup"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl text-base font-medium hover:opacity-90 transition-opacity"
                >
                  Start now - It's free
                </a>
                <a 
                  href="#"
                  className="text-gray-400 hover:text-white text-base font-medium transition-colors"
                >
                  Contact sales
                </a>
              </div>
              <p className="text-sm text-gray-500 mt-6">No credit card required • Instant access</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">S</span>
                </div>
                <span className="text-xl font-semibold">Sokostack</span>
              </div>
              <p className="text-gray-500 text-sm mb-6">
                Comprehensive business suite for payments, infrastructure, analytics, and e-commerce.
              </p>
              <div className="flex gap-3">
                <a href="#" className="w-8 h-8 border border-white/10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
                  <span className="text-sm">𝕏</span>
                </a>
                <a href="#" className="w-8 h-8 border border-white/10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
                  <span className="text-sm">in</span>
                </a>
                <a href="#" className="w-8 h-8 border border-white/10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
                  <span className="text-sm">@</span>
                </a>
              </div>
            </div>

            <div>
              <div className="font-semibold mb-4">Products</div>
              <div className="space-y-3 text-sm text-gray-500">
                <a href="https://ripplify.sokostack.xyz" className="block hover:text-white transition-colors">Ripplify</a>
                <a href="https://shopalize.sokostack.xyz" className="block hover:text-white transition-colors">Shopalize</a>
                <a href="https://watchtower.sokostack.xyz" className="block hover:text-white transition-colors">Watchtower</a>
                <a href="https://dns.sokostack.xyz" className="block hover:text-white transition-colors">Sokostack DNS</a>
              </div>
            </div>

            <div>
              <div className="font-semibold mb-4">Platform</div>
              <div className="space-y-3 text-sm text-gray-500">
                <a href="https://admin.sokostack.xyz" className="block hover:text-white transition-colors">Admin Panel</a>
                <a href="https://auth.sokostack.xyz" className="block hover:text-white transition-colors">Authentication</a>
                <a href="#" className="block hover:text-white transition-colors">API Documentation</a>
                <a href="#" className="block hover:text-white transition-colors">Status Page</a>
              </div>
            </div>

            <div>
              <div className="font-semibold mb-4">Company</div>
              <div className="space-y-3 text-sm text-gray-500">
                <a href="#" className="block hover:text-white transition-colors">About Us</a>
                <a href="#" className="block hover:text-white transition-colors">Blog</a>
                <a href="#" className="block hover:text-white transition-colors">Careers</a>
                <a href="#" className="block hover:text-white transition-colors">Contact</a>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-500">
              Sokostack Inc. ©2026. All Rights Reserved.
            </div>
            <div className="flex gap-6 text-sm text-gray-500">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Security</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
