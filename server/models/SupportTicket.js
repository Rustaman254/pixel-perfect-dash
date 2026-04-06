import { getDb } from '../config/db.js';

const SupportTicket = {
    create: async (ticketData) => {
        const db = getDb();
        const [result] = await db('support_tickets').insert({
            userId: ticketData.userId || null,
            name: ticketData.name,
            email: ticketData.email,
            subject: ticketData.subject,
            message: ticketData.message,
            status: 'Open'
        }).returning('*');
        return result;
    },

    findAllForAdmin: async () => {
        const db = getDb();
        return await db('support_tickets').orderBy('createdAt', 'desc');
    },

    updateStatus: async (id, status) => {
        const db = getDb();
        await db('support_tickets').where({ id }).update({ status });
        return await db('support_tickets').where({ id }).first();
    }
};

export default SupportTicket;
