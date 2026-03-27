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
    t.text('ripplifyTransactionId');
    t.timestamp('createdAt').defaultTo(db.fn.now());
  });

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
