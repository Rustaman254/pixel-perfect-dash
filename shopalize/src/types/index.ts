export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  category: string;
}

export interface StoreSection {
  id: string;
  type: 'hero' | 'products' | 'features' | 'testimonials' | 'footer' | 'header' | 'gallery' | 'cta' | 'newsletter' | 'faq';
  props: Record<string, unknown>;
}

export interface StoreTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
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
  pages: StorePage[];
  theme: StoreTheme;
  products: Product[];
}

export interface Project {
  id: string;
  name: string;
  templateId: string;
  pages: StorePage[];
  theme: StoreTheme;
  products: Product[];
  createdAt: number;
  updatedAt: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  provider: 'google' | 'github';
  avatar?: string;
}
