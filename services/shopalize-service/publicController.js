import { createConnection } from '../shared/db.js';

const db = () => createConnection('shopalize_db');

export const getStoreBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const project = await db()('projects')
      .where({ slug, status: 'published' })
      .first();
    if (!project) return res.status(404).json({ message: 'Store not found' });

    const pages = await db()('project_pages')
      .where({ projectId: project.id })
      .orderBy('createdAt', 'asc');

    const products = await db()('store_products')
      .where({ projectId: project.id, isActive: true })
      .orderBy('createdAt', 'desc');

    let theme = {};
    try {
      theme = project.themeJson ? JSON.parse(project.themeJson) : {};
    } catch {
      theme = {};
    }

    res.json({
      id: project.id,
      name: project.name,
      slug: project.slug,
      description: project.description,
      domain: project.domain,
      theme,
      pages: pages.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        type: p.type,
        sections: (() => { try { return JSON.parse(p.sectionsJson || '[]'); } catch { return []; } })(),
        seoTitle: p.seoTitle,
        seoDescription: p.seoDescription,
      })),
      products: products.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: parseFloat(p.price),
        currency: p.currency,
        images: (() => { try { return JSON.parse(p.images || '[]'); } catch { return []; } })(),
        category: p.category,
        inventory: p.inventory,
        ripplifySlug: p.ripplifySlug,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStoreProduct = async (req, res) => {
  try {
    const { slug, id } = req.params;

    const project = await db()('projects')
      .where({ slug, status: 'published' })
      .first();
    if (!project) return res.status(404).json({ message: 'Store not found' });

    const product = await db()('store_products')
      .where({ id: parseInt(id), projectId: project.id, isActive: true })
      .first();
    if (!product) return res.status(404).json({ message: 'Product not found' });

    res.json({
      id: product.id,
      name: product.name,
      description: product.description,
      price: parseFloat(product.price),
      currency: product.currency,
      images: (() => { try { return JSON.parse(product.images || '[]'); } catch { return []; } })(),
      category: product.category,
      inventory: product.inventory,
      ripplifySlug: product.ripplifySlug,
      storeName: project.name,
      storeSlug: project.slug,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default { getStoreBySlug, getStoreProduct };
