import { createConnection } from '../shared/db.js';

const db = () => createConnection('shopalize_db');

// GET /internal/admin/stores - all stores with stats
export const getAllStores = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;

    let query = db()('projects').orderBy('createdAt', 'desc');
    if (status) query = query.where({ status });
    if (search) query = query.where(function () {
      this.where('name', 'ilike', `%${search}%`).orWhere('slug', 'ilike', `%${search}%`);
    });

    const total = await query.clone().count('id as count').first();
    const projects = await query.limit(parseInt(limit)).offset((parseInt(page) - 1) * parseInt(limit));

    const enriched = await Promise.all(projects.map(async (project) => {
      const [productCount, orderCount, revenueResult, owner] = await Promise.all([
        db()('store_products').where({ projectId: project.id }).count('id as count').first(),
        db()('store_orders').where({ projectId: project.id }).count('id as count').first(),
        db()('store_orders').where({ projectId: project.id }).whereNot({ status: 'cancelled' }).sum('amount as total').first(),
        db()('store_orders').where({ projectId: project.id }).whereNotNull('buyerEmail').where('buyerEmail', '!=', '').countDistinct('buyerEmail as count').first(),
      ]);

      return {
        ...project,
        productCount: parseInt(productCount?.count || 0),
        orderCount: parseInt(orderCount?.count || 0),
        totalRevenue: parseFloat(revenueResult?.total || 0),
        customerCount: parseInt(owner?.count || 0),
      };
    }));

    res.json({ stores: enriched, total: parseInt(total?.count || 0), page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    console.error('Get all stores error:', error);
    res.status(500).json({ message: error.message });
  }
};

// GET /internal/admin/stores/:id
export const getStoreDetail = async (req, res) => {
  try {
    const project = await db()('projects').where({ id: parseInt(req.params.id) }).first();
    if (!project) return res.status(404).json({ message: 'Store not found' });

    const [pages, productCount, orderCount, revenueResult, recentOrders, customers] = await Promise.all([
      db()('project_pages').where({ projectId: project.id }),
      db()('store_products').where({ projectId: project.id }).count('id as count').first(),
      db()('store_orders').where({ projectId: project.id }).count('id as count').first(),
      db()('store_orders').where({ projectId: project.id }).whereNot({ status: 'cancelled' }).sum('amount as total').first(),
      db()('store_orders').where({ projectId: project.id }).orderBy('createdAt', 'desc').limit(10),
      db()('store_orders').where({ projectId: project.id }).whereNotNull('buyerEmail').where('buyerEmail', '!=', '').countDistinct('buyerEmail as count').first(),
    ]);

    res.json({
      ...project,
      pages,
      productCount: parseInt(productCount?.count || 0),
      orderCount: parseInt(orderCount?.count || 0),
      totalRevenue: parseFloat(revenueResult?.total || 0),
      customerCount: parseInt(customers?.count || 0),
      recentOrders,
    });
  } catch (error) {
    console.error('Get store detail error:', error);
    res.status(500).json({ message: error.message });
  }
};

// PUT /internal/admin/stores/:id
export const updateStore = async (req, res) => {
  try {
    const { name, description, status, domain } = req.body;
    const store = await db()('projects').where({ id: parseInt(req.params.id) }).first();
    if (!store) return res.status(404).json({ message: 'Store not found' });

    const updates = { updatedAt: db().fn.now() };
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;
    if (domain !== undefined) updates.domain = domain;

    const [updated] = await db()('projects').where({ id: store.id }).update(updates).returning('*');
    res.json(updated);
  } catch (error) {
    console.error('Update store error:', error);
    res.status(500).json({ message: error.message });
  }
};

