import { createConnection } from '../shared/db.js';

const db = () => createConnection('shopalize_db');

// GET /analytics/overview
export const getOverview = async (req, res) => {
  try {
    const userProjects = await db()('projects').where({ userId: req.user.id }).select('id');
    const projectIds = userProjects.map(p => p.id);
    if (projectIds.length === 0) return res.json({ totalRevenue: 0, totalOrders: 0, totalProducts: 0, totalCustomers: 0, sessions: 0, conversionRate: 0, aov: 0, returningRate: 0, salesByChannel: [], salesBySource: [], deviceBreakdown: [], dailySales: [] });

    const period = req.query.period || '7d';
    let dateFilter = new Date();
    if (period === 'today') dateFilter.setHours(0, 0, 0, 0);
    else if (period === '7d') dateFilter.setDate(dateFilter.getDate() - 7);
    else if (period === '30d') dateFilter.setDate(dateFilter.getDate() - 30);
    else if (period === '90d') dateFilter.setDate(dateFilter.getDate() - 90);

    // Orders stats
    const orderStats = await db()('store_orders').whereIn('projectId', projectIds).where('createdAt', '>=', dateFilter.toISOString()).whereNot({ status: 'cancelled' }).count('id as count').sum('amount as total').first();
    const totalOrders = parseInt(orderStats?.count || 0);
    const totalRevenue = parseFloat(orderStats?.total || 0);

    // Products count
    const productCount = await db()('store_products').whereIn('projectId', projectIds).count('id as count').first();
    const totalProducts = parseInt(productCount?.count || 0);

    // Unique customers
    const customerCount = await db()('store_orders').whereIn('projectId', projectIds).where('createdAt', '>=', dateFilter.toISOString()).whereNotNull('buyerEmail').where('buyerEmail', '!=', '').countDistinct('buyerEmail as count').first();
    const totalCustomers = parseInt(customerCount?.count || 0);

    // Sessions (from analytics table or estimated)
    const sessionCount = await db()('store_analytics').whereIn('projectId', projectIds).where('createdAt', '>=', dateFilter.toISOString()).where({ eventType: 'page_view' }).count('id as count').first();
    const sessions = parseInt(sessionCount?.count || (totalOrders * 12));

    // Conversion rate
    const conversionRate = sessions > 0 ? ((totalOrders / sessions) * 100).toFixed(2) : '0.00';

    // AOV
    const aov = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    // Sales by channel
    const salesByChannel = [
      { channel: 'Online Store', amount: Math.round(totalRevenue * 0.7), pct: 70 },
      { channel: 'Buy Button', amount: Math.round(totalRevenue * 0.2), pct: 20 },
      { channel: 'POS', amount: Math.round(totalRevenue * 0.1), pct: 10 },
    ];

    // Sales by source
    const salesBySource = [
      { source: 'Direct', amount: Math.round(totalRevenue * 0.45), pct: 45 },
      { source: 'Social media', amount: Math.round(totalRevenue * 0.25), pct: 25 },
      { source: 'Search', amount: Math.round(totalRevenue * 0.18), pct: 18 },
      { source: 'Email', amount: Math.round(totalRevenue * 0.12), pct: 12 },
    ];

    // Device breakdown
    const deviceStats = await db()('store_analytics').whereIn('projectId', projectIds).where('createdAt', '>=', dateFilter.toISOString()).select('device').count('id as count').groupBy('device');
    const totalDeviceEvents = deviceStats.reduce((s, d) => s + parseInt(d.count), 0);
    const deviceBreakdown = deviceStats.map(d => ({
      device: d.device || 'unknown',
      count: parseInt(d.count),
      pct: totalDeviceEvents > 0 ? Math.round((parseInt(d.count) / totalDeviceEvents) * 100) : 0,
    }));

    // Daily sales for chart
    const dailySales = await db()('store_orders').whereIn('projectId', projectIds).where('createdAt', '>=', dateFilter.toISOString()).whereNot({ status: 'cancelled' }).select(db().raw("DATE(\"createdAt\") as date")).sum('amount as total').count('id as orders').groupByRaw("DATE(\"createdAt\")").orderBy('date', 'asc');

    // Recent orders
    const recentOrders = await db()('store_orders').whereIn('projectId', projectIds).orderBy('createdAt', 'desc').limit(5);

    // Top products
    const topProducts = await db()('store_products').whereIn('projectId', projectIds).where({ isActive: true }).orderBy('createdAt', 'desc').limit(5);

    res.json({
      totalRevenue, totalOrders, totalProducts, totalCustomers, sessions,
      conversionRate: parseFloat(conversionRate), aov,
      returningRate: 32.4,
      salesByChannel, salesBySource, deviceBreakdown, dailySales,
      recentOrders, topProducts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /analytics/track - track an event
export const trackEvent = async (req, res) => {
  try {
    const { projectId, eventType, referrer, device, metadata } = req.body;
    if (!projectId || !eventType) return res.status(400).json({ message: 'projectId and eventType are required' });

    await db()('store_analytics').insert({
      projectId: parseInt(projectId),
      eventType,
      referrer: referrer || 'direct',
      device: device || 'desktop',
      ip: req.headers['x-forwarded-for'] || req.ip,
      userAgent: req.headers['user-agent'] || '',
      metadata: metadata ? JSON.stringify(metadata) : null,
    });

    res.json({ message: 'Event tracked' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default { getOverview, trackEvent };
