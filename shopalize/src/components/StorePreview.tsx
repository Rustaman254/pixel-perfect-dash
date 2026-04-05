import { useState } from 'react'
import type { Project, StoreSection, Product, CartItem, AnimationStyle, SectionStyleConfig } from '@/types'
import { ShoppingCart, Eye, X, ChevronLeft, Minus, Plus, Heart, Share2, Star, Menu, Trash2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStore } from '@/store'

interface StorePreviewProps {
  project: Project;
  interactive?: boolean;
  activePageId?: string | null;
}

function getAnimClass(anim?: AnimationStyle): string {
  if (!anim || anim === 'none') return '';
  const map: Record<string, string> = {
    'fade-in': 'animate-[fade-in_0.6s_ease-out]',
    'slide-up': 'animate-[slide-up_0.6s_ease-out]',
    'slide-in-left': 'animate-[slide-in-left_0.6s_ease-out]',
    'slide-in-right': 'animate-[slide-in-right_0.6s_ease-out]',
    'zoom-in': 'animate-[zoom-in_0.5s_ease-out]',
    'bounce-in': 'animate-[bounce-in_0.8s_ease-out]',
  };
  return map[anim] || '';
}

function getSectionStyle(section: StoreSection, theme: Project['theme']): React.CSSProperties {
  const sc = section.styleConfig || {};
  const style: React.CSSProperties = {};
  if (sc.sectionBgColor) style.backgroundColor = sc.sectionBgColor;
  if (sc.sectionTextColor) style.color = sc.sectionTextColor;
  if (sc.sectionBorderRadius) style.borderRadius = `${sc.sectionBorderRadius}px`;
  return style;
}

function getSectionPadding(sc?: SectionStyleConfig): string {
  const map: Record<string, string> = {
    none: 'py-0',
    sm: 'py-6 sm:py-8',
    md: 'py-10 sm:py-14',
    lg: 'py-16 sm:py-24',
    xl: 'py-20 sm:py-32',
  };
  return map[sc?.sectionPadding || 'md'] || 'py-10 sm:py-14';
}

export default function StorePreview({ project, interactive = false, activePageId }: StorePreviewProps) {
  const { theme, pages, products } = project;
  const sections = (activePageId ? pages.find(p => p.id === activePageId) : pages[0])?.sections || [];
  const { cart, addToCart, removeFromCart, updateCartQuantity, clearCart, getCartTotal, createOrder } = useStore();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'shipping' | 'payment' | 'success'>('cart');

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = getCartTotal();

  const handleAddToCart = (product: Product, quantity: number, selectedVariants?: Record<string, string>) => {
    addToCart(product, quantity, selectedVariants);
    setSelectedProduct(null);
    setShowCart(true);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setCheckoutStep('payment');
    try {
      await createOrder(project.id, cartTotal, cart);
      setCheckoutStep('success');
      setTimeout(() => {
        clearCart();
        setShowCart(false);
        setCheckoutStep('cart');
      }, 3000);
    } catch {
      setCheckoutStep('cart');
    }
  };

  const style: React.CSSProperties = {
    fontFamily: `'${theme.fontFamily}', sans-serif`,
    color: theme.textColor,
    backgroundColor: theme.backgroundColor,
  };

  if (selectedProduct) {
    return (
      <div style={style} className="min-h-full">
        <ProductDetailView
          product={selectedProduct}
          theme={theme}
          cartCount={cartCount}
          onBack={() => setSelectedProduct(null)}
          onAddToCart={(qty, variants) => handleAddToCart(selectedProduct, qty, variants)}
          onOpenCart={() => setShowCart(true)}
        />
        {showCart && (
          <CartSidebar
            theme={theme}
            cart={cart}
            cartTotal={cartTotal}
            checkoutStep={checkoutStep}
            onClose={() => { setShowCart(false); setCheckoutStep('cart'); }}
            onUpdateQuantity={(item, qty) => updateCartQuantity(item.product.id, qty, item.selectedVariants)}
            onRemove={(item) => removeFromCart(item.product.id, item.selectedVariants)}
            onCheckout={handleCheckout}
            onSetStep={setCheckoutStep}
          />
        )}
      </div>
    );
  }

  return (
    <div style={style} className="min-h-full relative">
      {sections.map((section, idx) => {
        const globalAnim = theme.animationStyle;
        const sectionAnim = section.styleConfig?.sectionAnimation;
        const anim = sectionAnim !== 'none' ? sectionAnim : globalAnim;
        return (
          <div key={section.id} className={getSectionStyleClass(anim, idx)}>
            <SectionRenderer
              section={section}
              project={project}
              theme={theme}
              products={products}
              interactive={interactive}
              cartCount={cartCount}
              onProductClick={interactive ? setSelectedProduct : undefined}
              onOpenCart={interactive ? () => setShowCart(true) : undefined}
            />
          </div>
        );
      })}
      {showCart && interactive && (
        <CartSidebar
          theme={theme}
          cart={cart}
          cartTotal={cartTotal}
          checkoutStep={checkoutStep}
          onClose={() => { setShowCart(false); setCheckoutStep('cart'); }}
          onUpdateQuantity={(item, qty) => updateCartQuantity(item.product.id, qty, item.selectedVariants)}
          onRemove={(item) => removeFromCart(item.product.id, item.selectedVariants)}
          onCheckout={handleCheckout}
          onSetStep={setCheckoutStep}
        />
      )}
    </div>
  );
}

