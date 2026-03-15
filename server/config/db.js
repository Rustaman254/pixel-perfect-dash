import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

let dbInstance = null;

const connectDB = async () => {
  try {
    dbInstance = await open({
      filename: './ripplify.db',
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
        isVerified BOOLEAN DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create OTP Table
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS otps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT NOT NULL,
        otp TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
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

    // Create System Settings Table
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
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
        currency TEXT NOT NULL,
        method TEXT NOT NULL,
        details TEXT NOT NULL,
        status TEXT DEFAULT 'Processing',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users (id)
      )
    `);

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

    // Seed Default Apps
    const hasApps = await dbInstance.get("SELECT COUNT(*) as count FROM apps");
    if (hasApps.count === 0) {
      await dbInstance.run(`
        INSERT INTO apps (name, slug, icon, url, isActive) 
        VALUES ('Ripplify', 'ripplify', 'Wallet', 'http://localhost:8080', 1),
               ('Insights', 'insights', 'BarChart', 'http://localhost:5175', 1)
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
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users (id)
      )
    `);

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

    console.log("SQLite Connected & All tables checked.");
    return dbInstance;
  } catch (error) {
    console.error(`Error connecting to SQLite: ${error.message}`);
    process.exit(1);
  }
};

export const getDb = () => dbInstance;

export default connectDB;
