import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import ApiKey from "../models/ApiKey.js";
import Notification from "../models/Notification.js";
import { getDb } from "../config/db.js";
import emailService from "../services/emailService.js";

const generateToken = (id, email, role) => {
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
        throw new Error('JWT_SECRET environment variable is not set');
    }
    return jwt.sign({ id, email, role }, JWT_SECRET, { expiresIn: '1d' });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
    try {
        const {
            email, password, role, fullName, phone, businessName,
            idType, idNumber, location, payoutMethod, payoutDetails
        } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Determine KYC/KYB status and transaction limits
        let kycStatus = "none";
        let kybStatus = "none";
        let transactionLimit = 1000; // Base limit if no KYC provided

        if (idNumber && idNumber.trim() !== "") {
            kycStatus = "pending";
            transactionLimit = 50000; // Elevated limit for KYC
            if (businessName && businessName.trim() !== "") {
                kybStatus = "pending";
                transactionLimit = 500000; // Supreme limit for KYB
            }
        }

        // Determine payout details - use phone as M-Pesa number if not provided
        let finalPayoutMethod = payoutMethod || "mpesa";
        let finalPayoutDetails = payoutDetails || "";

        if (finalPayoutMethod === "mpesa" && !finalPayoutDetails && phone) {
            finalPayoutDetails = phone;
        }

        // Create user
        const user = await User.create({
            email,
            password: hashedPassword,
            role: role || "seller",
            fullName: fullName || "",
            phone: phone || "",
            businessName: businessName || (role === "admin" ? "Super Admin" : (fullName ? `${fullName}'s Store` : "New Store")),
            idType: idType || "National ID",
            idNumber: idNumber || "",
            location: location || "",
            payoutMethod: finalPayoutMethod,
            payoutDetails: finalPayoutDetails,
            kycStatus,
            kybStatus,
            transactionLimit,
            isVerified: true // Assume verified if they reached here in the flow
        });

        if (user) {
            // Create default payout method in user_payout_methods table
            try {
                const db = getDb();
                await db.run(
                    `INSERT INTO user_payout_methods (userId, method, label, details, isDefault) VALUES (?, ?, ?, ?, 1)`,
                    [user.id, finalPayoutMethod, finalPayoutMethod === 'mpesa' ? 'M-Pesa' : 'Bank Account', finalPayoutDetails]
                );
            } catch (payoutErr) {
                console.error('Failed to create default payout method:', payoutErr.message);
            }

            // Send welcome email
            try {
                await emailService.sendWelcomeEmail(user);
                console.log('Welcome email sent to:', user.email);
            } catch (emailError) {
                console.error('Failed to send welcome email:', emailError.message);
                // Don't block registration if email fails
            }
            
            // Notify Admin
            await Notification.create({
                userId: null, 
                targetRole: 'admin',
                title: "New User Registered",
                message: `User ${email} (${fullName || 'N/A'}) has joined RippliFy as a ${role || 'seller'}.`,
                type: 'info',
                actionUrl: '/admin/users',
                actionLabel: 'Manage User'
            });
            
            // Welcome Notification for New User
            await Notification.create({
                userId: user.id,
                title: "Welcome to RippliFy!",
                message: `Hi ${fullName || user.email.split('@')[0]}, welcome to RippliFy! We're excited to have you on board. Start creating payment links and trading safely today.`,
                type: 'success',
                actionUrl: '/payment-links',
                actionLabel: 'Create Your First Link'
            });

            // Auto-assign API Key for sellers
            if (user.role === "seller") {
                try {
                    await ApiKey.create(user.id, "Default API Key");
                } catch (keyError) {
                    console.error("Failed to auto-assign API key:", keyError);
                    // We don't block registration if API key creation fails, but we log it
                }
            }

            res.status(201).json({
                token: generateToken(user.id, user.email, user.role),
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    businessName: user.businessName,
                    fullName: user.fullName,
                    phone: user.phone,
                    location: user.location,
                    payoutMethod: user.payoutMethod,
                    payoutDetails: user.payoutDetails,
                    kycStatus: user.kycStatus,
                    kybStatus: user.kybStatus,
                    transactionLimit: user.transactionLimit,
                    isVerified: user.isVerified
                }
            });
        } else {
            res.status(400).json({ message: "Invalid user data" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        // Find user by email first
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Check if user is disabled
        if (user.isDisabled) {
            return res.status(403).json({ message: "Your account has been disabled. Contact support for assistance." });
        }

        // If role is specified, verify it matches
        if (role && user.role !== role) {
            return res.status(400).json({ message: "Invalid credentials or role mismatch" });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        res.json({
            token: generateToken(user.id, user.email, user.role),
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                businessName: user.businessName,
                fullName: user.fullName,
                phone: user.phone,
                location: user.location,
                payoutMethod: user.payoutMethod,
                payoutDetails: user.payoutDetails,
                kycStatus: user.kycStatus,
                kybStatus: user.kybStatus,
                transactionLimit: user.transactionLimit,
                isVerified: user.isVerified,
                isDisabled: user.isDisabled
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (user) {
            res.json({
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    businessName: user.businessName,
                    fullName: user.fullName,
                    phone: user.phone,
                    location: user.location,
                    payoutMethod: user.payoutMethod,
                    payoutDetails: user.payoutDetails,
                    kycStatus: user.kycStatus,
                    kybStatus: user.kybStatus,
                    transactionLimit: user.transactionLimit,
                    isVerified: user.isVerified,
                    isDisabled: user.isDisabled
                }
            });
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Get current user's API Keys
// @route   GET /api/auth/api-keys
// @access  Private
export const getMyApiKeys = async (req, res) => {
    try {
        const keys = await ApiKey.findByUserId(req.user.id);
        res.json(keys);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Create a new API Key for current user
// @route   POST /api/auth/api-keys
// @access  Private
export const createMyApiKey = async (req, res) => {
    try {
        const { name } = req.body;
        const newKey = await ApiKey.create(req.user.id, name || "Default API Key");
        res.status(201).json(newKey);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Delete current user's API Key
// @route   DELETE /api/auth/api-keys/:id
// @access  Private
export const deleteMyApiKey = async (req, res) => {
    try {
        const id = req.params.id;
        const userId = req.user.id;
        
        // Safety: Check if key belongs to user
        const db = getDb();
        const key = await db.get("SELECT * FROM api_keys WHERE id = ? AND userId = ?", [id, userId]);
        
        if (!key) {
            return res.status(404).json({ message: "API Key not found or access denied" });
        }

        await ApiKey.delete(id);
        res.json({ message: "API Key deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Send OTP to phone number
// @route   POST /api/auth/send-otp
// @access  Public
export const sendOTP = async (req, res) => {
    console.log('Received OTP request for:', req.body.email);
    try {

        const { email } = req.body;
        if (!email) return res.status(400).json({ message: "Email is required." });

        const db = getDb();
        if (!db) {
            console.error("Database connection not ready");
            return res.status(500).json({ message: "Database connection not ready" });
        }


        // Check if an OTP already exists for this email recently, delete it to prevent spam
        await db.run("DELETE FROM otps WHERE email = ?", email);

        // Generate a random 4-digit code
        const otpCode = Math.floor(1000 + Math.random() * 9000).toString();

        await db.run("INSERT INTO otps (email, otp, phone) VALUES (?, ?, ?)", [email, otpCode, ""]);

        try {
            console.log('Attempting to send OTP email to:', email);
            await emailService.sendOTPEmail(email, otpCode);
        } catch (emailError) {
            console.error('[sendOTP] Failed to send OTP email:', emailError.stack || emailError.message);
        }

        res.json({ message: "OTP sent successfully via email" });
    } catch (error) {
        console.error('[sendOTP] Fatal error in sendOTP controller:', error.stack || error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required." });

        const db = getDb();
        const record = await db.get("SELECT * FROM otps WHERE email = ? ORDER BY createdAt DESC LIMIT 1", email);

        if (!record) {
            return res.status(400).json({ message: "No OTP request found for this email.", success: false });
        }

        // Add an expiry check here if desired (e.g. 5 minutes)
        // Add an expiry check here if desired (e.g. 5 minutes)

        if (record.otp === otp) {
            // Success, remove the OTP
            await db.run("DELETE FROM otps WHERE email = ?", email);
            res.json({ message: "OTP verified successfully", success: true });
        } else {
            res.status(400).json({ message: "Invalid OTP", success: false });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};
// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
    try {
        const { businessName, fullName, phone, location, payoutMethod, payoutDetails } = req.body;
        
        const updatedUser = await User.update(req.user.id, {
            businessName,
            fullName,
            phone,
            location,
            payoutMethod,
            payoutDetails
        });

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({
            message: "Profile updated successfully",
            user: updatedUser
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Forgot password - send reset email
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            // For security, don't reveal if user exists
            return res.json({ message: "If an account with that email exists, a password reset link has been sent." });
        }

        // Generate reset OTP
        const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
        const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

        const db = getDb();
        // Delete any existing reset tokens for this user
        await db.run("DELETE FROM password_reset_tokens WHERE userId = ?", [user.id]);
        
        // Store new token
        await db.run(
            "INSERT INTO password_reset_tokens (userId, token, expiresAt) VALUES (?, ?, ?)",
            [user.id, otpCode, expiresAt.toISOString()]
        );

        // Send reset email
        try {
            await emailService.sendPasswordResetEmail(user, otpCode);
            console.log('Password reset email sent to:', user.email);
        } catch (emailError) {
            console.error('Failed to send password reset email:', emailError.message);
            // Still return success to user (security measure)
        }

        res.json({ message: "If an account with that email exists, a password reset link has been sent." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Reset password with token
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
    try {
        const { otp, password } = req.body;
        
        if (!otp || !password) {
            return res.status(400).json({ message: "OTP and new password are required" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        const db = getDb();
        
        // Find token and check expiration
        const resetTokenRecord = await db.get(
            "SELECT * FROM password_reset_tokens WHERE token = ? AND used = 0 AND expiresAt > datetime('now')",
            [otp]
        );

        if (!resetTokenRecord) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        // Get user
        const user = await User.findById(resetTokenRecord.userId);
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Update user password
        await db.run("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, user.id]);
        
        // Mark token as used
        await db.run("UPDATE password_reset_tokens SET used = 1 WHERE id = ?", [resetTokenRecord.id]);

        // Send notification email (optional)
        try {
            await emailService.sendNotificationEmail(user, {
                title: "Password Reset Successful",
                message: "Your password has been successfully reset. If you did not perform this action, please contact our support team immediately.",
                actionUrl: '/login',
                actionLabel: 'Login Now'
            });
        } catch (emailError) {
            console.error('Failed to send password reset confirmation email:', emailError.message);
        }

        res.json({ message: "Password reset successful. You can now login with your new password." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};
