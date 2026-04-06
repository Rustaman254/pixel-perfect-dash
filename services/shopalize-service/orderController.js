import { createConnection } from '../shared/db.js';
import { recordActivity } from './activityController.js';
import { ripplifyService } from '../shared/serviceClient.js';

const db = () => createConnection('shopalize_db');

export const createOrder = async (req, res) => {
  try {
    const { projectId, items, buyerName, buyerEmail, buyerPhone, buyerAddress, totalAmount, amount, currency, ripplifyTransactionId, returnUrl } = req.body;

    const orderAmount = totalAmount || amount;

    if (!projectId || !orderAmount) {
      return res.status(400).json({ message: 'projectId and amount are required' });
    }

    const project = await db()('projects').where({ id: parseInt(projectId) }).first();
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const parsedItems = typeof items === 'string' ? JSON.parse(items) : (items || []);
    
    // Enrich items with buyer address
    const enrichedItems = parsedItems.map(item => ({
      ...item,
      buyerAddress: buyerAddress || ''
    }));

    const [{ id: orderId }] = await db()('store_orders')
      .insert({
        projectId: project.id,
        buyerName: buyerName || '',
        buyerEmail: buyerEmail || '',
        buyerPhone: buyerPhone || '',
        amount: parseFloat(orderAmount),
        currency: currency || project.currency || 'USD',
        status: 'pending',
        itemsJson: JSON.stringify(parsedItems),
        ripplifyTransactionId: ripplifyTransactionId || null,
      })
      .returning('id');
    
    const order = await db()('store_orders').where({ id: orderId }).first();

    const webhookUrl = `${process.env.SHOPALIZE_SERVICE_URL || 'http://localhost:3008'}/api/shopalize/internal/webhook/ripplify`;
    
    let checkoutUrl = null;
    let checkoutSlug = null;
    
    if (!ripplifyTransactionId && buyerEmail) {
      try {
        // Get product name from first item for the payment link title
        const firstItemName = parsedItems[0]?.name || null;
        
        const checkout = await ripplifyService.createShopalizeCheckout({
          storeId: project.id,
          storeName: project.name,
          storeDomain: project.domain || `${project.subdomain}.sokostack.xyz`,
          orderId: order.id,
          items: enrichedItems,
          productName: firstItemName,
          buyerName: buyerName || 'Customer',
          buyerEmail,
          buyerPhone: buyerPhone || '',
          buyerAddress: buyerAddress || '',
          totalAmount: orderAmount,
          currency: currency || project.currency || 'KES',
          returnUrl: returnUrl || '',
          webhookUrl,
        }, req.headers.authorization);
        
        checkoutUrl = checkout.checkoutUrl;
        checkoutSlug = checkout.checkoutSlug;
        
        await db()('store_orders')
          .where({ id: orderId })
          .update({ ripplifySlug: checkoutSlug });
      } catch (ripplifyErr) {
        console.error('Ripplify checkout creation failed:', ripplifyErr.message);
      }
    }
    
    res.status(201).json({
      ...order,
      checkoutUrl,
      checkoutSlug,
    });
  } catch (error) {
    console.error('CreateOrder error:', error);
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
      .whereIn('status', ['completed', 'paid'])
      .sum('amount as total')
      .first();

    const pendingResult = await db()('store_orders')
      .whereIn('projectId', projectIds)
      .where({ status: 'pending' })
      .count('id as count')
      .first();

    const completedResult = await db()('store_orders')
      .whereIn('projectId', projectIds)
      .whereIn('status', ['completed', 'paid'])
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

export const handleRipplifyWebhook = async (req, res) => {
  try {
    const { event, checkoutSlug, orderId, status, transactionId, amount, currency, buyerEmail, buyerPhone } = req.body;

    if (event === 'payment_completed' && checkoutSlug) {
      const order = await db()('store_orders').where({ ripplifySlug: checkoutSlug }).first();
      
      if (order) {
        for (const item of JSON.parse(order.itemsJson || '[]')) {
          if (item.productId) {
            const product = await db()('store_products').where({ id: parseInt(item.productId), projectId: order.projectId }).first();
            if (product && product.inventory > 0) {
              await db()('store_products')
                .where({ id: product.id })
                .decrement('inventory', item.quantity || 1)
                .update({ updatedAt: db().fn.now() });
            }
          }
        }

        await db()('store_orders')
          .where({ id: order.id })
          .update({ 
            status: 'paid',
            ripplifyTransactionId: transactionId,
            updatedAt: db().fn.now()
          });

        const project = await db()('projects').where({ id: order.projectId }).first();
        
        await recordActivity({
          userId: project?.userId,
          action: 'order_paid',
          projectId: order.projectId,
          description: `Payment received for order #${order.id} - ${amount} ${currency}`,
          metadata: { orderId: order.id, amount, buyerEmail, transactionId }
        });
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Ripplify webhook error:', error);
    res.status(500).json({ message: error.message });
  }
};

export default { createOrder, getOrders, getOrderStats, updateOrder, handleRipplifyWebhook };
