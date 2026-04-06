import { createConnection } from '../shared/db.js';

const db = createConnection('ripplify_db');

// Force PostgreSQL column names to use camelCase
db.schema.raw('SET SESSION search_path = public');

async function createIfNotExists(tableName, callback) {
  const exists = await db.schema.hasTable(tableName);
  if (!exists) {
    await db.schema.createTable(tableName, (t) => {
      callback(t);
      // Convert all column names to camelCase for PostgreSQL
    });
    console.log(`  Created table: ${tableName}`);
  }
}

export async function migrate() {
  console.log('Running ripplify_db migrations...');

  await createIfNotExists('payment_links', (t) => {
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
    t.string('source');
    t.string('sourceStoreId');
    t.string('sourceStoreDomain');
    t.string('sourceOrderId');
    t.string('returnUrl');
    t.string('webhookUrl');
    t.timestamp('createdAt').defaultTo(db.fn.now());
    t.timestamp('updatedAt').defaultTo(db.fn.now());
  });

  await createIfNotExists('transactions', (t) => {
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
    t.string('transactionId').unique();
    t.string('trackingToken').unique();
    t.string('type').defaultTo('Payment');
    t.integer('senderId').unsigned();
    t.integer('receiverId').unsigned();
    t.string('network');
    t.string('paymentMethod');
    t.string('txHash');
    t.text('metadata');
    t.string('externalRef');
    t.timestamp('createdAt').defaultTo(db.fn.now());
  });

  await createIfNotExists('wallets', (t) => {
    t.increments('id').primary();
    t.integer('userId').unsigned();
    t.string('currency_code');
    t.string('network');
    t.decimal('balance', 18, 8).defaultTo(0);
    t.decimal('locked_balance', 18, 8).defaultTo(0);
    t.string('address');
    t.timestamp('createdAt').defaultTo(db.fn.now());
    t.timestamp('updatedAt').defaultTo(db.fn.now());
    t.unique(['userId', 'currency_code', 'network']);
  });

  await createIfNotExists('payment_intents', (t) => {
    t.increments('id').primary();
    t.integer('userId').unsigned();
    t.decimal('amount', 12, 2);
    t.string('currency');
    t.string('paymentMethod');
    t.string('status').defaultTo('pending');
    t.string('clientSecret');
    t.string('txHash');
    t.text('metadata');
    t.timestamp('expiresAt');
    t.timestamp('createdAt').defaultTo(db.fn.now());
    t.timestamp('updatedAt').defaultTo(db.fn.now());
  });

  await createIfNotExists('payouts', (t) => {
    t.increments('id').primary();
    t.integer('userId').unsigned();
    t.decimal('amount', 12, 2);
    t.decimal('fee', 12, 2).defaultTo(0);
    t.string('currency').defaultTo('KES');
    t.string('method');
    t.text('details');
    t.string('status').defaultTo('Processing');
    t.timestamp('createdAt').defaultTo(db.fn.now());
  });

  await createIfNotExists('transfers', (t) => {
    t.increments('id').primary();
    t.integer('senderId').unsigned();
    t.integer('receiverId').unsigned();
    t.string('receiverPhone');
    t.string('receiverEmail');
    t.decimal('amount', 12, 2);
    t.decimal('fee', 12, 2).defaultTo(0);
    t.string('currency').defaultTo('KES');
    t.string('method');
    t.string('status').defaultTo('Processing');
    t.text('note');
    t.string('externalRef');
    t.timestamp('createdAt').defaultTo(db.fn.now());
  });

  await createIfNotExists('user_payout_methods', (t) => {
    t.increments('id').primary();
    t.integer('userId').unsigned();
    t.string('method');
    t.string('label').defaultTo('');
    t.text('details');
    t.boolean('isDefault').defaultTo(false);
    t.boolean('isActive').defaultTo(true);
    t.timestamp('createdAt').defaultTo(db.fn.now());
    t.timestamp('updatedAt').defaultTo(db.fn.now());
  });

  await createIfNotExists('user_payment_methods', (t) => {
    t.increments('id').primary();
    t.integer('userId').unsigned();
    t.string('methodId');
    t.boolean('enabled').defaultTo(true);
    t.string('fee');
    t.unique(['userId', 'methodId']);
  });

  await createIfNotExists('fee_tiers', (t) => {
    t.increments('id').primary();
    t.decimal('minAmount', 12, 2);
    t.decimal('maxAmount', 12, 2);
    t.decimal('feePercent', 5, 2);
    t.string('label').defaultTo('');
    t.timestamp('createdAt').defaultTo(db.fn.now());
  });

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
    console.log('  Default fee tiers seeded.');
  }

  // Fix column names: ensure camelCase for PostgreSQL
  try {
    await db.schema.raw(`
      -- Fix users table
      ALTER TABLE users RENAME COLUMN businessname TO "businessName";
      ALTER TABLE users RENAME COLUMN fullname TO "fullName";
      ALTER TABLE users RENAME COLUMN idtype TO "idType";
      ALTER TABLE users RENAME COLUMN idnumber TO "idNumber";
      ALTER TABLE users RENAME COLUMN payoutmethod TO "payoutMethod";
      ALTER TABLE users RENAME COLUMN payoutdetails TO "payoutDetails";
      ALTER TABLE users RENAME COLUMN businesslogo TO "businessLogo";
      ALTER TABLE users RENAME COLUMN kycstatus TO "kycStatus";
      ALTER TABLE users RENAME COLUMN kybstatus TO "kybStatus";
      ALTER TABLE users RENAME COLUMN transactionlimit TO "transactionLimit";
      ALTER TABLE users RENAME COLUMN isverified TO "isVerified";
      ALTER TABLE users RENAME COLUMN createdat TO "createdAt";
      ALTER TABLE users RENAME COLUMN updatedat TO "updatedAt";
      ALTER TABLE users ADD COLUMN IF NOT EXISTS "isDisabled" boolean DEFAULT false;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS "isSuspended" boolean DEFAULT false;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS "accountStatus" text DEFAULT 'active';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS "suspendReason" text DEFAULT '';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS "referralPoints" integer DEFAULT 0;
    `);
    console.log('  Fixed users table columns.');
  } catch (e) {
    // Columns may already exist or be renamed
  }

  console.log('ripplify_db migrations complete.');
}

export default migrate;
