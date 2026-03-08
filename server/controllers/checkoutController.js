import PaymentLink from '../models/PaymentLink.js';
import { v4 as uuidv4 } from 'uuid';

const slugify = (text) =>
    text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export const createCheckoutSession = async (req, res) => {
    try {
        const { name, price, currency, description, buyerName, buyerPhone, buyerEmail } = req.body;

        if (!name || !price || !currency) {
            return res.status(400).json({ message: "Name, price, and currency are required." });
        }

        const shortId = Math.random().toString(36).substring(2, 7);
        const slug = `${slugify(name)}-${shortId}`;

        const newLink = await PaymentLink.create({
            userId: req.vendor.id, // Attached by apiKeyAuth middleware
            name,
            slug,
            description: description || `Checkout for ${name}`,
            price: parseFloat(price),
            currency,
            linkType: 'one-time',
            status: 'Active',
            deliveryDays: 3, // Default for API checkouts
            expiryLabel: "1 hour after creation",
            buyerName,
            buyerPhone,
            buyerEmail
        });

        const payUrl = `${process.env.FRONTEND_URL || 'http://localhost:8081'}/pay/${newLink.slug}`;

        res.status(201).json({
            message: "Checkout session created",
            payUrl,
            slug: newLink.slug,
            linkId: newLink.id
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
