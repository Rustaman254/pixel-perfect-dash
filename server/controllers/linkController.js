import crypto from 'crypto';
import PaymentLink from '../models/PaymentLink.js';
import UserPaymentMethod from '../models/UserPaymentMethod.js';
import slugify from '../utils/slugify.js';

export const createLink = async (req, res) => {
    try {
        let { name, slug, description, price, currency, linkType, hasPhotos, deliveryDays, expiryDate, expiryLabel, buyerName, buyerPhone, buyerEmail, minDonation, category, shippingFee } = req.body;

        if (!slug && name) {
            const shortId = crypto.randomBytes(4).toString('hex');
            slug = `${slugify(name)}-${shortId}`;
        }

        const newLink = await PaymentLink.create({
            userId: req.user.id,
            name,
            slug,
            description,
            price: price || 0,
            currency,
            linkType,
            hasPhotos,
            deliveryDays,
            expiryDate,
            expiryLabel,
            buyerName,
            buyerPhone,
            buyerEmail,
            minDonation: minDonation || 0,
            category,
            shippingFee: shippingFee || 0
        });

        res.status(201).json(newLink);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getMyLinks = async (req, res) => {
    try {
        const links = await PaymentLink.findAllByUserId(req.user.id);
        res.json(links);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getPublicLink = async (req, res) => {
    try {
        const link = await PaymentLink.findBySlug(req.params.slug);
        if (!link) {
            return res.status(404).json({ message: "Payment link not found" });
        }

        // Calculate expiration for one-time links (not donation links)
        let isExpired = false;
        let expirationReason = null;

        if (link.linkType === 'one-time') {
            // Check if already paid
            if (link.paymentCount > 0) {
                isExpired = true;
                expirationReason = 'already-used';
            } else {
                // Check if 1 hour has passed since creation
                // Append ' UTC' because SQLite stores in UTC but JS Date(string) assumes local time
                const createdTime = new Date(link.createdAt + ' UTC').getTime();
                const now = new Date().getTime();
                const ONE_HOUR = 60 * 60 * 1000;

                if (now - createdTime > ONE_HOUR) {
                    isExpired = true;
                    expirationReason = 'time-expired';
                }
            }
        }
        // Donation links never expire automatically (like reusable links)

        // Fetch enabled payment methods for this seller
        const paymentMethods = await UserPaymentMethod.findAllByUserId(link.userId);
        const enabledMethods = paymentMethods.filter(pm => pm.enabled).map(pm => pm.methodId);

        res.json({ 
            ...link, 
            isExpired, 
            expirationReason, 
            enabledMethods,
            publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteLink = async (req, res) => {
    try {
        await PaymentLink.delete(req.params.id, req.user.id);
        res.json({ message: "Link deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateLinkStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const link = await PaymentLink.updateStatus(req.params.id, status);

        res.json(link);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Public: buyer confirms delivery (sets status to Completed)
export const confirmDelivery = async (req, res) => {
    try {
        const link = await PaymentLink.findBySlug(req.params.slug);
        if (!link) return res.status(404).json({ message: "Link not found" });

        const updated = await PaymentLink.updateStatus(link.id, 'Completed');
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Public: buyer reports a problem (sets status to Disputed)
export const reportDispute = async (req, res) => {
    try {
        const link = await PaymentLink.findBySlug(req.params.slug);
        if (!link) return res.status(404).json({ message: "Link not found" });

        const updated = await PaymentLink.updateStatus(link.id, 'Disputed');
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
