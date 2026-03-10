import UserPaymentMethod from '../models/UserPaymentMethod.js';

export const getUserPaymentMethods = async (req, res) => {
    try {
        const userId = req.user.id;
        const methods = await UserPaymentMethod.findAllByUserId(userId);
        res.status(200).json(methods);
    } catch (error) {
        console.error('Error fetching payment methods:', error);
        res.status(500).json({ message: 'Failed to fetch payment methods' });
    }
};

export const upsertUserPaymentMethod = async (req, res) => {
    try {
        const userId = req.user.id;
        const { methodId } = req.params;
        const { enabled, fee } = req.body;

        if (enabled === undefined || !fee) {
            return res.status(400).json({ message: 'Enabled status and fee are required' });
        }

        const updated = await UserPaymentMethod.upsert(userId, methodId, enabled, fee);
        res.status(200).json({ message: 'Payment method configured', method: updated });
    } catch (error) {
        console.error('Error updating payment method:', error);
        res.status(500).json({ message: 'Failed to update payment method' });
    }
};
