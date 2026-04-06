import crypto from 'crypto';
import { createConnection } from '../shared/db.js';
import { authService } from '../shared/serviceClient.js';

const db = () => createConnection('ripplify_db');

const generateShortId = () => crypto.randomBytes(4).toString('hex');

export const createShopalizeCheckout = async (req, res) => {
  try {
    const {
      storeId,
      storeName,
      storeDomain,
      orderId,
      items,
      productName,
      buyerName,
      buyerEmail,
      buyerPhone,
      buyerAddress,
      totalAmount,
      currency,
      returnUrl,
      webhookUrl
    } = req.body;

    if (!storeId || !totalAmount || !buyerEmail) {
      return res.status(400).json({ message: 'storeId, totalAmount, and buyerEmail are required' });
    }

    const shortId = generateShortId();
    const slug = `shop-${storeId}-${shortId}`;

    // Enrich items with buyer address
    const enrichedItems = (items || []).map(item => ({
      ...item,
      buyerAddress: buyerAddress || ''
    }));

    const [newLink] = await db()('payment_links')
      .insert({
        userId: req.user.id,
        name: productName || storeName || 'Store Order',
        slug,
        description: `Order #${orderId} - ${items?.length || 0} items`,
        price: parseFloat(totalAmount),
        currency: currency || 'KES',
        linkType: 'one-time',
        status: 'Active',
        deliveryDays: 7,
        expiryLabel: '7 days',
        buyerName: buyerName || '',
        buyerEmail,
        buyerPhone: buyerPhone || '',
        category: 'product',
        source: 'shopalize',
        sourceStoreId: storeId.toString(),
        sourceStoreDomain: storeDomain || '',
        sourceOrderId: orderId?.toString() || '',
        returnUrl,
        webhookUrl,
      })
      .returning('*');

    const payUrl = `${process.env.FRONTEND_URL || 'https://ripplify.sokostack.xyz'}/pay/${newLink.slug}`;

    res.status(201).json({
      success: true,
      checkoutId: newLink.id,
      checkoutSlug: newLink.slug,
      checkoutUrl: payUrl,
      amount: newLink.price,
      currency: newLink.currency,
    });
  } catch (error) {
    console.error('CreateShopalizeCheckout error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getShopalizeCheckoutStatus = async (req, res) => {
  try {
    const { checkoutSlug } = req.params;

    const link = await db()('payment_links').where({ slug: checkoutSlug }).first();
    if (!link) {
      return res.status(404).json({ message: 'Checkout not found' });
    }

    const transactions = await db()('transactions')
      .where({ linkId: link.id })
      .orderBy('createdAt', 'desc')
      .limit(1);

    const transaction = transactions[0] || null;

    res.json({
      checkoutId: link.id,
      checkoutSlug: link.slug,
      status: link.status,
      amount: link.price,
      currency: link.currency,
      buyerName: link.buyerName,
      buyerEmail: link.buyerEmail,
      buyerPhone: link.buyerPhone,
      transaction: transaction ? {
        transactionId: transaction.transactionId,
        status: transaction.status,
        paymentMethod: transaction.paymentMethod,
        amount: transaction.amount,
        currency: transaction.currency,
        createdAt: transaction.createdAt,
      } : null,
      sourceOrderId: link.sourceOrderId,
    });
  } catch (error) {
    console.error('GetShopalizeCheckoutStatus error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const handleShopalizeWebhook = async (req, res) => {
  try {
    const { checkoutSlug } = req.params;
    const { event, transactionId } = req.body;

    const link = await db()('payment_links').where({ slug: checkoutSlug }).first();
    if (!link) {
      return res.status(404).json({ message: 'Checkout not found' });
    }

    if (event === 'payment_completed' && link.webhookUrl) {
      const updated = await db()('payment_links')
        .where({ id: link.id })
        .update({ status: 'Funds locked', updatedAt: db().fn.now() })
        .returning('*');

      const fetch = await import('node-fetch');
      try {
        await fetch.default(link.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'payment_completed',
            checkoutSlug,
            orderId: link.sourceOrderId,
            storeId: link.sourceStoreId,
            transactionId,
            status: 'paid',
            amount: link.price,
            currency: link.currency,
            buyerName: link.buyerName,
            buyerEmail: link.buyerEmail,
            buyerPhone: link.buyerPhone,
          }),
        });
      } catch (webhookErr) {
        console.error('Webhook delivery failed:', webhookErr.message);
      }

      return res.json({ success: true, message: 'Webhook processed' });
    }

    res.json({ success: true, message: 'Event processed' });
  } catch (error) {
    console.error('HandleShopalizeWebhook error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getStoreCheckouts = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    if (!storeId) {
      return res.status(400).json({ message: 'storeId is required' });
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;

    const checkouts = await db()('payment_links')
      .where({ sourceStoreId: storeId.toString(), source: 'shopalize' })
      .orderBy('createdAt', 'desc')
      .limit(limitNum)
      .offset((pageNum - 1) * limitNum);

    const countResult = await db()('payment_links')
      .where({ sourceStoreId: storeId.toString(), source: 'shopalize' })
      .count('* as count')
      .first();

    res.json({
      checkouts,
      total: parseInt(countResult?.count || 0),
      page: pageNum,
      limit: limitNum,
    });
  } catch (error) {
    console.error('GetStoreCheckouts error:', error);
    res.status(500).json({ message: error.message });
  }
};

export default {
  createShopalizeCheckout,
  getShopalizeCheckoutStatus,
  handleShopalizeWebhook,
  getStoreCheckouts,
};