import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
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

// Get all subdomains
router.get('/subdomains', async (req, res) => {
  try {
    const rows = await db('subdomains').orderBy('created_at', 'desc');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get subdomain by ID
router.get('/subdomains/:id', async (req, res) => {
  try {
    const rows = await db('subdomains').where('id', req.params.id);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Subdomain not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new subdomain
router.post('/subdomains', async (req, res) => {
  try {
    const { subdomain, domain, project_id, user_id, target, ip_address } = req.body;
    
    const existing = await db('subdomains').where('subdomain', subdomain).first();
    if (existing) {
      return res.status(400).json({ error: 'Subdomain already exists' });
    }

    const [id] = await db('subdomains').insert({
      subdomain,
      domain: domain || 'sokostack.xyz',
      project_id,
      user_id,
      target,
      ip_address,
      ssl_enabled: true,
      status: 'active',
    });

    const newSubdomain = await db('subdomains').where('id', id).first();
    res.status(201).json(newSubdomain);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update subdomain
router.put('/subdomains/:id', async (req, res) => {
  try {
    const { target, ip_address, ssl_enabled, status } = req.body;
    const updates = {};
    if (target !== undefined) updates.target = target;
    if (ip_address !== undefined) updates.ip_address = ip_address;
    if (ssl_enabled !== undefined) updates.ssl_enabled = ssl_enabled;
    if (status !== undefined) updates.status = status;
    updates.updated_at = new Date().toISOString();

    await db('subdomains').where('id', req.params.id).update(updates);
    const updated = await db('subdomains').where('id', req.params.id).first();
    
    if (!updated) {
      return res.status(404).json({ error: 'Subdomain not found' });
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete subdomain
router.delete('/subdomains/:id', async (req, res) => {
  try {
    const deleted = await db('subdomains').where('id', req.params.id).del();
    if (!deleted) {
      return res.status(404).json({ error: 'Subdomain not found' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get subdomain stats summary
router.get('/subdomains/stats/summary', async (req, res) => {
  try {
    const total = await db('subdomains').count('* as count').first();
    const active = await db('subdomains').where('status', 'active').count('* as count').first();
    const pending = await db('subdomains').where('status', 'pending').count('* as count').first();
    const ssl_enabled = await db('subdomains').where('ssl_enabled', true).count('* as count').first();

    res.json({
      total: total.count,
      active: active.count,
      pending: pending.count,
      ssl_enabled: ssl_enabled.count,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