// DELETE /internal/admin/stores/:id
export const deleteStore = async (req, res) => {
  try {
    const store = await db()('projects').where({ id: parseInt(req.params.id) }).first();
    if (!store) return res.status(404).json({ message: 'Store not found' });

    await db()('wishlists').where({ projectId: store.id }).delete();
    await db()('store_analytics').where({ projectId: store.id }).delete();
    await db()('store_orders').where({ projectId: store.id }).delete();
    await db()('store_products').where({ projectId: store.id }).delete();
    await db()('project_pages').where({ projectId: store.id }).delete();
    await db()('store_blogs').where({ projectId: store.id }).delete();
    await db()('store_navigation').where({ projectId: store.id }).delete();
    await db()('projects').where({ id: store.id }).delete();

    res.json({ message: 'Store and all related data deleted' });
  } catch (error) {
    console.error('Delete store error:', error);
    res.status(500).json({ message: error.message });
  }
};

// GET /internal/admin/orders
export const getAllOrders = async (req, res) => {
  try {
    const { status, storeId, search, page = 1, limit = 50 } = req.query;

    let query = db()('store_orders').orderBy('createdAt', 'desc');
    if (status) query = query.where({ status });
    if (storeId) query = query.where({ projectId: parseInt(storeId) });
    if (search) query = query.where(function () {
      this.where('buyerName', 'ilike', `%${search}%`)
        .orWhere('buyerEmail', 'ilike', `%${search}%`)
        .orWhere('id', parseInt(search) || 0);
    });

    const total = await query.clone().count('id as count').first();
    const orders = await query.limit(parseInt(limit)).offset((parseInt(page) - 1) * parseInt(limit));

    // Enrich with store names
    const storeIds = [...new Set(orders.map(o => o.projectId))];
    const stores = storeIds.length > 0 ? await db()('projects').whereIn('id', storeIds).select('id', 'name', 'slug') : [];
    const storeMap = Object.fromEntries(stores.map(s => [s.id, s]));

    const enriched = orders.map(o => ({
      ...o,
      storeName: storeMap[o.projectId]?.name || 'Unknown',
      storeSlug: storeMap[o.projectId]?.slug || '',
    }));

    res.json({ orders: enriched, total: parseInt(total?.count || 0), page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ message: error.message });
  }
};

// PUT /internal/admin/orders/:id
export const updateOrder = async (req, res) => {
  try {
    const { status, fulfillmentStatus, paymentStatus, notes } = req.body;
    const order = await db()('store_orders').where({ id: parseInt(req.params.id) }).first();
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const updates = {};
    if (status !== undefined) updates.status = status;
    if (fulfillmentStatus !== undefined) updates.fulfillmentStatus = fulfillmentStatus;
    if (paymentStatus !== undefined) updates.paymentStatus = paymentStatus;
    if (notes !== undefined) updates.notes = notes;

    const [updated] = await db()('store_orders').where({ id: order.id }).update(updates).returning('*');
    res.json(updated);
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ message: error.message });
  }
};

// GET /internal/admin/products
export const getAllProducts = async (req, res) => {
  try {
    const { storeId, search, category, page = 1, limit = 50 } = req.query;

    let query = db()('store_products').orderBy('createdAt', 'desc');
    if (storeId) query = query.where({ projectId: parseInt(storeId) });
    if (category) query = query.where({ category });
    if (search) query = query.where(function () {
      this.where('name', 'ilike', `%${search}%`).orWhere('description', 'ilike', `%${search}%`);
    });

    const total = await query.clone().count('id as count').first();
    const products = await query.limit(parseInt(limit)).offset((parseInt(page) - 1) * parseInt(limit));

    const storeIds = [...new Set(products.map(p => p.projectId))];
    const stores = storeIds.length > 0 ? await db()('projects').whereIn('id', storeIds).select('id', 'name') : [];
    const storeMap = Object.fromEntries(stores.map(s => [s.id, s]));

    const enriched = products.map(p => ({
      ...p,
      storeName: storeMap[p.projectId]?.name || 'Unknown',
    }));

    res.json({ products: enriched, total: parseInt(total?.count || 0), page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    console.error('Get all products error:', error);
    res.status(500).json({ message: error.message });
  }
};

// PUT /internal/admin/products/:id
export const updateProduct = async (req, res) => {
  try {
    const { name, description, price, category, inventory, isActive } = req.body;
    const product = await db()('store_products').where({ id: parseInt(req.params.id) }).first();
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const updates = { updatedAt: db().fn.now() };
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (price !== undefined) updates.price = parseFloat(price);
    if (category !== undefined) updates.category = category;
    if (inventory !== undefined) updates.inventory = parseInt(inventory);
    if (isActive !== undefined) updates.isActive = isActive;

    const [updated] = await db()('store_products').where({ id: product.id }).update(updates).returning('*');
    res.json(updated);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: error.message });
  }
};

