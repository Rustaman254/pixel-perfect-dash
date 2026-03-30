import { create } from 'zustand';
import type { Project, Template, StoreTheme, Product, StorePage, CartItem, ProductVariant } from '@/types';
import { fetchWithAuth } from '@/lib/api';

interface AppState {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  cart: CartItem[];

  loadProjects: () => Promise<void>;
  createProject: (template: Template, name?: string) => Promise<Project | null>;
  loadProject: (id: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  updateProjectTheme: (theme: Partial<StoreTheme>) => Promise<void>;
  updateProjectPages: (pages: StorePage[]) => Promise<void>;
  updateProjectName: (name: string) => Promise<void>;
  publishProject: (id: string) => Promise<void>;
  upgradeProject: (id: string, plan: string) => Promise<void>;
  createOrder: (projectId: string, amount: number, items: CartItem[]) => Promise<any>;
  addToCart: (product: Product, quantity: number, selectedVariants?: Record<string, string>) => void;
  removeFromCart: (productId: string, selectedVariants?: Record<string, string>) => void;
  updateCartQuantity: (productId: string, quantity: number, selectedVariants?: Record<string, string>) => void;
  clearCart: () => void;
  getCartTotal: () => number;
}

function parseTheme(themeJson: string | null): StoreTheme {
  try {
    const parsed = themeJson ? JSON.parse(themeJson) : {};
    return {
      primaryColor: parsed.colors?.primary || parsed.primaryColor || '#000000',
      secondaryColor: parsed.colors?.secondary || parsed.secondaryColor || '#ffffff',
      accentColor: parsed.colors?.accent || parsed.accentColor || '#3b82f6',
      backgroundColor: parsed.colors?.background || parsed.backgroundColor || '#ffffff',
      textColor: parsed.colors?.text || parsed.textColor || '#111827',
      fontFamily: parsed.fonts?.body || parsed.fontFamily || 'Inter',
      isPublished: parsed.isPublished === true,
      logoUrl: parsed.logoUrl || undefined,
      faviconUrl: parsed.faviconUrl || undefined,
      borderRadius: parsed.borderRadius ?? 0,
      spacing: parsed.spacing || 'normal',
      animationStyle: parsed.animationStyle || 'none',
    };
  } catch {
    return {
      primaryColor: '#000000',
      secondaryColor: '#ffffff',
      accentColor: '#3b82f6',
      backgroundColor: '#ffffff',
      textColor: '#111827',
      fontFamily: 'Inter',
      isPublished: false,
    };
  }
}

function themeToJson(theme: StoreTheme): string {
  return JSON.stringify({
    colors: {
      primary: theme.primaryColor,
      secondary: theme.secondaryColor,
      accent: theme.accentColor,
      background: theme.backgroundColor,
      text: theme.textColor,
    },
    fonts: { heading: theme.fontFamily, body: theme.fontFamily },
    isPublished: theme.isPublished,
    logoUrl: theme.logoUrl || null,
    faviconUrl: theme.faviconUrl || null,
    borderRadius: theme.borderRadius ?? 0,
    spacing: theme.spacing || 'normal',
    animationStyle: theme.animationStyle || 'none',
  });
}

function parseSections(sectionsJson: string | null): StorePage['sections'] {
  try {
    const parsed = sectionsJson ? JSON.parse(sectionsJson) : [];
    return parsed.map((s: any, i: number) => ({
      id: s.id || `section-${i}-${Date.now()}`,
      type: s.type || 'hero',
      props: s.settings || s.props || {},
      blocks: s.blocks || [],
      styleConfig: s.styleConfig || undefined,
    }));
  } catch {
    return [];
  }
}

function sectionsToJson(sections: StorePage['sections']): string {
  return JSON.stringify(sections.map(s => ({
    id: s.id,
    type: s.type,
    settings: s.props,
    blocks: s.blocks,
    styleConfig: s.styleConfig || undefined,
  })));
}

function generateSubdomain(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 20);
  return slug;
}

function apiProjectToProject(p: any): Project {
  return {
    id: String(p.id),
    name: p.name,
    slug: p.slug || '',
    templateId: p.templateId || '',
    domain: p.domain || undefined,
    subdomain: p.subdomain || undefined,
    pages: (p.pages || []).map((pg: any) => ({
      id: String(pg.id),
      name: pg.name,
      slug: pg.slug,
      sections: parseSections(pg.sectionsJson),
    })),
    theme: parseTheme(p.themeJson),
    products: (p.products || []).map((prod: any) => ({
      ...prod,
      id: String(prod.id),
      price: parseFloat(prod.price),
      image: prod.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
    })),
    createdAt: new Date(p.createdAt).getTime(),
    updatedAt: new Date(p.updatedAt).getTime(),
    isPremium: p.isPremium === true || p.isPremium === 1,
    premiumStatus: p.premiumStatus || 'basic',
  };
}

