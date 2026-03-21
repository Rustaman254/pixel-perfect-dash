import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import ApiKey from "../models/ApiKey.js";
import Notification from "../models/Notification.js";
import { getDb } from "../config/db.js";

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
        let transactionLimit = 5000; // Base limit if no KYC provided

        if (idNumber && idNumber.trim() !== "") {
            kycStatus = "pending";
            transactionLimit = 50000; // Elevated limit for KYC
            if (businessName && businessName.trim() !== "") {
                kybStatus = "pending";
                transactionLimit = 500000; // Supreme limit for KYB
            }
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
            payoutMethod: payoutMethod || "mpesa",
            payoutDetails: payoutDetails || "",
            kycStatus,
            kybStatus,
            transactionLimit,
            isVerified: true // Assume verified if they reached here in the flow
        });

        if (user) {
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

        // Find user
        const user = await User.findOne({ email, role });
        if (!user) {
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
                isVerified: user.isVerified
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
                    isVerified: user.isVerified
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
    try {
        const { phone } = req.body;
        if (!phone) return res.status(400).json({ message: "Phone number is required." });

        const db = getDb();

        // Check if an OTP already exists for this phone recently, delete it to prevent spam
        await db.run("DELETE FROM otps WHERE phone = ?", phone);

        // Generate a random 4-digit code
        const otpCode = Math.floor(1000 + Math.random() * 9000).toString();

        await db.run("INSERT INTO otps (phone, otp) VALUES (?, ?)", [phone, otpCode]);

        // In a real app, integrate Twilio/Africa's Talking here to send the SMS
        // In a real app, integrate Twilio/Africa's Talking here to send the SMS

        res.json({ message: "OTP sent successfully", otp: otpCode });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOTP = async (req, res) => {
    try {
        const { phone, otp } = req.body;
        if (!phone || !otp) return res.status(400).json({ message: "Phone and OTP are required." });

        const db = getDb();
        const record = await db.get("SELECT * FROM otps WHERE phone = ? ORDER BY createdAt DESC LIMIT 1", phone);

        if (!record) {
            return res.status(400).json({ message: "No OTP request found for this number.", success: false });
        }

        // Add an expiry check here if desired (e.g. 5 minutes)
        // Add an expiry check here if desired (e.g. 5 minutes)

        if (record.otp === otp) {
            // Success, remove the OTP
            await db.run("DELETE FROM otps WHERE phone = ?", phone);
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
