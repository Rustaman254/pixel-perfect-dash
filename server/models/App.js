import { getDb } from "../config/db.js";

const App = {
    findAll: async () => {
        const db = getDb();
        return await db('apps').orderBy('createdAt', 'asc');
    },
    
    findActive: async () => {
        const db = getDb();
        return await db('apps').where({ isActive: true }).orderBy('createdAt', 'asc');
    },

    findById: async (id) => {
        const db = getDb();
        return await db('apps').where({ id }).first();
    },

    create: async ({ name, slug, icon, url }) => {
        const db = getDb();
        const [result] = await db('apps').insert({ name, slug, icon, url }).returning('*');
        return result;
    },

    update: async (id, updates) => {
        const db = getDb();
        await db('apps').where({ id }).update(updates);
        return await App.findById(id);
    },

    delete: async (id) => {
        const db = getDb();
        await db('apps').where({ id }).del();
        return true;
    },
    
    toggleActive: async (id, isActive) => {
        const db = getDb();
        await db('apps').where({ id }).update({ isActive });
        return true;
    }
};

export default App;
