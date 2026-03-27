import { createConnection } from '../shared/db.js';
import geoip from 'geoip-lite';
import { v4 as uuidv4 } from 'uuid';

const db = () => createConnection('watchtower_db');

// POST /api/watchtower/ingest - PUBLIC
export const ingestData = async (req, res) => {
  try {
    const { session, events } = req.body;

    if (!session || !session.projectId) {
      return res.status(400).json({ error: 'Missing session or projectId' });
    }

    if (!session.sessionId) {
      session.sessionId = uuidv4();
    }

    const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;
    const geo = geoip.lookup(clientIp);
    const country = geo ? geo.country : session.country || 'Unknown';
    const city = geo ? geo.city : session.city || 'Unknown';

    const sessionData = {
      userId: parseInt(session.projectId) || 0,
      sessionId: session.sessionId,
      device: session.device || 'Unknown',
      browser: session.browser || 'Unknown',
      os: session.os || 'Unknown',
      country,
      city,
      duration: session.duration || 0,
      pageViews: session.pageViews || (events?.filter(e => e.type === 'pageview').length || 1),
      isRageClick: false,
      isDeadClick: false,
      endUserId: session.endUserId || session.userId || null,
      metadata: session.timezone ? `Timezone: ${session.timezone}` : (session.metadata || null),
    };

    // Check if session exists
    const existing = await db()('insight_sessions').where({ sessionId: session.sessionId }).first();

    if (!existing) {
      await db()('insight_sessions').insert(sessionData);
    } else {
      // Update pageViews and duration
      const pageViewCount = (events?.filter(e => e.type === 'pageview').length || 0);
      await db()('insight_sessions')
        .where({ sessionId: session.sessionId })
        .update({
          pageViews: existing.pageViews + pageViewCount,
          duration: session.duration || existing.duration,
        });
    }

    // Insert events
    if (events && events.length > 0) {
      const eventRows = events.map(event => ({
        sessionId: session.sessionId,
        type: event.type,
        target: event.target || null,
        url: event.url || null,
        data: typeof event.data === 'string' ? event.data : JSON.stringify(event.data),
        timestamp: event.timestamp || new Date().toISOString(),
      }));

      await db()('insight_events').insert(eventRows);

      // Check for rage clicks and dead clicks
      const hasRageClick = events.some(e => e.type === 'rage_click');
      const hasDeadClick = events.some(e => e.type === 'dead_click');

      if (hasRageClick || hasDeadClick) {
        const update = {};
        if (hasRageClick) update.isRageClick = true;
        if (hasDeadClick) update.isDeadClick = true;
        await db()('insight_sessions').where({ sessionId: session.sessionId }).update(update);
      }
    }

    res.status(201).json({ message: 'Data ingested successfully', sessionId: session.sessionId });
  } catch (error) {
    console.error('Ingest error:', error);
    res.status(500).json({ error: error.message });
  }
};

// GET /api/watchtower/overview - Auth required
export const getOverview = async (req, res) => {
  try {
    const userId = req.user.id;

    const behavioralStats = await db()('insight_sessions')
      .where({ userId })
      .count('id as totalSessions')
      .sum('pageViews as totalPageViews')
      .avg('duration as avgDuration')
      .first();

    const rageClickSessionCount = await db()('insight_sessions')
      .where({ userId, isRageClick: true })
      .count('id as count')
      .first();

    const deadClickCount = await db()('insight_events')
      .whereIn('sessionId', function () {
        this.select('sessionId').from('insight_sessions').where({ userId });
      })
      .where({ type: 'dead_click' })
      .count('id as count')
      .first();

    const rageClickCount = await db()('insight_events')
      .whereIn('sessionId', function () {
        this.select('sessionId').from('insight_sessions').where({ userId });
      })
      .where({ type: 'rage_click' })
      .count('id as count')
      .first();

    const sessionsOverTime = await db()('insight_sessions')
      .select(db().raw("DATE(\"createdAt\") as date"))
      .count('id as count')
      .where({ userId })
      .andWhere(db().raw('"createdAt" >= NOW() - INTERVAL \'30 days\''))
      .groupByRaw('DATE("createdAt")')
      .orderByRaw('DATE("createdAt") DESC')
      .limit(30);

    const topPages = await db()('insight_events')
      .select('url')
      .count('id as views')
      .whereIn('sessionId', function () {
        this.select('sessionId').from('insight_sessions').where({ userId });
      })
      .where({ type: 'pageview' })
      .whereNotNull('url')
      .groupBy('url')
      .orderBy('views', 'desc')
      .limit(10);

    res.json({
      totalSessions: parseInt(behavioralStats.totalSessions) || 0,
      totalPageViews: parseInt(behavioralStats.totalPageViews) || 0,
      avgDuration: Math.round(parseFloat(behavioralStats.avgDuration) || 0),
      rageClicks: parseInt(rageClickCount.count) || parseInt(rageClickSessionCount.count) || 0,
      deadClicks: parseInt(deadClickCount.count) || 0,
      sessionsOverTime: sessionsOverTime.reverse(),
      topPages,
    });
  } catch (error) {
    console.error('Get overview error:', error);
    res.status(500).json({ error: error.message });
  }
};

