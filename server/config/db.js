import knex from 'knex';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

let dbInstance = null;

const pgConfig = {
  client: 'pg',
  connection: {
    host: process.env.PG_HOST || 'localhost',
    port: parseInt(process.env.PG_PORT || '5432'),
    user: process.env.PG_USER || 'sokostack',
    password: process.env.PG_PASSWORD || 'sokostack2026',
    database: process.env.PG_DATABASE || 'ripplify_db',
  },
  pool: { min: 2, max: 10 },
};

const connectDB = async () => {
  try {
    console.log('Connecting to PostgreSQL ripplify_db...');
    dbInstance = knex(pgConfig);
    
    await dbInstance.raw('SELECT 1');
    console.log('PostgreSQL Connected successfully.');
    return dbInstance;
  } catch (error) {
    console.error(`Error connecting to PostgreSQL: ${error.message}`);
    process.exit(1);
  }
};

export const getDb = () => dbInstance;
export default connectDB;
