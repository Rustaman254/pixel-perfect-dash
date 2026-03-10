import { getDb } from '../config/db.js';

const SupportTicket = {
    create: async (ticketData) => {
        const db = getDb();
        const result = await db.run(`
            INSERT INTO support_tickets (userId, name, email, subject, message, status)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            ticketData.userId || null,
            ticketData.name,
            ticketData.email,
            ticketData.subject,
            ticketData.message,
            'Open'
        ]);
        return await db.get(`SELECT * FROM support_tickets WHERE id = ?`, result.lastID);
    },

    findAllForAdmin: async () => {
        const db = getDb();
        return await db.all(`
            SELECT * FROM support_tickets
            ORDER BY createdAt DESC
        `);
    },

    updateStatus: async (id, status) => {
        const db = getDb();
        await db.run(`
            UPDATE support_tickets SET status = ? WHERE id = ?
        `, [status, id]);
        return await db.get(`SELECT * FROM support_tickets WHERE id = ?`, id);
    }
};

export default SupportTicket;
