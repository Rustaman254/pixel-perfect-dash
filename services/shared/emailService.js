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
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8fafc; margin: 0; padding: 40px 20px;">
  <div style="max-width: 420px; margin: 0 auto; background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
    <!-- Logo -->
    <div style="text-align: center; margin-bottom: 28px;">
      <div style="display: inline-block;">
        <svg width="32" height="32" viewBox="0 0 36 48" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block; margin: 0 auto;">
          <path d="M0 7.5H28.8C31.3202 7.5 32.5804 7.5 33.543 7.99047C34.3897 8.4219 35.0781 9.11031 35.5095 9.95704C36 10.9196 36 12.1798 36 14.7V16.5H7.2C4.67976 16.5 3.41965 16.5 2.45704 16.0095C1.61031 15.5781 0.921901 14.8897 0.490471 14.043C0 13.0804 0 11.8202 0 9.3V7.5Z" fill="#025864"/>
          <path d="M0 28.5H28.8C31.3202 28.5 32.5804 28.5 33.543 28.0095C34.3897 27.5781 35.0781 26.8897 35.5095 26.043C36 25.0804 36 23.8202 36 21.3V19.5H7.2C4.67976 19.5 3.41965 19.5 2.45704 19.9905C1.61031 20.4219 0.921901 21.1103 0.490471 21.957C0 22.9196 0 24.1798 0 26.7V28.5Z" fill="#025864"/>
          <path d="M14 31.5H28.8C31.3202 31.5 32.5804 31.5 33.543 31.9905C34.3897 32.4219 35.0781 33.1103 35.5095 33.957C36 34.9196 36 36.1798 36 38.7V40.5H21.2C18.6798 40.5 17.4196 40.5 16.457 40.0095C15.6103 39.5781 14.9219 38.8897 14.4905 38.043C14 37.0804 14 35.8202 14 33.3V31.5Z" fill="#025864"/>
        </svg>
      </div>
      <span style="display: block; font-size: 22px; font-weight: 800; color: #025864; margin-top: 8px; letter-spacing: -0.5px;">RippliFy</span>
    </div>

    <!-- Title -->
    <h2 style="color: #1e293b; font-size: 20px; font-weight: 700; text-align: center; margin: 0 0 8px 0;">${subject}</h2>
    <p style="color: #64748b; font-size: 14px; text-align: center; margin: 0 0 24px 0;">Enter this code to continue</p>

    <!-- OTP Box -->
    <div style="background: #f1f5f9; border-radius: 12px; padding: 20px; text-align: center; margin: 0 auto 24px auto; max-width: 200px;">
      <span style="font-size: 28px; font-weight: 700; letter-spacing: 12px; color: #0f172a;">${otp}</span>
    </div>

    <!-- Footer -->
    <p style="color: #64748b; font-size: 13px; text-align: center; margin: 0 0 8px 0;">This code expires in 15 minutes.</p>
    <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">
      If you didn't request this, please ignore this email.
    </p>

    <!-- Copyright -->
    <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
      <p style="color: #94a3b8; font-size: 11px; margin: 0;">© 2025 RippliFy Inc. All rights reserved.</p>
      <p style="color: #94a3b8; font-size: 11px; margin: 4px 0 0 0;">Nairobi, Kenya</p>
    </div>
  </div>
</body>
</html>
    `,
  });
};

export const sendPasswordResetEmail = async (email, otp) => {
  return sendOTPEmail(email, otp, 'password_reset');
};

export default { initialize, sendEmail, sendWelcomeEmail, sendOTPEmail, sendPasswordResetEmail };
