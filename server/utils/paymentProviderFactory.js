import IntaSendProvider from '../../services/ripplify-service/utils/IntaSendProvider.js';

const getPaymentProvider = () => {
    const provider = process.env.PAYMENT_PROVIDER || 'intasend';
    
    switch (provider) {
        case 'intasend':
            return new IntaSendProvider();
        default:
            throw new Error(`Unknown payment provider: ${provider}`);
    }
};

export default getPaymentProvider;