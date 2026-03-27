import { createConnection } from '../shared/db.js';

const db = createConnection('watchtower_db');

async function createIfNotExists(tableName, callback) {
  const exists = await db.schema.hasTable(tableName);
  if (!exists) {
    await db.schema.createTable(tableName, callback);
    console.log(`  Created table: ${tableName}`);
  }
}

export async function migrate() {
  console.log('Running watchtower_db migrations...');

  await createIfNotExists('insight_sessions', (t) => {
    t.increments('id').primary();
    t.integer('userId').notNullable();
    t.text('sessionId').unique();
    t.text('device');
    t.text('browser');
    t.text('os');
    t.text('country');
    t.text('city');
    t.integer('duration').defaultTo(0);
    t.integer('pageViews').defaultTo(0);
    t.boolean('isRageClick').defaultTo(false);
    t.boolean('isDeadClick').defaultTo(false);
    t.text('endUserId');
    t.text('metadata');
    t.timestamp('createdAt').defaultTo(db.fn.now());
  });

  await createIfNotExists('insight_events', (t) => {
    t.increments('id').primary();
    t.text('sessionId').notNullable();
    t.text('type').notNullable();
    t.text('target');
    t.text('url');
    t.text('data');
    t.timestamp('timestamp').defaultTo(db.fn.now());
  });

  // Index on insight_events(sessionId)
  const hasIndex = await db.raw(
    `SELECT 1 FROM pg_indexes WHERE indexname = 'insight_events_sessionid_index'`
  );
  if (hasIndex.rows.length === 0) {
    await db.schema.alterTable('insight_events', (t) => {
      t.index('sessionId', 'insight_events_sessionid_index');
    });
    console.log('  Created index: insight_events_sessionid_index');
  }

  await createIfNotExists('insight_entity_mappings', (t) => {
    t.increments('id').primary();
    t.integer('entityId').notNullable();
    t.text('entityType').notNullable();
    t.text('clarityId').notNullable();
    t.timestamp('createdAt').defaultTo(db.fn.now());
    t.unique(['entityId', 'entityType']);
  });

  console.log('watchtower_db migrations complete.');
}

export default migrate;
