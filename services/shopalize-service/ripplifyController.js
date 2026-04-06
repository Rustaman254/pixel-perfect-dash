import { ripplifyService } from '../shared/serviceClient.js';
import { createConnection } from '../shared/db.js';

const db = () => createConnection('shopalize_db');

// ADDED FOR SHOPALIZE INTEGRATION - Create Ripplify payment link for a product
export const createRipplifyPaymentLink = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      currency,
      category,
      linkType,
      metadata,
    } = req.body;

    if (!name || !price) {
      return res.status(400).json({ message: 'Name and price are required' });
    }

    // Get the user's token for authentication
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Create payment link via Ripplify service
    const paymentLink = await ripplifyService.createPaymentLink(
      {
        name,
        description,
        price: parseFloat(price),
        currency: currency || 'KES',
        category: category || 'product',
        linkType: linkType || 'one-time',
        source: 'shopalize',
        sourceStoreId: req.user?.id?.toString(),
        metadata,
      },
      authHeader
    );

    res.status(201).json({
      success: true,
      url: paymentLink.url,
      slug: paymentLink.slug,
      linkId: paymentLink.id,
      price: paymentLink.price,
      currency: paymentLink.currency,
    });
  } catch (error) {
    console.error('CreateRipplifyPaymentLink error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ADDED FOR SHOPALIZE INTEGRATION - Get Ripplify payment link status
export const getRipplifyPaymentLinkStatus = async (req, res) => {
  try {
    const { linkId } = req.params;

    if (!linkId) {
      return res.status(400).json({ message: 'linkId is required' });
    }

    const status = await ripplifyService.getPaymentLinkStatus(linkId);

    res.json(status);
  } catch (error) {
    console.error('GetRipplifyPaymentLinkStatus error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ADDED FOR SHOPALIZE INTEGRATION - List payment links for user's products
export const listRipplifyPaymentLinks = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Get payment links from Ripplify service
    const paymentLinks = await ripplifyService.getPaymentLinks(req.user.id);

    res.json(paymentLinks);
  } catch (error) {
    console.error('ListRipplifyPaymentLinks error:', error);
    res.status(500).json({ message: error.message });
  }
};

export default {
  createRipplifyPaymentLink,
  getRipplifyPaymentLinkStatus,
  listRipplifyPaymentLinks,
};
