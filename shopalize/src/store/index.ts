import { create } from 'zustand';
import type { Project, Template, StoreTheme, Product, StorePage } from '@/types';
import { fetchWithAuth } from '@/lib/api';

interface AppState {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;

  loadProjects: () => Promise<void>;
  createProject: (template: Template, name?: string) => Promise<Project | null>;
  loadProject: (id: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  updateProjectTheme: (theme: Partial<StoreTheme>) => Promise<void>;
  updateProjectPages: (pages: StorePage[]) => Promise<void>;
  updateProjectProducts: (products: Product[]) => Promise<void>;
  updateProjectName: (name: string) => Promise<void>;
}

function parseTheme(themeJson: string | null): StoreTheme {
  try {
    const parsed = themeJson ? JSON.parse(themeJson) : {};
    return {
      primaryColor: parsed.colors?.primary || '#000000',
      secondaryColor: parsed.colors?.secondary || '#ffffff',
      accentColor: parsed.colors?.accent || '#3b82f6',
      backgroundColor: parsed.colors?.background || '#ffffff',
      textColor: parsed.colors?.text || '#111827',
      fontFamily: parsed.fonts?.body || 'Inter',
    };
  } catch {
    return {
      primaryColor: '#000000',
      secondaryColor: '#ffffff',
      accentColor: '#3b82f6',
      backgroundColor: '#ffffff',
      textColor: '#111827',
      fontFamily: 'Inter',
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
  });
}

function parseSections(sectionsJson: string | null): StorePage['sections'] {
  try {
    const parsed = sectionsJson ? JSON.parse(sectionsJson) : [];
    return parsed.map((s: any, i: number) => ({
      id: `section-${i}`,
      type: s.type || 'hero',
      props: s.settings || s.props || {},
    }));
  } catch {
    return [];
  }
}

function sectionsToJson(sections: StorePage['sections']): string {
  return JSON.stringify(sections.map(s => ({
    type: s.type,
    settings: s.props,
  })));
}

function apiProjectToProject(p: any): Project {
  return {
    id: String(p.id),
    name: p.name,
    templateId: p.templateId || '',
    pages: (p.pages || []).map((pg: any) => ({
      id: String(pg.id),
      name: pg.name,
      slug: pg.slug,
      sections: parseSections(pg.sectionsJson),
    })),
    theme: parseTheme(p.themeJson),
    products: [],
    createdAt: new Date(p.createdAt).getTime(),
    updatedAt: new Date(p.updatedAt).getTime(),
  };
}

export const useStore = create<AppState>((set, get) => ({
  projects: [],
  currentProject: null,
  loading: false,

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
      const data = await fetchWithAuth('/shopalize/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: name || template.name,
          description: template.description || '',
          templateId: template.id,
        }),
      });

      // Load the full project with pages
      const full = await fetchWithAuth(`/shopalize/projects/${data.id}`);
      const project = apiProjectToProject(full);
      set({ projects: [project, ...get().projects], currentProject: project });
      return project;
    } catch {
      return null;
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
      // Update each page via API
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

  updateProjectProducts: async (products: Product[]) => {
    const { currentProject } = get();
    if (!currentProject) return;

    try {
      // Sync products to API
      for (const product of products) {
        if (product.id && product.id.startsWith('new-')) {
          await fetchWithAuth(`/shopalize/products`, {
            method: 'POST',
            body: JSON.stringify({
              name: product.name,
              price: product.price,
              description: product.description,
              category: product.category,
              images: JSON.stringify(product.image ? [product.image] : []),
            }),
          });
        }
      }
      const updatedProject = { ...currentProject, products, updatedAt: Date.now() };
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
}));
