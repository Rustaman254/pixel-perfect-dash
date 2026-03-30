import knex from 'knex';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function migrate() {
  console.log('Running DNS database migrations...');
  
  const db = knex({
    client: 'better-sqlite3',
    connection: {
      filename: path.resolve(__dirname, '..', '..', 'dns_db.sqlite'),
    },
    useNullAsDefault: true,
  });

  // Create subdomains table
  const hasSubdomains = await db.schema.hasTable('subdomains');
  if (!hasSubdomains) {
    await db.schema.createTable('subdomains', (table) => {
      table.increments('id').primary();
      table.string('subdomain', 63).notNullable().unique();
      table.string('domain', 255).notNullable().defaultTo('sokostack.xyz');
      table.integer('project_id');
      table.integer('user_id');
      table.string('target', 255).notNullable();
      table.string('ip_address', 45);
      table.boolean('ssl_enabled').defaultTo(true);
      table.text('ssl_cert');
      table.text('ssl_key');
      table.text('ssl_ca');
      table.enum('status', ['pending', 'active', 'suspended', 'deleted']).defaultTo('pending');
      table.timestamp('created_at').defaultTo(db.fn.now());
      table.timestamp('updated_at').defaultTo(db.fn.now());
      table.date('expires_at');
    });
    await db.schema.alterTable('subdomains', (table) => {
      table.index('subdomain');
      table.index('domain');
      table.index('project_id');
      table.index('status');
    });
  }

  // Create custom_domains table
  const hasCustomDomains = await db.schema.hasTable('custom_domains');
  if (!hasCustomDomains) {
    await db.schema.createTable('custom_domains', (table) => {
      table.increments('id').primary();
      table.string('domain', 255).notNullable().unique();
      table.integer('project_id');
      table.integer('user_id');
      table.string('registrar', 255);
      table.date('registration_date');
      table.date('expiration_date');
      table.boolean('auto_renew').defaultTo(false);
      table.boolean('privacy_protection').defaultTo(false);
      table.json('nameservers');
      table.json('dns_records');
      table.string('target', 255);
      table.boolean('ssl_enabled').defaultTo(false);
      table.text('ssl_cert');
      table.text('ssl_key');
      table.text('ssl_ca');
      table.date('ssl_expiry');
      table.string('verification_token', 255);
      table.enum('verification_status', ['pending', 'verified', 'failed']).defaultTo('pending');
      table.enum('status', ['pending', 'active', 'suspended', 'expired', 'deleted']).defaultTo('pending');
      table.timestamp('created_at').defaultTo(db.fn.now());
      table.timestamp('updated_at').defaultTo(db.fn.now());
    });
    await db.schema.alterTable('custom_domains', (table) => {
      table.index('domain');
      table.index('project_id');
      table.index('status');
      table.index('expiration_date');
    });
  }

  // Create dns_records table
  const hasDnsRecords = await db.schema.hasTable('dns_records');
  if (!hasDnsRecords) {
    await db.schema.createTable('dns_records', (table) => {
      table.increments('id').primary();
      table.integer('domain_id').references('id').inTable('custom_domains').onDelete('CASCADE');
      table.string('subdomain', 255);
      table.enum('type', ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV', 'CAA']).notNullable();
      table.string('name', 255).notNullable();
      table.text('value').notNullable();
      table.integer('priority').defaultTo(10);
      table.integer('ttl').defaultTo(300);
      table.integer('weight').defaultTo(100);
      table.integer('port').defaultTo(80);
      table.integer('flags');
      table.string('tag', 255);
      table.timestamp('created_at').defaultTo(db.fn.now());
      table.timestamp('updated_at').defaultTo(db.fn.now());
    });
    await db.schema.alterTable('dns_records', (table) => {
      table.index('domain_id');
      table.index('type');
      table.index('name');
    });
  }

  // Create domain_registrations table
  const hasDomainRegistrations = await db.schema.hasTable('domain_registrations');
  if (!hasDomainRegistrations) {
    await db.schema.createTable('domain_registrations', (table) => {
      table.increments('id').primary();
      table.string('domain', 255).notNullable().unique();
      table.string('tld', 50).notNullable();
      table.integer('project_id');
      table.integer('user_id');
      table.string('registrar', 255);
      table.date('registration_date').notNullable();
      table.date('expiration_date').notNullable();
      table.boolean('auto_renew').defaultTo(true);
      table.boolean('privacy_protection').defaultTo(false);
      table.json('contact_info');
      table.json('nameservers').defaultTo('["ns1.dnshost.com", "ns2.dnshost.com"]');
      table.enum('status', ['pending', 'registered', 'active', 'suspended', 'expired', 'cancelled', 'transferred']).defaultTo('pending');
      table.decimal('price', 10, 2).defaultTo(0.00);
      table.string('currency', 3).defaultTo('USD');
      table.timestamp('created_at').defaultTo(db.fn.now());
      table.timestamp('updated_at').defaultTo(db.fn.now());
    });
    await db.schema.alterTable('domain_registrations', (table) => {
      table.index('domain');
      table.index('tld');
      table.index('project_id');
      table.index('status');
      table.index('expiration_date');
    });
  }

  // Create dns_analytics table
  const hasDnsAnalytics = await db.schema.hasTable('dns_analytics');
  if (!hasDnsAnalytics) {
    await db.schema.createTable('dns_analytics', (table) => {
      table.bigIncrements('id').primary();
      table.string('domain', 255).notNullable();
      table.string('query_type', 10).notNullable();
      table.integer('response_time_ms');
      table.enum('result', ['success', 'nxdomain', 'error', 'timeout']).notNullable();
      table.string('source_ip', 45);
      table.string('country', 2);
      table.string('user_agent', 255);
      table.boolean('cached').defaultTo(false);
      table.timestamp('created_at').defaultTo(db.fn.now());
    });
    await db.schema.alterTable('dns_analytics', (table) => {
      table.index('domain');
      table.index('query_type');
      table.index('result');
      table.index('created_at');
      table.index(['domain', 'created_at']);
    });
  }

  // Create ssl_certificates table
  const hasSslCertificates = await db.schema.hasTable('ssl_certificates');
  if (!hasSslCertificates) {
    await db.schema.createTable('ssl_certificates', (table) => {
      table.increments('id').primary();
      table.string('domain', 255).notNullable().unique();
      table.enum('type', ['letsencrypt', 'comodo', 'digicert', 'custom']).defaultTo('letsencrypt');
      table.text('cert').notNullable();
      table.text('private_key').notNullable();
      table.text('ca_bundle');
      table.string('issuer', 255);
      table.string('subject', 255);
      table.date('valid_from').notNullable();
      table.date('valid_until').notNullable();
      table.boolean('auto_renew').defaultTo(true);
      table.enum('renewal_status', ['pending', 'renewed', 'failed']).defaultTo('pending');
      table.string('challenge_token', 255);
      table.enum('challenge_type', ['http01', 'dns01', 'tlsalpn01']).defaultTo('http01');
      table.timestamp('created_at').defaultTo(db.fn.now());
      table.timestamp('updated_at').defaultTo(db.fn.now());
    });
    await db.schema.alterTable('ssl_certificates', (table) => {
      table.index('domain');
      table.index('valid_until');
      table.index('auto_renew');
    });
  }

  // Create nameservers table
  const hasNameservers = await db.schema.hasTable('nameservers');
  if (!hasNameservers) {
    await db.schema.createTable('nameservers', (table) => {
      table.increments('id').primary();
      table.string('nameserver', 255).notNullable().unique();
      table.string('ip_address', 45).notNullable();
      table.string('ipv6_address', 45);
      table.string('provider', 255);
      table.enum('status', ['active', 'inactive', 'maintenance']).defaultTo('active');
      table.timestamp('created_at').defaultTo(db.fn.now());
      table.timestamp('updated_at').defaultTo(db.fn.now());
    });
    await db.schema.alterTable('nameservers', (table) => {
      table.index('nameserver');
      table.index('ip_address');
    });
  }

  // Insert default nameservers
  const count = await db('nameservers').count('* as cnt').first();
  if (count.cnt === 0) {
    await db('nameservers').insert([
      { nameserver: 'ns1.shopalize.com', ip_address: '1.2.3.4', provider: 'Cloudflare' },
      { nameserver: 'ns2.shopalize.com', ip_address: '5.6.7.8', provider: 'Cloudflare' },
      { nameserver: 'ns1.dnshost.com', ip_address: '10.0.0.1', provider: 'Internal' },
      { nameserver: 'ns2.dnshost.com', ip_address: '10.0.0.2', provider: 'Internal' },
    ]);
  }

  console.log('DNS database migrations completed successfully!');
  await db.destroy();
}

export { migrate };
