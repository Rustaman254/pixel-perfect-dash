import jwt from "jsonwebtoken";
import User from "../models/User.js";
import ApiKey from "../models/ApiKey.js";

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        try {
            token = req.headers.authorization.split(" ")[1];

            if (token.startsWith("rf_")) {
                // API Key Authentication
                const apiKeyRecord = await ApiKey.findByKey(token);
                if (!apiKeyRecord) {
                    return res.status(401).json({ message: "Invalid or inactive API Key" });
                }
                
                req.user = await User.findById(apiKeyRecord.userId);
                if (!req.user) {
                    return res.status(401).json({ message: "User associated with API Key not found" });
                }
            } else {
                // Standard JWT Authentication
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                req.user = await User.findById(decoded.id);
                if (!req.user) {
                    return res.status(401).json({ message: "Not authorized, user not found" });
                }
            }

            // Check if user account is disabled
            if (req.user.isDisabled) {
                return res.status(403).json({ message: "Your account has been disabled. Contact support for assistance." });
            }

            return next();
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                console.warn("JWT Expired warning:", error.message);
                return res.status(401).json({ message: "Token expired" });
            } else {
                console.error("Auth Verification error:", error);
                return res.status(401).json({ message: "Not authorized, token failed" });
            }
        }
    }

    if (!token) {
        return res.status(401).json({ message: "Not authorized, no token" });
    }
};

import rbacService from '../utils/rbacService.js';

const admin = async (req, res, next) => {
    if (req.user) {
        // Legacy role check
        if (req.user.role === 'admin') return next();

        // RBAC-aware check: Check if user has 'admin:view' or 'Super Admin' role
        const isSuperAdmin = await rbacService.userHasPermission(req.user.id, 'roles', 'view');
        if (isSuperAdmin) return next();
    }
    
    res.status(403).json({ message: 'Not authorized as an admin' });
};

export { protect, admin };
