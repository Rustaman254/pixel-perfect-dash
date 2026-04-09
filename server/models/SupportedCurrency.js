import { getAuthDb } from '../config/db.js';

const SupportedCurrency = {
    findAll: async () => {
        const db = getAuthDb();
        return await db('supported_currencies');
    },

    findAllEnabled: async () => {
        const db = getAuthDb();
        return await db('supported_currencies').where({ enabled: true });
    },

    findByCode: async (code) => {
        const db = getAuthDb();
        return await db('supported_currencies').where({ code }).first();
    },

    create: async (currencyData) => {
        const db = getAuthDb();
        const { code, name, flag, rate, symbol, enabled = 1 } = currencyData;
        await db('supported_currencies').insert({ code, name, flag, rate, symbol, enabled });
        return await SupportedCurrency.findByCode(code);
    },

    update: async (code, updateData) => {
        const db = getAuthDb();
        await db('supported_currencies').where({ code }).update(updateData);
        return await SupportedCurrency.findByCode(code);
    },

    delete: async (code) => {
        const db = getAuthDb();
        await db('supported_currencies').where({ code }).del();
    }
};

export default SupportedCurrency;
