import knex from 'knex';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const connections = {};

const pgConfig = {
  client: 'pg',
  connection: {
    host: process.env.PG_HOST || 'localhost',
    port: parseInt(process.env.PG_PORT || '5432'),
    user: process.env.PG_USER || 'sokostack',
    password: process.env.PG_PASSWORD || 'sokostack2026',
  },
  pool: { min: 2, max: 10 },
};

const tableToDb = {
  users: 'auth_db',
  api_keys: 'auth_db',
  apps: 'auth_db',
  roles: 'auth_db',
  permissions: 'auth_db',
  user_roles: 'auth_db',
  role_permissions: 'auth_db',
  audit_logs: 'auth_db',
  admin_audit_logs: 'auth_db',
  stores: 'auth_db',
  otps: 'auth_db',
  password_reset_tokens: 'auth_db',
  oauth_clients: 'auth_db',
  oauth_auth_codes: 'auth_db',
  oauth_access_tokens: 'auth_db',
  supported_currencies: 'auth_db',
  system_settings: 'auth_db',
  feature_flags: 'auth_db',
  user_feature_overrides: 'auth_db',
  user_currencies: 'auth_db',
  referral_codes: 'auth_db',
  referral_usage: 'auth_db',
  forms: 'auth_db',
  form_responses: 'auth_db',
  payment_links: 'ripplify_db',
  transactions: 'ripplify_db',
  wallets: 'ripplify_db',
  payment_intents: 'ripplify_db',
  payouts: 'ripplify_db',
  transfers: 'ripplify_db',
  user_payout_methods: 'ripplify_db',
  user_payment_methods: 'ripplify_db',
  fee_tiers: 'ripplify_db',
  projects: 'shopalize_db',
  project_pages: 'shopalize_db',
  templates: 'shopalize_db',
  store_products: 'shopalize_db',
  store_orders: 'shopalize_db',
  discounts: 'shopalize_db',
  store_analytics: 'shopalize_db',
  campaigns: 'shopalize_db',
  wishlists: 'shopalize_db',
  store_blogs: 'shopalize_db',
  store_navigation: 'shopalize_db',
  store_settings: 'shopalize_db',
  shopalize_features: 'shopalize_db',
  activity_logs: 'shopalize_db',
  support_tickets: 'admin_db',
  notifications: 'admin_db',
  admin_settings: 'admin_db',
  shopalize_discount_codes: 'admin_db',
  shopalize_discount_usage: 'admin_db',
  insight_sessions: 'watchtower_db',
  insight_events: 'watchtower_db',
  insight_entity_mappings: 'watchtower_db',
  subdomains: 'dns_db',
  custom_domains: 'dns_db',
  dns_records: 'dns_db',
  domain_registrations: 'dns_db',
  dns_analytics: 'dns_db',
  ssl_certificates: 'dns_db',
  nameservers: 'dns_db',
};

const getDbName = (table) => tableToDb[table?.toLowerCase()] || 'auth_db';

export const createConnection = (dbName) => {
  if (connections[dbName]) return addQueryMethods(connections[dbName]);
  const db = knex({ ...pgConfig, connection: { ...pgConfig.connection, database: dbName } });
  connections[dbName] = db;
  return addQueryMethods(db);
};

const addQueryMethods = (db) => {
  const fixCase = (row) => {
    if (!row) return row;
    const fixed = {};
    for (const [key, value] of Object.entries(row)) {
      const lowerKey = key.toLowerCase();
      if (lowerKey === 'isenabled' && !('isEnabled' in fixed)) {
        fixed.isEnabled = value;
      } else if (lowerKey === 'userid' && !('userId' in fixed)) {
        fixed.userId = value;
      } else if (lowerKey === 'featurekey' && !('featureKey' in fixed)) {
        fixed.featureKey = value;
      } else if (lowerKey === 'createdat' && !('createdAt' in fixed)) {
        fixed.createdAt = value;
      } else if (lowerKey === 'updatedat' && !('updatedAt' in fixed)) {
        fixed.updatedAt = value;
      } else {
        fixed[key] = value;
      }
    }
    return fixed;
  };

  db.all = async (sql, ...params) => {
    const rawParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
    const result = await db.raw(sql, rawParams);
    return result.rows.map(fixCase);
  };
  db.get = async (sql, ...params) => {
    const rawParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
    const result = await db.raw(sql, rawParams);
    return fixCase(result.rows[0]);
  };
  db.run = async (sql, ...params) => {
    const rawParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
    const result = await db.raw(sql, rawParams);
    return { lastID: result.rowCount, rows: result.rows.map(fixCase), changes: result.rowCount };
  };
  return db;
};

export const getDb = (table) => createConnection(getDbName(table));
export const getAuthDb = () => createConnection('auth_db');
export const getRipplifyDb = () => createConnection('ripplify_db');
export const getShopalizeDb = () => createConnection('shopalize_db');
export const getAdminDb = () => createConnection('admin_db');
export const getWatchtowerDb = () => createConnection('watchtower_db');
export const getDnsDb = () => createConnection('dns_db');

export const connectAll = async () => {
  const dbs = ['auth_db', 'ripplify_db', 'shopalize_db', 'admin_db', 'watchtower_db', 'dns_db'];
  for (const dbName of dbs) {
    try {
      const db = createConnection(dbName);
      await db.raw('SELECT 1');
      console.log(`PostgreSQL ${dbName} connected`);
    } catch (e) {
      console.error(`Failed to connect to ${dbName}: ${e.message}`);
    }
  }
};

export const closeAll = async () => {
  for (const db of Object.values(connections)) await db.destroy();
  Object.keys(connections).forEach(k => delete connections[k]);
};

export default connectAll;