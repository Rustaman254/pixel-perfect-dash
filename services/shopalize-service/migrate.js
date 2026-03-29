import { createConnection } from '../shared/db.js';

const db = createConnection('shopalize_db');

async function createIfNotExists(tableName, callback) {
  const exists = await db.schema.hasTable(tableName);
  if (!exists) {
    await db.schema.createTable(tableName, callback);
    console.log(`  Created table: ${tableName}`);
  }
}

export async function migrate() {
  console.log('Running shopalize_db migrations...');

  await createIfNotExists('projects', (t) => {
    t.increments('id').primary();
    t.integer('userId').notNullable();
    t.text('name').notNullable();
    t.string('slug').unique().notNullable();
    t.text('templateId');
    t.text('description').defaultTo('');
    t.string('status').defaultTo('draft');
    t.text('domain');
    t.text('themeJson');
    t.timestamp('createdAt').defaultTo(db.fn.now());
    t.timestamp('updatedAt').defaultTo(db.fn.now());
  });

  await createIfNotExists('project_pages', (t) => {
    t.increments('id').primary();
    t.integer('projectId').notNullable();
    t.text('name').notNullable();
    t.string('slug').notNullable();
    t.string('type').defaultTo('page');
    t.text('sectionsJson');
    t.text('seoTitle');
    t.text('seoDescription');
    t.timestamp('createdAt').defaultTo(db.fn.now());
    t.timestamp('updatedAt').defaultTo(db.fn.now());
    t.unique(['projectId', 'slug']);
  });

  await createIfNotExists('templates', (t) => {
    t.increments('id').primary();
    t.text('name').notNullable();
    t.string('slug').unique().notNullable();
    t.string('category').defaultTo('general');
    t.text('description');
    t.text('thumbnailUrl');
    t.text('previewUrl');
    t.text('sectionsJson');
    t.boolean('isActive').defaultTo(true);
    t.timestamp('createdAt').defaultTo(db.fn.now());
  });

  await createIfNotExists('store_products', (t) => {
    t.increments('id').primary();
    t.integer('projectId').notNullable();
    t.text('name').notNullable();
    t.text('description');
    t.decimal('price', 12, 2).notNullable();
    t.string('currency').defaultTo('USD');
    t.text('images');
    t.string('category');
    t.integer('inventory').defaultTo(-1);
    t.boolean('isActive').defaultTo(true);
    t.integer('ripplifyLinkId');
    t.string('ripplifySlug');
    t.timestamp('createdAt').defaultTo(db.fn.now());
    t.timestamp('updatedAt').defaultTo(db.fn.now());
  });

  await createIfNotExists('store_orders', (t) => {
    t.increments('id').primary();
    t.integer('projectId').notNullable();
    t.integer('productId');
    t.text('buyerName');
    t.text('buyerEmail');
    t.text('buyerPhone');
    t.decimal('amount', 12, 2).notNullable();
    t.string('currency');
    t.string('status').defaultTo('pending');
    t.string('fulfillmentStatus').defaultTo('unfulfilled');
    t.string('paymentStatus').defaultTo('pending');
    t.text('notes');
    t.text('ripplifyTransactionId');
    t.timestamp('createdAt').defaultTo(db.fn.now());
  });

  // Discounts table
  await createIfNotExists('discounts', (t) => {
    t.increments('id').primary();
    t.integer('userId').notNullable();
    t.string('code').notNullable();
    t.string('type').defaultTo('percentage'); // percentage, fixed
    t.decimal('value', 12, 2).notNullable();
    t.decimal('minOrderAmount', 12, 2).defaultTo(0);
    t.integer('usageLimit').defaultTo(0); // 0 = unlimited
    t.integer('usedCount').defaultTo(0);
    t.string('appliesTo').defaultTo('all'); // all, products, collections
    t.text('appliesToIds'); // JSON array of IDs
    t.boolean('isActive').defaultTo(true);
    t.timestamp('startsAt');
    t.timestamp('endsAt');
    t.timestamp('createdAt').defaultTo(db.fn.now());
    t.timestamp('updatedAt').defaultTo(db.fn.now());
    t.unique(['userId', 'code']);
  });

  // Store analytics / sessions table
  await createIfNotExists('store_analytics', (t) => {
    t.increments('id').primary();
    t.integer('projectId').notNullable();
    t.string('eventType').notNullable(); // page_view, add_to_cart, checkout, purchase
    t.string('referrer'); // direct, social, search, email
    t.string('device'); // mobile, desktop, tablet
    t.string('ip');
    t.string('userAgent');
    t.text('metadata'); // JSON
    t.timestamp('createdAt').defaultTo(db.fn.now());
  });

  // Marketing campaigns table
  await createIfNotExists('campaigns', (t) => {
    t.increments('id').primary();
    t.integer('userId').notNullable();
    t.string('name').notNullable();
    t.string('type').notNullable(); // email, social, google_ads
    t.string('status').defaultTo('draft'); // draft, active, paused, completed
    t.text('content'); // JSON with campaign content
    t.string('audience'); // all, returning, new
    t.integer('sentCount').defaultTo(0);
    t.integer('openCount').defaultTo(0);
    t.integer('clickCount').defaultTo(0);
    t.decimal('revenue', 12, 2).defaultTo(0);
    t.timestamp('scheduledAt');
    t.timestamp('sentAt');
    t.timestamp('createdAt').defaultTo(db.fn.now());
    t.timestamp('updatedAt').defaultTo(db.fn.now());
  });

  // Wishlist table
  await createIfNotExists('wishlists', (t) => {
    t.increments('id').primary();
    t.integer('projectId').notNullable();
    t.string('customerEmail').notNullable();
    t.integer('productId').notNullable();
    t.timestamp('createdAt').defaultTo(db.fn.now());
  });

  // Store pages / blog posts
  await createIfNotExists('store_blogs', (t) => {
    t.increments('id').primary();
    t.integer('projectId').notNullable();
    t.string('title').notNullable();
    t.string('slug').notNullable();
    t.text('content');
    t.string('author');
    t.string('image');
    t.boolean('isPublished').defaultTo(false);
    t.timestamp('publishedAt');
    t.timestamp('createdAt').defaultTo(db.fn.now());
    t.timestamp('updatedAt').defaultTo(db.fn.now());
  });

  // Navigation menus
  await createIfNotExists('store_navigation', (t) => {
    t.increments('id').primary();
    t.integer('projectId').notNullable();
    t.string('title').notNullable();
    t.string('url').notNullable();
    t.integer('position').defaultTo(0);
    t.integer('parentId');
    t.timestamp('createdAt').defaultTo(db.fn.now());
  });

  // Store settings table
  await createIfNotExists('store_settings', (t) => {
    t.increments('id').primary();
    t.string('platformName').defaultTo('Shopalize');
    t.string('currency').defaultTo('USD');
    t.string('timezone').defaultTo('UTC');
    t.string('orderPrefix').defaultTo('ORD-');
    t.decimal('taxRate', 5, 2).defaultTo(0);
    t.boolean('shippingEnabled').defaultTo(true);
    t.boolean('inventoryTracking').defaultTo(true);
    t.boolean('autoFulfillOrders').defaultTo(false);
    t.boolean('emailNotifications').defaultTo(true);
    t.integer('lowStockThreshold').defaultTo(5);
    t.integer('maxProductsPerStore').defaultTo(1000);
    t.boolean('allowCustomDomains').defaultTo(true);
    t.timestamp('updatedAt').defaultTo(db.fn.now());
  });

  // Shopalize feature flags table
  await createIfNotExists('shopalize_features', (t) => {
    t.increments('id').primary();
    t.string('key').unique().notNullable();
    t.string('name').notNullable();
    t.text('description').defaultTo('');
    t.string('category').defaultTo('general');
    t.boolean('isEnabled').defaultTo(true);
    t.timestamp('createdAt').defaultTo(db.fn.now());
    t.timestamp('updatedAt').defaultTo(db.fn.now());
  });

  // Seed default feature flags if empty
  const featureCount = await db('shopalize_features').count('id as count').first().catch(() => ({ count: 0 }));
  if (parseInt(featureCount.count) === 0) {
    await db('shopalize_features').insert([
      { key: 'multi_currency', name: 'Multi-Currency Support', description: 'Allow stores to accept multiple currencies', category: 'payments', isEnabled: true },
      { key: 'custom_domains', name: 'Custom Domains', description: 'Allow stores to use custom domain names', category: 'stores', isEnabled: true },
      { key: 'discount_codes', name: 'Discount Codes', description: 'Enable discount code creation and management', category: 'marketing', isEnabled: true },
      { key: 'inventory_tracking', name: 'Inventory Tracking', description: 'Track product inventory levels', category: 'products', isEnabled: true },
      { key: 'analytics_dashboard', name: 'Store Analytics', description: 'Enable analytics dashboards for store owners', category: 'analytics', isEnabled: true },
      { key: 'marketing_campaigns', name: 'Marketing Campaigns', description: 'Enable email and social marketing campaigns', category: 'marketing', isEnabled: true },
      { key: 'seo_tools', name: 'SEO Tools', description: 'Enable SEO optimization features for stores', category: 'stores', isEnabled: true },
      { key: 'abandoned_cart', name: 'Abandoned Cart Recovery', description: 'Send recovery emails for abandoned carts', category: 'marketing', isEnabled: false },
      { key: 'product_reviews', name: 'Product Reviews', description: 'Allow customers to leave product reviews', category: 'products', isEnabled: true },
      { key: 'wishlists', name: 'Wishlists', description: 'Allow customers to save products to wishlists', category: 'products', isEnabled: true },
      { key: 'gift_cards', name: 'Gift Cards', description: 'Enable gift card purchase and redemption', category: 'payments', isEnabled: false },
      { key: 'subscription_products', name: 'Subscription Products', description: 'Allow stores to sell subscription-based products', category: 'products', isEnabled: false },
    ]);
    console.log('  Default shopalize feature flags seeded.');
  }

  // Seed default settings if empty
  const settingsCount = await db('store_settings').count('id as count').first().catch(() => ({ count: 0 }));
  if (parseInt(settingsCount.count) === 0) {
    await db('store_settings').insert({
      platformName: 'Shopalize',
      currency: 'USD',
      timezone: 'UTC',
      orderPrefix: 'ORD-',
      taxRate: 0,
      shippingEnabled: true,
      inventoryTracking: true,
      autoFulfillOrders: false,
      emailNotifications: true,
      lowStockThreshold: 5,
      maxProductsPerStore: 1000,
      allowCustomDomains: true,
    });
    console.log('  Default store settings seeded.');
  }

  // Seed default templates if empty
  const templateCount = await db('templates').count('id as count').first();
  if (parseInt(templateCount.count) === 0) {
    const minimalSections = JSON.stringify([
      { type: 'hero', settings: { headline: 'Welcome', subheadline: 'Your store awaits', ctaText: 'Shop Now' } },
      { type: 'products', settings: { title: 'Featured Products', layout: 'grid', columns: 3 } },
      { type: 'footer', settings: { copyright: '© 2026 My Store' } },
    ]);

    const modernSections = JSON.stringify([
      { type: 'navbar', settings: { style: 'transparent', sticky: true } },
      { type: 'hero', settings: { headline: 'Modern Store', subheadline: 'Curated for you', ctaText: 'Explore', style: 'fullbleed' } },
      { type: 'announcement', settings: { text: 'Free shipping on orders over $50', style: 'banner' } },
      { type: 'products', settings: { title: 'New Arrivals', layout: 'grid', columns: 4, showFilters: true } },
      { type: 'newsletter', settings: { heading: 'Stay in the loop', placeholder: 'Enter your email' } },
      { type: 'footer', settings: { style: 'modern', copyright: '© 2026 My Store' } },
    ]);

    const classicSections = JSON.stringify([
      { type: 'navbar', settings: { style: 'solid', sticky: false } },
      { type: 'hero', settings: { headline: 'Classic Collection', subheadline: 'Timeless style', ctaText: 'Browse Collection', style: 'centered' } },
      { type: 'categories', settings: { title: 'Shop by Category', layout: 'carousel' } },
      { type: 'products', settings: { title: 'Best Sellers', layout: 'grid', columns: 3 } },
      { type: 'testimonials', settings: { title: 'What customers say', count: 3 } },
      { type: 'footer', settings: { style: 'classic', copyright: '© 2026 My Store' } },
    ]);

    await db('templates').insert([
      {
        name: 'Minimal',
        slug: 'minimal',
        category: 'general',
        description: 'A clean, minimal template perfect for any store. Focus on your products with a distraction-free design.',
        thumbnailUrl: '/templates/minimal-thumb.png',
        previewUrl: '/templates/minimal-preview.png',
        sectionsJson: minimalSections,
        isActive: true,
      },
      {
        name: 'Modern',
        slug: 'modern',
        category: 'general',
        description: 'A bold, modern template with announcement bars, newsletter signup, and filterable product grids.',
        thumbnailUrl: '/templates/modern-thumb.png',
        previewUrl: '/templates/modern-preview.png',
        sectionsJson: modernSections,
        isActive: true,
      },
      {
        name: 'Classic',
        slug: 'classic',
        category: 'general',
        description: 'A traditional e-commerce layout with category browsing, testimonials, and a classic navigation bar.',
        thumbnailUrl: '/templates/classic-thumb.png',
        previewUrl: '/templates/classic-preview.png',
        sectionsJson: classicSections,
        isActive: true,
      },
    ]);
    console.log('  Default templates seeded.');
  }

  console.log('shopalize_db migrations complete.');
}

if (process.argv[1] && process.argv[1].includes('migrate.js')) {
  migrate().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}

export default migrate;
