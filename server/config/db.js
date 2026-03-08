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
        buyerName TEXT,
        buyerPhone TEXT,
        buyerEmail TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users (id)
      )
    `);

    // Migration: add updatedAt to payment_links if missing
    // NOTE: SQLite ALTER TABLE does not support DEFAULT CURRENT_TIMESTAMP (non-constant)
    // so we use no default — the column will be NULL for old rows
    try {
      await dbInstance.exec(`ALTER TABLE payment_links ADD COLUMN updatedAt DATETIME`);
    } catch (e) {
      // Column already exists — ignore
    }

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

    console.log("SQLite Connected & All tables checked.");
    return dbInstance;
  } catch (error) {
    console.error(`Error connecting to SQLite: ${error.message}`);
    process.exit(1);
  }
};

export const getDb = () => dbInstance;

export default connectDB;
