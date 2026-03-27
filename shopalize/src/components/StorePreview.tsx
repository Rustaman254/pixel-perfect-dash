import type { Project, StoreSection } from '@/types'

interface StorePreviewProps {
  project: Project;
  interactive?: boolean;
}

export default function StorePreview({ project, interactive = false }: StorePreviewProps) {
  const { theme, pages, products } = project;
  const sections = pages[0]?.sections || [];

  const style: React.CSSProperties = {
    fontFamily: `'${theme.fontFamily}', sans-serif`,
    color: theme.textColor,
    backgroundColor: theme.backgroundColor,
  };

  return (
    <div style={style} className="min-h-full">
      {sections.map(section => (
        <SectionRenderer
          key={section.id}
          section={section}
          theme={theme}
          products={products}
          interactive={interactive}
        />
      ))}
    </div>
  );
}

function SectionRenderer({ section, theme, products, interactive }: {
  section: StoreSection;
  theme: Project['theme'];
  products: Project['products'];
  interactive: boolean;
}) {
  const p = section.props;

  switch (section.type) {
    case 'header':
      return (
        <header className="px-4 sm:px-6 py-3 border-b flex items-center justify-between" style={{ borderColor: theme.textColor + '20' }}>
          <strong className="text-lg" style={{ color: theme.textColor }}>{String(p.storeName || 'Store')}</strong>
          <nav className="hidden sm:flex gap-4 text-sm">
            {['Shop', 'About', 'Contact'].map(link => (
              <a key={link} href="#" style={{ color: theme.primaryColor }} className="hover:opacity-80">{link}</a>
            ))}
          </nav>
          <button className="sm:hidden text-sm" style={{ color: theme.primaryColor }}>☰</button>
        </header>
      );

    case 'hero':
      return (
        <section
          className="text-center py-12 sm:py-20 px-4"
          style={{ background: `linear-gradient(135deg, ${theme.primaryColor}15, ${theme.secondaryColor}15)` }}
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4" style={{ color: theme.textColor }}>
            {String(p.title || 'Welcome')}
          </h1>
          <p className="text-base sm:text-lg mb-6 max-w-lg mx-auto" style={{ color: theme.textColor + 'aa' }}>
            {String(p.subtitle || '')}
          </p>
          {String(p.cta || '') && (
            <button
              className="px-6 py-3 rounded-lg font-medium text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: theme.primaryColor }}
            >
              {String(p.cta)}
            </button>
          )}
        </section>
      );

    case 'products': {
      const cols = Number(p.columns) || 3;
      return (
        <section className="py-10 sm:py-16 px-4 sm:px-6" id="products">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8" style={{ color: theme.textColor }}>
            {String(p.title || 'Products')}
          </h2>
          <div
            className="grid gap-4 sm:gap-6 max-w-6xl mx-auto"
            style={{ gridTemplateColumns: `repeat(${Math.min(cols, products.length || 1)}, 1fr)` }}
          >
            {products.map(product => (
              <div
                key={product.id}
                className="rounded-xl overflow-hidden border transition-shadow hover:shadow-lg"
                style={{ borderColor: theme.textColor + '15' }}
              >
                <div className="aspect-square overflow-hidden bg-gray-100">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-sm sm:text-base mb-1" style={{ color: theme.textColor }}>{product.name}</h3>
                  <p className="font-bold text-lg" style={{ color: theme.primaryColor }}>${product.price.toFixed(2)}</p>
                  <p className="text-xs mt-1 line-clamp-2" style={{ color: theme.textColor + '88' }}>{product.description}</p>
                  {interactive && (
                    <button
                      className="w-full mt-3 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
                      style={{ backgroundColor: theme.primaryColor }}
                    >
                      Add to Cart
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      );
    }

    case 'features':
      return (
        <section className="py-10 sm:py-16 px-4" style={{ backgroundColor: theme.primaryColor + '08' }}>
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8" style={{ color: theme.textColor }}>
            {String(p.title || 'Features')}
          </h2>
          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { icon: '🚀', title: 'Fast Delivery', desc: 'Get your order in 2-3 days' },
              { icon: '🔒', title: 'Secure Payment', desc: 'Your data is always protected' },
              { icon: '💚', title: 'Quality Guarantee', desc: '30-day money back guarantee' },
            ].map((f, i) => (
              <div key={i} className="text-center p-6 rounded-xl bg-white/80">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold mb-1" style={{ color: theme.textColor }}>{f.title}</h3>
                <p className="text-sm" style={{ color: theme.textColor + '88' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      );

    case 'testimonials':
      return (
        <section className="py-10 sm:py-16 px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8" style={{ color: theme.textColor }}>
            {String(p.title || 'Testimonials')}
          </h2>
          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { name: 'Sarah J.', text: '"Amazing quality and fast shipping!"', stars: 5 },
              { name: 'Mike R.', text: '"Best online shopping experience ever."', stars: 5 },
              { name: 'Emily C.', text: '"Will definitely buy again. Love it!"', stars: 5 },
            ].map((t, i) => (
              <div key={i} className="p-6 rounded-xl border" style={{ borderColor: theme.textColor + '15' }}>
                <div className="text-yellow-500 mb-2">{'★'.repeat(t.stars)}</div>
                <p className="text-sm mb-3 italic" style={{ color: theme.textColor + 'cc' }}>{t.text}</p>
                <p className="text-sm font-semibold" style={{ color: theme.textColor }}>— {t.name}</p>
              </div>
            ))}
          </div>
        </section>
      );

    case 'gallery':
      return (
        <section className="py-10 sm:py-16 px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8" style={{ color: theme.textColor }}>
            {String(p.title || 'Gallery')}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 max-w-4xl mx-auto">
            {products.slice(0, 6).map((prod, i) => (
              <div key={i} className="aspect-square rounded-xl overflow-hidden">
                <img src={prod.image} alt={prod.name} className="w-full h-full object-cover hover:scale-105 transition-transform" loading="lazy" />
              </div>
            ))}
          </div>
        </section>
      );

    case 'cta':
      return (
        <section
          className="py-12 sm:py-16 px-4 text-center"
          style={{ backgroundColor: theme.primaryColor }}
        >
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-white">{String(p.title || 'Get Started')}</h2>
          <p className="text-base mb-6 text-white/90">{String(p.text || '')}</p>
          {String(p.cta || '') && (
            <button
              className="px-6 py-3 rounded-lg font-medium transition-opacity hover:opacity-90"
              style={{ backgroundColor: theme.backgroundColor, color: theme.primaryColor }}
            >
              {String(p.cta)}
            </button>
          )}
        </section>
      );

    case 'newsletter':
      return (
        <section className="py-10 sm:py-16 px-4 text-center" style={{ backgroundColor: theme.primaryColor + '10' }}>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: theme.textColor }}>
            {String(p.title || 'Newsletter')}
          </h2>
          <p className="text-sm mb-6" style={{ color: theme.textColor + '88' }}>
            {String(p.subtitle || 'Stay updated with our latest offers')}
          </p>
          <div className="flex gap-2 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-2.5 rounded-lg border text-sm"
              style={{ borderColor: theme.textColor + '30' }}
            />
            <button
              className="px-5 py-2.5 rounded-lg text-sm font-medium text-white"
              style={{ backgroundColor: theme.primaryColor }}
            >
              Subscribe
            </button>
          </div>
        </section>
      );

    case 'faq':
      return (
        <section className="py-10 sm:py-16 px-4 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8" style={{ color: theme.textColor }}>
            {String(p.title || 'FAQ')}
          </h2>
          {[
            { q: 'How do I track my order?', a: 'You will receive a tracking email once shipped.' },
            { q: 'What is your return policy?', a: 'We offer 30-day hassle-free returns on all items.' },
            { q: 'Do you ship internationally?', a: 'Yes, we ship to over 50 countries worldwide.' },
          ].map((item, i) => (
            <div key={i} className="mb-4 border-b pb-4" style={{ borderColor: theme.textColor + '15' }}>
              <h3 className="font-semibold mb-1" style={{ color: theme.textColor }}>{item.q}</h3>
              <p className="text-sm" style={{ color: theme.textColor + '88' }}>{item.a}</p>
            </div>
          ))}
        </section>
      );

    case 'footer':
      return (
        <footer className="py-6 sm:py-8 px-4 text-center border-t" style={{ borderColor: theme.textColor + '15' }}>
          <p className="text-sm" style={{ color: theme.textColor + '88' }}>{String(p.text || '© 2024 Store')}</p>
        </footer>
      );

    default:
      return (
        <section className="py-8 px-4 text-center">
          <p className="text-sm text-muted-foreground">Unknown section: {section.type}</p>
        </section>
      );
  }
}
