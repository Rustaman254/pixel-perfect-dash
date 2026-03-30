import crypto from 'crypto';
import slugify from 'slugify';
import { createConnection } from '../shared/db.js';
import { recordActivity } from './activityController.js';

const db = () => createConnection('shopalize_db');

export const createProject = async (req, res) => {
  try {
    const { name, description, templateId, subdomain, themeJson } = req.body;
    if (!name) return res.status(400).json({ message: 'Project name is required' });

    const slug = slugify(name, { lower: true, strict: true }) || 'store';

    // Generate subdomain: storename.sokostack.xyz (without random suffix)
    const projectSubdomain = subdomain || slugify(name, { lower: true, strict: true }).substring(0, 20);

    // Load template sections if templateId provided
    let sectionsJson = null;
    if (templateId) {
      let templateQuery = db()('templates');
      if (isNaN(parseInt(templateId))) {
        templateQuery = templateQuery.where({ slug: templateId });
      } else {
        templateQuery = templateQuery.where({ id: parseInt(templateId) });
      }
      const template = await templateQuery.first();
      if (template) {
        sectionsJson = template.sectionsJson;
      }
    }

    // Use provided themeJson or default theme
    const projectThemeJson = themeJson || JSON.stringify({
      colors: { primary: '#000000', secondary: '#ffffff', accent: '#3b82f6', background: '#ffffff', text: '#111827' },
      fonts: { heading: 'Inter', body: 'Inter' },
    });

    const [projectId] = await db()('projects')
      .insert({
        userId: req.user.id,
        name,
        slug,  // Use clean slug without random suffix
        subdomain: projectSubdomain,
        templateId: templateId || null,
        description: description || '',
        status: 'draft',
        themeJson: projectThemeJson,
        isPremium: false,
        premiumStatus: 'basic',
      });

    const project = await db()('projects').where({ id: projectId }).first();

    // Create default home page
    await db()('project_pages').insert({
      projectId: project.id,
      name: 'Home',
      slug: 'home',
      type: 'home',
      sectionsJson: sectionsJson || JSON.stringify([
        { type: 'hero', settings: { headline: 'Welcome', subheadline: 'Your store awaits', ctaText: 'Shop Now' } },
        { type: 'products', settings: { title: 'Products', layout: 'grid', columns: 3 } },
      ]),
      seoTitle: name,
      seoDescription: description || `Welcome to ${name}`,
    });

    // Create default product listing page
    await db()('project_pages').insert({
      projectId: project.id,
      name: 'Products',
      slug: 'products',
      type: 'products',
      sectionsJson: JSON.stringify([
        { type: 'products', settings: { title: 'All Products', layout: 'grid', columns: 4, showFilters: true } },
      ]),
      seoTitle: `${name} - Products`,
      seoDescription: `Browse all products from ${name}`,
    });

    await recordActivity({
      userId: req.user.id,
      action: 'project_created',
      projectId: project.id,
      description: `Created new store: ${name}`
    });

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyProjects = async (req, res) => {
  try {
    const projects = await db()('projects')
      .where({ userId: req.user.id })
      .orderBy('createdAt', 'desc');
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProject = async (req, res) => {
  try {
    const project = await db()('projects')
      .where({ id: parseInt(req.params.id), userId: req.user.id })
      .first();
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const pages = await db()('project_pages')
      .where({ projectId: project.id })
      .orderBy('createdAt', 'asc');

    const products = await db()('store_products')
      .where({ projectId: project.id })
      .orderBy('createdAt', 'desc');

    res.json({
      ...project,
      pages,
      products: products.map(p => ({
        ...p,
        price: parseFloat(p.price),
        images: (() => { try { return JSON.parse(p.images || '[]'); } catch { return []; } })(),
        variants: (() => { try { return JSON.parse(p.variants || '[]'); } catch { return []; } })(),
      })),
      productCount: products.length,
    });
  } catch (error) {
    console.error(`[ERROR] getProject(${req.params.id}): ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

export const updateProject = async (req, res) => {
  try {
    const { name, description, status, domain, themeJson } = req.body;

    const project = await db()('projects')
      .where({ id: parseInt(req.params.id), userId: req.user.id })
      .first();
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const updates = { updatedAt: db().fn.now() };
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;
    if (domain !== undefined) updates.domain = domain;
    if (themeJson !== undefined) updates.themeJson = typeof themeJson === 'string' ? themeJson : JSON.stringify(themeJson);
    if (req.body.isPremium !== undefined) updates.isPremium = req.body.isPremium;
    if (req.body.premiumStatus !== undefined) updates.premiumStatus = req.body.premiumStatus;

    await db()('projects')
      .where({ id: parseInt(req.params.id) })
      .update(updates);

    const updated = await db()('projects')
      .where({ id: parseInt(req.params.id) })
      .first();

    await recordActivity({
      userId: req.user.id,
      action: 'project_updated',
      projectId: updated.id,
      description: `Updated store settings for ${updated.name}`
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const project = await db()('projects')
      .where({ id: parseInt(req.params.id), userId: req.user.id })
      .first();
    if (!project) return res.status(404).json({ message: 'Project not found' });

    await db()('store_orders').where({ projectId: project.id }).delete();
    await db()('store_products').where({ projectId: project.id }).delete();
    await db()('project_pages').where({ projectId: project.id }).delete();
    await db()('projects').where({ id: project.id }).delete();

    await recordActivity({
      userId: req.user.id,
      action: 'project_deleted',
      description: `Deleted store: ${project.name}`
    });

    res.json({ message: 'Project and all related data deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const publishProject = async (req, res) => {
  try {
    const project = await db()('projects')
      .where({ id: parseInt(req.params.id), userId: req.user.id })
      .first();
    if (!project) return res.status(404).json({ message: 'Project not found' });

    await db()('projects')
      .where({ id: project.id })
      .update({ status: 'published', updatedAt: db().fn.now() });

    const updated = await db()('projects')
      .where({ id: project.id })
      .first();

    await recordActivity({
      userId: req.user.id,
      action: 'project_published',
      projectId: updated.id,
      description: `Published store: ${updated.name}`
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const unpublishProject = async (req, res) => {
  try {
    const project = await db()('projects')
      .where({ id: parseInt(req.params.id), userId: req.user.id })
      .first();
    if (!project) return res.status(404).json({ message: 'Project not found' });

    await db()('projects')
      .where({ id: project.id })
      .update({ status: 'draft', updatedAt: db().fn.now() });

    const updated = await db()('projects')
      .where({ id: project.id })
      .first();

    await recordActivity({
      userId: req.user.id,
      action: 'project_unpublished',
      projectId: updated.id,
      description: `Unpublished store: ${updated.name}`
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default {
  createProject, getMyProjects, getProject, updateProject,
  deleteProject, publishProject, unpublishProject,
};
