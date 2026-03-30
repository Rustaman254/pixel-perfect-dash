export interface ProductVariant {
  id: string;
  name: string;
  options: string[];
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  images?: string[];
  category: string;
  variants?: ProductVariant[];
  variantPricing?: Record<string, number>;
  inventory?: number;
  sku?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariants?: Record<string, string>;
}

export interface StoreBlock {
  id: string;
  type: string;
  props: Record<string, unknown>;
}

export type SectionStyle = 'default' | 'minimal' | 'editorial' | 'bold' | 'centered' | 'split';

export interface SectionStyleConfig {
  sectionBgColor?: string;
  sectionTextColor?: string;
  sectionAccentColor?: string;
  sectionStyle?: SectionStyle;
  sectionPadding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  sectionBorderRadius?: number;
  sectionAnimation?: AnimationStyle;
}

export type AnimationStyle = 'none' | 'fade-in' | 'slide-up' | 'slide-in-left' | 'slide-in-right' | 'zoom-in' | 'bounce-in';

export interface StoreSection {
  id: string;
  type: 'hero' | 'products' | 'features' | 'testimonials' | 'footer' | 'header' | 'gallery' | 'cta' | 'newsletter' | 'faq' | 'checkout' | 'navbar' | 'image_with_text' | 'featured_collection' | 'instagram_feed';
  props: Record<string, unknown>;
  blocks?: StoreBlock[];
  styleConfig?: SectionStyleConfig;
}

export interface StoreTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  isPublished?: boolean;
  logoUrl?: string;
  faviconUrl?: string;
  borderRadius?: number;
  spacing?: 'compact' | 'normal' | 'relaxed';
  animationStyle?: AnimationStyle;
}

export interface StorePage {
  id: string;
  name: string;
  slug: string;
  sections: StoreSection[];
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  image: string;
  isPremium?: boolean;
  pages: StorePage[];
  theme: StoreTheme;
  products: Product[];
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  templateId: string;
  domain?: string;
  subdomain?: string;
  customDomain?: string | null;
  storeUrl?: string;
  pages: StorePage[];
  theme: StoreTheme;
  products: Product[];
  createdAt: number;
  updatedAt: number;
  isPremium?: boolean;
  premiumStatus?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  provider: 'google' | 'github';
  avatar?: string;
}
