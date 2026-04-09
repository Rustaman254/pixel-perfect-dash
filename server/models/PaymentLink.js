import { getRipplifyDb } from '../config/db.js';

const PaymentLink = {
    create: async (linkData) => {
        const db = getRipplifyDb();
        const [result] = await db('payment_links').insert({
            userId: linkData.userId,
            name: linkData.name,
            slug: linkData.slug,
            description: linkData.description,
            price: linkData.price,
            currency: linkData.currency,
            linkType: linkData.linkType || 'one-time',
            status: linkData.status || 'Active',
            hasPhotos: linkData.hasPhotos || false,
            deliveryDays: linkData.deliveryDays,
            expiryDate: linkData.expiryDate,
            expiryLabel: linkData.expiryLabel,
            buyerName: linkData.buyerName,
            buyerPhone: linkData.buyerPhone,
            buyerEmail: linkData.buyerEmail,
            minDonation: linkData.minDonation || 0,
            category: linkData.category || 'product',
            shippingFee: linkData.shippingFee || 0
        }).returning('*');

        return result;
    },

    findAllByUserId: async (userId) => {
        const db = getRipplifyDb();
        return await db('payment_links').where({ userId }).orderBy('createdAt', 'desc');
    },

    findBySlug: async (slug) => {
        const db = getRipplifyDb();
        return await db('payment_links').join('users', 'payment_links.userId', 'users.id')
            .select('payment_links.*', 'users.businessName', 'users.fullName', 'users.email as sellerEmail', 'users.businessLogo')
            .where('payment_links.slug', slug).first();
    },

    findById: async (id) => {
        const db = getRipplifyDb();
        return await db('payment_links').where({ id }).first();
    },

    updateStatus: async (id, status) => {
        const db = getRipplifyDb();
        await db('payment_links').where({ id }).update({ 
            status,
            updatedAt: db.fn.now()
        });
        return await db('payment_links').where({ id }).first();
    },

    incrementClicks: async (id) => {
        const db = getRipplifyDb();
        await db('payment_links').where({ id }).increment('clicks', 1);
    },

    updatePaymentStats: async (id, amount) => {
        const db = getRipplifyDb();
        await db('payment_links').where({ id }).increment('paymentCount', 1);
        await db('payment_links').where({ id }).increment('totalEarnedValue', amount);
    },

    updateBuyerDetails: async (id, details) => {
        const db = getRipplifyDb();
        await db('payment_links').where({ id }).update({
            buyerName: details.buyerName,
            buyerEmail: details.buyerEmail,
            buyerPhone: details.buyerPhone
        });
    },

    delete: async (id, userId) => {
        const db = getRipplifyDb();
        return await db('payment_links').where({ id, userId }).del();
    }
};

export default PaymentLink;