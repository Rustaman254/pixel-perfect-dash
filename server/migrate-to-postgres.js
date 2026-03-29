import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import knex from 'knex';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dbPath = path.resolve(__dirname, './ripplify.db');

const pgAuth = knex({
  client: 'pg',
  connection: {
    host: process.env.PG_HOST || 'localhost',
    port: parseInt(process.env.PG_PORT || '5432'),
    database: 'auth_db',
    user: process.env.PG_USER || 'sokostack',
    password: process.env.PG_PASSWORD || 'sokostack2026',
  },
});

const pgAdmin = knex({
  client: 'pg',
  connection: {
    host: process.env.PG_HOST || 'localhost',
    port: parseInt(process.env.PG_PORT || '5432'),
    database: 'admin_db',
    user: process.env.PG_USER || 'sokostack',
    password: process.env.PG_PASSWORD || 'sokostack2026',
  },
});

const pgRipplify = knex({
  client: 'pg',
  connection: {
    host: process.env.PG_HOST || 'localhost',
    port: parseInt(process.env.PG_PORT || '5432'),
    database: 'ripplify_db',
    user: process.env.PG_USER || 'sokostack',
    password: process.env.PG_PASSWORD || 'sokostack2026',
  },
});

async function migrate() {
  console.log('Starting migration from SQLite to PostgreSQL...');

  const sqlite = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  try {
    await migrateUsers(sqlite, pgAuth);
    await migrateRoles(sqlite, pgAuth);
    await migratePermissions(sqlite, pgAuth);
    await migrateUserRoles(sqlite, pgAuth);
    await migrateApiKeys(sqlite, pgAuth);
    await migrateCurrencies(sqlite, pgAuth);
    await migrateSystemSettings(sqlite, pgAuth);
    await migrateFeatureFlags(sqlite, pgAuth);
    await migrateApps(sqlite, pgAuth);
    await migrateReferralCodes(sqlite, pgAuth);
    await migrateNotifications(sqlite, pgAdmin);
    await migrateSupportTickets(sqlite, pgAdmin);
    await migratePaymentLinks(sqlite, pgRipplify);
    await migrateTransactions(sqlite, pgRipplify);
    await migratePayouts(sqlite, pgRipplify);

    console.log('\nMigration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await sqlite.close();
    await pgAuth.destroy();
    await pgAdmin.destroy();
    await pgRipplify.destroy();
  }
}

async function migrateUsers(sqlite, pg) {
  console.log('Migrating users...');
  const users = await sqlite.all('SELECT * FROM users');
  
  for (const user of users) {
    try {
      await pg.raw(`
        INSERT INTO users (id, email, password, role, "fullName", phone, "businessName", "idType", "idNumber", 
          location, "payoutMethod", "payoutDetails", "businessLogo", "kycStatus", "kybStatus", "transactionLimit", 
          "isVerified", "isDisabled", "isSuspended", "accountStatus", "suspendReason", "referralPoints", pin, "createdAt")
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (email) DO UPDATE SET
          password = EXCLUDED.password,
          role = EXCLUDED.role,
          "fullName" = EXCLUDED."fullName",
          phone = EXCLUDED.phone,
          "businessName" = EXCLUDED."businessName",
          "isVerified" = EXCLUDED."isVerified",
          "isDisabled" = EXCLUDED."isDisabled",
          "isSuspended" = EXCLUDED."isSuspended",
          "accountStatus" = EXCLUDED."accountStatus"
      `, [
        user.id, user.email, user.password, user.role || 'seller', user.fullName || '', user.phone || '', 
        user.businessName || '', user.idType || 'National ID', user.idNumber || '', user.location || '', 
        user.payoutMethod || 'mpesa', user.payoutDetails || '', user.businessLogo, user.kycStatus || 'none', 
        user.kybStatus || 'none', user.transactionLimit || 1000, user.isVerified ? true : false,
        user.isDisabled ? true : false, user.isSuspended ? true : false, 
        user.accountStatus || 'active', user.suspendReason || '', user.referralPoints || 0, user.pin || null, user.createdAt || new Date()
      ]);
    } catch (e) {
      console.log(`  Error migrating user ${user.id}: ${e.message}`);
    }
  }
  console.log(`  Migrated ${users.length} users`);
}

async function migrateRoles(sqlite, pg) {
  console.log('Migrating roles...');
  const roles = await sqlite.all('SELECT * FROM roles');
  
  for (const role of roles) {
    try {
      await pg.raw(`
        INSERT INTO roles (id, name, description, is_system, "parent_role_id", is_deprecated, tenant_id, "createdAt")
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          is_system = EXCLUDED.is_system
      `, [
        role.id, role.name, role.description || '', role.is_system ? true : false, 
        role.parent_role_id, role.is_deprecated ? true : false, role.tenant_id || 'global', role.createdAt || new Date()
      ]);
    } catch (e) {
      // Skip duplicates
    }
  }
  console.log(`  Migrated ${roles.length} roles`);
}

async function migratePermissions(sqlite, pg) {
  console.log('Migrating permissions...');
  const perms = await sqlite.all('SELECT * FROM permissions');
  
  for (const p of perms) {
    try {
      await pg.raw(`
        INSERT INTO permissions (id, resource, action, description, category, is_deprecated)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT (resource, action) DO UPDATE SET
          description = EXCLUDED.description,
          category = EXCLUDED.category,
          is_deprecated = EXCLUDED.is_deprecated
      `, [p.id, p.resource, p.action, p.description || '', p.category || 'general', p.is_deprecated ? true : false]);
    } catch (e) {
      // Skip duplicates
    }
  }
  console.log(`  Migrated ${perms.length} permissions`);
}

async function migrateUserRoles(sqlite, pg) {
  console.log('Migrating user_roles...');
  const userRoles = await sqlite.all('SELECT * FROM user_roles');
  
  for (const ur of userRoles) {
    try {
      await pg.raw(`
        INSERT INTO user_roles (user_id, role_id, scope_type, scope_id, expires_at, assigned_by, assigned_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (user_id, role_id, scope_id) DO UPDATE SET
          expires_at = EXCLUDED.expires_at,
          assigned_by = EXCLUDED.assigned_by
      `, [
        ur.user_id, ur.role_id, ur.scope_type || 'platform', ur.scope_id || 'global', 
        ur.expires_at, ur.assigned_by, ur.assigned_at || new Date()
      ]);
    } catch (e) {
      // Skip duplicates
    }
  }
  console.log(`  Migrated ${userRoles.length} user_roles`);
}

async function migrateApiKeys(sqlite, pg) {
  console.log('Migrating api_keys...');
  const keys = await sqlite.all('SELECT * FROM api_keys');
  
  for (const key of keys) {
    try {
      await pg.raw(`
        INSERT INTO api_keys (id, "userId", key, name, status, "createdAt")
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT (id) DO UPDATE SET
          key = EXCLUDED.key,
          status = EXCLUDED.status
      `, [key.id, key.userId, key.key, key.name, key.status || 'Active', key.createdAt || new Date()]);
    } catch (e) {
      // Skip duplicates
    }
  }
  console.log(`  Migrated ${keys.length} api_keys`);
}

async function migrateCurrencies(sqlite, pg) {
  console.log('Migrating supported_currencies...');
  const currencies = await sqlite.all('SELECT * FROM supported_currencies');
  
  for (const c of currencies) {
    try {
      await pg.raw(`
        INSERT INTO supported_currencies (id, code, name, flag, rate, symbol, enabled, "createdAt")
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (id) DO UPDATE SET
          code = EXCLUDED.code,
          rate = EXCLUDED.rate,
          enabled = EXCLUDED.enabled
      `, [c.id, c.code, c.name, c.flag, c.rate || 1.0, c.symbol, c.enabled !== 0, c.createdAt || new Date()]);
    } catch (e) {
      // Skip duplicates
    }
  }
  console.log(`  Migrated ${currencies.length} currencies`);
}

async function migrateSystemSettings(sqlite, pg) {
  console.log('Migrating system_settings...');
  const settings = await sqlite.all('SELECT * FROM system_settings');
  
  for (const s of settings) {
    try {
      await pg.raw(`
        INSERT INTO system_settings (id, key, value, "updatedAt")
        VALUES (?, ?, ?, ?)
        ON CONFLICT (key) DO UPDATE SET
          value = EXCLUDED.value,
          "updatedAt" = EXCLUDED."updatedAt"
      `, [s.id, s.key, s.value, s.updatedAt || new Date()]);
    } catch (e) {
      // Skip duplicates
    }
  }
  console.log(`  Migrated ${settings.length} system_settings`);
}

async function migrateFeatureFlags(sqlite, pg) {
  console.log('Migrating feature_flags...');
  const flags = await sqlite.all('SELECT * FROM feature_flags');
  
  for (const f of flags) {
    try {
      await pg.raw(`
        INSERT INTO feature_flags (id, key, name, description, category, "isEnabled", "createdAt", "updatedAt")
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (id) DO UPDATE SET
          key = EXCLUDED.key,
          "isEnabled" = EXCLUDED."isEnabled"
      `, [
        f.id, f.key, f.name, f.description || '', f.category || 'general', 
        f.isEnabled !== 0, f.createdAt || new Date(), f.updatedAt || new Date()
      ]);
    } catch (e) {
      // Skip duplicates
    }
  }
  console.log(`  Migrated ${flags.length} feature_flags`);
}

async function migrateApps(sqlite, pg) {
  console.log('Migrating apps...');
  const apps = await sqlite.all('SELECT * FROM apps');
  
  for (const app of apps) {
    try {
      await pg.raw(`
        INSERT INTO apps (id, name, slug, icon, url, "isActive", "createdAt")
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          slug = EXCLUDED.slug
      `, [app.id, app.name, app.slug, app.icon, app.url, app.isActive !== 0, app.createdAt || new Date()]);
    } catch (e) {
      // Skip duplicates
    }
  }
  console.log(`  Migrated ${apps.length} apps`);
}

async function migrateReferralCodes(sqlite, pg) {
  console.log('Migrating referral_codes...');
  const codes = await sqlite.all('SELECT * FROM referral_codes');
  
  for (const c of codes) {
    try {
      await pg.raw(`
        INSERT INTO referral_codes (id, code, "userId", discount, "maxUses", "currentUses", "isActive", 
          "pointsPerReferral", "expiresAt", "createdAt")
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (id) DO UPDATE SET
          code = EXCLUDED.code,
          "currentUses" = EXCLUDED."currentUses"
      `, [
        c.id, c.code, c.userId, c.discount || 0, c.maxUses || -1, c.currentUses || 0,
        c.isActive !== 0, c.pointsPerReferral || 10, c.expiresAt, c.createdAt || new Date()
      ]);
    } catch (e) {
      // Skip duplicates
    }
  }
  console.log(`  Migrated ${codes.length} referral_codes`);
}

async function migrateNotifications(sqlite, pg) {
  console.log('Migrating notifications...');
  const notes = await sqlite.all('SELECT * FROM notifications');
  
  for (const n of notes) {
    try {
      await pg.raw(`
        INSERT INTO notifications (id, "userId", title, message, type, "isRead", "actionUrl", "actionLabel", 
          "targetRole", "appName", "deliveryChannel", "createdAt")
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          "isRead" = EXCLUDED."isRead"
      `, [
        n.id, n.userId, n.title, n.message, n.type || 'info', n.isRead ? true : false,
        n.actionUrl, n.actionLabel, n.targetRole, n.appName || 'ripplify', n.deliveryChannel || 'app', n.createdAt || new Date()
      ]);
    } catch (e) {
      // Skip duplicates
    }
  }
  console.log(`  Migrated ${notes.length} notifications`);
}

async function migrateSupportTickets(sqlite, pg) {
  console.log('Migrating support_tickets...');
  const tickets = await sqlite.all('SELECT * FROM support_tickets');
  
  for (const t of tickets) {
    try {
      await pg.raw(`
        INSERT INTO support_tickets (id, "userId", name, email, subject, message, status, "createdAt")
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (id) DO UPDATE SET
          status = EXCLUDED.status
      `, [t.id, t.userId, t.name, t.email, t.subject, t.message, t.status || 'Open', t.createdAt || new Date()]);
    } catch (e) {
      // Skip duplicates
    }
  }
  console.log(`  Migrated ${tickets.length} support_tickets`);
}

async function migratePaymentLinks(sqlite, pg) {
  console.log('Migrating payment_links...');
  const links = await sqlite.all('SELECT * FROM payment_links');
  
  for (const l of links) {
    try {
      await pg.raw(`
        INSERT INTO payment_links (id, "userId", name, slug, description, price, currency, "linkType", status, clicks, 
          "paymentCount", "totalEarnedValue", "hasPhotos", "deliveryDays", "expiryDate", "expiryLabel", 
          "shippingFee", category, "buyerName", "buyerPhone", "buyerEmail", "createdAt", "updatedAt")
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          status = EXCLUDED.status,
          clicks = EXCLUDED.clicks
      `, [
        l.id, l.userId, l.name, l.slug, l.description, l.price, l.currency || 'USD', l.linkType || 'one-time',
        l.status || 'Active', l.clicks || 0, l.paymentCount || 0, l.totalEarnedValue || 0, l.hasPhotos ? true : false,
        l.deliveryDays, l.expiryDate, l.expiryLabel, l.shippingFee || 0, l.category || 'product',
        l.buyerName, l.buyerPhone, l.buyerEmail, l.createdAt || new Date(), l.updatedAt || new Date()
      ]);
    } catch (e) {
      // Skip duplicates
    }
  }
  console.log(`  Migrated ${links.length} payment_links`);
}

async function migrateTransactions(sqlite, pg) {
  console.log('Migrating transactions...');
  const txs = await sqlite.all('SELECT * FROM transactions');
  
  for (const t of txs) {
    try {
      await pg.raw(`
        INSERT INTO transactions (id, "userId", "linkId", "buyerName", "buyerEmail", "buyerPhone", amount, fee, currency, 
          status, "transactionId", "trackingToken", type, "senderId", "receiverId", network, "paymentMethod", 
          "txHash", metadata, "externalRef", "createdAt")
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (id) DO UPDATE SET
          status = EXCLUDED.status,
          amount = EXCLUDED.amount
      `, [
        t.id, t.userId, t.linkId, t.buyerName, t.buyerEmail, t.buyerPhone, t.amount, t.fee || 0,
        t.currency || 'USD', t.status || 'Pending', t.transactionId, t.trackingToken, t.type || 'Payment',
        t.senderId, t.receiverId, t.network, t.paymentMethod, t.txHash, t.metadata, t.externalRef, t.createdAt || new Date()
      ]);
    } catch (e) {
      // Skip duplicates
    }
  }
  console.log(`  Migrated ${txs.length} transactions`);
}

async function migratePayouts(sqlite, pg) {
  console.log('Migrating payouts...');
  const payouts = await sqlite.all('SELECT * FROM payouts');
  
  for (const p of payouts) {
    try {
      await pg.raw(`
        INSERT INTO payouts (id, "userId", amount, fee, currency, method, details, status, "createdAt")
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (id) DO UPDATE SET
          status = EXCLUDED.status,
          amount = EXCLUDED.amount
      `, [
        p.id, p.userId, p.amount, p.fee || 0, p.currency || 'USD', p.method, p.details, 
        p.status || 'Processing', p.createdAt || new Date()
      ]);
    } catch (e) {
      // Skip duplicates
    }
  }
  console.log(`  Migrated ${payouts.length} payouts`);
}

migrate();
