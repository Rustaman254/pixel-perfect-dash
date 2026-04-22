import crypto from 'crypto';
import PaymentLink from '../models/PaymentLink.js';
import UserPaymentMethod from '../models/UserPaymentMethod.js';
import User from '../models/User.js';
import slugify from '../utils/slugify.js';
import emailService from '../services/emailService.js';
import Transaction from '../models/Transaction.js';

export const createLink = async (req, res) => {
    try {
        let { name, slug, description, price, currency, linkType, hasPhotos, deliveryDays, expiryDate, expiryLabel, buyerName, buyerPhone, buyerEmail, minDonation, category, shippingFee, items, minItems, maxItems, allowMultiQuantity } = req.body;

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        let itemsJson = null;
        let totalPrice = price || 0;
        let finalMinItems = minItems || 1;
        let finalMaxItems = maxItems || 100;

        if (items && Array.isArray(items) && items.length > 0) {
            itemsJson = JSON.stringify(items);
            totalPrice = items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
            if (items.length > 0) {
                finalMinItems = Math.max(1, minItems || 1);
                finalMaxItems = maxItems || items.length;
            }
        }

        const transactionLimit = user.transactionLimit || 1000;

        if (totalPrice > transactionLimit) {
            return res.status(400).json({ message: `Please complete KYC verification to create links with prices higher than ${transactionLimit}.` });
        }

        if (!slug && name) {
            const shortId = crypto.randomBytes(4).toString('hex');
            slug = `${slugify(name)}-${shortId}`;
        }

        const newLink = await PaymentLink.create({
            userId: req.user.id,
            name,
            slug,
            description,
            price: totalPrice,
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
            shippingFee: shippingFee || 0,
            itemsJson,
            minItems: finalMinItems,
            maxItems: finalMaxItems,
            allowMultiQuantity: allowMultiQuantity || false
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

        // Fetch enabled payment methods for this seller — default to ALL if not configured
        const paymentMethods = await UserPaymentMethod.findAllByUserId(link.userId);
        const enabledMethods = paymentMethods.length > 0 
            ? paymentMethods.filter(pm => pm.enabled).map(pm => pm.methodId)
            : ['card', 'mpesa', 'bank', 'crypto'];

        let items = [];
        if (link.itemsJson) {
            try {
                items = JSON.parse(link.itemsJson);
            } catch (e) {
                items = [];
            }
        }

        res.json({ 
            ...link, 
            isExpired, 
            expirationReason, 
            enabledMethods,
            items,
            minItems: link.minItems || 1,
            maxItems: link.maxItems || 100,
            allowMultiQuantity: link.allowMultiQuantity || false
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
        const { slug } = req.params;
        const { sig } = req.query;
        if (!sig) return res.status(403).json({ message: "Missing signature" });
        
        const expected = crypto.createHash('sha256').update(slug + process.env.JWT_SECRET).digest('hex');
        if (expected !== sig) return res.status(403).json({ message: "Invalid signature" });
        
        const link = await PaymentLink.findBySlug(slug);
        if (!link) return res.status(404).json({ message: "Link not found" });

        const updated = await PaymentLink.updateStatus(link.id, 'Completed');

        // Send seller notification that funds are released
        try {
            const seller = await User.findById(link.userId);
            if (seller?.email) {
                const transaction = await Transaction.findByLinkId(link.id);
                if (transaction) {
                    await emailService.sendSellerPaymentNotification(seller, {
                        ...transaction,
                        status: 'Completed',
                        linkName: link.name
                    });
                    console.log('Funds release notification sent to seller:', seller.email);
                }
            }
        } catch (emailError) {
            console.error('Failed to send funds release email:', emailError.message);
        }

        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Public: buyer reports a problem (sets status to Disputed)
export const reportDispute = async (req, res) => {
    try {
        const { slug } = req.params;
        const { sig } = req.query;
        if (!sig) return res.status(403).json({ message: "Missing signature" });
        
        const expected = crypto.createHash('sha256').update(slug + process.env.JWT_SECRET).digest('hex');
        if (expected !== sig) return res.status(403).json({ message: "Invalid signature" });
        
        const link = await PaymentLink.findBySlug(slug);
        if (!link) return res.status(404).json({ message: "Link not found" });

        const updated = await PaymentLink.updateStatus(link.id, 'Disputed');
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
