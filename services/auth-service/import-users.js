import sqlite3 from 'sqlite3';
import knex from 'knex';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

const sqlite = new sqlite3.Database(path.resolve(__dirname, '..', '..', 'server', 'ripplify.db'));

const pg = knex({
  client: 'pg',
  connection: {
    host: process.env.PG_HOST || 'localhost',
    port: parseInt(process.env.PG_PORT || '5432'),
    database: 'auth_db',
    user: process.env.PG_USER || 'sokostack',
    password: process.env.PG_PASSWORD || 'sokostack2026',
  },
});

sqlite.all('SELECT * FROM users', async (err, rows) => {
  if (err) {
    console.error('Error reading SQLite:', err);
    process.exit(1);
  }

  if (rows.length === 0) {
    console.log('No users to migrate');
    process.exit(0);
  }

  console.log(`Found ${rows.length} users to migrate`);

  for (const user of rows) {
    try {
      await pg('users').insert({
        email: user.email,
        password: user.password,
        role: user.role === 'admin' ? 'Super Admin' : 'Seller',
        fullName: user.fullName || '',
        phone: user.phone || '',
        businessName: user.businessName || '',
        idType: user.idType || 'National ID',
        idNumber: user.idNumber || '',
        location: user.location || '',
        payoutMethod: user.payoutMethod || 'mpesa',
        payoutDetails: user.payoutDetails || '',
        isVerified: user.isVerified === 1 || user.isVerified === true,
        createdAt: user.createdAt || new Date(),
      });
      console.log(`Migrated: ${user.email}`);
    } catch (insertErr) {
      if (insertErr.code === '23505') {
        console.log(`User already exists: ${user.email}`);
      } else {
        console.error(`Error inserting ${user.email}:`, insertErr.message);
      }
    }
  }

  console.log('Migration complete');
  
  sqlite.close();
  await pg.destroy();
  process.exit(0);
});
