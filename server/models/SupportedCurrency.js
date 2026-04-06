import { getDb } from '../config/db.js';

const SupportedCurrency = {
    findAll: async () => {
        const db = getDb();
        return await db('supported_currencies');
    },

    findAllEnabled: async () => {
        const db = getDb();
        return await db('supported_currencies').where({ enabled: true });
    },

    findByCode: async (code) => {
        const db = getDb();
        return await db('supported_currencies').where({ code }).first();
    },

    create: async (currencyData) => {
        const db = getDb();
        const { code, name, flag, rate, symbol, enabled = 1 } = currencyData;
        await db('supported_currencies').insert({ code, name, flag, rate, symbol, enabled });
        return await SupportedCurrency.findByCode(code);
    },

    update: async (code, updateData) => {
        const db = getDb();
        await db('supported_currencies').where({ code }).update(updateData);
        return await SupportedCurrency.findByCode(code);
    },

    delete: async (code) => {
        const db = getDb();
        await db('supported_currencies').where({ code }).del();
    }
};

export default SupportedCurrency;
