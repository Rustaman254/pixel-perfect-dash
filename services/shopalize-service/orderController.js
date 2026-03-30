import { createConnection } from '../shared/db.js';
import { recordActivity } from './activityController.js';

const db = () => createConnection('shopalize_db');

export const createOrder = async (req, res) => {
  try {
    const { projectId, items, buyerName, buyerEmail, buyerPhone, totalAmount, amount, currency, ripplifyTransactionId } = req.body;

    const orderAmount = totalAmount || amount;

    if (!projectId || !orderAmount) {
      return res.status(400).json({ message: 'projectId and amount are required' });
    }

    const project = await db()('projects').where({ id: parseInt(projectId) }).first();
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const parsedItems = typeof items === 'string' ? JSON.parse(items) : (items || []);

    // Decrement inventory for each item
    for (const item of parsedItems) {
      if (item.productId) {
        const product = await db()('store_products').where({ id: parseInt(item.productId), projectId: project.id }).first();
        if (product && product.inventory > 0) {
          await db()('store_products')
            .where({ id: product.id })
            .decrement('inventory', item.quantity || 1)
            .update({ updatedAt: db().fn.now() });
        }
      }
    }

    const [orderId] = await db()('store_orders')
      .insert({
        projectId: project.id,
        buyerName: buyerName || '',
        buyerEmail: buyerEmail || '',
        buyerPhone: buyerPhone || '',
        amount: parseFloat(orderAmount),
        currency: currency || project.currency || 'USD',
        status: 'paid',
        itemsJson: JSON.stringify(parsedItems),
        ripplifyTransactionId: ripplifyTransactionId || null,
      });
    
    const order = await db()('store_orders').where({ id: orderId }).first();
    
    // Record activity
    await recordActivity({
      userId: req.user.id,
      action: 'order_created',
      projectId: project.id,
      description: `New order #${order.id} received for ${amount} ${currency || project.currency || 'USD'}`,
      metadata: { orderId: order.id, amount, buyerEmail }
    });

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

// PUT /orders/:id - update order status
export const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, fulfillmentStatus, paymentStatus, notes } = req.body;

    // Verify ownership
    const userProjects = await db()('projects').where({ userId: req.user.id }).select('id');
    const projectIds = userProjects.map(p => p.id);

    const order = await db()('store_orders').where({ id: parseInt(id) }).whereIn('projectId', projectIds).first();
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const updates = {};
    if (status !== undefined) updates.status = status;
    if (fulfillmentStatus !== undefined) updates.fulfillmentStatus = fulfillmentStatus;
    if (paymentStatus !== undefined) updates.paymentStatus = paymentStatus;
    if (notes !== undefined) updates.notes = notes;

    await db()('store_orders').where({ id: parseInt(id) }).update(updates);
    const updated = await db()('store_orders').where({ id: parseInt(id) }).first();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default { createOrder, getOrders, getOrderStats, updateOrder };
