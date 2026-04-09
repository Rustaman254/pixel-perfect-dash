import { getAuthDb } from "../config/db.js";

const App = {
    findAll: async () => {
        const db = getAuthDb();
        return await db('apps').orderBy('createdAt', 'asc');
    },
    
    findActive: async () => {
        const db = getAuthDb();
        return await db('apps').where({ isActive: true }).orderBy('createdAt', 'asc');
    },

    findById: async (id) => {
        const db = getAuthDb();
        return await db('apps').where({ id }).first();
    },

    create: async ({ name, slug, icon, url }) => {
        const db = getAuthDb();
        const [result] = await db('apps').insert({ name, slug, icon, url }).returning('*');
        return result;
    },

    update: async (id, updates) => {
        const db = getAuthDb();
        await db('apps').where({ id }).update(updates);
        return await App.findById(id);
    },

    delete: async (id) => {
        const db = getAuthDb();
        await db('apps').where({ id }).del();
        return true;
    },
    
    toggleActive: async (id, isActive) => {
        const db = getAuthDb();
        await db('apps').where({ id }).update({ isActive });
        return true;
    }
};

export default App;