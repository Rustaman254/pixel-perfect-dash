import knex from 'knex';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
const connections = {};

// Validate required environment variables at startup
const requiredEnvVars = ['PG_HOST', 'PG_USER', 'PG_PASSWORD'];
for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    console.error(`[FATAL] Missing required environment variable: ${key}`);
    // Don't crash immediately — allow the service to start for health checks,
    // but DB operations will fail with a clear message.
  }
}

const pgConfig = {
  client: 'pg',
  connection: {
    host: process.env.PG_HOST || 'localhost',
    port: parseInt(process.env.PG_PORT || '5432'),
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
  },
  pool: { min: 2, max: 10 },
  acquireConnectionTimeout: 10000,
};

export const createConnection = (dbName) => {
  if (connections[dbName]) return connections[dbName];

  const db = knex({
    ...pgConfig,
    connection: {
      ...pgConfig.connection,
      database: dbName,
    },
  });

  // Validate the connection on first use (non-blocking)
  db.raw('SELECT 1')
    .then(() => console.log(`[DB] Connected to ${dbName}`))
    .catch((err) => console.error(`[DB] Failed to connect to ${dbName}:`, err.message));

  connections[dbName] = db;
  return db;
};

export const closeAll = async () => {
  for (const [name, db] of Object.entries(connections)) {
    try {
      await db.destroy();
    } catch (e) {
      console.error(`[DB] Error closing ${name}:`, e.message);
    }
    delete connections[name];
  }
  console.log('[DB] All connections closed.');
};

// Graceful shutdown on process signals
const shutdown = async (signal) => {
  console.log(`[DB] Received ${signal}, closing connections...`);
  await closeAll();
};
process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));

export default createConnection;
