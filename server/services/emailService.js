import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class EmailService {
    constructor() {
        this.transporter = null;
        this.templates = {};
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        // Create transporter based on environment variables
        const emailHost = process.env.EMAIL_HOST;
        const emailPort = process.env.EMAIL_PORT;
        const emailUser = process.env.EMAIL_USER;
        const emailPass = process.env.EMAIL_PASS;
        const emailFrom = process.env.EMAIL_FROM;

        if (!emailHost || !emailPort || !emailUser || !emailPass) {
            console.warn('Email configuration incomplete. Email sending will be disabled.');
            return;
        }

        this.transporter = nodemailer.createTransport({
            host: emailHost,
            port: parseInt(emailPort),
            secure: parseInt(emailPort) === 465, // true for 465, false for other ports
            auth: {
                user: emailUser,
                pass: emailPass
            }
        });

        // Verify connection
        try {
            await this.transporter.verify();
            console.log('Email server connection verified successfully');
            this.initialized = true;
        } catch (error) {
            console.error('Email server connection failed:', error.message);
        }

        // Precompile templates
        this.loadTemplates();
    }

    loadTemplates() {
        const templatesDir = path.join(__dirname, '../templates/email');
        
        try {
            // Welcome email template
            const welcomeTemplate = fs.readFileSync(
                path.join(templatesDir, 'welcome.hbs'),
                'utf8'
            );
            this.templates.welcome = handlebars.compile(welcomeTemplate);

            // Receipt email template
            const receiptTemplate = fs.readFileSync(
                path.join(templatesDir, 'receipt.hbs'),
                'utf8'
            );
            this.templates.receipt = handlebars.compile(receiptTemplate);

            // Password reset template
            const passwordResetTemplate = fs.readFileSync(
                path.join(templatesDir, 'password-reset.hbs'),
                'utf8'
            );
            this.templates.passwordReset = handlebars.compile(passwordResetTemplate);

            // Notification template
            const notificationTemplate = fs.readFileSync(
                path.join(templatesDir, 'notification.hbs'),
                'utf8'
            );
            this.templates.notification = handlebars.compile(notificationTemplate);

            console.log('Email templates loaded successfully');
        } catch (error) {
            console.error('Error loading email templates:', error.message);
        }
    }

    async sendEmail(to, subject, template, data) {
        if (!this.initialized) {
            console.error('Email service not initialized');
            return false;
        }

        try {
            const html = template(data);
            
            const mailOptions = {
                from: process.env.EMAIL_FROM || '"RippliFy" <noreply@ripplify.com>',
                to,
                subject,
                html,
                text: this.htmlToText(html) // Plain text fallback
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('Email sent:', info.messageId);
            return true;
        } catch (error) {
            console.error('Error sending email:', error.message);
            return false;
        }
    }

    htmlToText(html) {
        // Simple HTML to text conversion (you can use a library like html-to-text for better results)
        return html
            .replace(/<[^>]*>/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    // Convenience methods for different email types
    async sendWelcomeEmail(user) {
        const data = {
            name: user.fullName || user.email.split('@')[0],
            email: user.email,
            businessName: user.businessName,
            loginUrl: `${process.env.FRONTEND_URL || 'https://sokostack.ddns.net'}/login`
        };

        return this.sendEmail(
            user.email,
            'Welcome to RippliFy!',
            this.templates.welcome,
            data
        );
    }

    async sendReceiptEmail(user, transaction) {
        const data = {
            name: user.fullName || user.email.split('@')[0],
            email: user.email,
            transactionId: transaction.transactionId,
            amount: transaction.amount,
            currency: transaction.currency,
            date: new Date(transaction.createdAt).toLocaleDateString(),
            time: new Date(transaction.createdAt).toLocaleTimeString(),
            status: transaction.status,
            productName: transaction.linkName || 'Payment Link',
            receiptUrl: `${process.env.FRONTEND_URL || 'https://sokostack.ddns.net'}/transactions/${transaction.transactionId}`
        };

        return this.sendEmail(
            user.email,
            `Payment Receipt - ${transaction.amount} ${transaction.currency}`,
            this.templates.receipt,
            data
        );
    }

    async sendPasswordResetEmail(user, resetToken) {
        const data = {
            name: user.fullName || user.email.split('@')[0],
            email: user.email,
            resetUrl: `${process.env.FRONTEND_URL || 'https://sokostack.ddns.net'}/reset-password?token=${resetToken}`,
            expiresIn: '1 hour'
        };

        return this.sendEmail(
            user.email,
            'Password Reset Request - RippliFy',
            this.templates.passwordReset,
            data
        );
    }

    async sendNotificationEmail(user, notification) {
        const data = {
            name: user.fullName || user.email.split('@')[0],
            email: user.email,
            title: notification.title,
            message: notification.message,
            actionUrl: notification.actionUrl ? `${process.env.FRONTEND_URL || 'https://sokostack.ddns.net'}${notification.actionUrl}` : null,
            actionLabel: notification.actionLabel,
            date: new Date().toLocaleDateString()
        };

        return this.sendEmail(
            user.email,
            notification.title,
            this.templates.notification,
            data
        );
    }
}

// Singleton instance
const emailService = new EmailService();
export default emailService;