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

// Record DNS query
router.post('/query', async (req, res) => {
  try {
    const { domain, query_type, response_time_ms, result, source_ip, country, user_agent, cached } = req.body;
    
    await db('dns_analytics').insert({
      domain,
      query_type,
      response_time_ms,
      result,
      source_ip,
      country,
      user_agent,
      cached: cached || false,
    });
    res.json({ message: 'Query recorded' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get query analytics
router.get('/queries', async (req, res) => {
  try {
    const { domain, from, to, limit = 100, offset = 0 } = req.query;

    let query = db('dns_analytics').select('*');

    if (domain) query = query.where('domain', domain);
    if (from) query = query.where('created_at', '>=', from);
    if (to) query = query.where('created_at', '<=', to);

    query = query.orderBy('created_at', 'desc').limit(parseInt(limit)).offset(parseInt(offset));

    const rows = await query;
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get query statistics
router.get('/stats', async (req, res) => {
  try {
    const { domain, period = '24h' } = req.query;

    const now = new Date();
    let fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    if (period === '7d') fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (period === '30d') fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    if (period === '90d') fromDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    let baseQuery = db('dns_analytics').where('created_at', '>=', fromDate.toISOString());
    if (domain) baseQuery = baseQuery.where('domain', domain);

    const total = await baseQuery.clone().count('* as count').first();
    const byType = await baseQuery.clone().select('query_type').count('* as count').groupBy('query_type');
    const byResult = await baseQuery.clone().select('result').count('* as count').groupBy('result');
    const avgResponse = await baseQuery.clone().whereNotNull('response_time_ms').avg('response_time_ms as avg');
    const topDomains = await db('dns_analytics')
      .select('domain')
      .count('* as count')
      .where('created_at', '>=', fromDate.toISOString())
      .groupBy('domain')
      .orderBy('count', 'desc')
      .limit(10);
    
    const overTime = await db('dns_analytics')
      .select(db.raw("DATE(created_at) as date"))
      .count('* as count')
      .where('created_at', '>=', fromDate.toISOString())
      .groupBy(db.raw("DATE(created_at)"))
      .orderBy('date');

    const cached = await baseQuery.clone().where('cached', true).count('* as count').first();

    res.json({
      totalQueries: total.count,
      byType,
      byResult,
      averageResponseTime: avgResponse.avg || 0,
      topDomains,
      overTime,
      cacheHitRate: total.count > 0 ? ((cached.count / total.count) * 100).toFixed(2) : 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get real-time queries (last 100)
router.get('/realtime', async (req, res) => {
  try {
    const rows = await db('dns_analytics').orderBy('created_at', 'desc').limit(100);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get error queries
router.get('/errors', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const rows = await db('dns_analytics')
      .where('result', '!=', 'success')
      .orderBy('created_at', 'desc')
      .limit(parseInt(limit));
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get slow queries
router.get('/slow', async (req, res) => {
  try {
    const { threshold = 1000, limit = 50 } = req.query;
    const rows = await db('dns_analytics')
      .where('response_time_ms', '>', parseInt(threshold))
      .orderBy('response_time_ms', 'desc')
      .limit(parseInt(limit));
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get geographic distribution
router.get('/geo', async (req, res) => {
  try {
    const { domain, period = '24h' } = req.query;

    const now = new Date();
    let fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    if (period === '7d') fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (period === '30d') fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let query = db('dns_analytics')
      .select('country')
      .count('* as count')
      .avg('response_time_ms as avg_response')
      .where('created_at', '>=', fromDate.toISOString())
      .whereNotNull('country')
      .groupBy('country')
      .orderBy('count', 'desc');

    if (domain) query = query.where('domain', domain);

    const rows = await query;
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
