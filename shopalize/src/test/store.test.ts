import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useStore } from '@/store'
import { templates } from '@/data/templates'

// Mock fetchWithAuth
vi.mock('@/lib/api', () => ({
  fetchWithAuth: vi.fn(),
  BASE_URL: '/api',
  DNS_URL: '/api/dns',
  SSO_HUB_URL: 'http://localhost:3001/sso.html',
  PRODUCTS: {
    ripplify: "http://localhost:8080",
    shopalize: "http://localhost:8081",
    watchtower: "http://localhost:8083",
    admin: "http://localhost:8082",
  }
}))

import { fetchWithAuth } from '@/lib/api'

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  useStore.setState({
    projects: [],
    currentProject: null,
    loading: false,
    cart: [],
  });
});

describe('Store', () => {
  it('starts with empty projects', () => {
    const state = useStore.getState();
    expect(state.projects).toEqual([]);
    expect(state.currentProject).toBeNull();
  });

  it('creates a project from template', async () => {
    const mockProject = {
      id: '1',
      name: 'Test Store',
      slug: 'test-store',
      templateId: 'studio',
      themeJson: JSON.stringify(templates[0].theme),
      pages: [],
      products: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    vi.mocked(fetchWithAuth).mockResolvedValueOnce(mockProject);

    const { createProject } = useStore.getState();
    const template = templates[0];
    const project = await createProject(template, 'Test Store');

    expect(fetchWithAuth).toHaveBeenCalledWith('/shopalize/projects', expect.objectContaining({
      method: 'POST',
    }));
    expect(project).not.toBeNull();
    expect(project!.name).toBe('Test Store');
    expect(project!.id).toBe('1');
  });

  it('loads projects', async () => {
    const mockProjects = [
      { id: '1', name: 'Store 1', slug: 'store-1', createdAt: Date.now(), updatedAt: Date.now() },
      { id: '2', name: 'Store 2', slug: 'store-2', createdAt: Date.now(), updatedAt: Date.now() },
    ];

    vi.mocked(fetchWithAuth).mockResolvedValueOnce(mockProjects);

    const { loadProjects } = useStore.getState();
    await loadProjects();

    const state = useStore.getState();
    expect(state.projects.length).toBe(2);
    expect(state.projects[0].name).toBe('Store 1');
  });

  it('loads a project by ID', async () => {
    const mockProject = { id: '1', name: 'Test', slug: 'test', createdAt: Date.now(), updatedAt: Date.now() };
    vi.mocked(fetchWithAuth).mockResolvedValueOnce(mockProject);

    const { loadProject } = useStore.getState();
    await loadProject('1');

    expect(useStore.getState().currentProject).not.toBeNull();
    expect(useStore.getState().currentProject!.id).toBe('1');
  });

  it('deletes a project', async () => {
    vi.mocked(fetchWithAuth).mockResolvedValueOnce({});
    
    useStore.setState({ 
      projects: [{ id: '1', name: 'Test', slug: 'test', pages: [], theme: {} as any, createdAt: 0, updatedAt: 0, templateId: '' }] 
    });

    const { deleteProject } = useStore.getState();
    await deleteProject('1');

    expect(fetchWithAuth).toHaveBeenCalledWith('/shopalize/projects/1', { method: 'DELETE' });
    expect(useStore.getState().projects.length).toBe(0);
  });

  it('updates project name', async () => {
    vi.mocked(fetchWithAuth).mockResolvedValueOnce({});
    const currentProject = { id: '1', name: 'Old Name', slug: 'old-name', pages: [], theme: {} as any, createdAt: 0, updatedAt: 0, templateId: '' };
    useStore.setState({ currentProject, projects: [currentProject] });

    const { updateProjectName } = useStore.getState();
    await updateProjectName('New Name');

    expect(fetchWithAuth).toHaveBeenCalledWith('/shopalize/projects/1', expect.objectContaining({
      method: 'PUT',
      body: JSON.stringify({ name: 'New Name' }),
    }));
    expect(useStore.getState().currentProject!.name).toBe('New Name');
  });

  it('manages cart', () => {
    const { addToCart, getCartTotal, clearCart } = useStore.getState();
    const product = { id: 'p1', name: 'Product 1', price: 100, description: '', image: '', category: '' };

    addToCart(product, 2);
    expect(useStore.getState().cart.length).toBe(1);
    expect(useStore.getState().cart[0].quantity).toBe(2);
    expect(getCartTotal()).toBe(200);

    clearCart();
    expect(useStore.getState().cart.length).toBe(0);
  });
});

