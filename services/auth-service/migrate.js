import { createConnection } from '../shared/db.js';

const db = createConnection('auth_db');

async function createIfNotExists(tableName, callback) {
  const exists = await db.schema.hasTable(tableName);
  if (!exists) {
    await db.schema.createTable(tableName, callback);
    console.log(`  Created table: ${tableName}`);
  }
}

export async function migrate() {
  console.log('Running auth_db migrations...');

  await createIfNotExists('users', (t) => {
    t.increments('id').primary();
    t.string('email').unique().notNullable();
    t.string('password').notNullable();
    t.string('role').defaultTo('seller');
    t.string('fullName').defaultTo('');
    t.string('phone').defaultTo('');
    t.string('businessName').defaultTo('');
    t.string('idType').defaultTo('National ID');
    t.string('idNumber').defaultTo('');
    t.string('location').defaultTo('');
    t.string('payoutMethod').defaultTo('mpesa');
    t.text('payoutDetails').defaultTo('');
    t.text('businessLogo');
    t.string('kycStatus').defaultTo('none');
    t.string('kybStatus').defaultTo('none');
    t.decimal('transactionLimit', 12, 2).defaultTo(1000);
    t.boolean('isVerified').defaultTo(false);
    t.boolean('isDisabled').defaultTo(false);
    t.boolean('isSuspended').defaultTo(false);
    t.string('accountStatus').defaultTo('active');
    t.text('suspendReason').defaultTo('');
    t.integer('referralPoints').defaultTo(0);
    t.string('pin');
    t.timestamp('createdAt').defaultTo(db.fn.now());
  });

  await createIfNotExists('otps', (t) => {
    t.increments('id').primary();
    t.string('phone');
    t.string('email');
    t.string('otp').notNullable();
    t.timestamp('createdAt').defaultTo(db.fn.now());
  });

  await createIfNotExists('password_reset_tokens', (t) => {
    t.increments('id').primary();
    t.integer('userId').unsigned().notNullable();
    t.string('token').unique().notNullable();
    t.timestamp('expiresAt').notNullable();
    t.boolean('used').defaultTo(false);
    t.timestamp('createdAt').defaultTo(db.fn.now());
  });

  await createIfNotExists('oauth_clients', (t) => {
    t.increments('id').primary();
    t.integer('userId').unsigned().notNullable();
    t.string('clientId').unique().notNullable();
    t.string('clientSecret').notNullable();
    t.string('name').notNullable();
    t.string('redirectUri').notNullable();
    t.timestamp('createdAt').defaultTo(db.fn.now());
  });

  await createIfNotExists('oauth_auth_codes', (t) => {
    t.increments('id').primary();
    t.string('code').unique().notNullable();
    t.integer('userId').unsigned().notNullable();
    t.string('clientId').notNullable();
    t.string('redirectUri').notNullable();
    t.timestamp('expiresAt').notNullable();
    t.timestamp('createdAt').defaultTo(db.fn.now());
  });

  await createIfNotExists('oauth_access_tokens', (t) => {
    t.increments('id').primary();
    t.string('token').unique().notNullable();
    t.integer('userId').unsigned().notNullable();
    t.string('clientId').notNullable();
    t.timestamp('expiresAt').notNullable();
    t.timestamp('createdAt').defaultTo(db.fn.now());
  });

  await createIfNotExists('api_keys', (t) => {
    t.increments('id').primary();
    t.integer('userId').unsigned().notNullable();
    t.string('key').unique().notNullable();
    t.string('name');
    t.string('status').defaultTo('Active');
    t.timestamp('createdAt').defaultTo(db.fn.now());
  });

  await createIfNotExists('supported_currencies', (t) => {
    t.increments('id').primary();
    t.string('code').unique().notNullable();
    t.string('name').notNullable();
    t.string('flag');
    t.decimal('rate', 12, 4).defaultTo(1.0);
    t.string('symbol').notNullable();
    t.boolean('enabled').defaultTo(true);
    t.timestamp('createdAt').defaultTo(db.fn.now());
  });

  await createIfNotExists('system_settings', (t) => {
    t.increments('id').primary();
    t.string('key').unique().notNullable();
    t.text('value').notNullable();
    t.timestamp('updatedAt').defaultTo(db.fn.now());
  });

  await createIfNotExists('feature_flags', (t) => {
    t.increments('id').primary();
    t.string('key').unique().notNullable();
    t.string('name').notNullable();
    t.text('description').defaultTo('');
    t.string('category').defaultTo('general');
    t.boolean('isEnabled').defaultTo(true);
    t.timestamp('createdAt').defaultTo(db.fn.now());
    t.timestamp('updatedAt').defaultTo(db.fn.now());
  });

  await createIfNotExists('user_feature_overrides', (t) => {
    t.increments('id').primary();
    t.integer('userId').unsigned().notNullable();
    t.string('featureKey').notNullable();
    t.boolean('isEnabled').defaultTo(true);
    t.text('reason').defaultTo('');
    t.timestamp('createdAt').defaultTo(db.fn.now());
    t.timestamp('updatedAt').defaultTo(db.fn.now());
    t.unique(['userId', 'featureKey']);
  });

  await createIfNotExists('apps', (t) => {
    t.increments('id').primary();
    t.string('name').unique().notNullable();
    t.string('slug').unique().notNullable();
    t.string('icon');
    t.string('url');
    t.boolean('isActive').defaultTo(true);
    t.timestamp('createdAt').defaultTo(db.fn.now());
  });

  await createIfNotExists('referral_codes', (t) => {
    t.increments('id').primary();
    t.string('code').unique().notNullable();
    t.integer('userId').unsigned();
    t.decimal('discount', 12, 2).defaultTo(0);
    t.integer('maxUses').defaultTo(-1);
    t.integer('currentUses').defaultTo(0);
    t.boolean('isActive').defaultTo(true);
    t.integer('pointsPerReferral').defaultTo(10);
    t.timestamp('expiresAt');
    t.timestamp('createdAt').defaultTo(db.fn.now());
  });

  await createIfNotExists('referral_usage', (t) => {
    t.increments('id').primary();
    t.integer('referralCodeId').unsigned().notNullable();
    t.string('code').notNullable();
    t.integer('referrerId').unsigned();
    t.integer('referredUserId').unsigned().notNullable();
    t.integer('pointsAwarded').defaultTo(0);
    t.timestamp('createdAt').defaultTo(db.fn.now());
  });

  await createIfNotExists('user_currencies', (t) => {
    t.increments('id').primary();
    t.integer('userId').unsigned().notNullable();
    t.string('code').notNullable();
    t.boolean('enabled').defaultTo(true);
    t.unique(['userId', 'code']);
  });

  await createIfNotExists('roles', (t) => {
    t.increments('id').primary();
    t.string('name').unique().notNullable();
    t.text('description').defaultTo('');
    t.boolean('is_system').defaultTo(false);
    t.integer('parent_role_id').unsigned();
    t.boolean('is_deprecated').defaultTo(false);
    t.string('tenant_id').defaultTo('global');
    t.timestamp('createdAt').defaultTo(db.fn.now());
  });

  await createIfNotExists('permissions', (t) => {
    t.increments('id').primary();
    t.string('resource').notNullable();
    t.string('action').notNullable();
    t.text('description').defaultTo('');
    t.string('category').defaultTo('general');
    t.boolean('is_deprecated').defaultTo(false);
    t.unique(['resource', 'action']);
  });

  await createIfNotExists('user_roles', (t) => {
    t.integer('user_id').unsigned().notNullable();
    t.integer('role_id').unsigned().notNullable();
    t.string('scope_type').defaultTo('platform');
    t.string('scope_id').defaultTo('global');
    t.timestamp('expires_at');
    t.integer('assigned_by').unsigned();
    t.timestamp('assigned_at').defaultTo(db.fn.now());
    t.primary(['user_id', 'role_id', 'scope_id']);
  });

  await createIfNotExists('role_permissions', (t) => {
    t.integer('role_id').unsigned().notNullable();
    t.integer('permission_id').unsigned().notNullable();
    t.primary(['role_id', 'permission_id']);
  });

  await createIfNotExists('audit_logs', (t) => {
    t.increments('id').primary();
    t.integer('user_id').unsigned().notNullable();
    t.string('action').notNullable();
    t.string('entity_type').notNullable();
    t.string('entity_id').notNullable();
    t.text('changes');
    t.string('ip_address');
    t.timestamp('created_at').defaultTo(db.fn.now());
  });

  await createIfNotExists('admin_audit_logs', (t) => {
    t.increments('id').primary();
    t.integer('actor_id').unsigned().notNullable();
    t.integer('target_id').unsigned();
    t.string('target_type').notNullable();
    t.string('action').notNullable();
    t.text('changes');
    t.string('ip_address');
    t.string('user_agent');
    t.string('tenant_id').defaultTo('global');
    t.timestamp('created_at').defaultTo(db.fn.now());
  });

  // Stores / Businesses table
  await createIfNotExists('stores', (t) => {
    t.increments('id').primary();
    t.integer('userId').unsigned().notNullable();
    t.string('name').notNullable();
    t.string('slug').unique().notNullable();
    t.text('description').defaultTo('');
    t.string('logo').defaultTo('');
    t.string('location').defaultTo('');
    t.string('phone').defaultTo('');
    t.string('email').defaultTo('');
    t.string('category').defaultTo('general');
    t.string('kycStatus').defaultTo('none');
    t.string('kybStatus').defaultTo('none');
    t.boolean('isActive').defaultTo(true);
    t.timestamp('createdAt').defaultTo(db.fn.now());
    t.timestamp('updatedAt').defaultTo(db.fn.now());
  });

  // Migrate stores table columns if table already existed
  try { await db.schema.raw('ALTER TABLE stores ADD COLUMN IF NOT EXISTS "kycStatus" TEXT DEFAULT \'none\''); } catch (e) {}
  try { await db.schema.raw('ALTER TABLE stores ADD COLUMN IF NOT EXISTS "kybStatus" TEXT DEFAULT \'none\''); } catch (e) {}
  try { await db.schema.raw('ALTER TABLE stores ADD COLUMN IF NOT EXISTS "phone" TEXT DEFAULT \'\''); } catch (e) {}
  try { await db.schema.raw('ALTER TABLE stores ADD COLUMN IF NOT EXISTS "location" TEXT DEFAULT \'\''); } catch (e) {}
  try { await db.schema.raw('ALTER TABLE stores ADD COLUMN IF NOT EXISTS "description" TEXT DEFAULT \'\''); } catch (e) {}
  try { await db.schema.raw('ALTER TABLE stores ADD COLUMN IF NOT EXISTS "logo" TEXT DEFAULT \'\''); } catch (e) {}
  try { await db.schema.raw('ALTER TABLE stores ADD COLUMN IF NOT EXISTS "email" TEXT DEFAULT \'\''); } catch (e) {}
  try { await db.schema.raw('ALTER TABLE stores ADD COLUMN IF NOT EXISTS "category" TEXT DEFAULT \'general\''); } catch (e) {}

  // Sync KYC/KYB from users to stores
  await db.schema.raw(`
    UPDATE stores SET "kycStatus" = (SELECT "kycStatus" FROM users WHERE users.id = stores."userId")
    WHERE EXISTS (SELECT 1 FROM users WHERE users.id = stores."userId")
  `);
  await db.schema.raw(`
    UPDATE stores SET "kybStatus" = (SELECT "kybStatus" FROM users WHERE users.id = stores."userId")
    WHERE EXISTS (SELECT 1 FROM users WHERE users.id = stores."userId")
  `);

  // Indexes
  await db.schema.raw('CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id)');
  await db.schema.raw('CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id)');

  // Seed data
  await seedData(db);

  console.log('auth_db migrations complete.');
}

