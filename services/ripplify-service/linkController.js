import crypto from 'crypto';
import slugify from 'slugify';
import { createConnection } from '../shared/db.js';

const db = () => createConnection('ripplify_db');

export const createLink = async (req, res) => {
  try {
    let { name, slug, description, price, currency, linkType, hasPhotos, deliveryDays, expiryDate, expiryLabel, buyerName, buyerPhone, buyerEmail, minDonation, category, shippingFee } = req.body;

    if (!name) return res.status(400).json({ message: 'Name is required' });

    if (!slug && name) {
      const shortId = crypto.randomBytes(4).toString('hex');
      slug = `${slugify(name, { lower: true, strict: true })}-${shortId}`;
    }

    const [newLink] = await db()('payment_links')
      .insert({
        userId: req.user.id,
        name,
        slug,
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
      })
      .returning('*');

    res.status(201).json(newLink);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyLinks = async (req, res) => {
  try {
    const links = await db()('payment_links')
      .where({ userId: req.user.id })
      .orderBy('createdAt', 'desc');
    res.json(links);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getLinkBySlug = async (req, res) => {
  try {
    const link = await db()('payment_links').where({ slug: req.params.slug }).first();
    if (!link) return res.status(404).json({ message: 'Payment link not found' });

    let isExpired = false;
    let expirationReason = null;

    if (link.linkType === 'one-time') {
      if (link.paymentCount > 0) {
        isExpired = true;
        expirationReason = 'already-used';
      } else {
        const createdTime = new Date(link.createdAt).getTime();
        const now = Date.now();
        const ONE_HOUR = 60 * 60 * 1000;
        if (now - createdTime > ONE_HOUR) {
          isExpired = true;
          expirationReason = 'time-expired';
        }
      }
    }

    const paymentMethods = await db()('user_payment_methods').where({ userId: link.userId, enabled: true });
    const enabledMethods = paymentMethods.length > 0
      ? paymentMethods.map(pm => pm.methodId)
      : ['card', 'mpesa', 'bank', 'crypto'];

    res.json({ ...link, isExpired, expirationReason, enabledMethods });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateLinkStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: 'Status is required' });

    const link = await db()('payment_links').where({ id: req.params.id }).first();
    if (!link) return res.status(404).json({ message: 'Link not found' });
    if (link.userId !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    const [updated] = await db()('payment_links')
      .where({ id: req.params.id })
      .update({ status, updatedAt: db().fn.now() })
      .returning('*');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteLink = async (req, res) => {
  try {
    const link = await db()('payment_links').where({ id: req.params.id }).first();
    if (!link) return res.status(404).json({ message: 'Link not found' });
    if (link.userId !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    await db()('payment_links').where({ id: req.params.id }).delete();
    res.json({ message: 'Link deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const incrementClicks = async (req, res) => {
  try {
    await db()('payment_links').where({ slug: req.params.slug }).increment('clicks', 1);
    res.json({ message: 'Click recorded' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const confirmPayment = async (req, res) => {
  try {
    const { slug } = req.params;
    const { sig } = req.query;
    if (!sig) return res.status(403).json({ message: 'Missing signature' });

    const expected = crypto.createHash('sha256').update(slug + process.env.JWT_SECRET).digest('hex');
    if (expected !== sig) return res.status(403).json({ message: 'Invalid signature' });

    const link = await db()('payment_links').where({ slug }).first();
    if (!link) return res.status(404).json({ message: 'Link not found' });

    const [updated] = await db()('payment_links')
      .where({ id: link.id })
      .update({ status: 'Completed', updatedAt: db().fn.now() })
      .returning('*');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const disputePayment = async (req, res) => {
  try {
    const { slug } = req.params;
    const { sig } = req.query;
    if (!sig) return res.status(403).json({ message: 'Missing signature' });

    const expected = crypto.createHash('sha256').update(slug + process.env.JWT_SECRET).digest('hex');
    if (expected !== sig) return res.status(403).json({ message: 'Invalid signature' });

    const link = await db()('payment_links').where({ slug }).first();
    if (!link) return res.status(404).json({ message: 'Link not found' });

    const [updated] = await db()('payment_links')
      .where({ id: link.id })
      .update({ status: 'Disputed', updatedAt: db().fn.now() })
      .returning('*');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Internal: get links for a user (called by other services)
export const internalGetLinks = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: 'userId required' });
    const links = await db()('payment_links').where({ userId: parseInt(userId) }).orderBy('createdAt', 'desc');
    res.json(links);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default {
  createLink, getMyLinks, getLinkBySlug, updateLinkStatus,
  deleteLink, incrementClicks, confirmPayment, disputePayment,
  internalGetLinks,
};
