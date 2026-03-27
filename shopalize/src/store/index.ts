import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Project, Template, StoreTheme, Product, StorePage, User } from '@/types';

const STORAGE_KEY = 'shopalize_projects';
const USER_KEY = 'shopalize_user';
const MAX_ANONYMOUS_PROJECTS = 3;

function loadProjects(): Project[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveProjects(projects: Project[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

function loadUser(): User | null {
  try {
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

interface AppState {
  projects: Project[];
  currentProject: Project | null;
  user: User | null;
  isLoggedIn: boolean;

  createProject: (template: Template, name?: string) => Project | null;
  loadProject: (id: string) => void;
  deleteProject: (id: string) => void;
  updateProjectTheme: (theme: Partial<StoreTheme>) => void;
  updateProjectPages: (pages: StorePage[]) => void;
  updateProjectProducts: (products: Product[]) => void;
  updateProjectName: (name: string) => void;

  canCreateProject: () => boolean;
  getAnonymousProjectCount: () => number;

  login: (provider: 'google' | 'github') => void;
  logout: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  projects: loadProjects(),
  currentProject: null,
  user: loadUser(),
  isLoggedIn: !!loadUser(),

  createProject: (template: Template, name?: string) => {
    const state = get();
    if (!state.isLoggedIn && state.projects.length >= MAX_ANONYMOUS_PROJECTS) {
      return null;
    }

    const now = Date.now();
    const project: Project = {
      id: uuidv4(),
      name: name || template.name,
      templateId: template.id,
      pages: JSON.parse(JSON.stringify(template.pages)),
      theme: { ...template.theme },
      products: [...template.products],
      createdAt: now,
      updatedAt: now,
    };

    const updated = [...state.projects, project];
    saveProjects(updated);
    set({ projects: updated, currentProject: project });
    return project;
  },

  loadProject: (id: string) => {
    const project = get().projects.find(p => p.id === id) || null;
    set({ currentProject: project });
  },

  deleteProject: (id: string) => {
    const updated = get().projects.filter(p => p.id !== id);
    saveProjects(updated);
    set({
      projects: updated,
      currentProject: get().currentProject?.id === id ? null : get().currentProject,
    });
  },

  updateProjectTheme: (theme: Partial<StoreTheme>) => {
    const { currentProject, projects } = get();
    if (!currentProject) return;

    const updatedProject = {
      ...currentProject,
      theme: { ...currentProject.theme, ...theme },
      updatedAt: Date.now(),
    };

    const updatedProjects = projects.map(p =>
      p.id === currentProject.id ? updatedProject : p
    );

    saveProjects(updatedProjects);
    set({ projects: updatedProjects, currentProject: updatedProject });
  },

  updateProjectPages: (pages: StorePage[]) => {
    const { currentProject, projects } = get();
    if (!currentProject) return;

    const updatedProject = {
      ...currentProject,
      pages,
      updatedAt: Date.now(),
    };

    const updatedProjects = projects.map(p =>
      p.id === currentProject.id ? updatedProject : p
    );

    saveProjects(updatedProjects);
    set({ projects: updatedProjects, currentProject: updatedProject });
  },

  updateProjectProducts: (products: Product[]) => {
    const { currentProject, projects } = get();
    if (!currentProject) return;

    const updatedProject = {
      ...currentProject,
      products,
      updatedAt: Date.now(),
    };

    const updatedProjects = projects.map(p =>
      p.id === currentProject.id ? updatedProject : p
    );

    saveProjects(updatedProjects);
    set({ projects: updatedProjects, currentProject: updatedProject });
  },

  updateProjectName: (name: string) => {
    const { currentProject, projects } = get();
    if (!currentProject) return;

    const updatedProject = { ...currentProject, name, updatedAt: Date.now() };
    const updatedProjects = projects.map(p =>
      p.id === currentProject.id ? updatedProject : p
    );

    saveProjects(updatedProjects);
    set({ projects: updatedProjects, currentProject: updatedProject });
  },

  canCreateProject: () => {
    const state = get();
    return state.isLoggedIn || state.projects.length < MAX_ANONYMOUS_PROJECTS;
  },

  getAnonymousProjectCount: () => {
    return get().projects.length;
  },

  login: (provider: 'google' | 'github') => {
    const user: User = {
      id: uuidv4(),
      name: provider === 'google' ? 'Google User' : 'GitHub User',
      email: `user@${provider}.com`,
      provider,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${provider}`,
    };
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ user, isLoggedIn: true });
  },

  logout: () => {
    localStorage.removeItem(USER_KEY);
    set({ user: null, isLoggedIn: false });
  },
}));
