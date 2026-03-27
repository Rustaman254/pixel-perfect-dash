import { createConnection } from '../shared/db.js';

const db = () => createConnection('shopalize_db');

export const getStores = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: 'userId required' });

    const projects = await db()('projects')
      .where({ userId: parseInt(userId) })
      .orderBy('createdAt', 'desc');

    const enriched = await Promise.all(projects.map(async (project) => {
      const productCount = await db()('store_products')
        .where({ projectId: project.id })
        .count('id as count')
        .first();

      const orderCount = await db()('store_orders')
        .where({ projectId: project.id })
        .count('id as count')
        .first();

      const revenueResult = await db()('store_orders')
        .where({ projectId: project.id })
        .whereNot({ status: 'cancelled' })
        .sum('amount as total')
        .first();

      return {
        ...project,
        productCount: parseInt(productCount?.count || 0),
        orderCount: parseInt(orderCount?.count || 0),
        totalRevenue: parseFloat(revenueResult?.total || 0),
      };
    }));

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStoreStats = async (req, res) => {
  try {
    const projectCount = await db()('projects')
      .count('id as count')
      .first();

    const publishedCount = await db()('projects')
      .where({ status: 'published' })
      .count('id as count')
      .first();

    const productCount = await db()('store_products')
      .count('id as count')
      .first();

    const orderCount = await db()('store_orders')
      .count('id as count')
      .first();

    const revenueResult = await db()('store_orders')
      .whereNot({ status: 'cancelled' })
      .sum('amount as total')
      .first();

    res.json({
      totalProjects: parseInt(projectCount?.count || 0),
      publishedProjects: parseInt(publishedCount?.count || 0),
      totalProducts: parseInt(productCount?.count || 0),
      totalOrders: parseInt(orderCount?.count || 0),
      totalRevenue: parseFloat(revenueResult?.total || 0),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default { getStores, getStoreStats };
