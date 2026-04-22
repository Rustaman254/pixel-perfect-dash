class PaymentProvider {
    async mpesaStkPush(params) {
        throw new Error('Method not implemented');
    }

    async checkoutCharge(params) {
        throw new Error('Method not implemented');
    }

    async checkPaymentStatus(invoiceId) {
        throw new Error('Method not implemented');
    }

    async mpesaB2c(params) {
        throw new Error('Method not implemented');
    }

    async bankPayout(params) {
        throw new Error('Method not implemented');
    }

    async intasendTransfer(params) {
        throw new Error('Method not implemented');
    }

    async checkPayoutStatus(trackingId) {
        throw new Error('Method not implemented');
    }

    async createWallet(label, currency) {
        throw new Error('Method not implemented');
    }

    async getWallet(walletId) {
        throw new Error('Method not implemented');
    }

    async getWalletTransactions(walletId) {
        throw new Error('Method not implemented');
    }

    async internalTransfer(params) {
        throw new Error('Method not implemented');
    }

    async getWallets() {
        throw new Error('Method not implemented');
    }

    async getWalletTransactions(walletId, period) {
        throw new Error('Method not implemented');
    }
}

export default PaymentProvider;
export { PaymentProvider };