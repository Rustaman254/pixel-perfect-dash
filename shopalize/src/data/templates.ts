import type { Template, Product } from '@/types';

const sampleProducts: Product[] = [
  { id: '1', name: 'Alpaca Wool Sweater', price: 299.99, description: 'Sustainably sourced, hand-knit alpaca blend', image: 'https://images.unsplash.com/photo-1574201635302-388dd92a4c3f?w=600&q=80', category: 'Clothing' },
  { id: '2', name: 'Silk Sleep Mask', price: 89.99, description: '100% Mulberry silk for ultimate rest', image: 'https://images.unsplash.com/photo-1582294191316-aa9f37ff7bfa?w=600&q=80', category: 'Accessories' },
  { id: '3', name: 'Ceramic Pour Over', price: 149.99, description: 'Artisan crafted coffee dripper', image: 'https://images.unsplash.com/photo-1544426541-1ed71001a1db?w=600&q=80', category: 'Home' },
  { id: '4', name: 'Minimalist Timepiece', price: 450.00, description: 'Swiss movement with Italian leather band', image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&q=80', category: 'Accessories' },
];

const defaultTheme = {
  primaryColor: '#0A0A0A',
  secondaryColor: '#27272A',
  accentColor: '#D4F655',
  backgroundColor: '#FFFFFF',
  textColor: '#0A0A0A',
  fontFamily: 'Inter',
};

export const templates: Template[] = [
  // 4 FREE THEMES
  {
    id: 'studio-base',
    name: 'Studio',
    description: 'A clean, high-contrast foundational template designed for independent creators.',
    category: 'Minimal',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80',
    isPremium: false,
    theme: { ...defaultTheme, primaryColor: '#18181b', secondaryColor: '#3f3f46' },
    products: sampleProducts,
    pages: [
      { id: 'home', name: 'Home', slug: 'index', sections: [
        { id: 'h1', type: 'header', props: { storeName: 'Studio', navLinks: ['Collections', 'New Arrivals', 'About', 'Contact'], showCart: true, showSearch: false, sticky: false } },
        { id: 'hero1', type: 'hero', props: { title: 'Modern Essentials.', subtitle: 'Curated products for everyday living.', cta: 'Shop Collection' } },
        { id: 'prod1', type: 'products', props: { title: 'Featured', columns: 3 } },
        { id: 'ft1', type: 'footer', props: { storeName: 'Studio', text: '© 2026 Studio', links: ['Privacy', 'Terms', 'Shipping'], showSocial: true } },
      ]},
      { id: 'checkout', name: 'Checkout', slug: 'checkout', sections: [
        { id: 'h1', type: 'header', props: { storeName: 'Studio', navLinks: ['Collections', 'New Arrivals', 'About', 'Contact'], showCart: true, showSearch: false, sticky: false } },
        { id: 'chk1', type: 'checkout', props: {} },
        { id: 'ft1', type: 'footer', props: { storeName: 'Studio', text: '© 2026 Studio', links: ['Privacy', 'Terms', 'Shipping'], showSocial: true } },
      ]},
    ],
  },
  {
    id: 'origin-free',
    name: 'Origin',
    description: 'An earthy, organic layout perfect for natural products and handmade goods.',
    category: 'Lifestyle',
    image: 'https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?w=800&q=80',
    isPremium: false,
    theme: { ...defaultTheme, primaryColor: '#4338CA', secondaryColor: '#3730A3', backgroundColor: '#FAFAFA' },
    products: sampleProducts,
    pages: [
      { id: 'home', name: 'Home', slug: 'index', sections: [
        { id: 'h1', type: 'header', props: { storeName: 'Origin', navLinks: ['Shop', 'About', 'Sustainability', 'Contact'], showCart: true, showSearch: false, sticky: false } },
        { id: 'hero1', type: 'hero', props: { title: 'Return to Nature.', subtitle: 'Sustainable goods crafted with care.', cta: 'Explore' } },
        { id: 'prod1', type: 'products', props: { title: 'New Arrivals', columns: 4 } },
        { id: 'test1', type: 'testimonials', props: {} },
        { id: 'ft1', type: 'footer', props: { storeName: 'Origin', text: '© 2026 Origin Goods', links: ['Privacy', 'Terms'], showSocial: true } },
      ]},
      { id: 'checkout', name: 'Checkout', slug: 'checkout', sections: [
        { id: 'h1', type: 'header', props: { storeName: 'Origin', navLinks: ['Shop', 'About', 'Sustainability', 'Contact'], showCart: true, showSearch: false, sticky: false } },
        { id: 'chk1', type: 'checkout', props: {} },
        { id: 'ft1', type: 'footer', props: { storeName: 'Origin', text: '© 2026 Origin Goods', links: ['Privacy', 'Terms'], showSocial: true } },
      ]},
    ],
  },
  {
    id: 'bold-framework',
    name: 'Bold',
    description: 'Heavy typography and striking contrast for streetwear and statement brands.',
    category: 'Fashion',
    image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800&q=80',
    isPremium: false,
    theme: { ...defaultTheme, primaryColor: '#EF4444', backgroundColor: '#09090B', textColor: '#FAFAFA' },
    products: sampleProducts,
    pages: [
      { id: 'home', name: 'Home', slug: 'index', sections: [
        { id: 'h1', type: 'header', props: { storeName: 'BOLD', navLinks: ['Drop', 'Lookbook', 'About', 'Contact'], showCart: true, showSearch: false, sticky: true, style: 'solid' } },
        { id: 'hero1', type: 'hero', props: { title: 'NEW SEASON.', subtitle: 'Unapologetic style.', cta: 'Shop Drop' } },
        { id: 'prod1', type: 'products', props: { title: 'Trending', columns: 2 } },
        { id: 'ft1', type: 'footer', props: { storeName: 'BOLD', text: '© 2026 BOLD WORLDWIDE', links: ['Privacy', 'Terms', 'Returns'], showSocial: true } },
      ]},
      { id: 'checkout', name: 'Checkout', slug: 'checkout', sections: [
        { id: 'h1', type: 'header', props: { storeName: 'BOLD', navLinks: ['Drop', 'Lookbook', 'About', 'Contact'], showCart: true, showSearch: false, sticky: true, style: 'solid' } },
        { id: 'chk1', type: 'checkout', props: {} },
        { id: 'ft1', type: 'footer', props: { storeName: 'BOLD', text: '© 2026 BOLD WORLDWIDE', links: ['Privacy', 'Terms', 'Returns'], showSocial: true } },
      ]},
    ],
  },
  {
    id: 'craft-standard',
    name: 'Craft',
    description: 'A structural, grid-based layout for artisans and specialized catalog displays.',
    category: 'Design',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80',
    isPremium: false,
    theme: { ...defaultTheme, primaryColor: '#2563EB', backgroundColor: '#F3F4F6' },
    products: sampleProducts,
    pages: [
      { id: 'home', name: 'Home', slug: 'index', sections: [
        { id: 'h1', type: 'header', props: { storeName: 'Craft', navLinks: ['Catalog', 'Workshop', 'About', 'Contact'], showCart: true, showSearch: false, sticky: false } },
        { id: 'hero1', type: 'hero', props: { title: 'Precision & Form', subtitle: 'Tools for the modern maker', cta: 'View Catalog' } },
        { id: 'feat1', type: 'features', props: {} },
        { id: 'prod1', type: 'products', props: { title: 'Top Rated', columns: 3 } },
        { id: 'ft1', type: 'footer', props: { storeName: 'Craft', text: '© 2026 Craft', links: ['Privacy', 'Terms'], showSocial: true } },
      ]},
      { id: 'checkout', name: 'Checkout', slug: 'checkout', sections: [
        { id: 'h1', type: 'header', props: { storeName: 'Craft', navLinks: ['Catalog', 'Workshop', 'About', 'Contact'], showCart: true, showSearch: false, sticky: false } },
        { id: 'chk1', type: 'checkout', props: {} },
        { id: 'ft1', type: 'footer', props: { storeName: 'Craft', text: '© 2026 Craft', links: ['Privacy', 'Terms'], showSocial: true } },
      ]},
    ],
  },
  
  // PREMIUM THEMES
  {
    id: 'lumiere-pro',
    name: 'Lumière',
    description: 'A highly sophisticated, editorial-style layout for high-end luxury, jewelry, or couture fashion.',
    category: 'Luxury',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80', 
    isPremium: true,
    theme: { ...defaultTheme, primaryColor: '#1c1917', secondaryColor: '#44403c', accentColor: '#d97706', backgroundColor: '#fafaf9', textColor: '#1c1917', fontFamily: 'Playfair Display' },
    products: sampleProducts,
    pages: [
      { id: 'home', name: 'Home', slug: 'index', sections: [
        { id: 'h1', type: 'header', props: { storeName: 'LUMIÈRE', navLinks: ['Collections', 'Maison', 'Heritage', 'Art of Living'], showCart: true, showSearch: false, sticky: false, style: 'editorial', font: 'editorial' } },
        { id: 'hero1', type: 'hero', props: { title: 'Timeless Elegance', subtitle: 'Crafted with absolute precision.', cta: 'Discover', style: 'editorial' } },
        { id: 'prod1', type: 'products', props: { title: 'Signature Collection', columns: 2 } },
        { id: 'gal1', type: 'gallery', props: { title: 'The Atelier' } },
        { id: 'test1', type: 'testimonials', props: {} },
        { id: 'cta1', type: 'cta', props: { title: 'Join the Club', text: 'Exclusive access to new arrivals', cta: 'Sign Up' } },
        { id: 'ft1', type: 'footer', props: { storeName: 'LUMIÈRE', text: '© 2026 Lumière Paris', links: ['Privacy', 'Terms', 'Shipping'], showSocial: true } },
      ]},
      { id: 'checkout', name: 'Checkout', slug: 'checkout', sections: [
        { id: 'h1', type: 'header', props: { storeName: 'LUMIÈRE', navLinks: ['Collections', 'Maison', 'Heritage', 'Art of Living'], showCart: true, showSearch: false, sticky: false, style: 'editorial', font: 'editorial' } },
        { id: 'chk1', type: 'checkout', props: {} },
        { id: 'ft1', type: 'footer', props: { storeName: 'LUMIÈRE', text: '© 2026 Lumière Paris', links: ['Privacy', 'Terms', 'Shipping'], showSocial: true } },
      ]},
    ],
  },
  {
    id: 'velocity-pro',
    name: 'Velocity',
    description: 'An aggressive, high-conversion layout designed specifically for athletic apparel and technical gear.',
    category: 'Sports',
    image: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800&q=80',
    isPremium: true,
    theme: { ...defaultTheme, primaryColor: '#FAFAFA', secondaryColor: '#A1A1AA', accentColor: '#D4F655', backgroundColor: '#09090B', textColor: '#FAFAFA', fontFamily: 'Roboto' },
    products: sampleProducts,
    pages: [
      { id: 'home', name: 'Home', slug: 'index', sections: [
        { id: 'h1', type: 'header', props: { storeName: 'VELOCITY', navLinks: ['Gear', 'Training', 'Athletes', 'Support'], showCart: true, showSearch: false, sticky: true, style: 'solid' } },
        { id: 'hero1', type: 'hero', props: { title: 'OUTPERFORM.', subtitle: 'Next-generation performance wear.', cta: 'Shop Gear' } },
        { id: 'prod1', type: 'products', props: { title: 'Latest Drops', columns: 4 } },
        { id: 'feat1', type: 'features', props: {} },
        { id: 'ft1', type: 'footer', props: { storeName: 'VELOCITY', text: '© 2026 Velocity Systems', links: ['Privacy', 'Terms', 'Returns'], showSocial: true } },
      ]},
      { id: 'checkout', name: 'Checkout', slug: 'checkout', sections: [
        { id: 'h1', type: 'header', props: { storeName: 'VELOCITY', navLinks: ['Gear', 'Training', 'Athletes', 'Support'], showCart: true, showSearch: false, sticky: true, style: 'solid' } },
        { id: 'chk1', type: 'checkout', props: {} },
        { id: 'ft1', type: 'footer', props: { storeName: 'VELOCITY', text: '© 2026 Velocity Systems', links: ['Privacy', 'Terms', 'Returns'], showSocial: true } },
      ]},
    ],
  },
  {
    id: 'aesthetics-pro',
    name: 'Aesthetics',
    description: 'A soft, immersive, and sensorial layout built for premium cosmetics and wellness brands.',
    category: 'Beauty',
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80',
    isPremium: true,
    theme: { ...defaultTheme, primaryColor: '#FDF2F8', secondaryColor: '#FBCFE8', accentColor: '#DB2777', backgroundColor: '#FFF1F2', textColor: '#4C1D95', fontFamily: 'Montserrat' },
    products: sampleProducts,
    pages: [
      { id: 'home', name: 'Home', slug: 'index', sections: [
        { id: 'h1', type: 'header', props: { storeName: 'AESTHETICA', navLinks: ['Shop', 'Ingredients', 'Rituals', 'About'], showCart: true, showSearch: false, sticky: false } },
        { id: 'hero1', type: 'hero', props: { title: 'Pure Radiance', subtitle: 'Scientifically formulated skincare.', cta: 'Shop Serums' } },
        { id: 'prod1', type: 'products', props: { title: 'Bestsellers', columns: 3 } },
        { id: 'test1', type: 'testimonials', props: {} },
        { id: 'ft1', type: 'footer', props: { storeName: 'AESTHETICA', text: '© 2026 Aesthetica Labs', links: ['Privacy', 'Terms', 'Ingredients'], showSocial: true } },
      ]},
      { id: 'checkout', name: 'Checkout', slug: 'checkout', sections: [
        { id: 'h1', type: 'header', props: { storeName: 'AESTHETICA', navLinks: ['Shop', 'Ingredients', 'Rituals', 'About'], showCart: true, showSearch: false, sticky: false } },
        { id: 'chk1', type: 'checkout', props: {} },
        { id: 'ft1', type: 'footer', props: { storeName: 'AESTHETICA', text: '© 2026 Aesthetica Labs', links: ['Privacy', 'Terms', 'Ingredients'], showSocial: true } },
      ]},
    ],
  },
  {
    id: 'momentum-pro',
    name: 'Momentum',
    description: 'A tech-forward, futuristic layout designed for consumer electronics and digital goods.',
    category: 'Technology',
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80',
    isPremium: true,
    theme: { ...defaultTheme, primaryColor: '#3B82F6', secondaryColor: '#1D4ED8', accentColor: '#10B981', backgroundColor: '#020617', textColor: '#F8FAFC', fontFamily: 'Inter' },
    products: sampleProducts,
    pages: [
      { id: 'home', name: 'Home', slug: 'index', sections: [
        { id: 'h1', type: 'header', props: { storeName: 'Momentum Tech', navLinks: ['Products', 'Innovation', 'Support', 'Blog'], showCart: true, showSearch: false, sticky: true, style: 'solid' } },
        { id: 'hero1', type: 'hero', props: { title: 'Future, Now.', subtitle: 'Next-gen devices for early adopters.', cta: 'Pre-Order' } },
        { id: 'feat1', type: 'features', props: {} },
        { id: 'prod1', type: 'products', props: { title: 'Flagship Devices', columns: 3 } },
        { id: 'nl1', type: 'newsletter', props: {} },
        { id: 'ft1', type: 'footer', props: { storeName: 'Momentum', text: '© 2026 Momentum Inc.', links: ['Privacy', 'Terms', 'Warranty'], showSocial: true } },
      ]},
      { id: 'checkout', name: 'Checkout', slug: 'checkout', sections: [
        { id: 'h1', type: 'header', props: { storeName: 'Momentum Tech', navLinks: ['Products', 'Innovation', 'Support', 'Blog'], showCart: true, showSearch: false, sticky: true, style: 'solid' } },
        { id: 'chk1', type: 'checkout', props: {} },
        { id: 'ft1', type: 'footer', props: { storeName: 'Momentum', text: '© 2026 Momentum Inc.', links: ['Privacy', 'Terms', 'Warranty'], showSocial: true } },
      ]},
    ],
  },
  {
    id: 'aurum-bags',
    name: 'Aurum',
    description: 'A luxurious, tactile layout designed specifically for premium leather goods and designer bags.',
    category: 'Luxury',
    image: 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=800&q=80',
    isPremium: true,
    theme: { ...defaultTheme, primaryColor: '#451A03', secondaryColor: '#78350F', accentColor: '#D97706', backgroundColor: '#FEF3C7', textColor: '#451A03', fontFamily: 'Playfair Display' },
    products: [
      { id: 'b1', name: 'The Classic Tote', price: 850.00, description: 'Hand-stitched Italian calf leather.', image: 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=600&q=80', category: 'Bags' },
      { id: 'b2', name: 'Mini Crossbody', price: 420.00, description: 'Compact elegance for evenings out.', image: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?w=600&q=80', category: 'Bags' },
      { id: 'b3', name: 'Weekender Duffel', price: 1200.00, description: 'Spacious, durable, and sophisticated.', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80', category: 'Bags' },
    ],
    pages: [
      { id: 'home', name: 'Home', slug: 'index', sections: [
        { id: 'h1', type: 'header', props: { storeName: 'AURUM', navLinks: ['Collection', 'Craftsmanship', 'Heritage', 'Boutiques'], showCart: true, showSearch: false, sticky: false, style: 'editorial' } },
        { id: 'hero1', type: 'hero', props: { title: 'The Art of Leather', subtitle: 'Exquisite bags for the modern journey.', cta: 'Explore Aurum' } },
        { id: 'feat1', type: 'features', props: {}, blocks: [
          { id: 'f_b1', type: 'feature', props: { icon: '✨', title: 'Premium Leather', text: 'Sourced from the finest tanneries in Italy.' } },
          { id: 'f_b2', type: 'feature', props: { icon: '🧵', title: 'Hand-Stitched', text: 'Crafted by master artisans.' } },
          { id: 'f_b3', type: 'feature', props: { icon: '🛡️', title: 'Lifetime Warranty', text: 'Built to last generations.' } },
        ]},
        { id: 'prod1', type: 'products', props: { title: 'The Collection', columns: 3 } },
        { id: 'ft1', type: 'footer', props: { storeName: 'AURUM', text: '© 2026 Aurum Leather Goods', links: ['Privacy', 'Terms', 'Care Guide'], showSocial: true } },
      ]},
      { id: 'checkout', name: 'Checkout', slug: 'checkout', sections: [
        { id: 'h1', type: 'header', props: { storeName: 'AURUM', navLinks: ['Collection', 'Craftsmanship', 'Heritage', 'Boutiques'], showCart: true, showSearch: false, sticky: false, style: 'editorial' } },
        { id: 'chk1', type: 'checkout', props: {} },
        { id: 'ft1', type: 'footer', props: { storeName: 'AURUM', text: '© 2026 Aurum Leather Goods', links: ['Privacy', 'Terms', 'Care Guide'], showSocial: true } },
      ]},
    ],
  }
];
