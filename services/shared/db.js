import knex from 'knex';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
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

export const createConnection = (dbName) => {
  if (connections[dbName]) return connections[dbName];

  const db = knex({
    ...pgConfig,
    connection: {
      ...pgConfig.connection,
      database: dbName,
    },
  });

  connections[dbName] = db;
  return db;
};

export const closeAll = async () => {
  for (const [name, db] of Object.entries(connections)) {
    await db.destroy();
    delete connections[name];
  }
};

export default createConnection;
