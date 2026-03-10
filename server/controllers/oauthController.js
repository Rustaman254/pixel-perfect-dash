import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { getDb } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_ripplify_key_2025";

// Helper to generate random strings
const generateRandomString = (length = 32) => {
    return crypto.randomBytes(length).toString('hex');
};

// @desc    Get all OAuth clients for current user
// @route   GET /api/oauth/clients
// @access  Private
export const getMyClients = async (req, res) => {
    try {
        const db = getDb();
        const clients = await db.all("SELECT id, clientId, name, redirectUri, createdAt FROM oauth_clients WHERE userId = ?", [req.user.id]);
        res.json(clients);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Create a new OAuth client
// @route   POST /api/oauth/clients
// @access  Private
export const createClient = async (req, res) => {
    try {
        const { name, redirectUri } = req.body;
        if (!name || !redirectUri) {
            return res.status(400).json({ message: "Name and redirect URI are required" });
        }

        const clientId = generateRandomString(16);
        const clientSecret = generateRandomString(32);

        const db = getDb();
        const result = await db.run(
            "INSERT INTO oauth_clients (userId, clientId, clientSecret, name, redirectUri) VALUES (?, ?, ?, ?, ?)",
            [req.user.id, clientId, clientSecret, name, redirectUri]
        );

        res.status(201).json({
            id: result.lastID,
            clientId,
            clientSecret,
            name,
            redirectUri
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Delete an OAuth client
// @route   DELETE /api/oauth/clients/:id
// @access  Private
export const deleteClient = async (req, res) => {
    try {
        const { id } = req.params;
        const db = getDb();
        
        const client = await db.get("SELECT * FROM oauth_clients WHERE id = ? AND userId = ?", [id, req.user.id]);
        if (!client) {
            return res.status(404).json({ message: "Client not found or access denied" });
        }

        await db.run("DELETE FROM oauth_clients WHERE id = ?", [id]);
        res.json({ message: "Client deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Authorize request (GET /api/oauth/authorize)
// @access  Private (User must be logged in to RippliFy)
export const authorize = async (req, res) => {
    try {
        const { client_id, redirect_uri, response_type, state } = req.query;

        if (response_type !== 'code') {
            return res.status(400).json({ message: "Only response_type=code is supported" });
        }

        const db = getDb();
        const client = await db.get("SELECT * FROM oauth_clients WHERE clientId = ?", [client_id]);

        if (!client) {
            return res.status(404).json({ message: "Invalid Client ID" });
        }

        // Validate redirect URI if provided, otherwise use the one on file
        if (redirect_uri && redirect_uri !== client.redirectUri) {
            return res.status(400).json({ message: "Invalid redirect URI" });
        }

        // Return client info so frontend can show consent screen
        res.json({
            clientName: client.name,
            clientId: client.clientId,
            redirectUri: client.redirectUri,
            state
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Handle User Consent (POST /api/oauth/consent)
// @access  Private
export const handleConsent = async (req, res) => {
    try {
        const { client_id, redirect_uri, state, consent } = req.body;

        if (!consent) {
            return res.status(400).json({ message: "Consent denied" });
        }

        const db = getDb();
        const client = await db.get("SELECT * FROM oauth_clients WHERE clientId = ?", [client_id]);

        if (!client) {
            return res.status(404).json({ message: "Invalid Client" });
        }

        const code = generateRandomString(16);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

        await db.run(
            "INSERT INTO oauth_auth_codes (code, userId, clientId, redirectUri, expiresAt) VALUES (?, ?, ?, ?, ?)",
            [code, req.user.id, client_id, redirect_uri || client.redirectUri, expiresAt]
        );

        res.json({ code, state, redirectUri: redirect_uri || client.redirectUri });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Exchange Auth Code for Token (POST /api/oauth/token)
// @access  Public (Client Secret required)
export const issueToken = async (req, res) => {
    try {
        const { client_id, client_secret, code, grant_type, redirect_uri } = req.body;

        if (grant_type !== 'authorization_code') {
            return res.status(400).json({ message: "Only grant_type=authorization_code is supported" });
        }

        const db = getDb();
        const client = await db.get("SELECT * FROM oauth_clients WHERE clientId = ? AND clientSecret = ?", [client_id, client_secret]);

        if (!client) {
            return res.status(401).json({ message: "Invalid client credentials" });
        }

        const authCode = await db.get(
            "SELECT * FROM oauth_auth_codes WHERE code = ? AND clientId = ?",
            [code, client_id]
        );

        if (!authCode) {
            return res.status(400).json({ message: "Invalid or expired authorization code" });
        }

        if (new Date(authCode.expiresAt) < new Date()) {
            await db.run("DELETE FROM oauth_auth_codes WHERE id = ?", [authCode.id]);
            return res.status(400).json({ message: "Authorization code expired" });
        }

        // Create access token
        const token = generateRandomString(40);
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

        await db.run(
            "INSERT INTO oauth_access_tokens (token, userId, clientId, expiresAt) VALUES (?, ?, ?, ?)",
            [token, authCode.userId, client_id, expiresAt]
        );

        // Clean up auth code
        await db.run("DELETE FROM oauth_auth_codes WHERE id = ?", [authCode.id]);

        res.json({
            access_token: token,
            token_type: 'Bearer',
            expires_in: 86400
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Get user profile via OAuth token
// @route   GET /api/oauth/userinfo
// @access  Public (Bearer Token required)
export const getUserInfo = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Missing or invalid authorization header" });
        }

        const token = authHeader.split(" ")[1];
        const db = getDb();
        
        const tokenRecord = await db.get("SELECT * FROM oauth_access_tokens WHERE token = ?", [token]);
        if (!tokenRecord) {
            return res.status(401).json({ message: "Invalid access token" });
        }

        if (new Date(tokenRecord.expiresAt) < new Date()) {
            return res.status(401).json({ message: "Access token expired" });
        }

        const user = await db.get("SELECT id, email, fullName, businessName, role FROM users WHERE id = ?", [tokenRecord.userId]);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};
