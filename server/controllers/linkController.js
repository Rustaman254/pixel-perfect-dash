import PaymentLink from '../models/PaymentLink.js';

export const createLink = async (req, res) => {
    try {
        const { name, slug, description, price, currency, linkType, hasPhotos, deliveryDays, expiryDate, expiryLabel, buyerName, buyerPhone, buyerEmail } = req.body;

        const newLink = await PaymentLink.create({
            userId: req.user.id,
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
            buyerEmail
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

        // Increment clicks
        await PaymentLink.incrementClicks(link.id);

        res.json(link);
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