// GET /api/watchtower/sessions - Auth required
export const getSessions = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    const startDate = req.query.startDate || null;
    const endDate = req.query.endDate || null;
    const countOnly = req.query.countOnly === 'true';

    let query = db()('insight_sessions').where({ userId });
    let countQuery = db()('insight_sessions').where({ userId });

    if (startDate) {
      query = query.where(db().raw('"createdAt" >= ?', [startDate]));
      countQuery = countQuery.where(db().raw('"createdAt" >= ?', [startDate]));
    }
    if (endDate) {
      query = query.where(db().raw('"createdAt" <= ?', [endDate]));
      countQuery = countQuery.where(db().raw('"createdAt" <= ?', [endDate]));
    }

    if (countOnly) {
      const result = await countQuery.count('id as count').first();
      return res.json({ count: parseInt(result.count) || 0 });
    }

    const sessions = await query
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(offset);

    const total = await countQuery.count('id as count').first();

    res.json({ sessions, total: parseInt(total.count) || 0 });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: error.message });
  }
};

// GET /api/watchtower/sessions/:id - Auth required
export const getSessionDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const session = await db()('insight_sessions').where({ sessionId: id }).first();
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const events = await db()('insight_events')
      .where({ sessionId: id })
      .orderBy('timestamp', 'asc');

    res.json({ ...session, events });
  } catch (error) {
    console.error('Get session detail error:', error);
    res.status(500).json({ error: error.message });
  }
};

// GET /api/watchtower/entity/:id - Auth required
export const getEntityAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query;
    const entityType = type || 'payment-link';

    const mapping = await db()('insight_entity_mappings')
      .where({ entityId: parseInt(id), entityType })
      .first();

    if (!mapping) {
      return res.status(404).json({ message: 'Analytics not found for this entity' });
    }

    const sessions = await db()('insight_sessions')
      .whereIn('sessionId', function () {
        this.select('sessionId').from('insight_events').where('url', 'like', `%${mapping.clarityId}%`);
      })
      .limit(10);

    const eventCount = await db()('insight_events')
      .where('url', 'like', `%${mapping.clarityId}%`)
      .count('id as count')
      .first();

    res.json({
      mapping,
      sessionCount: sessions.length,
      totalEvents: parseInt(eventCount.count) || 0,
      sessions,
    });
  } catch (error) {
    console.error('Get entity analytics error:', error);
    res.status(500).json({ error: error.message });
  }
};

// GET /api/watchtower/products - Auth required
export const getProductInsights = async (req, res) => {
  try {
    const userId = req.user.id;

    const mappings = await db()('insight_entity_mappings')
      .where({ entityType: 'payment-link' })
      .orderBy('createdAt', 'desc');

    const insights = [];

    for (const mapping of mappings) {
      const visitCount = await db()('insight_events')
        .where('url', 'like', `%${mapping.clarityId}%`)
        .where({ type: 'pageview' })
        .countDistinct('sessionId as count')
        .first();

      const clickCount = await db()('insight_events')
        .where('url', 'like', `%${mapping.clarityId}%`)
        .where({ type: 'click' })
        .count('id as count')
        .first();

      const visits = parseInt(visitCount.count) || 0;
      const clicks = parseInt(clickCount.count) || 0;
      const convRate = visits > 0 ? ((clicks / visits) * 100).toFixed(1) : 0;

      insights.push({
        id: mapping.id,
        entityId: mapping.entityId,
        clarityId: mapping.clarityId,
        visits,
        clicks,
        conversionRate: convRate,
        health: convRate > 10 ? 'Healthy' : convRate > 2 ? 'Needs Attention' : 'Critical',
      });
    }

    res.json(insights);
  } catch (error) {
    console.error('Get product insights error:', error);
    res.status(500).json({ error: error.message });
  }
};

