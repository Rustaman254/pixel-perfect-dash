import { createConnection } from '../shared/db.js';

const db = () => createConnection('shopalize_db');

export const createOrder = async (req, res) => {
  try {
    const { projectId, productId, buyerName, buyerEmail, buyerPhone, amount, currency, ripplifyTransactionId } = req.body;

    if (!projectId || !amount) {
      return res.status(400).json({ message: 'projectId and amount are required' });
    }

    const project = await db()('projects').where({ id: parseInt(projectId) }).first();
    if (!project) return res.status(404).json({ message: 'Project not found' });

    let product = null;
    if (productId) {
      product = await db()('store_products').where({ id: parseInt(productId), projectId: project.id }).first();
      if (product && product.inventory > 0) {
        await db()('store_products')
          .where({ id: product.id })
          .decrement('inventory', 1)
          .update({ updatedAt: db().fn.now() });
      }
    }

    const [order] = await db()('store_orders')
      .insert({
        projectId: project.id,
        productId: productId ? parseInt(productId) : null,
        buyerName: buyerName || '',
        buyerEmail: buyerEmail || '',
        buyerPhone: buyerPhone || '',
        amount: parseFloat(amount),
        currency: currency || project.currency || 'USD',
        status: 'pending',
        ripplifyTransactionId: ripplifyTransactionId || null,
      })
      .returning('*');

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getOrders = async (req, res) => {
  try {
    const { projectId, status, limit: queryLimit } = req.query;

    // Get all projects owned by user
    const userProjects = await db()('projects').where({ userId: req.user.id }).select('id');
    const projectIds = userProjects.map(p => p.id);

    if (projectIds.length === 0) return res.json([]);

    let query = db()('store_orders')
      .whereIn('projectId', projectIds)
      .orderBy('createdAt', 'desc');

    if (projectId) query = query.where({ projectId: parseInt(projectId) });
    if (status) query = query.where({ status });
    if (queryLimit) query = query.limit(parseInt(queryLimit));

    const orders = await query;
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getOrderStats = async (req, res) => {
  try {
    const userProjects = await db()('projects').where({ userId: req.user.id }).select('id');
    const projectIds = userProjects.map(p => p.id);

    if (projectIds.length === 0) {
      return res.json({
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        completedOrders: 0,
        recentOrders: [],
      });
    }

    const totalResult = await db()('store_orders')
      .whereIn('projectId', projectIds)
      .count('id as count')
      .first();

    const revenueResult = await db()('store_orders')
      .whereIn('projectId', projectIds)
      .whereNot({ status: 'cancelled' })
      .sum('amount as total')
      .first();

    const pendingResult = await db()('store_orders')
      .whereIn('projectId', projectIds)
      .where({ status: 'pending' })
      .count('id as count')
      .first();

    const completedResult = await db()('store_orders')
      .whereIn('projectId', projectIds)
      .where({ status: 'completed' })
      .count('id as count')
      .first();

    const recentOrders = await db()('store_orders')
      .whereIn('projectId', projectIds)
      .orderBy('createdAt', 'desc')
      .limit(5);

    res.json({
      totalOrders: parseInt(totalResult?.count || 0),
      totalRevenue: parseFloat(revenueResult?.total || 0),
      pendingOrders: parseInt(pendingResult?.count || 0),
      completedOrders: parseInt(completedResult?.count || 0),
      recentOrders,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default { createOrder, getOrders, getOrderStats };
