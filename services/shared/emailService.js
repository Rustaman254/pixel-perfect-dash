import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import dotenv from 'dotenv';
dotenv.config();

let transporter = null;

export const initialize = async () => {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';

  if (!user || !pass) {
    console.warn('Email service: SMTP credentials not configured');
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  console.log('Email service initialized');
  return transporter;
};

export const sendEmail = async ({ to, subject, html, text }) => {
  if (!transporter) await initialize();
  if (!transporter) {
    console.warn('Email not sent: transporter not configured');
    return null;
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  return transporter.sendMail({ from, to, subject, html, text });
};

export const sendWelcomeEmail = async (user, frontendUrl) => {
  const url = frontendUrl || process.env.FRONTEND_URL || 'https://ripplify.sokostack.xyz';
  return sendEmail({
    to: user.email,
    subject: 'Welcome to Sokostack!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome, ${user.fullName || 'there'}!</h2>
        <p>Your account has been created successfully.</p>
        <p>You now have access to all Sokostack products: Ripplify, Shopalize, Watchtower, and more.</p>
        <a href="${url}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;margin-top:16px;">Go to Dashboard</a>
      </div>
    `,
  });
};

export const sendOTPEmail = async (email, otp, type = 'verification') => {
  const subject = type === 'password_reset' ? 'Password Reset Code' : 'Your Verification Code';
  return sendEmail({
    to: email,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${subject}</h2>
        <p>Your code is:</p>
        <h1 style="font-size: 32px; letter-spacing: 4px; background: #f3f4f6; padding: 16px; text-align: center; border-radius: 8px;">${otp}</h1>
        <p>This code expires in 15 minutes.</p>
      </div>
    `,
  });
};

export const sendPasswordResetEmail = async (email, otp) => {
  return sendOTPEmail(email, otp, 'password_reset');
};

export default { initialize, sendEmail, sendWelcomeEmail, sendOTPEmail, sendPasswordResetEmail };