// GET /api/watchtower/internal/platform-overview - Internal auth
export const getPlatformOverview = async (req, res) => {
  try {
    const behavioralStats = await db()('insight_sessions')
      .count('id as totalSessions')
      .sum('pageViews as totalPageViews')
      .avg('duration as avgDuration')
      .first();

    const rageClickCount = await db()('insight_sessions')
      .where({ isRageClick: true })
      .count('id as count')
      .first();

    const deadClickCount = await db()('insight_sessions')
      .where({ isDeadClick: true })
      .count('id as count')
      .first();

    const uniqueUsers = await db()('insight_sessions')
      .countDistinct('userId as count')
      .first();

    const sessionsOverTime = await db()('insight_sessions')
      .select(db().raw("DATE(\"createdAt\") as date"))
      .count('id as count')
      .where(db().raw('"createdAt" >= NOW() - INTERVAL \'30 days\''))
      .groupByRaw('DATE("createdAt")')
      .orderByRaw('DATE("createdAt") DESC');

    res.json({
      totalSessions: parseInt(behavioralStats.totalSessions) || 0,
      totalPageViews: parseInt(behavioralStats.totalPageViews) || 0,
      avgDuration: Math.round(parseFloat(behavioralStats.avgDuration) || 0),
      totalRageClicks: parseInt(rageClickCount.count) || 0,
      totalDeadClicks: parseInt(deadClickCount.count) || 0,
      uniqueUsers: parseInt(uniqueUsers.count) || 0,
      sessionsOverTime: sessionsOverTime.reverse(),
    });
  } catch (error) {
    console.error('Get platform overview error:', error);
    res.status(500).json({ error: error.message });
  }
};

// POST /api/watchtower/internal/events - Internal auth
export const pushEvent = async (req, res) => {
  try {
    const { sessionId, type, target, url, data } = req.body;

    if (!sessionId || !type) {
      return res.status(400).json({ message: 'sessionId and type are required' });
    }

    const session = await db()('insight_sessions').where({ sessionId }).first();
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const [event] = await db()('insight_events')
      .insert({
        sessionId,
        type,
        target: target || null,
        url: url || null,
        data: data ? (typeof data === 'string' ? data : JSON.stringify(data)) : null,
      })
      .returning('*');

    if (type === 'rage_click') {
      await db()('insight_sessions').where({ sessionId }).update({ isRageClick: true });
    }
    if (type === 'dead_click') {
      await db()('insight_sessions').where({ sessionId }).update({ isDeadClick: true });
    }

    res.status(201).json(event);
  } catch (error) {
    console.error('Push event error:', error);
    res.status(500).json({ error: error.message });
  }
};

// GET /api/watchtower/internal/overview - Internal auth
export const internalGetOverview = async (req, res) => {
  try {
    const userId = parseInt(req.query.userId);
    if (!userId) return res.status(400).json({ message: 'userId is required' });

    const behavioralStats = await db()('insight_sessions')
      .where({ userId })
      .count('id as totalSessions')
      .sum('pageViews as totalPageViews')
      .avg('duration as avgDuration')
      .first();

    const rageClickCount = await db()('insight_events')
      .whereIn('sessionId', function () {
        this.select('sessionId').from('insight_sessions').where({ userId });
      })
      .where({ type: 'rage_click' })
      .count('id as count')
      .first();

    const deadClickCount = await db()('insight_events')
      .whereIn('sessionId', function () {
        this.select('sessionId').from('insight_sessions').where({ userId });
      })
      .where({ type: 'dead_click' })
      .count('id as count')
      .first();

    const sessionsOverTime = await db()('insight_sessions')
      .select(db().raw("DATE(\"createdAt\") as date"))
      .count('id as count')
      .where({ userId })
      .andWhere(db().raw('"createdAt" >= NOW() - INTERVAL \'30 days\''))
      .groupByRaw('DATE("createdAt")')
      .orderByRaw('DATE("createdAt") DESC')
      .limit(30);

    res.json({
      totalSessions: parseInt(behavioralStats.totalSessions) || 0,
      totalPageViews: parseInt(behavioralStats.totalPageViews) || 0,
      avgDuration: Math.round(parseFloat(behavioralStats.avgDuration) || 0),
      rageClicks: parseInt(rageClickCount.count) || 0,
      deadClicks: parseInt(deadClickCount.count) || 0,
      sessionsOverTime: sessionsOverTime.reverse(),
    });
  } catch (error) {
    console.error('Internal get overview error:', error);
    res.status(500).json({ error: error.message });
  }
};

