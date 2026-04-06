import crypto from 'crypto';
import slugify from 'slugify';
import { createConnection } from '../shared/db.js';

const db = () => createConnection('ripplify_db');

// API Key based authentication for external services
const validateApiKey = async (apiKey) => {
  try {
    const { authService } = await import('../shared/serviceClient.js');
    return await authService.validateApiKey(apiKey);
  } catch (e) {
    console.error('API key validation error:', e);
    return null;
  }
};

export const createPaymentLink = async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      price,
      currency,
      linkType,
      hasPhotos,
      deliveryDays,
      expiryDate,
      expiryLabel,
      buyerName,
      buyerPhone,
      buyerEmail,
      minDonation,
      category,
      shippingFee,
      metadata,
      webhookUrl,
      returnUrl,
      source,
      sourceStoreId,
      sourceOrderId,
    } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    // Authenticate via API key or JWT
    let userId = req.user?.id;
    
    const authHeader = req.headers.authorization;
    if (!userId && authHeader) {
      const apiKey = authHeader.replace('Bearer ', '');
      const validation = await validateApiKey(apiKey);
      if (validation?.valid) {
        userId = validation.userId;
      }
    }

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required - provide valid API key or JWT token' });
    }

    let linkSlug = slug;
    if (!linkSlug && name) {
      const shortId = crypto.randomBytes(4).toString('hex');
      linkSlug = `${slugify(name, { lower: true, strict: true })}-${shortId}`;
    }

    const [newLink] = await db()('payment_links')
      .insert({
        userId,
        name,
        slug: linkSlug,
        description,
        price: price || 0,
        currency: currency || 'KES',
        linkType: linkType || 'one-time',
        hasPhotos: hasPhotos || false,
        deliveryDays,
        expiryDate: expiryDate || null,
        expiryLabel,
        buyerName,
        buyerPhone,
        buyerEmail,
        minDonation: minDonation || 0,
        category: category || 'product',
        shippingFee: shippingFee || 0,
        source: source || null,
        sourceStoreId: sourceStoreId?.toString() || null,
        sourceOrderId: sourceOrderId?.toString() || null,
        returnUrl: returnUrl || null,
        webhookUrl: webhookUrl || null,
      })
      .returning('*');

    const payUrl = `${process.env.FRONTEND_URL || 'https://ripplify.sokostack.xyz'}/pay/${newLink.slug}`;

    res.status(201).json({
      id: newLink.id,
      url: payUrl,
      slug: newLink.slug,
      name: newLink.name,
      description: newLink.description,
      price: newLink.price,
      currency: newLink.currency,
      status: newLink.status,
      metadata,
    });
  } catch (error) {
    console.error('CreatePaymentLink error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getPaymentLink = async (req, res) => {
  try {
    const { id } = req.params;
    
    let link;
    if (isNaN(parseInt(id))) {
      // Search by slug
      link = await db()('payment_links').where({ slug: id }).first();
    } else {
      // Search by ID
      link = await db()('payment_links').where({ id: parseInt(id) }).first();
    }

    if (!link) {
      return res.status(404).json({ message: 'Payment link not found' });
    }

    // Get payment status
    const transactions = await db()('transactions')
      .where({ linkId: link.id })
      .orderBy('createdAt', 'desc')
      .limit(10);

    const latestTransaction = transactions[0] || null;

    res.json({
      id: link.id,
      slug: link.slug,
      name: link.name,
      description: link.description,
      price: link.price,
      currency: link.currency,
      linkType: link.linkType,
      status: link.status,
      hasPhotos: link.hasPhotos,
      deliveryDays: link.deliveryDays,
      expiryDate: link.expiryDate,
      expiryLabel: link.expiryLabel,
      shippingFee: link.shippingFee,
      category: link.category,
      buyerName: link.buyerName,
      buyerPhone: link.buyerPhone,
      buyerEmail: link.buyerEmail,
      minDonation: link.minDonation,
      clicks: link.clicks,
      paymentCount: link.paymentCount,
      totalEarnedValue: link.totalEarnedValue,
      source: link.source,
      sourceStoreId: link.sourceStoreId,
      sourceOrderId: link.sourceOrderId,
      returnUrl: link.returnUrl,
      createdAt: link.createdAt,
      updatedAt: link.updatedAt,
      transactions: transactions.map(t => ({
        id: t.id,
        transactionId: t.transactionId,
        status: t.status,
        amount: t.amount,
        currency: t.currency,
        paymentMethod: t.paymentMethod,
        createdAt: t.createdAt,
      })),
      latestTransaction: latestTransaction ? {
        id: latestTransaction.id,
        transactionId: latestTransaction.transactionId,
        status: latestTransaction.status,
        amount: latestTransaction.amount,
        currency: latestTransaction.currency,
        paymentMethod: latestTransaction.paymentMethod,
        createdAt: latestTransaction.createdAt,
      } : null,
    });
  } catch (error) {
    console.error('GetPaymentLink error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getPaymentLinkStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    let link;
    if (isNaN(parseInt(id))) {
      link = await db()('payment_links').where({ slug: id }).first();
    } else {
      link = await db()('payment_links').where({ id: parseInt(id) }).first();
    }

    if (!link) {
      return res.status(404).json({ message: 'Payment link not found' });
    }

    // Get latest transaction
    const latestTransaction = await db()('transactions')
      .where({ linkId: link.id })
      .orderBy('createdAt', 'desc')
      .first();

    res.json({
      id: link.id,
      slug: link.slug,
      status: link.status,
      amount: link.price,
      currency: link.currency,
      paymentCount: link.paymentCount,
      transaction: latestTransaction ? {
        id: latestTransaction.id,
        transactionId: latestTransaction.transactionId,
        status: latestTransaction.status,
        amount: latestTransaction.amount,
        currency: latestTransaction.currency,
        paymentMethod: latestTransaction.paymentMethod,
        createdAt: latestTransaction.createdAt,
      } : null,
    });
  } catch (error) {
    console.error('GetPaymentLinkStatus error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const updatePaymentLink = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated
    delete updates.id;
    delete updates.userId;
    delete updates.slug;
    delete updates.createdAt;

    const link = await db()('payment_links').where({ id: parseInt(id) }).first();
    if (!link) {
      return res.status(404).json({ message: 'Payment link not found' });
    }

    // Verify ownership
    if (req.user && link.userId !== req.user.id) {
      const authHeader = req.headers.authorization;
      if (authHeader) {
        const apiKey = authHeader.replace('Bearer ', '');
        const validation = await validateApiKey(apiKey);
        if (!validation?.valid || validation.userId !== link.userId) {
          return res.status(403).json({ message: 'Not authorized to update this payment link' });
        }
      } else {
        return res.status(403).json({ message: 'Not authorized to update this payment link' });
      }
    }

    const [updated] = await db()('payment_links')
      .where({ id: parseInt(id) })
      .update({ ...updates, updatedAt: db().fn.now() })
      .returning('*');

    res.json(updated);
  } catch (error) {
    console.error('UpdatePaymentLink error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const handlePaymentWebhook = async (req, res) => {
  try {
    const { event, checkoutSlug, transactionId, status, amount, currency, buyerEmail, buyerPhone, paymentMethod } = req.body;

    if (!checkoutSlug || !event) {
      return res.status(400).json({ message: 'checkoutSlug and event are required' });
    }

    const link = await db()('payment_links').where({ slug: checkoutSlug }).first();
    if (!link) {
      return res.status(404).json({ message: 'Payment link not found' });
    }

    // Update payment link status based on event
    let newStatus = link.status;
    if (event === 'payment.succeeded' || event === 'payment_completed') {
      newStatus = 'Completed';
    } else if (event === 'payment.failed' || event === 'payment_failed') {
      newStatus = 'Failed';
    } else if (event === 'payment.pending') {
      newStatus = 'Pending';
    }

    if (newStatus !== link.status) {
      await db()('payment_links')
        .where({ id: link.id })
        .update({ 
          status: newStatus, 
          paymentCount: db().raw('payment_count + 1'),
          totalEarnedValue: db().raw(`total_earned_value + ${amount || link.price}`),
          updatedAt: db().fn.now() 
        });
    }

    // Create transaction record
    if (transactionId) {
      const existingTransaction = await db()('transactions')
        .where({ transactionId })
        .first();

      if (!existingTransaction) {
        await db()('transactions').insert({
          linkId: link.id,
          userId: link.userId,
          buyerName: link.buyerName,
          buyerEmail: link.buyerEmail,
          buyerPhone: link.buyerPhone,
          amount: amount || link.price,
          currency: currency || link.currency,
          status: status || newStatus,
          transactionId,
          paymentMethod: paymentMethod || null,
          type: 'Payment',
        });
      }
    }

    // Forward webhook to source store if configured
    if (link.webhookUrl && (event === 'payment.succeeded' || event === 'payment_completed')) {
      try {
        const fetch = await import('node-fetch');
        await fetch.default(link.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event,
            checkoutSlug,
            transactionId,
            status: newStatus,
            amount: amount || link.price,
            currency: currency || link.currency,
            buyerName: link.buyerName,
            buyerEmail: link.buyerEmail,
            buyerPhone: link.buyerPhone,
            sourceStoreId: link.sourceStoreId,
            sourceOrderId: link.sourceOrderId,
          }),
        });
      } catch (webhookErr) {
        console.error('Webhook delivery failed:', webhookErr.message);
      }
    }

    res.json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    console.error('HandlePaymentWebhook error:', error);
    res.status(500).json({ message: error.message });
  }
};

// List all payment links for a user
export const listPaymentLinks = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    
    let userId = req.user?.id;
    
    // Support API key auth
    const authHeader = req.headers.authorization;
    if (!userId && authHeader) {
      const apiKey = authHeader.replace('Bearer ', '');
      const validation = await validateApiKey(apiKey);
      if (validation?.valid) {
        userId = validation.userId;
      }
    }

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;

    let query = db()('payment_links')
      .where({ userId })
      .orderBy('createdAt', 'desc')
      .limit(limitNum)
      .offset((pageNum - 1) * limitNum);

    if (status) {
      query = query.where({ status });
    }

    if (search) {
      query = query.where((builder) => {
        builder.where('name', 'ilike', `%${search}%`)
          .orWhere('slug', 'ilike', `%${search}%`)
          .orWhere('description', 'ilike', `%${search}%`);
      });
    }

    const links = await query;

    const countResult = await db()('payment_links')
      .where({ userId })
      .count('* as count')
      .first();

    res.json({
      links,
      total: parseInt(countResult?.count || 0),
      page: pageNum,
      limit: limitNum,
    });
  } catch (error) {
    console.error('ListPaymentLinks error:', error);
    res.status(500).json({ message: error.message });
  }
};

export default {
  createPaymentLink,
  getPaymentLink,
  getPaymentLinkStatus,
  updatePaymentLink,
  handlePaymentWebhook,
  listPaymentLinks,
};
