import paymentService from '../utils/paymentService.js';

export const createCheckout = async (req, res) => {
    try {
        const { amount, currency, paymentMethod, metadata } = req.body;
        const intent = await paymentService.createCheckoutIntent(
            req.user.id, 
            parseFloat(amount), 
            currency, 
            paymentMethod || 'card', 
            metadata
        );
        res.status(201).json(intent);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const handleWebhook = async (req, res) => {
    try {
        const provider = req.params.provider; // 'stripe', 'mpesa', 'mock_provider'
        await paymentService.handleWebhook(provider, req.body);
        res.status(200).json({ received: true });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