// GET /api/watchtower/internal/sessions - Internal auth
export const internalGetSessions = async (req, res) => {
  try {
    const userId = parseInt(req.query.userId);
    if (!userId) return res.status(400).json({ message: 'userId is required' });

    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const sessions = await db()('insight_sessions')
      .where({ userId })
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(offset);

    const total = await db()('insight_sessions')
      .where({ userId })
      .count('id as count')
      .first();

    res.json({ sessions, total: parseInt(total.count) || 0 });
  } catch (error) {
    console.error('Internal get sessions error:', error);
    res.status(500).json({ error: error.message });
  }
};

// GET /api/watchtower/dead-clicks - Auth required
export const getDeadClicks = async (req, res) => {
  try {
    const userId = req.user.id;

    const deadClickEvents = await db()('insight_events')
      .select('insight_events.*', 'insight_sessions.device', 'insight_sessions.browser', 'insight_sessions.country')
      .join('insight_sessions', 'insight_events.sessionId', 'insight_sessions.sessionId')
      .where('insight_sessions.userId', userId)
      .where('insight_events.type', 'dead_click')
      .orderBy('insight_events.timestamp', 'desc')
      .limit(50);

    const deadClickByTarget = await db()('insight_events')
      .select('target')
      .count('id as count')
      .whereIn('sessionId', function () {
        this.select('sessionId').from('insight_sessions').where({ userId });
      })
      .where({ type: 'dead_click' })
      .whereNotNull('target')
      .groupBy('target')
      .orderBy('count', 'desc')
      .limit(20);

    const totalDeadClicks = await db()('insight_events')
      .count('id as count')
      .whereIn('sessionId', function () {
        this.select('sessionId').from('insight_sessions').where({ userId });
      })
      .where({ type: 'dead_click' })
      .first();

    res.json({
      total: parseInt(totalDeadClicks.count) || 0,
      byTarget: deadClickByTarget,
      recentEvents: deadClickEvents,
    });
  } catch (error) {
    console.error('Get dead clicks error:', error);
    res.status(500).json({ error: error.message });
  }
};

// GET /api/watchtower/rage-clicks - Auth required
export const getRageClicks = async (req, res) => {
  try {
    const userId = req.user.id;

    const rageClickEvents = await db()('insight_events')
      .select('insight_events.*', 'insight_sessions.device', 'insight_sessions.browser', 'insight_sessions.country')
      .join('insight_sessions', 'insight_events.sessionId', 'insight_sessions.sessionId')
      .where('insight_sessions.userId', userId)
      .where('insight_events.type', 'rage_click')
      .orderBy('insight_events.timestamp', 'desc')
      .limit(50);

    const rageClickByTarget = await db()('insight_events')
      .select('target')
      .count('id as count')
      .whereIn('sessionId', function () {
        this.select('sessionId').from('insight_sessions').where({ userId });
      })
      .where({ type: 'rage_click' })
      .whereNotNull('target')
      .groupBy('target')
      .orderBy('count', 'desc')
      .limit(20);

    const rageClickSessions = await db()('insight_sessions')
      .where({ userId, isRageClick: true })
      .orderBy('createdAt', 'desc')
      .limit(20);

    const totalRageClicks = await db()('insight_events')
      .count('id as count')
      .whereIn('sessionId', function () {
        this.select('sessionId').from('insight_sessions').where({ userId });
      })
      .where({ type: 'rage_click' })
      .first();

    res.json({
      total: parseInt(totalRageClicks.count) || 0,
      byTarget: rageClickByTarget,
      recentEvents: rageClickEvents,
      affectedSessions: rageClickSessions,
    });
  } catch (error) {
    console.error('Get rage clicks error:', error);
    res.status(500).json({ error: error.message });
  }
};

export default {
  ingestData,
  getOverview,
  getSessions,
  getSessionDetail,
  getEntityAnalytics,
  getProductInsights,
  getPlatformOverview,
  pushEvent,
  internalGetOverview,
  internalGetSessions,
  getDeadClicks,
  getRageClicks,
};
