import { createConnection } from '../shared/db.js';
import { callService } from '../shared/serviceClient.js';
import { recordActivity } from './activityController.js';

const db = () => createConnection('shopalize_db');

async function getOrCreateDefaultProject(userId) {
  let project = await db()('projects').where({ userId }).orderBy('createdAt', 'asc').first();
  if (!project) {
    const crypto = await import('crypto');
    const shortId = crypto.randomBytes(3).toString('hex');
    const [id] = await db()('projects').insert({
      userId,
      name: 'My Store',
      slug: `my-store-${shortId}`,
      status: 'draft',
      themeJson: JSON.stringify({
        colors: { primary: '#0D5D6D', secondary: '#F2F4F7', accent: '#00D26A', background: '#ffffff', text: '#333333' },
        fonts: { heading: 'Inter', body: 'Inter' },
      }),
    });
    project = await db()('projects').where({ id }).first();
  }
  return project;
}

export const createProduct = async (req, res) => {
  try {
    const { projectId, name, description, price, currency, images, variants, category, inventory, isActive } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ message: 'name and price are required' });
    }

    const project = projectId
      ? await db()('projects').where({ id: parseInt(projectId), userId: req.user.id }).first()
      : await getOrCreateDefaultProject(req.user.id);

    if (!project) return res.status(404).json({ message: 'Project not found' });

    const [productId] = await db()('store_products')
      .insert({
        projectId: project.id,
        name,
        description: description || '',
        price: parseFloat(price),
        currency: currency || 'KES',
        images: images ? (typeof images === 'string' ? images : JSON.stringify(images)) : '[]',
        variants: variants ? (typeof variants === 'string' ? variants : JSON.stringify(variants)) : null,
        category: category || null,
        inventory: inventory !== undefined ? parseInt(inventory) : -1,
        isActive: isActive !== undefined ? isActive : true,
      });

    const product = await db()('store_products').where({ id: productId }).first();

    await recordActivity({
      userId: req.user.id,
      action: 'product_created',
      projectId: project.id,
      description: `Added new product: ${name}`,
      metadata: { productId: product.id }
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProducts = async (req, res) => {
  try {
    const { projectId } = req.query;

    if (projectId) {
      const project = await db()('projects').where({ id: parseInt(projectId), userId: req.user.id }).first();
      if (!project) return res.status(404).json({ message: 'Project not found' });
      const products = await db()('store_products').where({ projectId: project.id }).orderBy('createdAt', 'desc');
      return res.json(products);
    }

    // Get all products across user's projects
    const userProjects = await db()('projects').where({ userId: req.user.id }).select('id');
    const projectIds = userProjects.map(p => p.id);
    if (projectIds.length === 0) return res.json([]);

    const products = await db()('store_products')
      .whereIn('projectId', projectIds)
      .orderBy('createdAt', 'desc');

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProduct = async (req, res) => {
  try {
    const product = await db()('store_products').where({ id: parseInt(req.params.id) }).first();
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const project = await db()('projects').where({ id: product.projectId, userId: req.user.id }).first();
    if (!project) return res.status(403).json({ message: 'Not authorized' });

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { name, description, price, currency, images, variants, category, inventory, isActive } = req.body;

    const product = await db()('store_products').where({ id: parseInt(req.params.id) }).first();
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const project = await db()('projects').where({ id: product.projectId, userId: req.user.id }).first();
    if (!project) return res.status(403).json({ message: 'Not authorized' });

    const updates = { updatedAt: db().fn.now() };
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (price !== undefined) updates.price = parseFloat(price);
    if (currency !== undefined) updates.currency = currency;
    if (images !== undefined) updates.images = typeof images === 'string' ? images : JSON.stringify(images);
    if (variants !== undefined) updates.variants = typeof variants === 'string' ? variants : JSON.stringify(variants);
    if (category !== undefined) updates.category = category;
    if (inventory !== undefined) updates.inventory = parseInt(inventory);
    if (isActive !== undefined) updates.isActive = isActive;

    await db()('store_products')
      .where({ id: parseInt(req.params.id) })
      .update(updates);

    const updated = await db()('store_products')
      .where({ id: parseInt(req.params.id) })
      .first();

    await recordActivity({
      userId: req.user.id,
      action: 'product_updated',
      projectId: project.id,
      description: `Updated product: ${updated.name}`,
      metadata: { productId: updated.id }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await db()('store_products').where({ id: parseInt(req.params.id) }).first();
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const project = await db()('projects').where({ id: product.projectId, userId: req.user.id }).first();
    if (!project) return res.status(403).json({ message: 'Not authorized' });

    await db()('store_products').where({ id: product.id }).delete();
    await recordActivity({
      userId: req.user.id,
      action: 'product_deleted',
      projectId: project.id,
      description: `Deleted product: ${product.name}`,
      metadata: { productId: product.id }
    });

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /customers - aggregate customer data from orders
export const getCustomers = async (req, res) => {
  try {
    const userProjects = await db()('projects').where({ userId: req.user.id }).select('id');
    const projectIds = userProjects.map(p => p.id);
    if (projectIds.length === 0) return res.json([]);

    const orders = await db()('store_orders')
      .whereIn('projectId', projectIds)
      .whereNotNull('buyerEmail')
      .where('buyerEmail', '!=', '');

    const customerMap = {};
    for (const order of orders) {
      const key = order.buyerEmail;
      if (!customerMap[key]) {
        customerMap[key] = {
          id: key,
          name: order.buyerName || 'Guest',
          email: order.buyerEmail,
          phone: order.buyerPhone || '',
          orders: 0,
          totalSpent: 0,
          createdAt: order.createdAt,
        };
      }
      customerMap[key].orders++;
      if (order.status !== 'cancelled') {
        customerMap[key].totalSpent += parseFloat(order.amount || 0);
      }
      if (new Date(order.createdAt) < new Date(customerMap[key].createdAt)) {
        customerMap[key].createdAt = order.createdAt;
      }
    }

    const customers = Object.values(customerMap).sort((a, b) => b.totalSpent - a.totalSpent);
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /dashboard - aggregated dashboard stats
export const getDashboardStats = async (req, res) => {
  try {
    const userProjects = await db()('projects').where({ userId: req.user.id }).select('id');
    const projectIds = userProjects.map(p => p.id);

    const totalProducts = projectIds.length > 0
      ? await db()('store_products').whereIn('projectId', projectIds).count('id as count').first()
      : { count: 0 };

    const orderStats = projectIds.length > 0
      ? await db()('store_orders').whereIn('projectId', projectIds)
        .select(
          db().count('id as totalOrders').as('totalOrders'),
          db().sum('amount as totalRevenue').as('totalRevenue'),
        )
        .whereNot({ status: 'cancelled' }).first()
      : { totalOrders: 0, totalRevenue: 0 };

    const pendingOrders = projectIds.length > 0
      ? await db()('store_orders').whereIn('projectId', projectIds).where({ status: 'pending' }).count('id as count').first()
      : { count: 0 };

    const uniqueCustomers = projectIds.length > 0
      ? await db()('store_orders').whereIn('projectId', projectIds)
        .whereNotNull('buyerEmail').where('buyerEmail', '!=', '')
        .countDistinct('buyerEmail as count').first()
      : { count: 0 };

    const recentOrders = projectIds.length > 0
      ? await db()('store_orders').whereIn('projectId', projectIds).orderBy('createdAt', 'desc').limit(5)
      : [];

    const topProducts = projectIds.length > 0
      ? await db()('store_products').whereIn('projectId', projectIds).where({ isActive: true }).orderBy('createdAt', 'desc').limit(5)
      : [];

    res.json({
      totalProducts: parseInt(totalProducts?.count || 0),
      totalOrders: parseInt(orderStats?.totalOrders || 0),
      totalRevenue: parseFloat(orderStats?.totalRevenue || 0),
      pendingOrders: parseInt(pendingOrders?.count || 0),
      totalCustomers: parseInt(uniqueCustomers?.count || 0),
      recentOrders,
      topProducts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default { createProduct, getProducts, getProduct, updateProduct, deleteProduct, getCustomers, getDashboardStats };
