import { getDb } from '../config/db.js';

const PaymentLink = {
    create: async (linkData) => {
        const db = getDb();
        const result = await db.run(`
      INSERT INTO payment_links (
        userId, name, slug, description, price, currency, linkType, status, 
        hasPhotos, deliveryDays, expiryDate, expiryLabel, buyerName, buyerPhone, buyerEmail,
        category, shippingFee
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
            linkData.userId,
            linkData.name,
            linkData.slug,
            linkData.description,
            linkData.price,
            linkData.currency,
            linkData.linkType || 'one-time',
            linkData.status || 'Active',
            linkData.hasPhotos ? 1 : 0,
            linkData.deliveryDays,
            linkData.expiryDate,
            linkData.expiryLabel,
            linkData.buyerName,
            linkData.buyerPhone,
            linkData.buyerEmail,
            linkData.category || 'product',
            linkData.shippingFee || 0
        ]);

        return await db.get(`SELECT * FROM payment_links WHERE id = ?`, result.lastID);
    },

    findAllByUserId: async (userId) => {
        const db = getDb();
        return await db.all(`SELECT * FROM payment_links WHERE userId = ? ORDER BY createdAt DESC`, userId);
    },

    findBySlug: async (slug) => {
        const db = getDb();
        return await db.get(`
            SELECT pl.*, u.businessName, u.fullName, u.email as sellerEmail 
            FROM payment_links pl
            JOIN users u ON pl.userId = u.id
            WHERE pl.slug = ?
        `, slug);
    },

    updateStatus: async (id, status) => {
        const db = getDb();
        try {
            // Try to update with updatedAt (available after migration)
            await db.run(`UPDATE payment_links SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`, [status, id]);
        } catch (e) {
            // Fallback: updatedAt column may not exist yet on old DBs
            await db.run(`UPDATE payment_links SET status = ? WHERE id = ?`, [status, id]);
        }
        return await db.get(`SELECT * FROM payment_links WHERE id = ?`, id);
    },

    incrementClicks: async (id) => {
        const db = getDb();
        await db.run(`UPDATE payment_links SET clicks = clicks + 1 WHERE id = ?`, id);
    },

    updatePaymentStats: async (id, amount) => {
        const db = getDb();
        await db.run(`
            UPDATE payment_links 
            SET paymentCount = paymentCount + 1, 
                totalEarnedValue = totalEarnedValue + ? 
            WHERE id = ?
        `, [amount, id]);
    },

    updateBuyerDetails: async (id, details) => {
        const db = getDb();
        await db.run(`
            UPDATE payment_links 
            SET buyerName = ?, buyerEmail = ?, buyerPhone = ? 
            WHERE id = ?
        `, [details.buyerName, details.buyerEmail, details.buyerPhone, id]);
    },

    delete: async (id, userId) => {
        const db = getDb();
        return await db.run(`DELETE FROM payment_links WHERE id = ? AND userId = ?`, [id, userId]);
    }
};

export default PaymentLink;
