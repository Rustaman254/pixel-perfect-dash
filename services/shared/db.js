import knex from 'knex';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const connections = {};

export const createConnection = (dbName) => {
  if (connections[dbName]) return connections[dbName];

  const dbPath = path.resolve(__dirname, '..', '..', `${dbName}.sqlite`);
  
  const db = knex({
    client: 'better-sqlite3',
    connection: {
      filename: dbPath,
    },
    useNullAsDefault: true,
    pool: { min: 1, max: 1 },
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
