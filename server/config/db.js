import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

let dbInstance = null;

const connectDB = async () => {
  try {
    const dbPath = path.resolve('./ripplify.db');
    console.log('Database path:', dbPath);
    dbInstance = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    // Create User Table
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'seller',
        fullName TEXT DEFAULT '',
        phone TEXT DEFAULT '',
        businessName TEXT DEFAULT '',
        idType TEXT DEFAULT 'National ID',
        idNumber TEXT DEFAULT '',
        location TEXT DEFAULT '',
        payoutMethod TEXT DEFAULT 'mpesa',
        payoutDetails TEXT DEFAULT '',
        businessLogo TEXT,
        kycStatus TEXT DEFAULT 'none',
        kybStatus TEXT DEFAULT 'none',
        transactionLimit REAL DEFAULT 1000,
        isVerified BOOLEAN DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create OTP Table
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS otps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT,
        email TEXT,
        otp TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Migration: add email to otps if missing
    try {
      await dbInstance.exec(`ALTER TABLE otps ADD COLUMN email TEXT`);
    } catch (e) { }

    // Create Password Reset Tokens Table
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expiresAt DATETIME NOT NULL,
        used BOOLEAN DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users (id)
      )
    `);

    // Create Payment Links Table
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS payment_links (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        currency TEXT NOT NULL,
        linkType TEXT DEFAULT 'one-time',
        status TEXT DEFAULT 'Active',
        clicks INTEGER DEFAULT 0,
        paymentCount INTEGER DEFAULT 0,
        totalEarnedValue REAL DEFAULT 0,
        hasPhotos BOOLEAN DEFAULT 0,
        deliveryDays INTEGER,
        expiryDate DATETIME,
        expiryLabel TEXT,
        shippingFee REAL DEFAULT 0,
        category TEXT DEFAULT 'product',
        buyerName TEXT,
        buyerPhone TEXT,
        buyerEmail TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users (id)
      )
    `);

    // Migration: add updatedAt to payment_links if missing
    try {
      await dbInstance.exec(`ALTER TABLE payment_links ADD COLUMN updatedAt DATETIME`);
    } catch (e) { }

    try {
      await dbInstance.exec(`ALTER TABLE payment_links ADD COLUMN category TEXT DEFAULT 'product'`);
    } catch (e) { }

    try {
      await dbInstance.exec(`ALTER TABLE payment_links ADD COLUMN shippingFee REAL DEFAULT 0`);
    } catch (e) { }

    try {
      await dbInstance.exec(`ALTER TABLE payment_links ADD COLUMN minDonation REAL DEFAULT 0`);
    } catch (e) { }

    try {
      await dbInstance.exec(`ALTER TABLE users ADD COLUMN businessLogo TEXT`);
    } catch (e) { }

    try {
      await dbInstance.exec(`ALTER TABLE users ADD COLUMN kycStatus TEXT DEFAULT 'none'`);
    } catch (e) { }

    try {
      await dbInstance.exec(`ALTER TABLE users ADD COLUMN kybStatus TEXT DEFAULT 'none'`);
    } catch (e) { }

    try {
      await dbInstance.exec(`ALTER TABLE users ADD COLUMN transactionLimit REAL DEFAULT 1000`);
    } catch (e) { }

    // Create Transactions Table
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        linkId INTEGER,
        buyerName TEXT,
        buyerEmail TEXT,
        buyerPhone TEXT,
        amount REAL NOT NULL,
        fee REAL DEFAULT 0,
        currency TEXT NOT NULL,
        status TEXT DEFAULT 'Pending',
        transactionId TEXT UNIQUE,
        trackingToken TEXT UNIQUE,
        type TEXT DEFAULT 'Payment',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users (id),
        FOREIGN KEY (linkId) REFERENCES payment_links (id)
      )
    `);

    // Migration: add trackingToken if missing (for existing DBs)
    try {
      await dbInstance.exec(`ALTER TABLE transactions ADD COLUMN trackingToken TEXT`);
    } catch (e) {
      // Column already exists — ignore
    }

    // Backfill: assign tracking tokens to existing transactions that have none
    try {
      await dbInstance.exec(`
        UPDATE transactions 
        SET trackingToken = lower(hex(randomblob(16)))
        WHERE trackingToken IS NULL
      `);
    } catch (e) {
      console.error('Backfill trackingToken failed:', e.message);
    }

    // Create API Keys Table
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        key TEXT UNIQUE NOT NULL,
        name TEXT,
        status TEXT DEFAULT 'Active',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users (id)
      )
    `);

    try {
      await dbInstance.exec(`ALTER TABLE transactions ADD COLUMN fee REAL DEFAULT 0`);
    } catch (e) { }

    try { await dbInstance.exec(`ALTER TABLE transactions ADD COLUMN senderId INTEGER REFERENCES users(id)`); } catch(e){}
    try { await dbInstance.exec(`ALTER TABLE transactions ADD COLUMN receiverId INTEGER REFERENCES users(id)`); } catch(e){}
    try { await dbInstance.exec(`ALTER TABLE transactions ADD COLUMN network TEXT`); } catch(e){}
    try { await dbInstance.exec(`ALTER TABLE transactions ADD COLUMN paymentMethod TEXT`); } catch(e){}
    try { await dbInstance.exec(`ALTER TABLE transactions ADD COLUMN txHash TEXT`); } catch(e){}
    try { await dbInstance.exec(`ALTER TABLE transactions ADD COLUMN metadata TEXT`); } catch(e){}
    try { await dbInstance.exec(`ALTER TABLE transactions ADD COLUMN externalRef TEXT`); } catch(e){}

    // Create Wallets Table
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS wallets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        currency_code TEXT NOT NULL,
        network TEXT NOT NULL,
        balance REAL DEFAULT 0,
        locked_balance REAL DEFAULT 0,
        address TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(userId, currency_code, network),
        FOREIGN KEY (userId) REFERENCES users (id)
      )
    `);

    // Create Payment Intents Table
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS payment_intents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        amount REAL NOT NULL,
        currency TEXT NOT NULL,
        paymentMethod TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        clientSecret TEXT,
        txHash TEXT,
        metadata TEXT,
        expiresAt DATETIME,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users (id)
      )
    `);

    // Create User Payout Methods Table (multiple payout options per user)
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS user_payout_methods (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        method TEXT NOT NULL,
        label TEXT DEFAULT '',
        details TEXT NOT NULL,
        isDefault BOOLEAN DEFAULT 0,
        isActive BOOLEAN DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users (id)
      )
    `);

    // Create Transfers Table (user-to-user transfers)
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS transfers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        senderId INTEGER NOT NULL,
        receiverId INTEGER,
        receiverPhone TEXT,
        receiverEmail TEXT,
        amount REAL NOT NULL,
        fee REAL DEFAULT 0,
        currency TEXT NOT NULL,
        method TEXT NOT NULL,
        status TEXT DEFAULT 'Processing',
        note TEXT,
        externalRef TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (senderId) REFERENCES users (id),
        FOREIGN KEY (receiverId) REFERENCES users (id)
      )
    `);

    // Create System Settings Table
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Fee Tiers Table (tiered pricing like PayHero)
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS fee_tiers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        minAmount REAL NOT NULL,
        maxAmount REAL NOT NULL,
        feePercent REAL NOT NULL,
        label TEXT DEFAULT '',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create OAuth Clients Table
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS oauth_clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        clientId TEXT UNIQUE NOT NULL,
        clientSecret TEXT NOT NULL,
        name TEXT NOT NULL,
        redirectUri TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users (id)
      )
    `);

    // Create OAuth Auth Codes Table
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS oauth_auth_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        userId INTEGER NOT NULL,
        clientId TEXT NOT NULL,
        redirectUri TEXT NOT NULL,
        expiresAt DATETIME NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users (id),
        FOREIGN KEY (clientId) REFERENCES oauth_clients (clientId)
      )
    `);

    // Create OAuth Access Tokens Table
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS oauth_access_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token TEXT UNIQUE NOT NULL,
        userId INTEGER NOT NULL,
        clientId TEXT NOT NULL,
        expiresAt DATETIME NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users (id),
        FOREIGN KEY (clientId) REFERENCES oauth_clients (clientId)
      )
    `);

    // Create Payouts Table
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS payouts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        amount REAL NOT NULL,
        fee REAL DEFAULT 0,
        currency TEXT NOT NULL,
        method TEXT NOT NULL,
        details TEXT NOT NULL,
        status TEXT DEFAULT 'Processing',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users (id)
      )
    `);

    try {
      await dbInstance.exec(`ALTER TABLE payouts ADD COLUMN fee REAL DEFAULT 0`);
    } catch (e) { }

    // Create Support Tickets Table
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT DEFAULT 'Open',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users (id)
      )
    `);

    // Create User Payment Methods Table
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS user_payment_methods (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        methodId TEXT NOT NULL,
        enabled BOOLEAN DEFAULT 1,
        fee TEXT NOT NULL,
        UNIQUE(userId, methodId),
        FOREIGN KEY (userId) REFERENCES users (id)
      )
    `);

    // Create User Currencies Table
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS user_currencies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        code TEXT NOT NULL,
        enabled BOOLEAN DEFAULT 1,
        UNIQUE(userId, code),
        FOREIGN KEY (userId) REFERENCES users (id)
      )
    `);

    // Create Notifications Table
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT DEFAULT 'info',
        isRead BOOLEAN DEFAULT 0,
        actionUrl TEXT,
        actionLabel TEXT,
        targetRole TEXT,
        appName TEXT DEFAULT 'ripplify',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users (id)
      )
    `);
    // Alter Notifications Table migrations
    try {
      await dbInstance.exec(`ALTER TABLE notifications ADD COLUMN actionUrl TEXT`);
    } catch (e) { }
    try {
      await dbInstance.exec(`ALTER TABLE notifications ADD COLUMN actionLabel TEXT`);
    } catch (e) { }
    try {
      await dbInstance.exec(`ALTER TABLE notifications ADD COLUMN targetRole TEXT`);
    } catch (e) { }
    try {
      await dbInstance.exec(`ALTER TABLE notifications ADD COLUMN appName TEXT DEFAULT 'ripplify'`);
    } catch (e) { }
    try {
      await dbInstance.exec(`ALTER TABLE notifications ADD COLUMN deliveryChannel TEXT DEFAULT 'app'`);
    } catch (e) { }

    // Create Apps Table (Admin Managed)
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS apps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        icon TEXT,
        url TEXT,
        isActive BOOLEAN DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Per-user feature overrides (admin can disable specific features for specific users)
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS user_feature_overrides (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        featureKey TEXT NOT NULL,
        isEnabled BOOLEAN DEFAULT 1,
        reason TEXT DEFAULT '',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users (id),
        UNIQUE(userId, featureKey)
      )
    `);

    // Seed Default Apps
    const hasApps = await dbInstance.get("SELECT COUNT(*) as count FROM apps");
    if (hasApps.count === 0) {
      await dbInstance.run(`
        INSERT INTO apps (name, slug, icon, url, isActive) 
        VALUES ('Ripplify', 'ripplify', 'Wallet', 'http://localhost:8080', 1),
               ('Watchtower', 'insights', 'BarChart', 'http://localhost:5175', 1)
      `);
    }
    try {
      await dbInstance.exec(`ALTER TABLE notifications ADD COLUMN actionUrl TEXT`);
    } catch (e) { }
    try {
      await dbInstance.exec(`ALTER TABLE notifications ADD COLUMN actionLabel TEXT`);
    } catch (e) { }
    try {
      await dbInstance.exec(`ALTER TABLE notifications ADD COLUMN targetRole TEXT`);
    } catch (e) { }

    // Create Referral Codes Table
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS referral_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        userId INTEGER,
        discount REAL DEFAULT 0,
        maxUses INTEGER DEFAULT -1,
        currentUses INTEGER DEFAULT 0,
        isActive BOOLEAN DEFAULT 1,
        pointsPerReferral INTEGER DEFAULT 10,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users (id)
      )
    `);

    // Referral usage tracking - who used which code to register
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS referral_usage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        referralCodeId INTEGER NOT NULL,
        code TEXT NOT NULL,
        referrerId INTEGER,
        referredUserId INTEGER NOT NULL,
        pointsAwarded INTEGER DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (referralCodeId) REFERENCES referral_codes (id),
        FOREIGN KEY (referrerId) REFERENCES users (id),
        FOREIGN KEY (referredUserId) REFERENCES users (id)
      )
    `);

    // Migration: add pointsPerReferral to referral_codes
    try { await dbInstance.exec(`ALTER TABLE referral_codes ADD COLUMN pointsPerReferral INTEGER DEFAULT 10`); } catch (e) { }

    // Migration: add expiresAt to referral_codes
    try { await dbInstance.exec(`ALTER TABLE referral_codes ADD COLUMN expiresAt DATETIME`); } catch (e) { }

    // Migration: add referralPoints to users
    try { await dbInstance.exec(`ALTER TABLE users ADD COLUMN referralPoints INTEGER DEFAULT 0`); } catch (e) { }

    // Migration: add pin to users
    try { await dbInstance.exec(`ALTER TABLE users ADD COLUMN pin TEXT`); } catch (e) { }

    // Create Supported Currencies Table (Admin Managed)
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS supported_currencies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        flag TEXT,
        rate REAL DEFAULT 1.0,
        symbol TEXT NOT NULL,
        enabled BOOLEAN DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed Supported Currencies
    const hasCurrencies = await dbInstance.get("SELECT COUNT(*) as count FROM supported_currencies");
    if (hasCurrencies.count === 0) {
      const defaultCurrencies = [
        { code: "USD", name: "US Dollar", flag: "🇺🇸", rate: 1.00, symbol: "$", enabled: 1 },
        { code: "EUR", name: "Euro", flag: "🇪🇺", rate: 0.92, symbol: "€", enabled: 1 },
        { code: "GBP", name: "British Pound", flag: "🇬🇧", rate: 0.79, symbol: "£", enabled: 1 },
        { code: "KES", name: "Kenyan Shilling", flag: "🇰🇪", rate: 129.00, symbol: "KSh", enabled: 1 },
        { code: "NGN", name: "Nigerian Naira", flag: "🇳🇬", rate: 1550.00, symbol: "₦", enabled: 1 },
        { code: "ZAR", name: "South African Rand", flag: "🇿🇦", rate: 18.45, symbol: "R", enabled: 1 },
        { code: "BRL", name: "Brazilian Real", flag: "🇧🇷", rate: 5.10, symbol: "R$", enabled: 1 },
        { code: "JPY", name: "Japanese Yen", flag: "🇯🇵", rate: 149.50, symbol: "¥", enabled: 1 },
        { code: "INR", name: "Indian Rupee", flag: "🇮🇳", rate: 83.20, symbol: "₹", enabled: 1 },
        { code: "AED", name: "UAE Dirham", flag: "🇦🇪", rate: 3.67, symbol: "د.إ", enabled: 1 },
        { code: "GHS", name: "Ghanaian Cedi", flag: "🇬🇭", rate: 14.80, symbol: "₵", enabled: 1 },
        { code: "TZS", name: "Tanzanian Shilling", flag: "🇹🇿", rate: 2510.00, symbol: "TSh", enabled: 1 },
      ];

      const insertStmt = await dbInstance.prepare(`
        INSERT INTO supported_currencies (code, name, flag, rate, symbol, enabled)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (const curr of defaultCurrencies) {
        await insertStmt.run(curr.code, curr.name, curr.flag, curr.rate, curr.symbol, curr.enabled);
      }
      await insertStmt.finalize();
    }

    // Migration: add isDisabled to users if missing
    try { await dbInstance.exec(`ALTER TABLE users ADD COLUMN isDisabled BOOLEAN DEFAULT 0`); } catch (e) { }
    try { await dbInstance.exec(`ALTER TABLE users ADD COLUMN isSuspended BOOLEAN DEFAULT 0`); } catch (e) { }
    try { await dbInstance.exec(`ALTER TABLE users ADD COLUMN accountStatus TEXT DEFAULT 'active'`); } catch (e) { }
    try { await dbInstance.exec(`ALTER TABLE users ADD COLUMN suspendReason TEXT DEFAULT ''`); } catch (e) { }

    // Create Feature Flags Table
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS feature_flags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        category TEXT DEFAULT 'general',
        isEnabled BOOLEAN DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed Default Feature Flags
    const hasFeatureFlags = await dbInstance.get("SELECT COUNT(*) as count FROM feature_flags");
    if (hasFeatureFlags.count === 0) {
      const defaultFeatures = [
        { key: 'payment_links', name: 'Payment Links', description: 'Create and manage payment links', category: 'payments' },
        { key: 'transactions', name: 'Transactions', description: 'View and manage transactions', category: 'payments' },
        { key: 'payouts', name: 'Payouts', description: 'Request and receive payouts', category: 'payments' },
        { key: 'wallets', name: 'Wallets', description: 'Manage currency wallets', category: 'payments' },
        { key: 'api_keys', name: 'API Keys', description: 'Generate and manage API keys for integrations', category: 'developer' },
        { key: 'oauth', name: 'OAuth', description: 'OAuth client and authorization management', category: 'developer' },
        { key: 'analytics', name: 'Analytics', description: 'View analytics and statistics', category: 'insights' },
        { key: 'customers', name: 'Customers', description: 'View customer list and data', category: 'insights' },
        { key: 'orders', name: 'Orders', description: 'Manage orders and fulfillment', category: 'payments' },
        { key: 'payment_methods', name: 'Payment Methods', description: 'Configure payment methods', category: 'payments' },
        { key: 'currencies', name: 'Currencies', description: 'Manage currency preferences', category: 'payments' },
        { key: 'notifications', name: 'Notifications', description: 'Receive and manage notifications', category: 'system' },
        { key: 'support', name: 'Support', description: 'Submit and track support tickets', category: 'system' },
        { key: 'referrals', name: 'Referrals', description: 'Use and manage referral codes', category: 'payments' },
        { key: 'transfers', name: 'Transfers', description: 'Send money to users and M-Pesa', category: 'payments' },
        { key: 'developer_docs', name: 'Developer Docs', description: 'Access API documentation', category: 'developer' },
        { key: 'transaction_pin', name: 'Transaction PIN', description: 'Set and manage transaction PIN for secure payouts', category: 'security' },
        { key: 'referral_expiry', name: 'Referral Code Expiry', description: 'Set expiration dates on referral codes', category: 'payments' },
        { key: 'forgot_password', name: 'Forgot Password', description: 'Allow users to reset their password', category: 'auth' },
        { key: 'password_reveal', name: 'Password Reveal', description: 'Toggle password visibility in forms', category: 'auth' },
      ];

      for (const f of defaultFeatures) {
        await dbInstance.run(
          `INSERT INTO feature_flags (key, name, description, category) VALUES (?, ?, ?, ?)`,
          [f.key, f.name, f.description, f.category]
        );
      }
      console.log('Default feature flags seeded.');
    }

    // Default settings
    const platformFee = await dbInstance.get("SELECT * FROM system_settings WHERE key = 'platform_fee'");
    if (!platformFee) {
      await dbInstance.run("INSERT INTO system_settings (key, value) VALUES ('platform_fee', '2.5')"); // 2.5%
    }
    const withdrawalFee = await dbInstance.get("SELECT * FROM system_settings WHERE key = 'withdrawal_fee'");
    if (!withdrawalFee) {
      await dbInstance.run("INSERT INTO system_settings (key, value) VALUES ('withdrawal_fee', '50')"); // Fixed 50 units
    }

    // Create Insights Sessions Table
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS insight_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        sessionId TEXT UNIQUE NOT NULL,
        device TEXT,
        browser TEXT,
        os TEXT,
        country TEXT,
        city TEXT,
        duration INTEGER DEFAULT 0,
        pageViews INTEGER DEFAULT 0,
        isRageClick BOOLEAN DEFAULT 0,
        isDeadClick BOOLEAN DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users (id)
      )
    `);

    // Create Insights Events Table
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS insight_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sessionId TEXT NOT NULL,
        type TEXT NOT NULL,
        target TEXT,
        url TEXT,
        data TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sessionId) REFERENCES insight_sessions (sessionId)
      )
    `);

    try {
      await dbInstance.exec(`ALTER TABLE insight_sessions ADD COLUMN endUserId TEXT`);
    } catch (e) { }
    try {
      await dbInstance.exec(`ALTER TABLE insight_sessions ADD COLUMN metadata TEXT`);
    } catch (e) { }
    try {
      await dbInstance.exec(`ALTER TABLE insight_events ADD COLUMN data TEXT`);
    } catch (e) { }

    // Create Insights Entity Mappings Table
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS insight_entity_mappings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entityId INTEGER NOT NULL,
        entityType TEXT NOT NULL,
        clarityId TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(entityId, entityType)
      )
    `);

    // --- RBAC TABLES (Enterprise Extended) ---
    
    // Roles Table Additions
    try { await dbInstance.exec(`ALTER TABLE roles ADD COLUMN parent_role_id INTEGER REFERENCES roles(id)`); } catch (e) {}
    try { await dbInstance.exec(`ALTER TABLE roles ADD COLUMN is_deprecated BOOLEAN DEFAULT 0`); } catch (e) {}
    try { await dbInstance.exec(`ALTER TABLE roles ADD COLUMN tenant_id TEXT DEFAULT 'global'`); } catch (e) {}

    // Permissions Table Additions
    try { await dbInstance.exec(`ALTER TABLE permissions ADD COLUMN category TEXT DEFAULT 'general'`); } catch (e) {}
    try { await dbInstance.exec(`ALTER TABLE permissions ADD COLUMN is_deprecated BOOLEAN DEFAULT 0`); } catch (e) {}

    // User Roles Table Additions/Fixes
    // Since user_roles is a PK table (user_id, role_id, scope_id), we might need to recreate it if we want an 'id' PK.
    // However, for portability and simplicity, we'll just add the new columns first.
    try { await dbInstance.exec(`ALTER TABLE user_roles ADD COLUMN scope_type TEXT DEFAULT 'platform'`); } catch (e) {}
    try { await dbInstance.exec(`ALTER TABLE user_roles ADD COLUMN expires_at DATETIME`); } catch (e) {}
    try { await dbInstance.exec(`ALTER TABLE user_roles ADD COLUMN assigned_by INTEGER REFERENCES users(id)`); } catch (e) {}
    try { await dbInstance.exec(`ALTER TABLE user_roles ADD COLUMN assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP`); } catch (e) {}

    // Audit Logs Table (Enhanced)
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS admin_audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        actor_id INTEGER NOT NULL,
        target_id INTEGER,
        target_type TEXT NOT NULL,
        action TEXT NOT NULL,
        changes TEXT,
        ip_address TEXT,
        user_agent TEXT,
        tenant_id TEXT DEFAULT 'global',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (actor_id) REFERENCES users (id)
      )
    `);

    // --- RBAC TABLES (Original) ---

    // User-Role Link Table (Scoped)
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS user_roles (
        user_id INTEGER NOT NULL,
        role_id INTEGER NOT NULL,
        scope_type TEXT DEFAULT 'platform',
        scope_id TEXT DEFAULT 'global',
        PRIMARY KEY (user_id, role_id, scope_id),
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE
      )
    `);

    // Role-Permission Link Table
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        role_id INTEGER NOT NULL,
        permission_id INTEGER NOT NULL,
        PRIMARY KEY (role_id, permission_id),
        FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE,
        FOREIGN KEY (permission_id) REFERENCES permissions (id) ON DELETE CASCADE
      )
    `);

    // RBAC Audit Logs Table
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        changes TEXT,
        ip_address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Create Indexes for RBAC
    await dbInstance.exec(`CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id)`);
    await dbInstance.exec(`CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id)`);

    // --- SEED PERMISSIONS (Enterprise) ---
    const enterprisePermissions = [
        { resource: 'roles', action: 'view', desc: 'View administrative roles', cat: 'access-control' },
        { resource: 'roles', action: 'create', desc: 'Create new roles', cat: 'access-control' },
        { resource: 'roles', action: 'update', desc: 'Update role rules', cat: 'access-control' },
        { resource: 'roles', action: 'delete', desc: 'Deprecate roles', cat: 'access-control' },
        { resource: 'users', action: 'view_roles', desc: 'View user role assignments', cat: 'user-mgmt' },
        { resource: 'users', action: 'assign_roles', desc: 'Assign roles to users', cat: 'user-mgmt' },
        { resource: 'users', action: 'bulk_assign', desc: 'Bulk assign roles to teams', cat: 'user-mgmt' },
        { resource: 'audit', action: 'view', desc: 'View security audit logs', cat: 'monitoring' },
        { resource: 'system', action: 'settings', desc: 'Manage platform settings', cat: 'system' },
        { resource: 'links', action: 'create', desc: 'Create payment links', cat: 'payments' },
        { resource: 'links', action: 'view', desc: 'View payment links', cat: 'payments' },
        { resource: 'transactions', action: 'view', desc: 'View transactions', cat: 'payments' },
        { resource: 'payouts', action: 'request', desc: 'Request payouts', cat: 'payments' }
    ];

    for (const p of enterprisePermissions) {
        await dbInstance.run(
            `INSERT OR IGNORE INTO permissions (resource, action, description, category) VALUES (?, ?, ?, ?)`,
            [p.resource, p.action, p.desc, p.cat]
        );
    }

    console.log('RBAC Enterprise permissions seeded.');

    // Final check for system roles (Super Admin, Seller)
    const systemRoles = [
        { name: 'Super Admin', desc: 'Full system access' },
        { name: 'Seller', desc: 'Standard seller access' }
    ];

    for (const sr of systemRoles) {
        let role = await dbInstance.get(`SELECT id FROM roles WHERE name = ?`, [sr.name]);
        let roleId;
        if (!role) {
            const res = await dbInstance.run(
                `INSERT INTO roles (name, description, is_system, tenant_id) VALUES (?, ?, ?, ?)`,
                [sr.name, sr.desc, 1, 'global']
            );
            roleId = res.lastID;
        } else {
            roleId = role.id;
        }
            
        // If Super Admin, link all perms
        if (sr.name === 'Super Admin') {
            const allPerms = await dbInstance.all(`SELECT id FROM permissions`);
            for (const p of allPerms) {
                await dbInstance.run(
                    `INSERT OR REPLACE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`,
                    [roleId, p.id]
                );
            }
        } else if (sr.name === 'Seller') {
            // Link baseline seller perms
            const sellerPerms = await dbInstance.all(
                `SELECT id FROM permissions WHERE resource IN ('links', 'transactions', 'payouts', 'analytics', 'notifications', 'payment_link')`
            );
            for (const p of sellerPerms) {
                await dbInstance.run(
                    `INSERT OR REPLACE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`,
                    [roleId, p.id]
                );
            }
        }
    }

    console.log('SQLite Connected & All tables checked (including RBAC Enterprise).');

    console.log("SQLite Connected & All tables checked.");
    return dbInstance;
  } catch (error) {
    console.error(`Error connecting to SQLite: ${error.message}`);
    process.exit(1);
  }
};

export const getDb = () => dbInstance;

export default connectDB;
