import { createConnection } from '../shared/db.js';

const db = () => createConnection('watchtower_db');

// GET /internal/admin/stats - Platform-wide watchtower stats
export const getStats = async (req, res) => {
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

    const totalProjects = await db()('insight_sessions')
      .countDistinct('userId as count')
      .first();

    const todaySessions = await db()('insight_sessions')
      .where(db().raw('"createdAt" >= CURRENT_DATE'))
      .count('id as count')
      .first();

    res.json({
      totalSessions: parseInt(behavioralStats.totalSessions) || 0,
      totalPageViews: parseInt(behavioralStats.totalPageViews) || 0,
      avgDuration: Math.round(parseFloat(behavioralStats.avgDuration) || 0),
      totalRageClicks: parseInt(rageClickCount.count) || 0,
      totalDeadClicks: parseInt(deadClickCount.count) || 0,
      uniqueUsers: parseInt(uniqueUsers.count) || 0,
      totalProjects: parseInt(totalProjects.count) || 0,
      todaySessions: parseInt(todaySessions.count) || 0,
    });
  } catch (error) {
    console.error('Get watchtower admin stats error:', error);
    res.status(500).json({ message: 'Failed to load watchtower stats' });
  }
};

// GET /internal/admin/analytics - Detailed analytics
export const getAnalytics = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    let interval = '30 days';
    if (period === '7d') interval = '7 days';
    else if (period === '90d') interval = '90 days';
    else if (period === '1y') interval = '1 year';

    const sessionsOverTime = await db()('insight_sessions')
      .select(db().raw("DATE(\"createdAt\") as date"))
      .count('id as sessions')
      .sum('pageViews as pageViews')
      .where(db().raw(`"createdAt" >= NOW() - INTERVAL '${interval}'`))
      .groupByRaw('DATE("createdAt")')
      .orderByRaw('DATE("createdAt") ASC');

    const topPages = await db()('insight_events')
      .select('url')
      .count('id as views')
      .where({ type: 'pageview' })
      .whereNotNull('url')
      .andWhere(db().raw(`"timestamp" >= NOW() - INTERVAL '${interval}'`))
      .groupBy('url')
      .orderBy('views', 'desc')
      .limit(20);

    const deviceBreakdown = await db()('insight_sessions')
      .select('device')
      .count('id as count')
      .groupBy('device')
      .orderBy('count', 'desc');

    const browserBreakdown = await db()('insight_sessions')
      .select('browser')
      .count('id as count')
      .groupBy('browser')
      .orderBy('count', 'desc')
      .limit(10);

    const countryBreakdown = await db()('insight_sessions')
      .select('country')
      .count('id as count')
      .whereNotNull('country')
      .groupBy('country')
      .orderBy('count', 'desc')
      .limit(15);

    const rageClicksByTarget = await db()('insight_events')
      .select('target')
      .count('id as count')
      .where({ type: 'rage_click' })
      .whereNotNull('target')
      .groupBy('target')
      .orderBy('count', 'desc')
      .limit(10);

    const deadClicksByTarget = await db()('insight_events')
      .select('target')
      .count('id as count')
      .where({ type: 'dead_click' })
      .whereNotNull('target')
      .groupBy('target')
      .orderBy('count', 'desc')
      .limit(10);

    const totalEvents = await db()('insight_events')
      .count('id as count')
      .where(db().raw(`"timestamp" >= NOW() - INTERVAL '${interval}'`))
      .first();

    res.json({
      sessionsOverTime,
      topPages,
      deviceBreakdown,
      browserBreakdown,
      countryBreakdown,
      rageClicksByTarget,
      deadClicksByTarget,
      totalEvents: parseInt(totalEvents.count) || 0,
    });
  } catch (error) {
    console.error('Get watchtower admin analytics error:', error);
    res.status(500).json({ message: 'Failed to load watchtower analytics' });
  }
};

// GET /internal/admin/sessions - All sessions with pagination
export const getSessions = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = db()('insight_sessions');
    let countQuery = db()('insight_sessions');

    if (search) {
      const searchFilter = function () {
        this.where('sessionId', 'like', `%${search}%`)
          .orWhere('device', 'like', `%${search}%`)
          .orWhere('browser', 'like', `%${search}%`)
          .orWhere('country', 'like', `%${search}%`);
      };
      query = query.where(searchFilter);
      countQuery = countQuery.where(searchFilter);
    }

    const sessions = await query
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit))
      .offset(offset);

    const total = await countQuery.count('id as count').first();

    res.json({
      sessions,
      total: parseInt(total.count) || 0,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('Get watchtower sessions error:', error);
    res.status(500).json({ message: 'Failed to load sessions' });
  }
};

// GET /internal/admin/users - Users using watchtower
export const getUsers = async (req, res) => {
  try {
    const users = await db()('insight_sessions')
      .select('userId')
      .count('id as sessionCount')
      .sum('pageViews as totalPageViews')
      .avg('duration as avgDuration')
      .max('createdAt as lastActive')
      .groupBy('userId')
      .orderBy('sessionCount', 'desc');

    res.json(users.map(u => ({
      userId: u.userId,
      sessionCount: parseInt(u.sessionCount) || 0,
      totalPageViews: parseInt(u.totalPageViews) || 0,
      avgDuration: Math.round(parseFloat(u.avgDuration) || 0),
      lastActive: u.lastActive,
    })));
  } catch (error) {
    console.error('Get watchtower users error:', error);
    res.status(500).json({ message: 'Failed to load users' });
  }
};

// GET /internal/admin/settings - Watchtower settings
export const getSettings = async (req, res) => {
  try {
    res.json({
      trackingEnabled: true,
      sessionTimeout: 30,
      rageClickThreshold: 3,
      deadClickDetection: true,
      dataRetentionDays: 90,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load settings' });
  }
};

// PUT /internal/admin/settings - Update watchtower settings
export const updateSettings = async (req, res) => {
  try {
    res.json({ message: 'Settings updated', settings: req.body });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update settings' });
  }
};

export default {
  getStats,
  getAnalytics,
  getSessions,
  getUsers,
  getSettings,
  updateSettings,
};
