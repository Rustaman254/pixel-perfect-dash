import crypto from 'crypto';
import slugify from 'slugify';
import { createConnection } from '../shared/db.js';
import { authService } from '../shared/serviceClient.js';

const db = () => createConnection('ripplify_db');

export const createCheckout = async (req, res) => {
  try {
    const { name, price, currency, description, buyerName, buyerPhone, buyerEmail } = req.body;

    if (!name || !price || !currency) {
      return res.status(400).json({ message: 'Name, price, and currency are required' });
    }

    // Validate API key via auth service
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'API key required' });

    const apiKey = authHeader.replace('Bearer ', '');
    let validation;
    try {
      validation = await authService.validateApiKey(apiKey);
    } catch {
      return res.status(401).json({ message: 'Invalid API key' });
    }

    if (!validation?.valid) {
      return res.status(401).json({ message: 'Invalid or inactive API key' });
    }

    const shortId = crypto.randomBytes(3).toString('hex');
    const slug = `${slugify(name, { lower: true, strict: true })}-${shortId}`;

    const [newLink] = await db()('payment_links')
      .insert({
        userId: validation.userId,
        name,
        slug,
        description: description || `Checkout for ${name}`,
        price: parseFloat(price),
        currency,
        linkType: 'one-time',
        status: 'Active',
        deliveryDays: 3,
        expiryLabel: '1 hour after creation',
        buyerName,
        buyerPhone,
        buyerEmail,
      })
      .returning('*');

    const payUrl = `${process.env.FRONTEND_URL || 'http://localhost:8081'}/pay/${newLink.slug}`;

    res.status(201).json({
      message: 'Checkout session created',
      payUrl,
      slug: newLink.slug,
      linkId: newLink.id,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default { createCheckout };
