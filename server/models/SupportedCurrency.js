import { getDb } from '../config/db.js';

const SupportedCurrency = {
    findAll: async () => {
        const db = getDb();
        return await db.all(`SELECT * FROM supported_currencies`);
    },

    findAllEnabled: async () => {
        const db = getDb();
        return await db.all(`SELECT * FROM supported_currencies WHERE enabled = 1`);
    },

    findByCode: async (code) => {
        const db = getDb();
        return await db.get(`SELECT * FROM supported_currencies WHERE code = ?`, code);
    },

    create: async (currencyData) => {
        const db = getDb();
        const { code, name, flag, rate, symbol, enabled = 1 } = currencyData;
        await db.run(`
            INSERT INTO supported_currencies (code, name, flag, rate, symbol, enabled)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [code, name, flag, rate, symbol, enabled]);
        return await SupportedCurrency.findByCode(code);
    },

    update: async (code, updateData) => {
        const db = getDb();
        const { name, flag, rate, symbol, enabled } = updateData;
        await db.run(`
            UPDATE supported_currencies 
            SET name = COALESCE(?, name),
                flag = COALESCE(?, flag),
                rate = COALESCE(?, rate),
                symbol = COALESCE(?, symbol),
                enabled = COALESCE(?, enabled)
            WHERE code = ?
        `, [name, flag, rate, symbol, enabled, code]);
        return await SupportedCurrency.findByCode(code);
    },

    delete: async (code) => {
        const db = getDb();
        await db.run(`DELETE FROM supported_currencies WHERE code = ?`, code);
    }
};

export default SupportedCurrency;
