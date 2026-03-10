import UserCurrency from '../models/UserCurrency.js';
import SupportedCurrency from '../models/SupportedCurrency.js';

export const getUserCurrencies = async (req, res) => {
    try {
        const userId = req.user.id;
        const currencies = await UserCurrency.findAllByUserId(userId);
        res.status(200).json(currencies);
    } catch (error) {
        console.error('Error fetching currencies:', error);
        res.status(500).json({ message: 'Failed to fetch currencies' });
    }
};

export const upsertUserCurrency = async (req, res) => {
    try {
        const userId = req.user.id;
        const { code } = req.params;
        const { enabled } = req.body;

        if (enabled === undefined) {
            return res.status(400).json({ message: 'Enabled status is required' });
        }

        const updated = await UserCurrency.upsert(userId, code, enabled);
        res.status(200).json({ message: 'Currency configured', currency: updated });
    } catch (error) {
        console.error('Error updating currency:', error);
        res.status(500).json({ message: 'Failed to update currency' });
    }
};

export const getSupportedCurrenciesForUser = async (req, res) => {
    try {
        const currencies = await SupportedCurrency.findAllEnabled();
        res.status(200).json(currencies);
    } catch (error) {
        console.error('Error fetching supported currencies:', error);
        res.status(500).json({ message: 'Failed to fetch supported currencies' });
    }
};