// DELETE /internal/admin/products/:id
export const deleteProduct = async (req, res) => {
  try {
    const product = await db()('store_products').where({ id: parseInt(req.params.id) }).first();
    if (!product) return res.status(404).json({ message: 'Product not found' });

    await db()('store_products').where({ id: product.id }).delete();
    res.json({ message: 'Product deleted' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: error.message });
  }
};

// GET /internal/admin/customers
export const getAllCustomers = async (req, res) => {
  try {
    const { storeId, search, page = 1, limit = 50 } = req.query;

    let ordersQuery = db()('store_orders')
      .whereNotNull('buyerEmail')
      .where('buyerEmail', '!=', '');

    if (storeId) ordersQuery = ordersQuery.where({ projectId: parseInt(storeId) });

    const orders = await ordersQuery;

    const customerMap = {};
    for (const order of orders) {
      const key = order.buyerEmail.toLowerCase();
      if (!customerMap[key]) {
        customerMap[key] = {
          id: key,
          name: order.buyerName || 'Guest',
          email: order.buyerEmail,
          phone: order.buyerPhone || '',
          orders: 0,
          totalSpent: 0,
          stores: new Set(),
          firstOrder: order.createdAt,
          lastOrder: order.createdAt,
        };
      }
      customerMap[key].orders++;
      if (order.status !== 'cancelled') {
        customerMap[key].totalSpent += parseFloat(order.amount || 0);
      }
      customerMap[key].stores.add(order.projectId);
      if (new Date(order.createdAt) < new Date(customerMap[key].firstOrder)) {
        customerMap[key].firstOrder = order.createdAt;
      }
      if (new Date(order.createdAt) > new Date(customerMap[key].lastOrder)) {
        customerMap[key].lastOrder = order.createdAt;
      }
    }

    let customers = Object.values(customerMap).map(c => ({
      ...c,
      storeCount: c.stores.size,
      stores: undefined,
    }));

    if (search) {
      const q = search.toLowerCase();
      customers = customers.filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
    }

    customers.sort((a, b) => b.totalSpent - a.totalSpent);
    const total = customers.length;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    customers = customers.slice(offset, offset + parseInt(limit));

    res.json({ customers, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    console.error('Get all customers error:', error);
    res.status(500).json({ message: error.message });
  }
};

// GET /internal/admin/analytics
export const getAnalytics = async (req, res) => {
  try {
    const period = req.query.period || '30d';
    let dateFilter = new Date();
    if (period === '7d') dateFilter.setDate(dateFilter.getDate() - 7);
    else if (period === '30d') dateFilter.setDate(dateFilter.getDate() - 30);
    else if (period === '90d') dateFilter.setDate(dateFilter.getDate() - 90);

    const [
      totalStores, publishedStores, totalProducts, totalOrders, revenueResult,
      pendingOrders, dailySales, orderStatusBreakdown, topStores, topProducts,
      uniqueCustomers,
    ] = await Promise.all([
      db()('projects').count('id as count').first(),
      db()('projects').where({ status: 'published' }).count('id as count').first(),
      db()('store_products').count('id as count').first(),
      db()('store_orders').where('createdAt', '>=', dateFilter.toISOString()).count('id as count').first(),
      db()('store_orders').where('createdAt', '>=', dateFilter.toISOString()).whereNot({ status: 'cancelled' }).sum('amount as total').first(),
      db()('store_orders').where({ status: 'pending' }).count('id as count').first(),
      db()('store_orders').where('createdAt', '>=', dateFilter.toISOString()).whereNot({ status: 'cancelled' })
        .select(db().raw('DATE("createdAt") as date')).sum('amount as revenue').count('id as orders')
        .groupByRaw('DATE("createdAt")').orderBy('date', 'asc'),
      db()('store_orders').select('status').count('id as count').groupBy('status'),
      db()('projects').select('projects.id', 'projects.name')
        .leftJoin('store_orders', 'projects.id', 'store_orders.projectId')
        .count('store_orders.id as orderCount')
        .sum('store_orders.amount as totalRevenue')
        .groupBy('projects.id', 'projects.name')
        .orderBy('totalRevenue', 'desc').limit(10),
      db()('store_products').select('store_products.id', 'store_products.name', 'store_products.price', 'store_products.currency')
        .leftJoin('store_orders', 'store_products.id', 'store_orders.productId')
        .count('store_orders.id as orderCount')
        .sum('store_orders.amount as totalRevenue')
        .groupBy('store_products.id', 'store_products.name', 'store_products.price', 'store_products.currency')
        .orderBy('orderCount', 'desc').limit(10),
      db()('store_orders').where('createdAt', '>=', dateFilter.toISOString())
        .whereNotNull('buyerEmail').where('buyerEmail', '!=', '')
        .countDistinct('buyerEmail as count').first(),
    ]);

    // Store status breakdown
    const storeStatusBreakdown = await db()('projects').select('status').count('id as count').groupBy('status');

    // Product category breakdown
    const productCategoryBreakdown = await db()('store_products').whereNotNull('category').where('category', '!=', '')
      .select('category').count('id as count').groupBy('category').orderBy('count', 'desc');

    const totalRev = parseFloat(revenueResult?.total || 0);
    const totalOrd = parseInt(totalOrders?.count || 0);

    res.json({
      totalStores: parseInt(totalStores?.count || 0),
      publishedStores: parseInt(publishedStores?.count || 0),
      totalProducts: parseInt(totalProducts?.count || 0),
      totalOrders: totalOrd,
      totalRevenue: totalRev,
      pendingOrders: parseInt(pendingOrders?.count || 0),
      uniqueCustomers: parseInt(uniqueCustomers?.count || 0),
      aov: totalOrd > 0 ? Math.round(totalRev / totalOrd) : 0,
      dailySales,
      orderStatusBreakdown,
      storeStatusBreakdown,
      productCategoryBreakdown,
      topStores: topStores.map(s => ({ ...s, totalRevenue: parseFloat(s.totalRevenue || 0) })),
      topProducts: topProducts.map(p => ({ ...p, totalRevenue: parseFloat(p.totalRevenue || 0) })),
      period,
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: error.message });
  }
};

// GET /internal/admin/settings
export const getSettings = async (req, res) => {
  try {
    const settings = await db()('store_settings').select('*').first().catch(() => null);
    res.json(settings || {
      platformName: 'Shopalize',
      currency: 'USD',
      timezone: 'UTC',
      orderPrefix: 'ORD-',
      taxRate: 0,
      shippingEnabled: true,
      inventoryTracking: true,
      autoFulfillOrders: false,
      emailNotifications: true,
      lowStockThreshold: 5,
      maxProductsPerStore: 1000,
      allowCustomDomains: true,
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ message: error.message });
  }
};

// PUT /internal/admin/settings
export const updateSettings = async (req, res) => {
  try {
    const settings = req.body;
    // Store settings as a single row
    const existing = await db()('store_settings').select('id').first().catch(() => null);
    if (existing) {
      await db()('store_settings').where({ id: existing.id }).update({ ...settings, updatedAt: db().fn.now() });
    } else {
      await db()('store_settings').insert(settings);
    }
    res.json(settings);
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ message: error.message });
  }
};

