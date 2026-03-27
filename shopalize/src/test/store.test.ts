import { describe, it, expect, beforeEach } from 'vitest'
import { useStore } from '@/store'
import { templates } from '@/data/templates'

beforeEach(() => {
  localStorage.clear();
  useStore.setState({
    projects: [],
    currentProject: null,
    user: null,
    isLoggedIn: false,
  });
});

describe('Store', () => {
  it('starts with empty projects', () => {
    const state = useStore.getState();
    expect(state.projects).toEqual([]);
    expect(state.currentProject).toBeNull();
    expect(state.isLoggedIn).toBe(false);
  });

  it('creates a project from template', () => {
    const { createProject } = useStore.getState();
    const template = templates[0];
    const project = createProject(template, 'Test Store');

    expect(project).not.toBeNull();
    expect(project!.name).toBe('Test Store');
    expect(project!.templateId).toBe(template.id);
    expect(project!.pages.length).toBeGreaterThan(0);
    expect(project!.theme).toEqual(template.theme);
  });

  it('generates unique project IDs', () => {
    const { createProject } = useStore.getState();
    const template = templates[0];
    const p1 = createProject(template, 'Store 1');
    const p2 = createProject(template, 'Store 2');

    expect(p1!.id).not.toBe(p2!.id);
  });

  it('enforces anonymous 3 project limit', () => {
    const { createProject, canCreateProject } = useStore.getState();
    const template = templates[0];

    expect(canCreateProject()).toBe(true);

    createProject(template, 'Store 1');
    expect(canCreateProject()).toBe(true);

    createProject(template, 'Store 2');
    expect(canCreateProject()).toBe(true);

    createProject(template, 'Store 3');
    expect(canCreateProject()).toBe(false);

    const result = createProject(template, 'Store 4');
    expect(result).toBeNull();
  });

  it('allows unlimited projects when logged in', () => {
    const { createProject, login, canCreateProject } = useStore.getState();
    const template = templates[0];

    createProject(template, 'Store 1');
    createProject(template, 'Store 2');
    createProject(template, 'Store 3');

    expect(canCreateProject()).toBe(false);

    login('google');
    expect(canCreateProject()).toBe(true);

    const p4 = createProject(template, 'Store 4');
    expect(p4).not.toBeNull();
  });

  it('loads a project by ID', () => {
    const { createProject, loadProject } = useStore.getState();
    const template = templates[0];
    const project = createProject(template, 'Test');

    useStore.setState({ currentProject: null });
    loadProject(project!.id);

    expect(useStore.getState().currentProject).not.toBeNull();
    expect(useStore.getState().currentProject!.id).toBe(project!.id);
  });

  it('deletes a project', () => {
    const { createProject, deleteProject } = useStore.getState();
    const template = templates[0];
    const project = createProject(template, 'Test');

    expect(useStore.getState().projects.length).toBe(1);

    deleteProject(project!.id);
    expect(useStore.getState().projects.length).toBe(0);
  });

  it('updates project theme', () => {
    const { createProject, updateProjectTheme } = useStore.getState();
    const template = templates[0];
    createProject(template, 'Test');

    updateProjectTheme({ primaryColor: '#ff0000' });

    expect(useStore.getState().currentProject!.theme.primaryColor).toBe('#ff0000');
  });

  it('updates project name', () => {
    const { createProject, updateProjectName } = useStore.getState();
    const template = templates[0];
    createProject(template, 'Old Name');

    updateProjectName('New Name');

    expect(useStore.getState().currentProject!.name).toBe('New Name');
  });

  it('login sets user and isLoggedIn', () => {
    const { login } = useStore.getState();

    login('github');

    const state = useStore.getState();
    expect(state.isLoggedIn).toBe(true);
    expect(state.user).not.toBeNull();
    expect(state.user!.provider).toBe('github');
  });

  it('logout clears user', () => {
    const { login, logout } = useStore.getState();

    login('google');
    expect(useStore.getState().isLoggedIn).toBe(true);

    logout();
    expect(useStore.getState().isLoggedIn).toBe(false);
    expect(useStore.getState().user).toBeNull();
  });
});
