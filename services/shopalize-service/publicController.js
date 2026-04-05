import { createConnection } from '../shared/db.js';

const db = () => createConnection('shopalize_db');

export const getStoreBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const host = req.headers.host?.split(':')[0];
    
    let project = null;
    
    // Try to find by subdomain (e.g., mystore.sokostack.xyz)
    if (host && host.includes('sokostack.xyz')) {
      const subdomain = host.replace('.sokostack.xyz', '');
      project = await db()('projects')
        .where({ subdomain, status: 'published' })
        .first();
    }
    
    // Try custom domain in projects table
    if (!project && host) {
      project = await db()('projects')
        .where({ domain: host, status: 'published' })
        .first();
    }
    
    // Fall back to slug parameter
    if (!project) {
      project = await db()('projects')
        .where({ slug, status: 'published' })
        .first();
    }
    
    if (!project) return res.status(404).json({ message: 'Store not found' });

    const pages = await db()('project_pages')
      .where({ projectId: project.id })
      .orderBy('createdAt', 'asc');

    const products = await db()('store_products')
      .where({ projectId: project.id, isActive: true })
      .orderBy('createdAt', 'desc');

    let rawTheme = {};
    try {
      rawTheme = project.themeJson ? JSON.parse(project.themeJson) : {};
    } catch {
      rawTheme = {};
    }

    const theme = {
      primaryColor: rawTheme.colors?.primary || '#000000',
      secondaryColor: rawTheme.colors?.secondary || '#ffffff',
      accentColor: rawTheme.colors?.accent || '#3b82f6',
      backgroundColor: rawTheme.colors?.background || '#ffffff',
      textColor: rawTheme.colors?.text || '#111827',
      fontFamily: rawTheme.fonts?.body || 'Inter',
      isPublished: true,
    };

    res.json({
      id: String(project.id),
      name: project.name,
      slug: project.slug,
      templateId: project.templateId || '',
      description: project.description,
      domain: project.domain,
      subdomain: project.subdomain,
      customDomain: project.domain || null,
      storeUrl: project.domain 
        ? `https://${project.domain}` 
        : `https://${project.subdomain}.sokostack.xyz`,
      theme,
      pages: pages.map(p => {
        const rawSections = (() => { try { return JSON.parse(p.sectionsJson || '[]'); } catch { return []; } })();
        return {
          id: String(p.id),
          name: p.name,
          slug: p.slug,
          sections: rawSections.map((s, i) => ({
            id: `section-${i}`,
            type: s.type || 'hero',
            props: s.settings || s.props || {},
            blocks: s.blocks || [],
          })),
        };
      }),
      products: products.map(p => {
        const images = (() => { try { return JSON.parse(p.images || '[]'); } catch { return []; } })();
        return {
          id: String(p.id),
          name: p.name,
          description: p.description,
          price: parseFloat(p.price),
          image: images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80',
          category: p.category,
        };
      }),
      createdAt: new Date(project.createdAt).getTime(),
      updatedAt: new Date(project.updatedAt).getTime(),
      isPremium: project.isPremium === true || project.isPremium === 1,
      premiumStatus: project.premiumStatus || 'basic',
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
