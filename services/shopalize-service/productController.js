import { createConnection } from '../shared/db.js';
import { callService } from '../shared/serviceClient.js';

const db = () => createConnection('shopalize_db');

export const createProduct = async (req, res) => {
  try {
    const { projectId, name, description, price, currency, images, category, inventory } = req.body;
    if (!projectId || !name || price === undefined) {
      return res.status(400).json({ message: 'projectId, name, and price are required' });
    }

    const project = await db()('projects')
      .where({ id: parseInt(projectId), userId: req.user.id })
      .first();
    if (!project) return res.status(404).json({ message: 'Project not found' });

    let ripplifyLinkId = null;
    let ripplifySlug = null;

    // Create payment link via Ripplify service
    try {
      const linkResult = await callService('ripplify', '/api/ripplify/links', {
        method: 'POST',
        userToken: req.headers.authorization?.split(' ')[1],
        body: {
          name,
          description: description || `Product: ${name}`,
          price: parseFloat(price),
          currency: currency || 'USD',
          linkType: 'one-time',
          category: 'product',
        },
      });
      ripplifyLinkId = linkResult.id;
      ripplifySlug = linkResult.slug;
    } catch (err) {
      console.error('Failed to create Ripplify payment link:', err.message);
    }

    const [product] = await db()('store_products')
      .insert({
        projectId: project.id,
        name,
        description: description || '',
        price: parseFloat(price),
        currency: currency || 'USD',
        images: images ? (typeof images === 'string' ? images : JSON.stringify(images)) : '[]',
        category: category || null,
        inventory: inventory !== undefined ? parseInt(inventory) : -1,
        isActive: true,
        ripplifyLinkId,
        ripplifySlug,
      })
      .returning('*');

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProducts = async (req, res) => {
  try {
    const { projectId } = req.query;
    if (!projectId) return res.status(400).json({ message: 'projectId query param is required' });

    const project = await db()('projects')
      .where({ id: parseInt(projectId), userId: req.user.id })
      .first();
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const products = await db()('store_products')
      .where({ projectId: project.id })
      .orderBy('createdAt', 'desc');

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProduct = async (req, res) => {
  try {
    const product = await db()('store_products')
      .where({ id: parseInt(req.params.id) })
      .first();
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const project = await db()('projects')
      .where({ id: product.projectId, userId: req.user.id })
      .first();
    if (!project) return res.status(403).json({ message: 'Not authorized' });

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { name, description, price, currency, images, category, inventory, isActive } = req.body;

    const product = await db()('store_products')
      .where({ id: parseInt(req.params.id) })
      .first();
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const project = await db()('projects')
      .where({ id: product.projectId, userId: req.user.id })
      .first();
    if (!project) return res.status(403).json({ message: 'Not authorized' });

    const updates = { updatedAt: db().fn.now() };
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (price !== undefined) updates.price = parseFloat(price);
    if (currency !== undefined) updates.currency = currency;
    if (images !== undefined) updates.images = typeof images === 'string' ? images : JSON.stringify(images);
    if (category !== undefined) updates.category = category;
    if (inventory !== undefined) updates.inventory = parseInt(inventory);
    if (isActive !== undefined) updates.isActive = isActive;

    const [updated] = await db()('store_products')
      .where({ id: parseInt(req.params.id) })
      .update(updates)
      .returning('*');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await db()('store_products')
      .where({ id: parseInt(req.params.id) })
      .first();
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const project = await db()('projects')
      .where({ id: product.projectId, userId: req.user.id })
      .first();
    if (!project) return res.status(403).json({ message: 'Not authorized' });

    await db()('store_products').where({ id: product.id }).delete();
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default { createProduct, getProducts, getProduct, updateProduct, deleteProduct };
