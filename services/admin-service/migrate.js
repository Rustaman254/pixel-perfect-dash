import { createConnection } from '../shared/db.js';

const db = createConnection('admin_db');

async function createIfNotExists(tableName, callback) {
  const exists = await db.schema.hasTable(tableName);
  if (!exists) {
    await db.schema.createTable(tableName, callback);
    console.log(`  Created table: ${tableName}`);
  }
}

export async function migrate() {
  console.log('Running admin_db migrations...');

  await createIfNotExists('support_tickets', (t) => {
    t.increments('id').primary();
    t.integer('userId');
    t.string('name').notNullable();
    t.string('email').notNullable();
    t.string('subject').notNullable();
    t.text('message').notNullable();
    t.string('status').defaultTo('Open');
    t.timestamp('createdAt').defaultTo(db.fn.now());
  });

  await createIfNotExists('notifications', (t) => {
    t.increments('id').primary();
    t.integer('userId');
    t.string('title').notNullable();
    t.text('message').notNullable();
    t.string('type').defaultTo('info');
    t.boolean('isRead').defaultTo(false);
    t.string('actionUrl');
    t.string('actionLabel');
    t.string('targetRole');
    t.string('appName').defaultTo('ripplify');
    t.string('deliveryChannel').defaultTo('app');
    t.timestamp('createdAt').defaultTo(db.fn.now());
  });

  await createIfNotExists('admin_settings', (t) => {
    t.increments('id').primary();
    t.string('key').unique().notNullable();
    t.text('value').notNullable();
    t.timestamp('updatedAt').defaultTo(db.fn.now());
  });

  // Seed default admin settings
  const settingsCount = await db('admin_settings').count('id as count').first();
  if (parseInt(settingsCount.count) === 0) {
    await db('admin_settings').insert([
      { key: 'maintenance_mode', value: 'false' },
      { key: 'default_currency', value: 'USD' },
      { key: 'support_email', value: 'support@sokostack.xyz' },
      { key: 'max_upload_size_mb', value: '10' },
    ]);
    console.log('Admin settings seeded.');
  }

  // Feature flags table
  await createIfNotExists('feature_flags', (t) => {
    t.increments('id').primary();
    t.string('key').unique().notNullable();
    t.string('name').notNullable();
    t.text('description');
    t.boolean('isEnabled').defaultTo(true);
    t.string('category').defaultTo('general');
    t.timestamp('createdAt').defaultTo(db.fn.now());
    t.timestamp('updatedAt').defaultTo(db.fn.now());
  });

  // Seed default feature flags including unified agent
  const flagsCount = await db('feature_flags').count('id as count').first();
  if (parseInt(flagsCount.count) === 0) {
    await db('feature_flags').insert([
      { key: 'unified_agent', name: 'Unified AI Agent', description: 'Enable unified AI agent across all services', isEnabled: true, category: 'ai' },
      { key: 'unified_agent_ripplify', name: 'Ripplify Unified Agent', description: 'Enable unified AI agent for Ripplify', isEnabled: true, category: 'ai' },
      { key: 'ai_forms', name: 'AI Form Builder', description: 'AI-powered form creation', isEnabled: true, category: 'ai' },
      { key: 'watchtower_analytics', name: 'Watchtower Analytics', description: 'Visitor analytics and session tracking', isEnabled: true, category: 'analytics' },
      { key: 'shopalize_stores', name: 'Shopalize E-commerce', description: 'E-commerce store functionality', isEnabled: true, category: 'ecommerce' },
      { key: 'payment_links', name: 'Payment Links', description: 'Create and manage payment links', isEnabled: true, category: 'payments' },
      { key: 'forms', name: 'Forms App', description: 'Enable the Forms application', isEnabled: true, category: 'apps' },
    ]);
    console.log('Feature flags seeded.');
  }

  console.log('admin_db migrations complete.');
}

export default migrate;
