import slugify from 'slugify';
import { createConnection } from '../shared/db.js';
import { recordActivity } from './activityController.js';

const db = () => createConnection('shopalize_db');

export const createPage = async (req, res) => {
  try {
    const { projectId, name, type, sectionsJson, seoTitle, seoDescription } = req.body;
    if (!projectId || !name) return res.status(400).json({ message: 'projectId and name are required' });

    const project = await db()('projects')
      .where({ id: parseInt(projectId), userId: req.user.id })
      .first();
    if (!project) return res.status(404).json({ message: 'Project not found' });

    let slug = slugify(name, { lower: true, strict: true }) || 'page';

    // Ensure unique slug within project
    const existing = await db()('project_pages').where({ projectId: project.id, slug }).first();
    if (existing) {
      const shortId = Math.random().toString(36).substring(2, 6);
      slug = `${slug}-${shortId}`;
    }

    const [{ id: pageId }] = await db()('project_pages')
      .insert({
        projectId: project.id,
        name,
        slug,
        type: type || 'page',
        sectionsJson: sectionsJson || JSON.stringify([]),
        seoTitle: seoTitle || name,
        seoDescription: seoDescription || '',
      })
      .returning('id');
    
    const page = await db()('project_pages').where({ id: pageId }).first();

    await recordActivity({
      userId: req.user.id,
      action: 'page_created',
      projectId: project.id,
      description: `Created new page: ${name}`,
      metadata: { pageId: page.id, slug: page.slug }
    });

    res.status(201).json(page);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPages = async (req, res) => {
  try {
    const { projectId } = req.query;
    if (!projectId) return res.status(400).json({ message: 'projectId query param is required' });

    const project = await db()('projects')
      .where({ id: parseInt(projectId), userId: req.user.id })
      .first();
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const pages = await db()('project_pages')
      .where({ projectId: project.id })
      .orderBy('createdAt', 'asc');

    res.json(pages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPage = async (req, res) => {
  try {
    const page = await db()('project_pages')
      .where({ id: parseInt(req.params.id) })
      .first();
    if (!page) return res.status(404).json({ message: 'Page not found' });

    // Verify ownership
    const project = await db()('projects')
      .where({ id: page.projectId, userId: req.user.id })
      .first();
    if (!project) return res.status(403).json({ message: 'Not authorized' });

    res.json(page);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updatePage = async (req, res) => {
  try {
    const { name, sectionsJson, seoTitle, seoDescription } = req.body;

    const page = await db()('project_pages')
      .where({ id: parseInt(req.params.id) })
      .first();
    if (!page) return res.status(404).json({ message: 'Page not found' });

    const project = await db()('projects')
      .where({ id: page.projectId, userId: req.user.id })
      .first();
    if (!project) return res.status(403).json({ message: 'Not authorized' });

    const updates = { updatedAt: db().fn.now() };
    if (name !== undefined) updates.name = name;
    if (sectionsJson !== undefined) {
      updates.sectionsJson = typeof sectionsJson === 'string' ? sectionsJson : JSON.stringify(sectionsJson);
    }
    if (seoTitle !== undefined) updates.seoTitle = seoTitle;
    if (seoDescription !== undefined) updates.seoDescription = seoDescription;

    await db()('project_pages')
      .where({ id: parseInt(req.params.id) })
      .update(updates);

    const updated = await db()('project_pages')
      .where({ id: parseInt(req.params.id) })
      .first();

    await recordActivity({
      userId: req.user.id,
      action: 'page_updated',
      projectId: project.id,
      description: `Updated page: ${updated.name}`,
      metadata: { pageId: updated.id, slug: updated.slug }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deletePage = async (req, res) => {
  try {
    const page = await db()('project_pages')
      .where({ id: parseInt(req.params.id) })
      .first();
    if (!page) return res.status(404).json({ message: 'Page not found' });

    const project = await db()('projects')
      .where({ id: page.projectId, userId: req.user.id })
      .first();
    if (!project) return res.status(403).json({ message: 'Not authorized' });

    if (page.type === 'home') {
      return res.status(400).json({ message: 'Cannot delete the home page' });
    }

    await db()('project_pages').where({ id: page.id }).delete();
    await recordActivity({
      userId: req.user.id,
      action: 'page_deleted',
      projectId: project.id,
      description: `Deleted page: ${page.name}`,
      metadata: { pageId: page.id }
    });

    res.json({ message: 'Page deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default { createPage, getPages, getPage, updatePage, deletePage };
