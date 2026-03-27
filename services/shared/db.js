import knex from 'knex';
import dotenv from 'dotenv';
dotenv.config();

const connections = {};

export const createConnection = (dbName) => {
  if (connections[dbName]) return connections[dbName];

  const db = knex({
    client: 'pg',
    connection: {
      host: process.env.PG_HOST || 'localhost',
      port: parseInt(process.env.PG_PORT || '5432'),
      database: dbName,
      user: process.env.PG_USER || 'sokostack',
      password: process.env.PG_PASSWORD || 'sokostack2026',
    },
    pool: { min: 2, max: 10 },
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
