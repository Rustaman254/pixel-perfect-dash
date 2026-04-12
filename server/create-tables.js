import knex from 'knex';
import dotenv from 'dotenv';

dotenv.config();

const pgConfig = {
  client: 'pg',
  connection: {
    host: process.env.PG_HOST || 'localhost',
    port: parseInt(process.env.PG_PORT || '5432'),
    user: process.env.PG_USER || 'sokostack',
    password: process.env.PG_PASSWORD || 'sokostack2026',
    database: process.env.PG_DATABASE || 'ripplify_db',
  },
};

const db = knex(pgConfig);

async function migrate() {
  console.log('Running ripplify_db migrations...');

  const tables = ['payment_links', 'transactions', 'payouts', 'wallets', 'user_payment_methods', 'user_payout_methods', 'payment_intents', 'transfers', 'fee_tiers'];

  for (const table of tables) {
    const exists = await db.schema.hasTable(table);
    if (!exists) {
      console.log(`Creating table: ${table}`);
    } else {
      console.log(`Table already exists: ${table}`);
    }
  }

  // Create payment_links table
  await db.schema.createTable('payment_links', (t) => {
    t.increments('id').primary();
    t.integer('userId').unsigned();
    t.text('name');
    t.string('slug').unique();
    t.text('description');
    t.decimal('price', 12, 2).defaultTo(0);
    t.string('currency').defaultTo('KES');
    t.string('linkType').defaultTo('one-time');
    t.string('status').defaultTo('Active');
    t.integer('clicks').defaultTo(0);
    t.integer('paymentCount').defaultTo(0);
    t.decimal('totalEarnedValue', 12, 2).defaultTo(0);
    t.boolean('hasPhotos').defaultTo(false);
    t.integer('deliveryDays');
    t.timestamp('expiryDate');
    t.string('expiryLabel');
    t.decimal('shippingFee', 12, 2).defaultTo(0);
    t.string('category').defaultTo('product');
    t.string('buyerName');
    t.string('buyerPhone');
    t.string('buyerEmail');
    t.decimal('minDonation', 12, 2).defaultTo(0);
    t.timestamp('createdAt').defaultTo(db.fn.now());
    t.timestamp('updatedAt').defaultTo(db.fn.now());
  }).catch(() => {});

  // Create transactions table
  await db.schema.createTable('transactions', (t) => {
    t.increments('id').primary();
    t.integer('userId').unsigned();
    t.integer('linkId').unsigned();
    t.string('buyerName');
    t.string('buyerEmail');
    t.string('buyerPhone');
    t.decimal('amount', 12, 2);
    t.decimal('fee', 12, 2).defaultTo(0);
    t.string('currency').defaultTo('KES');
    t.string('status').defaultTo('Pending');
    t.string('transactionId');
    t.string('trackingToken');
    t.string('type').defaultTo('Payment');
    t.integer('senderId').unsigned();
    t.integer('receiverId').unsigned();
    t.string('network');
    t.string('paymentMethod');
    t.string('txHash');
    t.jsonb('metadata');
    t.string('externalRef');
    t.timestamp('createdAt').defaultTo(db.fn.now());
  }).catch(() => {});

  // Create wallets table
  await db.schema.createTable('wallets', (t) => {
    t.increments('id').primary();
    t.integer('userId').unsigned().unique();
    t.decimal('balance', 12, 2).defaultTo(0);
    t.decimal('pendingBalance', 12, 2).defaultTo(0);
    t.string('currency').defaultTo('KES');
    t.timestamp('createdAt').defaultTo(db.fn.now());
    t.timestamp('updatedAt').defaultTo(db.fn.now());
  }).catch(() => {});

  // Create user_payment_methods table
  await db.schema.createTable('user_payment_methods', (t) => {
    t.increments('id').primary();
    t.integer('userId').unsigned();
    t.string('type');
    t.string('provider');
    t.string('accountName');
    t.string('accountNumber');
    t.string('phoneNumber');
    t.boolean('isActive').defaultTo(true);
    t.timestamp('createdAt').defaultTo(db.fn.now());
  }).catch(() => {});

  // Create user_payout_methods table
  await db.schema.createTable('user_payout_methods', (t) => {
    t.increments('id').primary();
    t.integer('userId').unsigned();
    t.string('type');
    t.string('provider');
    t.string('accountName');
    t.string('accountNumber');
    t.string('phoneNumber');
    t.boolean('isActive').defaultTo(true);
    t.timestamp('createdAt').defaultTo(db.fn.now());
  }).catch(() => {});

  // Create payouts table
  await db.schema.createTable('payouts', (t) => {
    t.increments('id').primary();
    t.integer('userId').unsigned();
    t.decimal('amount', 12, 2);
    t.decimal('fee', 12, 2).defaultTo(0);
    t.string('currency').defaultTo('KES');
    t.string('status').defaultTo('Pending');
    t.string('payoutMethodId');
    t.string('transactionId');
    t.string('bankName');
    t.string('accountNumber');
    t.string('accountName');
    t.string('phoneNumber');
    t.timestamp('createdAt').defaultTo(db.fn.now());
  }).catch(() => {});

  // Create payment_intents table
  await db.schema.createTable('payment_intents', (t) => {
    t.increments('id').primary();
    t.string('paymentIntentId').unique();
    t.integer('userId').unsigned();
    t.integer('linkId').unsigned();
    t.decimal('amount', 12, 2);
    t.string('currency').defaultTo('KES');
    t.string('status').defaultTo('Pending');
    t.jsonb('metadata');
    t.timestamp('createdAt').defaultTo(db.fn.now());
  }).catch(() => {});

  // Create transfers table
  await db.schema.createTable('transfers', (t) => {
    t.increments('id').primary();
    t.integer('senderId').unsigned();
    t.integer('receiverId').unsigned();
    t.decimal('amount', 12, 2);
    t.decimal('fee', 12, 2).defaultTo(0);
    t.string('currency').defaultTo('KES');
    t.string('status').defaultTo('Pending');
    t.string('transactionId');
    t.timestamp('createdAt').defaultTo(db.fn.now());
  }).catch(() => {});

  // Create fee_tiers table
  await db.schema.createTable('fee_tiers', (t) => {
    t.increments('id').primary();
    t.decimal('minAmount', 12, 2);
    t.decimal('maxAmount', 12, 2);
    t.decimal('feePercent', 5, 2);
    t.string('label').defaultTo('');
    t.timestamp('createdAt').defaultTo(db.fn.now());
  }).catch(() => {});

  // Seed default fee tiers if empty
  const feeCount = await db('fee_tiers').count('id as count').first();
  if (parseInt(feeCount.count) === 0) {
    await db('fee_tiers').insert([
      { minAmount: 0, maxAmount: 100, feePercent: 2.5, label: 'Starter' },
      { minAmount: 101, maxAmount: 500, feePercent: 2.0, label: 'Basic' },
      { minAmount: 501, maxAmount: 2000, feePercent: 1.5, label: 'Standard' },
      { minAmount: 2001, maxAmount: 10000, feePercent: 1.0, label: 'Premium' },
      { minAmount: 10001, maxAmount: 999999999, feePercent: 0.5, label: 'Enterprise' },
    ]);
    console.log('Default fee tiers seeded.');
  }

  console.log('Migrations complete.');
  
  // Add missing columns to users table in auth_db
  await addUsersColumns();
  
  await db.destroy();
}

async function addUsersColumns() {
  console.log('Checking users table columns...');
  
  const authDb = knex({
    client: 'pg',
    connection: {
      host: process.env.PG_HOST || 'localhost',
      port: parseInt(process.env.PG_PORT || '5432'),
      user: process.env.PG_USER || 'sokostack',
      password: process.env.PG_PASSWORD || 'sokostack2026',
      database: 'auth_db',
    },
  });
  
  try {
    const columns = [
      { name: 'businessName', type: 'VARCHAR(255)' },
      { name: 'fullName', type: 'VARCHAR(255)' },
      { name: 'businessLogo', type: 'TEXT' },
      { name: 'phone', type: 'VARCHAR(50)' },
      { name: 'role', type: 'VARCHAR(50)' },
    ];
    
    for (const col of columns) {
      const exists = await authDb.schema.hasColumn('users', col.name);
      if (!exists) {
        console.log(`Adding ${col.name} column to users...`);
        await authDb.raw(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`);
      }
    }
    
    console.log('Users table columns check complete.');
  } catch (error) {
    console.error('Error adding users columns:', error.message);
  } finally {
    await authDb.destroy();
  }
}

migrate().catch(console.error);
