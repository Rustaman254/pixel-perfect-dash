import knex from 'knex';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const db = knex({
  client: 'better-sqlite3',
  connection: {
    filename: path.resolve(__dirname, '..', '..', 'dns_db.sqlite'),
  },
  useNullAsDefault: true,
  pool: { min: 1, max: 1 },
});

export default db;
