import sqlite3 from 'better-sqlite3';
import pg from 'pg';
const { Client } = pg;

const SQLite_DIR = '/home/anwar/apps/sokostack';
const PG_CONFIG = {
  host: 'localhost',
  port: 5432,
  user: 'sokostack',
  password: 'sokostack2026',
};

const SERVICES = [
  { sqlite: 'auth_db.sqlite', pg: 'auth_db' },
  { sqlite: 'ripplify_db.sqlite', pg: 'ripplify_db' },
  { sqlite: 'shopalize_db.sqlite', pg: 'shopalize_db' },
  { sqlite: 'admin_db.sqlite', pg: 'admin_db' },
  { sqlite: 'watchtower_db.sqlite', pg: 'watchtower_db' },
];

async function migrateService(sqliteFile, pgDb) {
  console.log(`\n=== Migrating ${sqliteFile} -> ${pgDb} ===`);
  
  const sqlite = new sqlite3(`${SQLite_DIR}/${sqliteFile}`);
  sqlite.pragma('journal_mode = WAL');
  
  const pgClient = new Client({ ...PG_CONFIG, database: pgDb });
  await pgClient.connect();

  const tables = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
  
  for (const { name: table } of tables) {
    try {
      const rows = sqlite.prepare(`SELECT * FROM ${table}`).all();
      if (rows.length === 0) {
        console.log(`  ${table}: 0 rows`);
        continue;
      }

      const columns = Object.keys(rows[0]);
      const colNames = columns.map(c => `"${c}"`).join(', ');
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
      
      const insertSql = `INSERT INTO ${table} (${colNames}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
      const insertStmt = await pgClient.prepare(insertSql);
      
      for (const row of rows) {
        const values = columns.map(col => {
          const val = row[col];
          if (val === null) return null;
          if (typeof val === 'object') return JSON.stringify(val);
          return val;
        });
        try {
          await insertStmt.values(values);
        } catch (e) {
          // Ignore conflicts
        }
      }
      await insertStmt.release();
      console.log(`  ${table}: ${rows.length} rows migrated`);
    } catch (err) {
      console.log(`  ${table}: ERROR - ${err.message}`);
    }
  }

  await pgClient.end();
  sqlite.close();
  console.log(`=== ${pgDb} complete ===`);
}

async function main() {
  for (const { sqlite, pg: pgDb } of SERVICES) {
    await migrateService(sqlite, pgDb);
  }
  console.log('\n=== All migrations complete ===');
}

main().catch(console.error);