function cartItemKey(productId: string, selectedVariants?: Record<string, string>): string {
  const variantStr = selectedVariants ? Object.entries(selectedVariants).sort().map(([k, v]) => `${k}:${v}`).join(',') : '';
  return `${productId}::${variantStr}`;
}

export const useStore = create<AppState>((set, get) => ({
  projects: [],
  currentProject: null,
  loading: false,
  cart: [],

  loadProjects: async () => {
    try {
      set({ loading: true });
      const data = await fetchWithAuth('/shopalize/projects');
      const projects = data.map(apiProjectToProject);
      set({ projects, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  createProject: async (template: Template, name?: string) => {
    try {
      const subdomain = generateSubdomain(name || template.name);
      const data = await fetchWithAuth('/shopalize/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: name || template.name,
          description: template.description || '',
          templateId: template.id,
          subdomain,
          themeJson: themeToJson(template.theme),
        }),
      });

      // Load the full project with pages
      const full = await fetchWithAuth(`/shopalize/projects/${data.id}`);
      const project = apiProjectToProject(full);

      // If template has pages, update the project pages to match the template exactly
      if (template.pages && template.pages.length > 0 && project.pages.length > 0) {
        for (let i = 0; i < Math.min(project.pages.length, template.pages.length); i++) {
          const apiPage = project.pages[i];
          const templatePage = template.pages[i];
          if (apiPage.id && templatePage.sections.length > 0) {
            await fetchWithAuth(`/shopalize/pages/${apiPage.id}`, {
              method: 'PUT',
              body: JSON.stringify({
                name: templatePage.name,
                sectionsJson: sectionsToJson(templatePage.sections),
              }),
            });
          }
        }

        for (let i = project.pages.length; i < template.pages.length; i++) {
          const templatePage = template.pages[i];
          await fetchWithAuth(`/shopalize/pages`, {
            method: 'POST',
            body: JSON.stringify({
              projectId: parseInt(project.id),
              name: templatePage.name,
              slug: templatePage.slug,
              type: templatePage.slug === 'checkout' ? 'checkout' : 'page',
              sectionsJson: sectionsToJson(templatePage.sections),
            }),
          });
        }

        // Save template sample products to the database
        if (template.products && template.products.length > 0) {
          for (const prod of template.products) {
            await fetchWithAuth('/shopalize/products', {
              method: 'POST',
              body: JSON.stringify({
                projectId: parseInt(project.id),
                name: prod.name,
                description: prod.description,
                price: prod.price,
                images: [prod.image],
                category: prod.category || null,
                isActive: true,
              }),
            });
          }
        }

        const updatedFull = await fetchWithAuth(`/shopalize/projects/${data.id}`);
        const updatedProject = apiProjectToProject(updatedFull);
        set({ projects: [updatedProject, ...get().projects], currentProject: updatedProject });
        return updatedProject;
      }

      set({ projects: [project, ...get().projects], currentProject: project });
      return project;
    } catch (err) {
      console.error('[createProject] Failed:', err);
      throw err;
    }
  },

  loadProject: async (id: string) => {
    try {
      const data = await fetchWithAuth(`/shopalize/projects/${id}`);
      const project = apiProjectToProject(data);
      set({ currentProject: project });
    } catch {
      set({ currentProject: null });
    }
  },

  deleteProject: async (id: string) => {
    try {
      await fetchWithAuth(`/shopalize/projects/${id}`, { method: 'DELETE' });
      const updated = get().projects.filter(p => p.id !== id);
      set({
        projects: updated,
        currentProject: get().currentProject?.id === id ? null : get().currentProject,
      });
    } catch { /* ignore */ }
  },

  updateProjectTheme: async (theme: Partial<StoreTheme>) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const merged = { ...currentProject.theme, ...theme };
    try {
      await fetchWithAuth(`/shopalize/projects/${currentProject.id}`, {
        method: 'PUT',
        body: JSON.stringify({ themeJson: themeToJson(merged) }),
      });
      const updatedProject = { ...currentProject, theme: merged, updatedAt: Date.now() };
      set({
        projects: get().projects.map(p => p.id === currentProject.id ? updatedProject : p),
        currentProject: updatedProject,
      });
    } catch { /* ignore */ }
  },

  updateProjectPages: async (pages: StorePage[]) => {
    const { currentProject } = get();
    if (!currentProject) return;

    try {
      for (const page of pages) {
        if (page.id && !page.id.startsWith('section-')) {
          await fetchWithAuth(`/shopalize/pages/${page.id}`, {
            method: 'PUT',
            body: JSON.stringify({ sectionsJson: sectionsToJson(page.sections) }),
          });
        }
      }
      const updatedProject = { ...currentProject, pages, updatedAt: Date.now() };
      set({
        projects: get().projects.map(p => p.id === currentProject.id ? updatedProject : p),
        currentProject: updatedProject,
      });
    } catch { /* ignore */ }
  },

  updateProjectName: async (name: string) => {
    const { currentProject } = get();
    if (!currentProject) return;

    try {
      await fetchWithAuth(`/shopalize/projects/${currentProject.id}`, {
        method: 'PUT',
        body: JSON.stringify({ name }),
      });
      const updatedProject = { ...currentProject, name, updatedAt: Date.now() };
      set({
        projects: get().projects.map(p => p.id === currentProject.id ? updatedProject : p),
        currentProject: updatedProject,
      });
    } catch { /* ignore */ }
  },

  publishProject: async (targetId: string) => {
    try {
      const { projects } = get();
      const targetProject = projects.find(p => p.id === targetId);
      if (!targetProject) return;

      const subdomain = targetProject.subdomain || generateSubdomain(targetProject.name);

      const updatedProjects = await Promise.all(projects.map(async (p) => {
        if (p.theme.isPublished && p.id !== targetId) {
           const newTheme = { ...p.theme, isPublished: false };
           await fetchWithAuth(`/shopalize/projects/${p.id}`, {
             method: 'PUT',
             body: JSON.stringify({ themeJson: themeToJson(newTheme) })
           }).catch(() => {});
           return { ...p, theme: newTheme, updatedAt: Date.now() };
        }
        if (p.id === targetId && !p.theme.isPublished) {
           const newTheme = { ...p.theme, isPublished: true };
           await fetchWithAuth(`/shopalize/projects/${p.id}`, {
             method: 'PUT',
             body: JSON.stringify({ themeJson: themeToJson(newTheme), subdomain, status: 'published' })
           }).catch(() => {});
           return { ...p, theme: newTheme, subdomain, updatedAt: Date.now() };
        }
        return p;
      }));

      set({
        projects: updatedProjects,
        currentProject: get().currentProject?.id ? updatedProjects.find(p => p.id === get().currentProject!.id) : null
      });
    } catch { /* ignore */ }
  },
  
  upgradeProject: async (id: string, plan: string) => {
    try {
      const data = await fetchWithAuth(`/shopalize/projects/${id}/upgrade`, {
        method: 'POST',
        body: JSON.stringify({ plan }),
      });
      
      const updatedProject = apiProjectToProject(data.project);
      set({
        projects: get().projects.map(p => p.id === id ? updatedProject : p),
        currentProject: get().currentProject?.id === id ? updatedProject : get().currentProject,
      });
    } catch (err) {
      console.error('Upgrade failed:', err);
      throw err;
    }
  },

  createOrder: async (projectId: string, amount: number, items: CartItem[]) => {
    try {
      const data = await fetchWithAuth('/shopalize/orders', {
        method: 'POST',
        body: JSON.stringify({
          projectId: parseInt(projectId),
          totalAmount: amount,
          items: JSON.stringify(items.map(item => ({
            productId: item.product.id,
            name: item.product.name,
            price: item.product.price,
            quantity: item.quantity,
            variants: item.selectedVariants,
            image: item.product.image,
          }))),
          customerName: 'Customer',
          customerEmail: 'customer@example.com',
          status: 'paid',
        }),
      });
      return data;
    } catch (err) {
      console.error('Order creation failed:', err);
      throw err;
    }
  },

  addToCart: (product: Product, quantity: number, selectedVariants?: Record<string, string>) => {
    const { cart } = get();
    const existingIndex = cart.findIndex(item =>
      item.product.id === product.id &&
      JSON.stringify(item.selectedVariants) === JSON.stringify(selectedVariants)
    );

    if (existingIndex >= 0) {
      const updated = [...cart];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: updated[existingIndex].quantity + quantity,
      };
      set({ cart: updated });
    } else {
      set({ cart: [...cart, { product, quantity, selectedVariants }] });
    }
  },

  removeFromCart: (productId: string, selectedVariants?: Record<string, string>) => {
    const { cart } = get();
    set({
      cart: cart.filter(item =>
        !(item.product.id === productId &&
          JSON.stringify(item.selectedVariants) === JSON.stringify(selectedVariants))
      ),
    });
  },

  updateCartQuantity: (productId: string, quantity: number, selectedVariants?: Record<string, string>) => {
    const { cart } = get();
    if (quantity <= 0) {
      get().removeFromCart(productId, selectedVariants);
      return;
    }
    set({
      cart: cart.map(item =>
        item.product.id === productId &&
        JSON.stringify(item.selectedVariants) === JSON.stringify(selectedVariants)
          ? { ...item, quantity }
          : item
      ),
    });
  },

  clearCart: () => set({ cart: [] }),

  getCartTotal: () => {
    const { cart } = get();
    return cart.reduce((total, item) => total + item.product.price * item.quantity, 0);
  },
}));
