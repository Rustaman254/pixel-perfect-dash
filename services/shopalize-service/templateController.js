import { createConnection } from '../shared/db.js';

const db = () => createConnection('shopalize_db');

export const getTemplates = async (req, res) => {
  try {
    const templates = await db()('templates')
      .where({ isActive: true })
      .orderBy('createdAt', 'asc');

    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTemplate = async (req, res) => {
  try {
    const template = await db()('templates')
      .where({ slug: req.params.slug, isActive: true })
      .first();
    if (!template) return res.status(404).json({ message: 'Template not found' });

    res.json(template);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default { getTemplates, getTemplate };
