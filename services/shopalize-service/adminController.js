import { createConnection } from '../shared/db.js';

const db = () => createConnection('shopalize_db');

// GET /internal/admin/stats - Platform-wide shopalize stats
export const getStats = async (req, res) => {
  try {
    const projectCount = await db()('projects')
      .count('id as count')
      .first();

    const publishedCount = await db()('projects')
      .where({ status: 'published' })
      .count('id as count')
      .first();

    const draftCount = await db()('projects')
      .where({ status: 'draft' })
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

    const pendingOrders = await db()('store_orders')
      .where({ status: 'pending' })
      .count('id as count')
      .first();

    const completedOrders = await db()('store_orders')
      .where({ status: 'completed' })
      .count('id as count')
      .first();

    const todayOrders = await db()('store_orders')
      .where(db().raw('"createdAt" >= CURRENT_DATE'))
      .count('id as count')
      .first();

    const uniqueUsers = await db()('projects')
      .countDistinct('userId as count')
      .first();

    const pageCount = await db()('project_pages')
      .count('id as count')
      .first();

    res.json({
      totalProjects: parseInt(projectCount?.count || 0),
      publishedProjects: parseInt(publishedCount?.count || 0),
      draftProjects: parseInt(draftCount?.count || 0),
      totalProducts: parseInt(productCount?.count || 0),
      totalOrders: parseInt(orderCount?.count || 0),
      totalRevenue: parseFloat(revenueResult?.total || 0),
      pendingOrders: parseInt(pendingOrders?.count || 0),
      completedOrders: parseInt(completedOrders?.count || 0),
      todayOrders: parseInt(todayOrders?.count || 0),
      uniqueUsers: parseInt(uniqueUsers?.count || 0),
      totalPages: parseInt(pageCount?.count || 0),
    });
  } catch (error) {
    console.error('Get shopalize admin stats error:', error);
    res.status(500).json({ message: 'Failed to load shopalize stats' });
  }
};

// GET /internal/admin/analytics - Detailed analytics
export const getAnalytics = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    let interval = '30 days';
    if (period === '7d') interval = '7 days';
    else if (period === '90d') interval = '90 days';
    else if (period === '1y') interval = '1 year';

    const ordersOverTime = await db()('store_orders')
      .select(db().raw("DATE(\"createdAt\") as date"))
      .count('id as orders')
      .sum('amount as revenue')
      .where(db().raw(`"createdAt" >= NOW() - INTERVAL '${interval}'`))
      .groupByRaw('DATE("createdAt")')
      .orderByRaw('DATE("createdAt") ASC');

    const projectsOverTime = await db()('projects')
      .select(db().raw("DATE(\"createdAt\") as date"))
      .count('id as count')
      .where(db().raw(`"createdAt" >= NOW() - INTERVAL '${interval}'`))
      .groupByRaw('DATE("createdAt")')
      .orderByRaw('DATE("createdAt") ASC');

    const topProducts = await db()('store_products')
      .select('store_products.*')
      .count('store_orders.id as orderCount')
      .sum('store_orders.amount as totalRevenue')
      .leftJoin('store_orders', 'store_products.id', 'store_orders.productId')
      .groupBy('store_products.id')
      .orderBy('orderCount', 'desc')
      .limit(10);

    const topStores = await db()('projects')
      .select('projects.*')
      .count('store_orders.id as orderCount')
      .sum('store_orders.amount as totalRevenue')
      .leftJoin('store_orders', 'projects.id', 'store_orders.projectId')
      .groupBy('projects.id')
      .orderBy('totalRevenue', 'desc')
      .limit(10);

    const orderStatusBreakdown = await db()('store_orders')
      .select('status')
      .count('id as count')
      .sum('amount as total')
      .groupBy('status');

    const productCategoryBreakdown = await db()('store_products')
      .select('category')
      .count('id as count')
      .whereNotNull('category')
      .groupBy('category')
      .orderBy('count', 'desc');

    const revenueByCurrency = await db()('store_orders')
      .select('currency')
      .sum('amount as total')
      .count('id as count')
      .whereNot({ status: 'cancelled' })
      .groupBy('currency')
      .orderBy('total', 'desc');

    res.json({
      ordersOverTime,
      projectsOverTime,
      topProducts: topProducts.map(p => ({
        ...p,
        orderCount: parseInt(p.orderCount) || 0,
        totalRevenue: parseFloat(p.totalRevenue) || 0,
      })),
      topStores: topStores.map(s => ({
        ...s,
        orderCount: parseInt(s.orderCount) || 0,
        totalRevenue: parseFloat(s.totalRevenue) || 0,
      })),
      orderStatusBreakdown,
      productCategoryBreakdown,
      revenueByCurrency,
    });
  } catch (error) {
    console.error('Get shopalize admin analytics error:', error);
    res.status(500).json({ message: 'Failed to load shopalize analytics' });
  }
};

