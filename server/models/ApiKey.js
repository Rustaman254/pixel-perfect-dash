import { getAuthDb } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

const ApiKey = {
    create: async (userId, name) => {
        const db = getAuthDb();
        const key = `rf_${uuidv4().replace(/-/g, '')}`;
        const [result] = await db('api_keys').insert({
            userId,
            key,
            name,
            status: 'Active'
        }).returning('*');
        return result;
    },

    findByKey: async (key) => {
        const db = getAuthDb();
        return await db('api_keys')
            .join('users', 'api_keys.userId', 'users.id')
            .select('api_keys.*', 'users.businessName', 'users.email as userEmail')
            .where('api_keys.key', key)
            .where('api_keys.status', 'Active')
            .first();
    },

    findAll: async () => {
        const db = getAuthDb();
        return await db('api_keys')
            .join('users', 'api_keys.userId', 'users.id')
            .select('api_keys.*', 'users.email as userEmail', 'users.businessName')
            .orderBy('api_keys.createdAt', 'desc');
    },

    findByUserId: async (userId) => {
        const db = getAuthDb();
        return await db('api_keys').where({ userId }).orderBy('createdAt', 'desc');
    },

    delete: async (id) => {
        const db = getAuthDb();
        return await db('api_keys').where({ id }).del();
    },

    updateStatus: async (id, status) => {
        const db = getAuthDb();
        return await db('api_keys').where({ id }).update({ status });
    }
};

export default ApiKey;
