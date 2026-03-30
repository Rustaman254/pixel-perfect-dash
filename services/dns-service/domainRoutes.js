import { Router } from 'express';
import knex from 'knex';
import path from 'path';
import { fileURLToPath } from 'url';

const router = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = knex({
  client: 'better-sqlite3',
  connection: {
    filename: path.resolve(__dirname, '..', '..', 'dns_db.sqlite'),
  },
  useNullAsDefault: true,
});

function getPriceForTLD(tld) {
  const prices = {
    com: 12.99,
    net: 14.99,
    org: 11.99,
    io: 39.99,
    co: 25.99,
    xyz: 9.99,
    info: 8.99,
    biz: 9.99,
    me: 19.99,
    us: 9.99,
    uk: 10.99,
    de: 12.99,
    fr: 12.99,
    ke: 29.99,
    ng: 24.99,
    za: 19.99,
  };
  return prices[tld] || 19.99;
}

// Get all custom domains
router.get('/', async (req, res) => {
  try {
    const rows = await db('custom_domains').orderBy('created_at', 'desc');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get domain by ID
router.get('/:id', async (req, res) => {
  try {
    const rows = await db('custom_domains').where('id', req.params.id);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Domain not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search domains (for domain availability check)
router.get('/search/:domain', async (req, res) => {
  try {
    const { domain } = req.params;
    const tld = domain.split('.').pop();
    
    const existing = await db('custom_domains').where('domain', domain).orWhere('domain', 'like', `%.${domain}`);
    const registered = await db('domain_registrations').where('domain', domain).orWhere('domain', 'like', `%.${domain}`);

    const isAvailable = existing.length === 0 && registered.length === 0;
    
    res.json({
      domain,
      tld,
      available: isAvailable,
      price: getPriceForTLD(tld),
      renewalPrice: getPriceForTLD(tld) * 1.2,
      registrationPeriods: [1, 2, 3, 5, 10]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register/connect custom domain
router.post('/', async (req, res) => {
  try {
    const { domain, project_id, user_id, target, nameservers } = req.body;
    
    if (!domain) {
      return res.status(400).json({ error: 'Domain is required' });
    }

    const existing = await db('custom_domains').where('domain', domain).first();
    
    if (existing) {
      return res.status(409).json({ error: 'Domain already connected' });
    }

    const verificationToken = `verify_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const [id] = await db('custom_domains').insert({
      domain,
      project_id,
      user_id,
      target: target || '127.0.0.1',
      verification_token: verificationToken,
      status: 'pending',
      verification_status: 'pending',
      nameservers: JSON.stringify(nameservers || ['ns1.shopalize.com', 'ns2.shopalize.com']),
    });

    const newDomain = await db('custom_domains').where('id', id).first();
    res.status(201).json(newDomain);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update domain
router.put('/:id', async (req, res) => {
  try {
    const { target, ssl_enabled, status, nameservers, privacy_protection, auto_renew } = req.body;
    const updates = {};

    if (target !== undefined) updates.target = target;
    if (ssl_enabled !== undefined) updates.ssl_enabled = ssl_enabled;
    if (status !== undefined) updates.status = status;
    if (nameservers !== undefined) updates.nameservers = JSON.stringify(nameservers);
    if (privacy_protection !== undefined) updates.privacy_protection = privacy_protection;
    if (auto_renew !== undefined) updates.auto_renew = auto_renew;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.updated_at = new Date().toISOString();
    await db('custom_domains').where('id', req.params.id).update(updates);

    const updated = await db('custom_domains').where('id', req.params.id).first();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify domain ownership
router.post('/:id/verify', async (req, res) => {
  try {
    const { token } = req.body;

    const domain = await db('custom_domains').where('id', req.params.id).first();
    
    if (!domain) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    if (domain.verification_token === token) {
      await db('custom_domains').where('id', req.params.id).update({
        verification_status: 'verified',
        status: 'active',
        updated_at: new Date().toISOString(),
      });
      return res.json({ message: 'Domain verified successfully', verified: true });
    }

    res.status(400).json({ error: 'Invalid verification token', verified: false });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete domain
router.delete('/:id', async (req, res) => {
  try {
    await db('custom_domains').where('id', req.params.id).update({ status: 'deleted', updated_at: new Date().toISOString() });
    res.json({ message: 'Domain disconnected successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get DNS records for domain
router.get('/:id/records', async (req, res) => {
  try {
    const rows = await db('dns_records').where('domain_id', req.params.id);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add DNS record
router.post('/:id/records', async (req, res) => {
  try {
    const { type, name, value, priority, ttl } = req.body;

    if (!type || !name || !value) {
      return res.status(400).json({ error: 'Type, name, and value are required' });
    }

    const [id] = await db('dns_records').insert({
      domain_id: req.params.id,
      type,
      name,
      value,
      priority: priority || 10,
      ttl: ttl || 300,
    });

    const newRecord = await db('dns_records').where('id', id).first();
    res.status(201).json(newRecord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update DNS record
router.put('/:id/records/:recordId', async (req, res) => {
  try {
    const { type, name, value, priority, ttl } = req.body;
    const updates = {};

    if (type) updates.type = type;
    if (name) updates.name = name;
    if (value) updates.value = value;
    if (priority !== undefined) updates.priority = priority;
    if (ttl !== undefined) updates.ttl = ttl;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.updated_at = new Date().toISOString();
    await db('dns_records').where('id', req.params.recordId).update(updates);

    const updated = await db('dns_records').where('id', req.params.recordId).first();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete DNS record
router.delete('/:id/records/:recordId', async (req, res) => {
  try {
    await db('dns_records').where('id', req.params.recordId).del();
    res.json({ message: 'DNS record deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get domain statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const total = await db('custom_domains').where('status', '!=', 'deleted').count('* as count').first();
    const active = await db('custom_domains').where('status', 'active').count('* as count').first();
    const pending = await db('custom_domains').where('verification_status', 'pending').count('* as count').first();
    const ssl = await db('custom_domains').where('ssl_enabled', true).where('status', 'active').count('* as count').first();

    res.json({
      total: total.count,
      active: active.count,
      pending_verification: pending.count,
      ssl_enabled: ssl.count,
      expiring_soon: 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