// GET /internal/admin/feature-flags
export const getFeatureFlags = async (req, res) => {
  try {
    let flags = [];
    try {
      flags = await db()('shopalize_features').select('*').orderBy('name', 'asc');
    } catch {
      // Table may not exist yet, return defaults
      flags = [
        { id: 1, key: 'multi_currency', name: 'Multi-Currency Support', description: 'Allow stores to accept multiple currencies', category: 'payments', isEnabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 2, key: 'custom_domains', name: 'Custom Domains', description: 'Allow stores to use custom domain names', category: 'stores', isEnabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 3, key: 'discount_codes', name: 'Discount Codes', description: 'Enable discount code creation and management', category: 'marketing', isEnabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 4, key: 'inventory_tracking', name: 'Inventory Tracking', description: 'Track product inventory levels', category: 'products', isEnabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 5, key: 'analytics_dashboard', name: 'Store Analytics', description: 'Enable analytics dashboards for store owners', category: 'analytics', isEnabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 6, key: 'marketing_campaigns', name: 'Marketing Campaigns', description: 'Enable email and social marketing campaigns', category: 'marketing', isEnabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 7, key: 'seo_tools', name: 'SEO Tools', description: 'Enable SEO optimization features for stores', category: 'stores', isEnabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 8, key: 'abandoned_cart', name: 'Abandoned Cart Recovery', description: 'Send recovery emails for abandoned carts', category: 'marketing', isEnabled: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 9, key: 'product_reviews', name: 'Product Reviews', description: 'Allow customers to leave product reviews', category: 'products', isEnabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 10, key: 'wishlists', name: 'Wishlists', description: 'Allow customers to save products to wishlists', category: 'products', isEnabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 11, key: 'gift_cards', name: 'Gift Cards', description: 'Enable gift card purchase and redemption', category: 'payments', isEnabled: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 12, key: 'subscription_products', name: 'Subscription Products', description: 'Allow stores to sell subscription-based products', category: 'products', isEnabled: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      ];
    }
    res.json(flags);
  } catch (error) {
    console.error('Get feature flags error:', error);
    res.status(500).json({ message: error.message });
  }
};

// PUT /internal/admin/feature-flags/:id
export const updateFeatureFlag = async (req, res) => {
  try {
    const { id } = req.params;
    const { isEnabled, name, description } = req.body;

    try {
      const updates = { updatedAt: db().fn.now() };
      if (isEnabled !== undefined) updates.isEnabled = isEnabled;
      if (name !== undefined) updates.name = name;
      if (description !== undefined) updates.description = description;

      const [updated] = await db()('shopalize_features').where({ id: parseInt(id) }).update(updates).returning('*');
      res.json(updated);
    } catch {
      res.json({ id: parseInt(id), isEnabled, name, description, updatedAt: new Date().toISOString() });
    }
  } catch (error) {
    console.error('Update feature flag error:', error);
    res.status(500).json({ message: error.message });
  }
};

// POST /internal/admin/feature-flags
export const createFeatureFlag = async (req, res) => {
  try {
    const { key, name, description, category, isEnabled } = req.body;
    if (!key || !name) return res.status(400).json({ message: 'Key and name are required' });

    try {
      const [flag] = await db()('shopalize_features').insert({
        key, name, description: description || '', category: category || 'general',
        isEnabled: isEnabled !== undefined ? isEnabled : true,
      }).returning('*');
      res.status(201).json(flag);
    } catch {
      res.status(201).json({ id: Date.now(), key, name, description, category: category || 'general', isEnabled: isEnabled !== undefined ? isEnabled : true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
  } catch (error) {
    console.error('Create feature flag error:', error);
    res.status(500).json({ message: error.message });
  }
};

// DELETE /internal/admin/feature-flags/:id
export const deleteFeatureFlag = async (req, res) => {
  try {
    try {
      await db()('shopalize_features').where({ id: parseInt(req.params.id) }).delete();
    } catch { /* ignore if table doesn't exist */ }
    res.json({ message: 'Feature flag deleted' });
  } catch (error) {
    console.error('Delete feature flag error:', error);
    res.status(500).json({ message: error.message });
  }
};

export default {
  getAllStores, getStoreDetail, updateStore, deleteStore,
  getAllOrders, updateOrder,
  getAllProducts, updateProduct, deleteProduct,
  getAllCustomers,
  getAnalytics,
  getSettings, updateSettings,
  getFeatureFlags, updateFeatureFlag, createFeatureFlag, deleteFeatureFlag,
};