function getSectionStyleClass(anim?: AnimationStyle, idx: number = 0): string {
  if (!anim || anim === 'none') return '';
  const base = getAnimClass(anim);
  return `${base}`;
}

function CartSidebar({ theme, cart, cartTotal, checkoutStep, onClose, onUpdateQuantity, onRemove, onCheckout, onSetStep }: {
  theme: Project['theme'];
  cart: CartItem[];
  cartTotal: number;
  checkoutStep: 'cart' | 'shipping' | 'payment' | 'success';
  onClose: () => void;
  onUpdateQuantity: (item: CartItem, qty: number) => void;
  onRemove: (item: CartItem) => void;
  onCheckout: () => void;
  onSetStep: (step: 'cart' | 'shipping' | 'payment' | 'success') => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-white h-full flex flex-col shadow-2xl"
        style={{ animation: 'slide-in-right 0.3s ease-out', color: theme.textColor }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 sm:p-6 border-b" style={{ borderColor: theme.textColor + '10' }}>
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-5 h-5" />
            <h2 className="text-lg font-bold">
              {checkoutStep === 'cart' ? 'Your Cart' : checkoutStep === 'shipping' ? 'Shipping' : checkoutStep === 'payment' ? 'Payment' : 'Order Confirmed'}
            </h2>
            {cart.length > 0 && checkoutStep === 'cart' && (
              <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: theme.primaryColor, color: '#fff' }}>{cart.reduce((s, i) => s + i.quantity, 0)}</span>
            )}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {checkoutStep === 'success' && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: theme.primaryColor + '15' }}>
              <Check className="w-10 h-10" style={{ color: theme.primaryColor }} />
            </div>
            <h3 className="text-2xl font-bold mb-2">Order Confirmed!</h3>
            <p className="text-sm opacity-60 mb-4">Thank you for your purchase.</p>
            <p className="text-2xl font-bold" style={{ color: theme.primaryColor }}>${cartTotal.toLocaleString()}</p>
          </div>
        )}

        {checkoutStep === 'cart' && (
          <>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
                  <ShoppingCart className="w-12 h-12 mb-4" />
                  <p className="font-bold mb-1">Your cart is empty</p>
                  <p className="text-sm">Add some products to get started</p>
                </div>
              ) : (
                cart.map((item, i) => (
                  <div key={i} className="flex gap-4 p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-200 shrink-0">
                      <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm truncate">{item.product.name}</h4>
                      {item.selectedVariants && Object.entries(item.selectedVariants).map(([k, v]) => (
                        <p key={k} className="text-xs opacity-50">{k}: {v}</p>
                      ))}
                      <p className="text-sm font-bold mt-1" style={{ color: theme.primaryColor }}>${item.product.price.toLocaleString()}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <button onClick={() => onUpdateQuantity(item, item.quantity - 1)} className="w-7 h-7 rounded-lg border flex items-center justify-center hover:bg-gray-100 transition-colors">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                        <button onClick={() => onUpdateQuantity(item, item.quantity + 1)} className="w-7 h-7 rounded-lg border flex items-center justify-center hover:bg-gray-100 transition-colors">
                          <Plus className="w-3 h-3" />
                        </button>
                        <button onClick={() => onRemove(item)} className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 ml-auto transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {cart.length > 0 && (
              <div className="p-4 sm:p-6 border-t space-y-4" style={{ borderColor: theme.textColor + '10' }}>
                <div className="flex justify-between text-lg pt-2">
                  <span className="font-bold">Total</span>
                  <span className="font-bold">${cartTotal.toLocaleString()}</span>
                </div>
                <button
                  onClick={() => onSetStep('shipping')}
                  className="w-full py-4 rounded-xl text-white font-bold text-sm uppercase tracking-wider transition-all hover:opacity-90"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  Proceed to Checkout
                </button>
              </div>
            )}
          </>
        )}

        {checkoutStep === 'shipping' && (
          <>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              <div className="space-y-4">
                {['Full Name', 'Email', 'Phone', 'Address'].map(label => (
                  <div key={label}>
                    <label className="text-xs font-bold uppercase tracking-wider opacity-50 mb-1.5 block">{label}</label>
                    <input placeholder={label === 'Full Name' ? 'John Doe' : label === 'Email' ? 'john@example.com' : label === 'Phone' ? '+254 700 000 000' : '123 Main Street'} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-black outline-none transition-all text-sm" />
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 sm:p-6 border-t space-y-3" style={{ borderColor: theme.textColor + '10' }}>
              <button
                onClick={onCheckout}
                className="w-full py-4 rounded-xl text-white font-bold text-sm uppercase tracking-wider transition-all hover:opacity-90 flex items-center justify-center gap-3"
                style={{ backgroundColor: theme.primaryColor }}
              >
                <ShoppingCart className="w-4 h-4" />
                Pay ${cartTotal.toLocaleString()} with Ripplify
              </button>
              <button onClick={() => onSetStep('cart')} className="w-full py-3 text-sm font-bold opacity-50 hover:opacity-100 transition-opacity">
                Back to cart
              </button>
            </div>
          </>
        )}

        {checkoutStep === 'payment' && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mb-6" style={{ borderColor: theme.primaryColor, borderTopColor: 'transparent' }} />
            <h3 className="text-lg font-bold mb-2">Processing Payment</h3>
            <p className="text-sm opacity-60">Ripplify is securely processing your order...</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ProductDetailView({ product, theme, cartCount, onBack, onAddToCart, onOpenCart }: {
  product: Product;
  theme: Project['theme'];
  cartCount: number;
  onBack: () => void;
  onAddToCart: (quantity: number, selectedVariants?: Record<string, string>) => void;
  onOpenCart: () => void;
}) {
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  const images = product.images?.length ? product.images : [product.image];
  const variants = product.variants || [];

  return (
    <div className="min-h-full">
      <header className="px-4 sm:px-6 py-4 sm:py-5 border-b flex items-center justify-between sticky top-0 z-50 bg-white" style={{ borderColor: theme.textColor + '10' }}>
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium hover:opacity-60 transition-opacity">
          <ChevronLeft className="w-5 h-5" />
          <span className="hidden sm:inline">Back</span>
        </button>
        <strong className="text-lg sm:text-xl tracking-widest uppercase font-bold" style={{ color: theme.textColor }}>
          {theme.logoUrl ? <img src={theme.logoUrl} alt="Store" className="h-6 object-contain" /> : 'Store'}
        </strong>
        <button onClick={onOpenCart} style={{ color: theme.textColor }} className="relative">
          <ShoppingCart className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-white text-[9px] flex items-center justify-center font-bold" style={{ backgroundColor: theme.primaryColor }}>{cartCount}</span>
          )}
        </button>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
          <div className="flex-1 space-y-3 sm:space-y-4">
            <div className="aspect-square rounded-2xl sm:rounded-3xl overflow-hidden bg-gray-100">
              <img src={images[selectedImage]} alt={product.name} className="w-full h-full object-cover" />
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 sm:gap-3">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={cn(
                      "w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl overflow-hidden border-2 transition-all",
                      selectedImage === i ? "border-black" : "border-transparent opacity-60 hover:opacity-100"
                    )}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 space-y-6 sm:space-y-8">
            <div>
              <p className="text-xs sm:text-sm font-bold uppercase tracking-widest mb-2 sm:mb-3" style={{ color: theme.primaryColor }}>{product.category}</p>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-3 sm:mb-4" style={{ color: theme.textColor }}>{product.name}</h1>
              <div className="flex items-center gap-2 mb-4 sm:mb-6">
                <div className="flex text-yellow-500">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />)}
                </div>
                <span className="text-xs sm:text-sm text-gray-500">(128 reviews)</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold" style={{ color: theme.textColor }}>${product.price.toLocaleString()}</p>
            </div>

            <p className="text-sm sm:text-base leading-relaxed opacity-70" style={{ color: theme.textColor }}>{product.description}</p>

            {variants.length > 0 && (
              <div className="space-y-4 sm:space-y-6">
                {variants.map(variant => (
                  <div key={variant.id}>
                    <label className="text-xs sm:text-sm font-bold uppercase tracking-wider mb-2 sm:mb-3 block">
                      {variant.name}: <span className="font-normal opacity-60">{selectedVariants[variant.name] || 'Select'}</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {variant.options.map(option => (
                        <button
                          key={option}
                          onClick={() => setSelectedVariants(prev => ({ ...prev, [variant.name]: option }))}
                          className={cn(
                            "px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl text-sm font-bold border-2 transition-all",
                            selectedVariants[variant.name] === option ? "border-black bg-black text-white" : "border-gray-200 hover:border-gray-400"
                          )}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3 sm:gap-4">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">Quantity</span>
              <div className="flex items-center border rounded-xl" style={{ borderColor: theme.textColor + '20' }}>
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center hover:bg-gray-50 rounded-l-xl transition-colors">
                  <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
                <span className="w-10 sm:w-12 text-center font-bold text-sm sm:text-base">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center hover:bg-gray-50 rounded-r-xl transition-colors">
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => onAddToCart(quantity, Object.keys(selectedVariants).length > 0 ? selectedVariants : undefined)}
                className="flex-1 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl text-white text-sm sm:text-base font-bold uppercase tracking-wider transition-all hover:opacity-90"
                style={{ backgroundColor: theme.primaryColor }}
              >
                Add to Cart
              </button>
              <button className="w-full sm:w-12 h-12 sm:h-auto border rounded-xl sm:rounded-2xl flex items-center justify-center hover:bg-gray-50 transition-colors" style={{ borderColor: theme.textColor + '20' }}>
                <Heart className="w-5 h-5" />
              </button>
              <button className="w-full sm:w-12 h-12 sm:h-auto border rounded-xl sm:rounded-2xl flex items-center justify-center hover:bg-gray-50 transition-colors" style={{ borderColor: theme.textColor + '20' }}>
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionRenderer({ section, project, theme, products, interactive, cartCount, onProductClick, onOpenCart }: {
  section: StoreSection;
  project: Project;
  theme: Project['theme'];
  products: Project['products'];
  interactive: boolean;
  cartCount: number;
  onProductClick?: (product: Product) => void;
  onOpenCart?: () => void;
}) {
  const p = section.props;
  const sc = section.styleConfig || {};
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const sectionStyle = getSectionStyle(section, theme);
  const sectionPadding = getSectionPadding(sc);
  const sectionTextColor = sc.sectionTextColor || theme.textColor;
  const sectionAccentColor = sc.sectionAccentColor || theme.primaryColor;
  const sectionStyleVariant = sc.sectionStyle || 'default';

  switch (section.type) {
    case 'header':
    case 'navbar': {
      const isHidden = p.hidden === true || p.visible === false;
      if (isHidden) return null;

      const styleVariant = p.style || sectionStyleVariant;
      const isEditorial = styleVariant === 'editorial';
      const isMinimal = styleVariant === 'minimal';
      const isSolid = styleVariant === 'solid';
      const isTransparent = styleVariant === 'transparent';
      const storeName = String(p.storeName || project.name || 'Store');
      const navLinks: string[] = Array.isArray(p.navLinks) ? p.navLinks : ['Collections', 'New Arrivals', 'About', 'Contact'];
      const showCart = p.showCart !== false;
      const sticky = p.sticky === true || p.sticky === 'true';
      const logoUrl = (p.logoUrl as string) || theme.logoUrl;

      return (
        <header
          className={cn(
            "px-4 sm:px-6 lg:px-10 py-4 sm:py-5 border-b flex items-center justify-between relative",
            sticky && "sticky top-0 z-50",
            isEditorial && "bg-white border-none py-6 sm:py-8",
            isMinimal && "bg-transparent border-none py-4 sm:py-6",
            isSolid && "text-white py-3 sm:py-4",
            isTransparent && "backdrop-blur-md",
          )}
          style={{
            ...sectionStyle,
            backgroundColor: sc.sectionBgColor || (isSolid ? sectionAccentColor : isTransparent ? 'rgba(255,255,255,0.8)' : '#ffffff'),
            borderColor: isSolid ? 'transparent' : sectionTextColor + '10',
          }}
        >
          <button className="sm:hidden flex items-center justify-center w-8 h-8" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <Menu className="w-5 h-5" style={{ color: isSolid ? '#fff' : sectionTextColor }} />
          </button>
          {logoUrl ? (
            <img src={logoUrl} alt={storeName} className="h-6 sm:h-8 object-contain" />
          ) : (
            <strong
              className={cn("text-lg sm:text-xl tracking-widest uppercase", isEditorial ? "font-serif text-xl sm:text-2xl" : "font-bold", isMinimal ? "text-xl sm:text-2xl tracking-[0.2em]" : "")}
              style={{ color: isSolid ? '#fff' : sectionTextColor }}
            >
              {storeName}
            </strong>
          )}
          <nav className="hidden sm:flex gap-4 sm:gap-6 lg:gap-8 text-[10px] sm:text-[11px] uppercase tracking-widest font-medium">
            {navLinks.map((link: string) => (
              <a key={link} href="#" style={{ color: isSolid ? '#ffffffcc' : sectionTextColor }} className="hover:opacity-50 transition-opacity whitespace-nowrap">{link}</a>
            ))}
          </nav>
          <div className="flex items-center gap-3 sm:gap-5">
            {showCart && (
              <button onClick={onOpenCart} style={{ color: isSolid ? '#fff' : sectionTextColor }} className="relative">
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full text-white text-[8px] sm:text-[9px] flex items-center justify-center font-bold" style={{ backgroundColor: sectionAccentColor }}>{cartCount}</span>
                )}
              </button>
            )}
          </div>
          {mobileMenuOpen && (
            <div className="absolute top-full left-0 right-0 border-b shadow-lg sm:hidden z-50 py-4 px-6" style={{ backgroundColor: sc.sectionBgColor || '#ffffff' }}>
              <nav className="flex flex-col gap-3">
                {navLinks.map((link: string) => (
                  <a key={link} href="#" className="text-sm uppercase tracking-wider font-medium py-2 border-b border-gray-100" style={{ color: sectionTextColor }} onClick={() => setMobileMenuOpen(false)}>{link}</a>
                ))}
              </nav>
            </div>
          )}
        </header>
      );
    }

    case 'hero': {
      const styleVariant = p.style || sectionStyleVariant;
      const isEditorialHero = styleVariant === 'editorial';
      const isBoldHero = styleVariant === 'bold';
      const isCenteredHero = styleVariant === 'centered' || styleVariant === 'default';
      const title = String(p.title || project.name || 'Store');
      const subtitle = String(p.subtitle || 'Welcome to our store');
      const cta = String(p.cta || '');
      const ctaLink = String(p.ctaLink || '');
      const images: string[] = Array.isArray(p.images) ? p.images : [];
      const heroImage = (p.image as string) || (images.length > 0 ? images[0] : null);

      const handleCtaClick = () => {
        if (!ctaLink) return;
        if (ctaLink.startsWith('http') || ctaLink.startsWith('https')) {
          window.open(ctaLink, '_blank', 'noopener,noreferrer');
        } else if (ctaLink.startsWith('/')) {
          window.location.href = ctaLink;
        } else if (ctaLink.startsWith('#')) {
          document.querySelector(ctaLink)?.scrollIntoView({ behavior: 'smooth' });
        }
      };

      return (
        <section
          className={cn(
            sectionPadding, "px-4 relative overflow-hidden",
            isEditorialHero && "bg-white",
            isBoldHero && "min-h-[80vh] flex items-center",
            isCenteredHero && "text-center",
          )}
          style={{
            ...sectionStyle,
            background: sc.sectionBgColor || (!isEditorialHero ? `linear-gradient(135deg, ${sectionAccentColor}15, ${theme.secondaryColor}15)` : undefined),
          }}
        >
          {isEditorialHero && <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/natural-paper.png")' }} />}
          {heroImage && !isEditorialHero && (
            <div className="absolute inset-0 opacity-10">
              <img src={heroImage} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div className={cn("relative z-10 max-w-6xl mx-auto", isBoldHero ? "flex flex-col items-start" : "")} style={{ color: sectionTextColor }}>
            {images.length > 0 && (
              <div className={cn("mb-8", isCenteredHero ? "flex justify-center" : "")}>
                <div className={cn("grid gap-4", images.length === 1 ? "max-w-2xl mx-auto" : images.length === 2 ? "grid-cols-2 max-w-4xl mx-auto" : "grid-cols-3 max-w-5xl mx-auto")}>
                  {images.slice(0, 3).map((img, i) => (
                    <div key={i} className="aspect-[4/3] rounded-2xl overflow-hidden">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
            <h1 className={cn(
              "mb-4 sm:mb-6 tracking-tight",
              isEditorialHero ? "text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-serif italic" : isBoldHero ? "text-5xl sm:text-6xl md:text-7xl lg:text-9xl font-black uppercase" : "text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-bold",
            )} style={{ color: sectionTextColor }}>
              {title}
            </h1>
            <p className={cn(
              "mb-8 sm:mb-10 font-light leading-relaxed tracking-wide",
              isCenteredHero ? "text-base sm:text-lg md:text-xl max-w-2xl mx-auto px-4" : "text-lg sm:text-xl max-w-xl",
            )} style={{ color: sectionTextColor + 'aa' }}>
              {subtitle}
            </p>
            {cta && (
              <button
                onClick={handleCtaClick}
                className={cn(
                  "px-6 sm:px-10 py-3 sm:py-4 text-xs uppercase tracking-[0.2em] font-medium transition-all hover:opacity-80",
                  ctaLink && "cursor-pointer",
                )}
                style={{ backgroundColor: isEditorialHero ? '#000' : sectionAccentColor, color: '#fff' }}
              >
                {cta}
              </button>
            )}
          </div>
        </section>
      );
    }

    case 'featured_collection':
    case 'products': {
      const cols = Number(p.columns) || 3;
      const title = String(p.title || 'Our Collection');
      const styleVariant = p.style || sectionStyleVariant;

      return (
        <section className={cn(sectionPadding, "px-4 sm:px-6 lg:px-10")} style={sectionStyle} id="products">
          <div className="max-w-[1400px] mx-auto">
            <div className={cn("flex items-end justify-between mb-8 sm:mb-12", styleVariant === 'centered' && "flex-col items-center text-center")}>
              <h2 className={cn("text-2xl sm:text-3xl", styleVariant === 'editorial' ? "font-serif italic" : "font-bold")} style={{ color: sectionTextColor }}>{title}</h2>
              {styleVariant !== 'centered' && <a href="#" className="text-[10px] sm:text-xs uppercase tracking-widest font-bold pb-1 border-b hidden sm:block" style={{ borderColor: sectionAccentColor, color: sectionTextColor }}>View All</a>}
            </div>
            <div className="grid gap-4 sm:gap-6 lg:gap-10" style={{ gridTemplateColumns: `repeat(${Math.min(cols, 4)}, 1fr)` }}>
              {(products.length > 0 ? products : Array(4).fill(null)).slice(0, 8).map((product, idx) => (
                <div key={product?.id || idx} className="group cursor-pointer" onClick={() => product && onProductClick?.(product)}>
                  <div className="aspect-[3/4] overflow-hidden bg-gray-100 mb-3 sm:mb-6 relative rounded-lg sm:rounded-none">
                    {product ? (
                      <img src={product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" loading="lazy" />
                    ) : (
                      <div className="w-full h-full bg-gray-200 animate-pulse" />
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500" />
                    {product && onProductClick && (
                      <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                        <button className="w-full py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider" style={{ backgroundColor: sectionAccentColor }} onClick={e => { e.stopPropagation(); onProductClick(product); }}>
                          Quick View
                        </button>
                      </div>
                    )}
                  </div>
                  <div className={cn(styleVariant === 'centered' ? "text-center" : "")}>
                    <h3 className="font-serif text-sm sm:text-lg mb-0.5 sm:mb-1" style={{ color: sectionTextColor }}>{product?.name || 'Product'}</h3>
                    <p className="font-light tracking-[0.1em] text-xs sm:text-sm" style={{ color: sectionTextColor + '88' }}>
                      {product ? `$${product.price.toLocaleString()}` : '$0.00'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {products.length === 0 && (
              <div className="text-center py-8 opacity-40 text-sm">No products yet. Add products to display them here.</div>
            )}
          </div>
        </section>
      );
    }

    case 'features': {
      const features = section.blocks && section.blocks.length > 0 ? section.blocks.map(b => b.props as any) : [
        { icon: '🚀', title: 'Fast Delivery', desc: 'Get your order in 2-3 days' },
        { icon: '🔒', title: 'Secure Payment', desc: 'Your data is always protected' },
        { icon: '💚', title: 'Quality Guarantee', desc: '30-day money back guarantee' },
      ];
      return (
        <section className={cn(sectionPadding, "px-4")} style={{ ...sectionStyle, backgroundColor: sc.sectionBgColor || sectionAccentColor + '08' }}>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-6 sm:mb-8" style={{ color: sectionTextColor }}>{String(p.title || 'Features')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
            {features.map((f, i) => (
              <div key={i} className="text-center p-4 sm:p-6 rounded-xl bg-white/80 border" style={{ borderColor: sectionTextColor + '05' }}>
                <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">{f.icon || '✨'}</div>
                <h3 className="font-semibold mb-1 text-sm sm:text-base" style={{ color: sectionTextColor }}>{f.title || 'Feature'}</h3>
                <p className="text-xs sm:text-sm" style={{ color: sectionTextColor + '88' }}>{f.desc || f.text || ''}</p>
              </div>
            ))}
          </div>
        </section>
      );
    }

    case 'testimonials': {
      const testimonials = section.blocks && section.blocks.length > 0 ? section.blocks.map(b => b.props as any) : [
        { name: 'Sarah J.', text: '"Amazing quality and fast shipping!"', stars: 5 },
        { name: 'Mike R.', text: '"Best online shopping experience ever."', stars: 5 },
        { name: 'Emily C.', text: '"Will definitely buy again. Love it!"', stars: 5 },
      ];
      return (
        <section className={cn(sectionPadding, "px-4")} style={sectionStyle}>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-6 sm:mb-8" style={{ color: sectionTextColor }}>{String(p.title || 'Testimonials')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
            {testimonials.map((t, i) => (
              <div key={i} className="p-4 sm:p-6 rounded-xl border bg-white/50" style={{ borderColor: sectionTextColor + '15' }}>
                <div className="text-yellow-500 mb-2 text-sm sm:text-base">{'★'.repeat(Number(t.stars) || 5)}</div>
                <p className="text-xs sm:text-sm mb-3 italic" style={{ color: sectionTextColor + 'cc' }}>{t.text || ''}</p>
                <p className="text-xs sm:text-sm font-semibold" style={{ color: sectionTextColor }}>— {t.name || 'Customer'}</p>
              </div>
            ))}
          </div>
        </section>
      );
    }

    case 'gallery': {
      const galleryImages: string[] = Array.isArray(p.images) ? p.images : products.slice(0, 6).map(prod => prod.image);
      return (
        <section className={cn(sectionPadding, "px-4 sm:px-6")} style={sectionStyle}>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-6 sm:mb-8" style={{ color: sectionTextColor }}>{String(p.title || 'Gallery')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 md:gap-4 max-w-4xl mx-auto">
            {galleryImages.slice(0, 6).map((img, i) => (
              <div key={i} className="aspect-square rounded-lg sm:rounded-xl overflow-hidden cursor-pointer" onClick={() => products[i] && onProductClick?.(products[i])}>
                <img src={img} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform" loading="lazy" />
              </div>
            ))}
          </div>
        </section>
      );
    }

    case 'cta': {
      const ctaLink = String(p.ctaLink || '');
      const handleCtaClick = () => {
        if (!ctaLink) return;
        if (ctaLink.startsWith('http') || ctaLink.startsWith('https')) {
          window.open(ctaLink, '_blank', 'noopener,noreferrer');
        } else if (ctaLink.startsWith('/')) {
          window.location.href = ctaLink;
        } else if (ctaLink.startsWith('#')) {
          document.querySelector(ctaLink)?.scrollIntoView({ behavior: 'smooth' });
        }
      };
      return (
        <section className={cn(sectionPadding, "px-4 text-center")} style={{ ...sectionStyle, backgroundColor: sc.sectionBgColor || sectionAccentColor }}>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3 text-white">{String(p.title || 'Get Started')}</h2>
          <p className="text-sm sm:text-base mb-4 sm:mb-6 text-white/90 px-4">{String(p.text || '')}</p>
          {String(p.cta || '') && (
            <button onClick={handleCtaClick} className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition-opacity hover:opacity-90 text-sm sm:text-base" style={{ backgroundColor: theme.backgroundColor, color: sectionAccentColor }}>
              {String(p.cta)}
            </button>
          )}
        </section>
      );
    }

    case 'newsletter':
      return (
        <section className={cn(sectionPadding, "px-4 text-center")} style={{ ...sectionStyle, backgroundColor: sc.sectionBgColor || sectionAccentColor + '10' }}>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2" style={{ color: sectionTextColor }}>{String(p.title || 'Newsletter')}</h2>
          <p className="text-xs sm:text-sm mb-4 sm:mb-6 px-4" style={{ color: sectionTextColor + '88' }}>{String(p.subtitle || 'Stay updated')}</p>
          <div className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
            <input type="email" placeholder="Enter your email" className="flex-1 px-4 py-2.5 rounded-lg border text-sm" style={{ borderColor: sectionTextColor + '30' }} />
            <button className="px-5 py-2.5 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: sectionAccentColor }}>Subscribe</button>
          </div>
        </section>
      );

    case 'instagram_feed': {
      const instaImages = Array.isArray(p.images) ? p.images : [
        'https://images.unsplash.com/photo-1534452207294-49c811adceef',
        'https://images.unsplash.com/photo-1549439602-43ebca2327af',
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8',
        'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04',
      ];
      return (
        <section className={cn(sectionPadding, "px-4 sm:px-6 lg:px-10")} style={sectionStyle}>
          <div className="max-w-[1400px] mx-auto">
            <h2 className="text-xl sm:text-2xl font-serif italic mb-6 sm:mb-10" style={{ color: sectionTextColor }}>{String(p.title || '@store')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
              {instaImages.slice(0, 4).map((src, i) => (
                <div key={i} className="aspect-square overflow-hidden group relative rounded-lg sm:rounded-none">
                  <img src={src} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    case 'faq': {
      const faqs = section.blocks && section.blocks.length > 0 ? section.blocks.map(b => b.props as any) : [
        { q: 'How do I track my order?', a: 'You will receive a tracking email once shipped.' },
        { q: 'What is your return policy?', a: 'We offer 30-day hassle-free returns.' },
      ];
      return (
        <section className={cn(sectionPadding, "px-4 max-w-2xl mx-auto")} style={sectionStyle}>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-6 sm:mb-8" style={{ color: sectionTextColor }}>{String(p.title || 'FAQ')}</h2>
          {faqs.map((item, i) => (
            <div key={i} className="mb-4 border-b pb-4" style={{ borderColor: sectionTextColor + '15' }}>
              <h3 className="font-semibold mb-1 text-sm sm:text-base" style={{ color: sectionTextColor }}>{item.q || item.question || 'Question'}</h3>
              <p className="text-xs sm:text-sm" style={{ color: sectionTextColor + '88' }}>{item.a || item.answer || 'Answer'}</p>
            </div>
          ))}
        </section>
      );
    }

    case 'footer': {
      const storeName = String(p.storeName || project.name || 'Store');
      const footerLinks: string[] = Array.isArray(p.links) ? p.links : [];
      const footerStyle = p.style || sectionStyleVariant;
      const isDark = footerStyle === 'solid' || footerStyle === 'bold';
      return (
        <footer className={cn(sectionPadding, "px-4 sm:px-6 border-t")} style={{ ...sectionStyle, borderColor: sectionTextColor + '15', backgroundColor: sc.sectionBgColor || (isDark ? sectionAccentColor : undefined) }}>
          <div className="max-w-6xl mx-auto text-center">
            {theme.logoUrl && !p.hideLogo ? (
              <img src={theme.logoUrl} alt={storeName} className="h-8 mx-auto mb-4 object-contain" />
            ) : (
              <strong className="text-base sm:text-lg tracking-widest uppercase font-bold block mb-4" style={{ color: isDark ? '#fff' : sectionTextColor }}>{storeName}</strong>
            )}
            {footerLinks.length > 0 && (
              <nav className="flex flex-wrap justify-center gap-4 sm:gap-6 text-[10px] sm:text-[11px] uppercase tracking-widest font-medium mb-4">
                {footerLinks.map((link: string) => (
                  <a key={link} href="#" style={{ color: isDark ? '#ffffff88' : sectionTextColor + '88' }} className="hover:opacity-60 transition-opacity">{link}</a>
                ))}
              </nav>
            )}
            <p className="text-xs sm:text-sm" style={{ color: isDark ? '#ffffff66' : sectionTextColor + '66' }}>{String(p.text || `© ${new Date().getFullYear()} ${storeName}`)}</p>
          </div>
        </footer>
      );
    }

    case 'checkout':
      return (
        <section className="py-8 sm:py-16 px-4 min-h-[400px]" style={{ ...sectionStyle, backgroundColor: sc.sectionBgColor || '#fcfcfc' }}>
          <div className="max-w-xl mx-auto text-center py-12">
            <h2 className="text-2xl sm:text-3xl font-serif mb-4 italic tracking-tight" style={{ color: sectionTextColor }}>Checkout</h2>
            <p className="text-sm mb-6" style={{ color: sectionTextColor + '88' }}>Add products to your cart and checkout with Ripplify.</p>
            <div className="p-6 rounded-2xl border-2 inline-flex items-center gap-4" style={{ borderColor: sectionAccentColor }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: sectionAccentColor }}>
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm tracking-tight" style={{ color: sectionTextColor }}>Ripplify Checkout</p>
                <p className="text-xs" style={{ color: sectionTextColor + '88' }}>Secure payments powered by Ripplify</p>
              </div>
            </div>
          </div>
        </section>
      );

    default:
      return (
        <section className="py-6 sm:py-8 px-4 text-center" style={sectionStyle}>
          <p className="text-xs sm:text-sm opacity-50">Section: {section.type}</p>
        </section>
      );
  }
}
