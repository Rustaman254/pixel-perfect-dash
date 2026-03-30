import { createConnection } from '../shared/db.js';

const db = createConnection('shopalize_db');

async function createIfNotExists(tableName, callback) {
  const exists = await db.schema.hasTable(tableName);
  if (!exists) {
    await db.schema.createTable(tableName, callback);
    console.log(`  Created table: ${tableName}`);
  }
}

async function addColumnIfNotExists(tableName, columnName, columnCallback) {
  const hasTable = await db.schema.hasTable(tableName);
  if (!hasTable) return;
  const hasColumn = await db.schema.hasColumn(tableName, columnName);
  if (!hasColumn) {
    await db.schema.alterTable(tableName, (t) => {
      columnCallback(t);
    });
    console.log(`  Added column ${columnName} to ${tableName}`);
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
    t.boolean('isPremium').defaultTo(false);
    t.string('premiumStatus').defaultTo('basic'); // basic, premium, enterprise
  });

  // Add missing columns to existing projects table
  await addColumnIfNotExists('projects', 'isPremium', (t) => t.boolean('isPremium').defaultTo(false));
  await addColumnIfNotExists('projects', 'premiumStatus', (t) => t.string('premiumStatus').defaultTo('basic'));
  await addColumnIfNotExists('projects', 'subdomain', (t) => t.string('subdomain').unique());
  await addColumnIfNotExists('projects', 'domain', (t) => t.text('domain'));
  await addColumnIfNotExists('store_products', 'variants', (t) => t.text('variants'));

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
    t.text('variants'); // JSON array of variant objects
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
    t.text('itemsJson'); // Store multiple items as JSON
    t.timestamp('createdAt').defaultTo(db.fn.now());
  });

  // Add missing columns to existing tables
  await addColumnIfNotExists('store_orders', 'itemsJson', (t) => t.text('itemsJson'));

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

  // Activity logs table (Everything the user does is recorded)
  await createIfNotExists('activity_logs', (t) => {
    t.increments('id').primary();
    t.integer('projectId');
    t.integer('userId').notNullable();
    t.string('action').notNullable(); // theme_saved, theme_published, product_created, etc.
    t.text('description');
    t.text('metadata'); // JSON
    t.timestamp('createdAt').defaultTo(db.fn.now());
  });

  // Shopalize feature flags table
  await createIfNotExists('shopalize_features', (t) => {
    t.increments('id').primary();
    t.string('key').unique().notNullable();
    t.string('name').notNullable();
    t.text('description');
    t.string('category').defaultTo('general');
    t.boolean('isEnabled').defaultTo(true);
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
    const studioSections = JSON.stringify([
      { type: 'header', settings: { storeName: 'Studio' } },
      { type: 'hero', settings: { title: 'Modern Essentials.', subtitle: 'Curated products for everyday living.', cta: 'Shop Collection' } },
      { type: 'products', settings: { title: 'Featured', columns: 3 } },
      { type: 'footer', settings: { text: '© 2026 Studio' } },
    ]);

    const originSections = JSON.stringify([
      { type: 'header', settings: { storeName: 'Origin' } },
      { type: 'hero', settings: { title: 'Return to Nature.', subtitle: 'Sustainable goods crafted with care.', cta: 'Explore' } },
      { type: 'products', settings: { title: 'New Arrivals', columns: 4 } },
      { type: 'testimonials', settings: {} },
      { type: 'footer', settings: { text: '© 2026 Origin Goods' } },
    ]);

    const boldSections = JSON.stringify([
      { type: 'header', settings: { storeName: 'BOLD' } },
      { type: 'hero', settings: { title: 'NEW SEASON.', subtitle: 'Unapologetic style.', cta: 'Shop Drop' } },
      { type: 'products', settings: { title: 'Trending', columns: 2 } },
      { type: 'footer', settings: { text: '© 2026 BOLD WORLDWIDE' } },
    ]);

    const craftSections = JSON.stringify([
      { type: 'header', settings: { storeName: 'Craft' } },
      { type: 'hero', settings: { title: 'Precision & Form', subtitle: 'Tools for the modern maker', cta: 'View Catalog' } },
      { type: 'features', settings: {} },
      { type: 'products', settings: { title: 'Top Rated', columns: 3 } },
      { type: 'footer', settings: { text: '© 2026 Craft' } },
    ]);

    const lumiereSections = JSON.stringify([
      { type: 'header', settings: { storeName: 'LUMIÈRE' } },
      { type: 'hero', settings: { title: 'Timeless Elegance', subtitle: 'Crafted with absolute precision.', cta: 'Discover' } },
      { type: 'products', settings: { title: 'Signature Collection', columns: 2 } },
      { type: 'gallery', settings: { title: 'The Atelier' } },
      { type: 'testimonials', settings: {} },
      { type: 'cta', settings: { title: 'Join the Club', text: 'Exclusive access to new arrivals', cta: 'Sign Up' } },
      { type: 'footer', settings: { text: '© 2026 Lumière Paris' } },
    ]);

    const velocitySections = JSON.stringify([
      { type: 'header', settings: { storeName: 'VELOCITY' } },
      { type: 'hero', settings: { title: 'OUTPERFORM.', subtitle: 'Next-generation performance wear.', cta: 'Shop Gear' } },
      { type: 'products', settings: { title: 'Latest Drops', columns: 4 } },
      { type: 'features', settings: {} },
      { type: 'footer', settings: { text: '© 2026 Velocity Systems' } },
    ]);

    const aestheticsSections = JSON.stringify([
      { type: 'header', settings: { storeName: 'AESTHETICA' } },
      { type: 'hero', settings: { title: 'Pure Radiance', subtitle: 'Scientifically formulated skincare.', cta: 'Shop Serums' } },
      { type: 'products', settings: { title: 'Bestsellers', columns: 3 } },
      { type: 'testimonials', settings: {} },
      { type: 'footer', settings: { text: '© 2026 Aesthetica Labs' } },
    ]);

    const momentumSections = JSON.stringify([
      { type: 'header', settings: { storeName: 'Momentum Tech' } },
      { type: 'hero', settings: { title: 'Future, Now.', subtitle: 'Next-gen devices for early adopters.', cta: 'Pre-Order' } },
      { type: 'features', settings: {} },
      { type: 'products', settings: { title: 'Flagship Devices', columns: 3 } },
      { type: 'newsletter', settings: {} },
      { type: 'footer', settings: { text: '© 2026 Momentum Inc.' } },
    ]);

    const aurumSections = JSON.stringify([
      { type: 'header', settings: { storeName: 'AURUM' } },
      { type: 'hero', settings: { title: 'The Art of Leather', subtitle: 'Exquisite bags for the modern journey.', cta: 'Explore Aurum' } },
      { type: 'features', settings: {} },
      { type: 'products', settings: { title: 'The Collection', columns: 3 } },
      { type: 'footer', settings: { text: '© 2026 Aurum Leather Goods' } },
    ]);

    await db('templates').insert([
      {
        name: 'Studio',
        slug: 'studio-base',
        category: 'Minimal',
        description: 'A clean, high-contrast foundational template designed for independent creators.',
        thumbnailUrl: '/templates/studio-thumb.png',
        previewUrl: '/templates/studio-preview.png',
        sectionsJson: studioSections,
        isActive: true,
      },
      {
        name: 'Origin',
        slug: 'origin-free',
        category: 'Lifestyle',
        description: 'An earthy, organic layout perfect for natural products and handmade goods.',
        thumbnailUrl: '/templates/origin-thumb.png',
        previewUrl: '/templates/origin-preview.png',
        sectionsJson: originSections,
        isActive: true,
      },
      {
        name: 'Bold',
        slug: 'bold-framework',
        category: 'Fashion',
        description: 'Heavy typography and striking contrast for streetwear and statement brands.',
        thumbnailUrl: '/templates/bold-thumb.png',
        previewUrl: '/templates/bold-preview.png',
        sectionsJson: boldSections,
        isActive: true,
      },
      {
        name: 'Craft',
        slug: 'craft-standard',
        category: 'Design',
        description: 'A structural, grid-based layout for artisans and specialized catalog displays.',
        thumbnailUrl: '/templates/craft-thumb.png',
        previewUrl: '/templates/craft-preview.png',
        sectionsJson: craftSections,
        isActive: true,
      },
      {
        name: 'Lumière',
        slug: 'lumiere-pro',
        category: 'Luxury',
        description: 'A highly sophisticated, editorial-style layout for high-end luxury, jewelry, or couture fashion.',
        thumbnailUrl: '/templates/lumiere-thumb.png',
        previewUrl: '/templates/lumiere-preview.png',
        sectionsJson: lumiereSections,
        isActive: true,
      },
      {
        name: 'Velocity',
        slug: 'velocity-pro',
        category: 'Sports',
        description: 'An aggressive, high-conversion layout designed specifically for athletic apparel and technical gear.',
        thumbnailUrl: '/templates/velocity-thumb.png',
        previewUrl: '/templates/velocity-preview.png',
        sectionsJson: velocitySections,
        isActive: true,
      },
      {
        name: 'Aesthetics',
        slug: 'aesthetics-pro',
        category: 'Beauty',
        description: 'A soft, immersive, and sensorial layout built for premium cosmetics and wellness brands.',
        thumbnailUrl: '/templates/aesthetics-thumb.png',
        previewUrl: '/templates/aesthetics-preview.png',
        sectionsJson: aestheticsSections,
        isActive: true,
      },
      {
        name: 'Momentum',
        slug: 'momentum-pro',
        category: 'Technology',
        description: 'A tech-forward, futuristic layout designed for consumer electronics and digital goods.',
        thumbnailUrl: '/templates/momentum-thumb.png',
        previewUrl: '/templates/momentum-preview.png',
        sectionsJson: momentumSections,
        isActive: true,
      },
      {
        name: 'Aurum',
        slug: 'aurum-bags',
        category: 'Luxury',
        description: 'A luxurious, tactile layout designed specifically for premium leather goods and designer bags.',
        thumbnailUrl: '/templates/aurum-thumb.png',
        previewUrl: '/templates/aurum-preview.png',
        sectionsJson: aurumSections,
        isActive: true,
      },
    ]);
    console.log('  Default templates seeded.');
  }

  // Migration: update templates if they don't match frontend IDs
  const hasStudioTemplate = await db('templates').where({ slug: 'studio-base' }).first();
  if (!hasStudioTemplate) {
    const oldTemplateCount = await db('templates').count('id as count').first();
    if (parseInt(oldTemplateCount.count) > 0) {
      // Clear old templates and re-seed with new ones
      await db('templates').delete();
      console.log('  Cleared old templates for re-seed.');
    }
    // Re-run the seed logic
    const templateCount2 = await db('templates').count('id as count').first();
    if (parseInt(templateCount2.count) === 0) {
      const studioSections = JSON.stringify([
        { type: 'header', settings: { storeName: 'Studio' } },
        { type: 'hero', settings: { title: 'Modern Essentials.', subtitle: 'Curated products for everyday living.', cta: 'Shop Collection' } },
        { type: 'products', settings: { title: 'Featured', columns: 3 } },
        { type: 'footer', settings: { text: '© 2026 Studio' } },
      ]);
      const originSections = JSON.stringify([
        { type: 'header', settings: { storeName: 'Origin' } },
        { type: 'hero', settings: { title: 'Return to Nature.', subtitle: 'Sustainable goods crafted with care.', cta: 'Explore' } },
        { type: 'products', settings: { title: 'New Arrivals', columns: 4 } },
        { type: 'testimonials', settings: {} },
        { type: 'footer', settings: { text: '© 2026 Origin Goods' } },
      ]);
      const boldSections = JSON.stringify([
        { type: 'header', settings: { storeName: 'BOLD' } },
        { type: 'hero', settings: { title: 'NEW SEASON.', subtitle: 'Unapologetic style.', cta: 'Shop Drop' } },
        { type: 'products', settings: { title: 'Trending', columns: 2 } },
        { type: 'footer', settings: { text: '© 2026 BOLD WORLDWIDE' } },
      ]);
      const craftSections = JSON.stringify([
        { type: 'header', settings: { storeName: 'Craft' } },
        { type: 'hero', settings: { title: 'Precision & Form', subtitle: 'Tools for the modern maker', cta: 'View Catalog' } },
        { type: 'features', settings: {} },
        { type: 'products', settings: { title: 'Top Rated', columns: 3 } },
        { type: 'footer', settings: { text: '© 2026 Craft' } },
      ]);
      const lumiereSections = JSON.stringify([
        { type: 'header', settings: { storeName: 'LUMIÈRE' } },
        { type: 'hero', settings: { title: 'Timeless Elegance', subtitle: 'Crafted with absolute precision.', cta: 'Discover' } },
        { type: 'products', settings: { title: 'Signature Collection', columns: 2 } },
        { type: 'gallery', settings: { title: 'The Atelier' } },
        { type: 'testimonials', settings: {} },
        { type: 'cta', settings: { title: 'Join the Club', text: 'Exclusive access to new arrivals', cta: 'Sign Up' } },
        { type: 'footer', settings: { text: '© 2026 Lumière Paris' } },
      ]);
      const velocitySections = JSON.stringify([
        { type: 'header', settings: { storeName: 'VELOCITY' } },
        { type: 'hero', settings: { title: 'OUTPERFORM.', subtitle: 'Next-generation performance wear.', cta: 'Shop Gear' } },
        { type: 'products', settings: { title: 'Latest Drops', columns: 4 } },
        { type: 'features', settings: {} },
        { type: 'footer', settings: { text: '© 2026 Velocity Systems' } },
      ]);
      const aestheticsSections = JSON.stringify([
        { type: 'header', settings: { storeName: 'AESTHETICA' } },
        { type: 'hero', settings: { title: 'Pure Radiance', subtitle: 'Scientifically formulated skincare.', cta: 'Shop Serums' } },
        { type: 'products', settings: { title: 'Bestsellers', columns: 3 } },
        { type: 'testimonials', settings: {} },
        { type: 'footer', settings: { text: '© 2026 Aesthetica Labs' } },
      ]);
      const momentumSections = JSON.stringify([
        { type: 'header', settings: { storeName: 'Momentum Tech' } },
        { type: 'hero', settings: { title: 'Future, Now.', subtitle: 'Next-gen devices for early adopters.', cta: 'Pre-Order' } },
        { type: 'features', settings: {} },
        { type: 'products', settings: { title: 'Flagship Devices', columns: 3 } },
        { type: 'newsletter', settings: {} },
        { type: 'footer', settings: { text: '© 2026 Momentum Inc.' } },
      ]);
      const aurumSections = JSON.stringify([
        { type: 'header', settings: { storeName: 'AURUM' } },
        { type: 'hero', settings: { title: 'The Art of Leather', subtitle: 'Exquisite bags for the modern journey.', cta: 'Explore Aurum' } },
        { type: 'features', settings: {} },
        { type: 'products', settings: { title: 'The Collection', columns: 3 } },
        { type: 'footer', settings: { text: '© 2026 Aurum Leather Goods' } },
      ]);
      await db('templates').insert([
        { name: 'Studio', slug: 'studio-base', category: 'Minimal', description: 'A clean, high-contrast foundational template designed for independent creators.', thumbnailUrl: '/templates/studio-thumb.png', previewUrl: '/templates/studio-preview.png', sectionsJson: studioSections, isActive: true },
        { name: 'Origin', slug: 'origin-free', category: 'Lifestyle', description: 'An earthy, organic layout perfect for natural products and handmade goods.', thumbnailUrl: '/templates/origin-thumb.png', previewUrl: '/templates/origin-preview.png', sectionsJson: originSections, isActive: true },
        { name: 'Bold', slug: 'bold-framework', category: 'Fashion', description: 'Heavy typography and striking contrast for streetwear and statement brands.', thumbnailUrl: '/templates/bold-thumb.png', previewUrl: '/templates/bold-preview.png', sectionsJson: boldSections, isActive: true },
        { name: 'Craft', slug: 'craft-standard', category: 'Design', description: 'A structural, grid-based layout for artisans and specialized catalog displays.', thumbnailUrl: '/templates/craft-thumb.png', previewUrl: '/templates/craft-preview.png', sectionsJson: craftSections, isActive: true },
        { name: 'Lumière', slug: 'lumiere-pro', category: 'Luxury', description: 'A highly sophisticated, editorial-style layout for high-end luxury, jewelry, or couture fashion.', thumbnailUrl: '/templates/lumiere-thumb.png', previewUrl: '/templates/lumiere-preview.png', sectionsJson: lumiereSections, isActive: true },
        { name: 'Velocity', slug: 'velocity-pro', category: 'Sports', description: 'An aggressive, high-conversion layout designed specifically for athletic apparel and technical gear.', thumbnailUrl: '/templates/velocity-thumb.png', previewUrl: '/templates/velocity-preview.png', sectionsJson: velocitySections, isActive: true },
        { name: 'Aesthetics', slug: 'aesthetics-pro', category: 'Beauty', description: 'A soft, immersive, and sensorial layout built for premium cosmetics and wellness brands.', thumbnailUrl: '/templates/aesthetics-thumb.png', previewUrl: '/templates/aesthetics-preview.png', sectionsJson: aestheticsSections, isActive: true },
        { name: 'Momentum', slug: 'momentum-pro', category: 'Technology', description: 'A tech-forward, futuristic layout designed for consumer electronics and digital goods.', thumbnailUrl: '/templates/momentum-thumb.png', previewUrl: '/templates/momentum-preview.png', sectionsJson: momentumSections, isActive: true },
        { name: 'Aurum', slug: 'aurum-bags', category: 'Luxury', description: 'A luxurious, tactile layout designed specifically for premium leather goods and designer bags.', thumbnailUrl: '/templates/aurum-thumb.png', previewUrl: '/templates/aurum-preview.png', sectionsJson: aurumSections, isActive: true },
      ]);
      console.log('  Templates re-seeded with frontend-compatible IDs.');
    }
  }

  console.log('shopalize_db migrations complete.');
}

if (process.argv[1] && process.argv[1].includes('migrate.js')) {
  migrate().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}

export default migrate;
