import AfricasTalking from 'africastalking';

class SMSService {
    constructor() {
        this.client = null;
        this.initialized = false;
        this.senderId = process.env.SMS_SENDER_ID || 'Ripplify';
    }

    async initialize() {
        if (this.initialized) return;

        const apiKey = process.env.AFRICASTALKING_API_KEY;
        const username = process.env.AFRICASTALKING_USERNAME;

        if (!apiKey || !username) {
            console.warn('Africa\'s Talking credentials not configured. SMS sending will be disabled.');
            return;
        }

        try {
            this.client = AfricasTalking({
                apiKey,
                username,
            });
            this.initialized = true;
            console.log('SMS service initialized successfully');
        } catch (error) {
            console.error('SMS service initialization failed:', error.message);
        }
    }

    normalizePhone(phone) {
        if (!phone) return '';
        let p = phone.replace(/\D/g, '');
        if (p.startsWith('0') && p.length === 10) {
            p = '+254' + p.slice(1);
        } else if (p.length === 9) {
            p = '+254' + p;
        } else if (p.startsWith('254') && p.length === 12) {
            p = '+' + p;
        }
        return p;
    }

    async sendSMS(phone, message) {
        if (!this.initialized) {
            console.warn('SMS service not initialized, skipping SMS to:', phone);
            return false;
        }

        const normalizedPhone = this.normalizePhone(phone);
        if (!normalizedPhone) {
            console.warn('Invalid phone number for SMS:', phone);
            return false;
        }

        try {
            const sms = this.client.SMS;
            const response = await sms.send({
                to: [normalizedPhone],
                message,
                from: this.senderId,
            });
            console.log('SMS sent to', normalizedPhone, ':', JSON.stringify(response));
            return true;
        } catch (error) {
            console.error('SMS send error:', error.message);
            return false;
        }
    }

    async sendTransactionSMS(phone, transaction) {
        const message = `Ripplify: You received KES ${Number(transaction.amount).toLocaleString()} from ${transaction.buyerName || 'a buyer'}. Ref: ${transaction.transactionId}. Thank you!`;
        return this.sendSMS(phone, message);
    }

    async sendTransferSentSMS(phone, transfer) {
        const message = `Ripplify: You sent KES ${Number(transfer.amount).toLocaleString()} to ${transfer.receiverPhone || 'user ' + transfer.receiverId}. Ref: ${transfer.id}. Fee: KES ${Number(transfer.fee).toLocaleString()}.`;
        return this.sendSMS(phone, message);
    }

    async sendTransferReceivedSMS(phone, transfer) {
        const message = `Ripplify: You received KES ${Number(transfer.amount).toLocaleString()}. Ref: ${transfer.id}. Log in to view details.`;
        return this.sendSMS(phone, message);
    }

    async sendPayoutSMS(phone, payout) {
        const message = `Ripplify: Your payout of KES ${Number(payout.amount).toLocaleString()} via ${payout.method} is processing. You'll receive it shortly.`;
        return this.sendSMS(phone, message);
    }

    async sendBatchTransferSMS(phone, batchCount, totalAmount) {
        const message = `Ripplify: Batch transfer of KES ${Number(totalAmount).toLocaleString()} to ${batchCount} recipients completed. Log in to view details.`;
        return this.sendSMS(phone, message);
    }
}

const smsService = new SMSService();
export default smsService;