async function seedData(db) {
  // Seed currencies
  const currencyCount = await db('supported_currencies').count('id as count').first();
  if (parseInt(currencyCount.count) === 0) {
    const currencies = [
      { code: 'USD', name: 'US Dollar', flag: '🇺🇸', rate: 1.00, symbol: '$' },
      { code: 'EUR', name: 'Euro', flag: '🇪🇺', rate: 0.92, symbol: '€' },
      { code: 'GBP', name: 'British Pound', flag: '🇬🇧', rate: 0.79, symbol: '£' },
      { code: 'KES', name: 'Kenyan Shilling', flag: '🇰🇪', rate: 129.00, symbol: 'KSh' },
      { code: 'NGN', name: 'Nigerian Naira', flag: '🇳🇬', rate: 1550.00, symbol: '₦' },
      { code: 'ZAR', name: 'South African Rand', flag: '🇿🇦', rate: 18.45, symbol: 'R' },
      { code: 'BRL', name: 'Brazilian Real', flag: '🇧🇷', rate: 5.10, symbol: 'R$' },
      { code: 'JPY', name: 'Japanese Yen', flag: '🇯🇵', rate: 149.50, symbol: '¥' },
      { code: 'INR', name: 'Indian Rupee', flag: '🇮🇳', rate: 83.20, symbol: '₹' },
      { code: 'AED', name: 'UAE Dirham', flag: '🇦🇪', rate: 3.67, symbol: 'د.إ' },
      { code: 'GHS', name: 'Ghanaian Cedi', flag: '🇬🇭', rate: 14.80, symbol: '₵' },
      { code: 'TZS', name: 'Tanzanian Shilling', flag: '🇹🇿', rate: 2510.00, symbol: 'TSh' },
    ];
    await db('supported_currencies').insert(currencies);
    console.log('Currencies seeded.');
  }

  // Seed apps
  const appCount = await db('apps').count('id as count').first();
  if (parseInt(appCount.count) === 0) {
    await db('apps').insert([
      { name: 'Ripplify', slug: 'ripplify', icon: 'Wallet', url: 'https://ripplify.sokostack.xyz', isActive: true },
      { name: 'Shopalize', slug: 'shopalize', icon: 'ShoppingBag', url: 'https://shopalize.sokostack.xyz', isActive: true },
      { name: 'Watchtower', slug: 'watchtower', icon: 'BarChart', url: 'https://watchtower.sokostack.xyz', isActive: true },
      { name: 'Admin', slug: 'admin', icon: 'Shield', url: 'https://admin.sokostack.xyz', isActive: true },
      { name: 'Forms', slug: 'forms', icon: 'FileText', url: 'https://forms.sokostack.xyz', isActive: true },
    ]);
    console.log('Apps seeded.');
  }

  // Seed feature flags
  const featureCount = await db('feature_flags').count('id as count').first();
  if (parseInt(featureCount.count) === 0) {
    const features = [
      { key: 'unified_agent', name: 'Unified AI Agent', description: 'Enable unified AI agent across all services', category: 'ai' },
      { key: 'unified_agent_ripplify', name: 'Ripplify Unified Agent', description: 'Enable unified AI agent for Ripplify', category: 'ai' },
      { key: 'payment_links', name: 'Payment Links', description: 'Create and manage payment links', category: 'payments' },
      { key: 'transactions', name: 'Transactions', description: 'View and manage transactions', category: 'payments' },
      { key: 'payouts', name: 'Payouts', description: 'Request and receive payouts', category: 'payments' },
      { key: 'wallets', name: 'Wallets', description: 'Manage currency wallets', category: 'payments' },
      { key: 'api_keys', name: 'API Keys', description: 'Generate and manage API keys', category: 'developer' },
      { key: 'oauth', name: 'OAuth', description: 'OAuth client management', category: 'developer' },
      { key: 'analytics', name: 'Analytics', description: 'View analytics and statistics', category: 'insights' },
      { key: 'customers', name: 'Customers', description: 'View customer list', category: 'insights' },
      { key: 'orders', name: 'Orders', description: 'Manage orders', category: 'payments' },
      { key: 'payment_methods', name: 'Payment Methods', description: 'Configure payment methods', category: 'payments' },
      { key: 'currencies', name: 'Currencies', description: 'Manage currency preferences', category: 'payments' },
      { key: 'notifications', name: 'Notifications', description: 'Manage notifications', category: 'system' },
      { key: 'support', name: 'Support', description: 'Support tickets', category: 'system' },
      { key: 'referrals', name: 'Referrals', description: 'Referral codes', category: 'payments' },
      { key: 'transfers', name: 'Transfers', description: 'Send money', category: 'payments' },
      { key: 'developer_docs', name: 'Developer Docs', description: 'API documentation', category: 'developer' },
      { key: 'transaction_pin', name: 'Transaction PIN', description: 'Transaction PIN security', category: 'security' },
      { key: 'referral_expiry', name: 'Referral Code Expiry', description: 'Referral code expiration', category: 'payments' },
      { key: 'forgot_password', name: 'Forgot Password', description: 'Password reset', category: 'auth' },
      { key: 'password_reveal', name: 'Password Reveal', description: 'Toggle password visibility', category: 'auth' },
    ];
    await db('feature_flags').insert(features);
    console.log('Feature flags seeded.');
  }

  // Seed stores from existing user business data
  const storeCount = await db('stores').count('id as count').first();
  if (parseInt(storeCount.count) === 0) {
    const users = await db('users').select('id', 'fullName', 'businessName', 'kycStatus', 'kybStatus', 'phone', 'location');
    const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const seenSlugs = new Set();
    const storesToInsert = [];

    for (const user of users) {
      const name = user.businessName || user.fullName;
      if (!name) continue;
      let slug = slugify(name);
      if (seenSlugs.has(slug)) slug = `${slug}-${user.id}`;
      seenSlugs.add(slug);
      storesToInsert.push({
        userId: user.id,
        name,
        slug,
        phone: user.phone || '',
        location: user.location || '',
        kycStatus: user.kycStatus || 'none',
        kybStatus: user.kybStatus || 'none',
      });
    }

    if (storesToInsert.length > 0) {
      await db('stores').insert(storesToInsert);
      console.log(`Seeded ${storesToInsert.length} stores from user data.`);
    }
  }

  // Seed system settings
  const platformFee = await db('system_settings').where({ key: 'platform_fee' }).first();
  if (!platformFee) {
    await db('system_settings').insert([
      { key: 'platform_fee', value: '2.5' },
      { key: 'withdrawal_fee', value: '50' },
    ]);
  }

  // Seed RBAC roles
  const roles = ['Super Admin', 'Seller', 'Admin'];
  for (const roleName of roles) {
    const exists = await db('roles').where({ name: roleName }).first();
    if (!exists) {
      const isSystem = roleName !== 'Admin';
      await db('roles').insert({
        name: roleName,
        description: roleName === 'Super Admin' ? 'Full system access' : roleName === 'Seller' ? 'Standard seller access' : 'Admin access',
        is_system: isSystem,
        tenant_id: 'global',
      });
    }
  }

  // Seed permissions
  const permCount = await db('permissions').count('id as count').first();
  if (parseInt(permCount.count) === 0) {
    const perms = [
      { resource: 'roles', action: 'view', description: 'View roles', category: 'access-control' },
      { resource: 'roles', action: 'create', description: 'Create roles', category: 'access-control' },
      { resource: 'roles', action: 'update', description: 'Update roles', category: 'access-control' },
      { resource: 'roles', action: 'delete', description: 'Delete roles', category: 'access-control' },
      { resource: 'users', action: 'view_roles', description: 'View user roles', category: 'user-mgmt' },
      { resource: 'users', action: 'assign_roles', description: 'Assign roles', category: 'user-mgmt' },
      { resource: 'users', action: 'bulk_assign', description: 'Bulk assign roles', category: 'user-mgmt' },
      { resource: 'audit', action: 'view', description: 'View audit logs', category: 'monitoring' },
      { resource: 'system', action: 'settings', description: 'System settings', category: 'system' },
      { resource: 'links', action: 'create', description: 'Create payment links', category: 'payments' },
      { resource: 'links', action: 'view', description: 'View payment links', category: 'payments' },
      { resource: 'transactions', action: 'view', description: 'View transactions', category: 'payments' },
      { resource: 'payouts', action: 'request', description: 'Request payouts', category: 'payments' },
    ];
    await db('permissions').insert(perms);

    // Assign all permissions to Super Admin
    const superAdmin = await db('roles').where({ name: 'Super Admin' }).first();
    const allPerms = await db('permissions').select('id');
    for (const p of allPerms) {
      await db('role_permissions').insert({ role_id: superAdmin.id, permission_id: p.id }).onConflict().ignore();
    }
  }
}

export default migrate;