// GET /internal/admin/projects - All projects with pagination
export const getProjects = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = db()('projects');
    let countQuery = db()('projects');

    if (status) {
      query = query.where({ status });
      countQuery = countQuery.where({ status });
    }
    if (search) {
      const searchFilter = function () {
        this.where('name', 'like', `%${search}%`)
          .orWhere('slug', 'like', `%${search}%`);
      };
      query = query.where(searchFilter);
      countQuery = countQuery.where(searchFilter);
    }

    const projects = await query
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit))
      .offset(offset);

    // Enrich with counts
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

      const pageCount = await db()('project_pages')
        .where({ projectId: project.id })
        .count('id as count')
        .first();

      return {
        ...project,
        productCount: parseInt(productCount?.count || 0),
        orderCount: parseInt(orderCount?.count || 0),
        totalRevenue: parseFloat(revenueResult?.total || 0),
        pageCount: parseInt(pageCount?.count || 0),
      };
    }));

    const total = await countQuery.count('id as count').first();

    res.json({
      projects: enriched,
      total: parseInt(total.count) || 0,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('Get shopalize projects error:', error);
    res.status(500).json({ message: 'Failed to load projects' });
  }
};

// GET /internal/admin/orders - All orders with pagination
export const getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = db()('store_orders')
      .select('store_orders.*', 'projects.name as projectName', 'store_products.name as productName');
    let countQuery = db()('store_orders');

    query = query
      .leftJoin('projects', 'store_orders.projectId', 'projects.id')
      .leftJoin('store_products', 'store_orders.productId', 'store_products.id');

    if (status) {
      query = query.where('store_orders.status', status);
      countQuery = countQuery.where({ status });
    }
    if (search) {
      const searchFilter = function () {
        this.where('buyerName', 'like', `%${search}%`)
          .orWhere('buyerEmail', 'like', `%${search}%`);
      };
      query = query.where(searchFilter);
      countQuery = countQuery.where(searchFilter);
    }

    const orders = await query
      .orderBy('store_orders.createdAt', 'desc')
      .limit(parseInt(limit))
      .offset(offset);

    const total = await countQuery.count('id as count').first();

    res.json({
      orders,
      total: parseInt(total.count) || 0,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('Get shopalize orders error:', error);
    res.status(500).json({ message: 'Failed to load orders' });
  }
};

// GET /internal/admin/settings - Shopalize settings
export const getSettings = async (req, res) => {
  try {
    res.json({
      defaultCurrency: 'USD',
      allowCustomDomains: true,
      maxProductsPerStore: 100,
      orderNotifications: true,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load settings' });
  }
};

// PUT /internal/admin/settings - Update settings
export const updateSettings = async (req, res) => {
  try {
    res.json({ message: 'Settings updated', settings: req.body });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update settings' });
  }
};

export default {
  getStats,
  getAnalytics,
  getProjects,
  getOrders,
  getSettings,
  updateSettings,
};
