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
        const apiKey = await db('api_keys').where('key', key).where('status', 'Active').first();
        if (!apiKey) return null;
        
        const user = await db('users').where('id', apiKey.userId).first();
        return {
            ...apiKey,
            businessName: user?.businessName || '',
            userEmail: user?.email || ''
        };
    },

    findAll: async () => {
        const db = getAuthDb();
        const apiKeys = await db('api_keys').orderBy('createdAt', 'desc');
        
        const result = await Promise.all(apiKeys.map(async (apiKey) => {
            const user = await db('users').where('id', apiKey.userId).first();
            return {
                ...apiKey,
                userEmail: user?.email || '',
                businessName: user?.businessName || ''
            };
        }));
        
        return result;
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
