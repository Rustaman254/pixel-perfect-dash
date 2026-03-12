import { getDb } from '../config/db.js';

const Insight = {
    getOverview: async (userId) => {
        const db = getDb();
        const stats = await db.get(`
            SELECT 
                COUNT(*) as totalSessions,
                SUM(pageViews) as totalPageViews,
                AVG(duration) as avgDuration,
                SUM(CASE WHEN isRageClick = 1 THEN 1 ELSE 0 END) as totalRageClicks
            FROM insight_sessions
            WHERE userId = ?
        `, userId);
        
        const sessionsOverTime = await db.all(`
            SELECT date(createdAt) as date, COUNT(*) as count
            FROM insight_sessions
            WHERE userId = ?
            GROUP BY date(createdAt)
            ORDER BY date(createdAt) DESC
            LIMIT 30
        `, userId);

        return {
            stats: {
                totalSessions: stats?.totalSessions || 0,
                totalPageViews: stats?.totalPageViews || 0,
                avgDuration: Math.round(stats?.avgDuration || 0),
                totalRageClicks: stats?.totalRageClicks || 0
            },
            sessionsOverTime: sessionsOverTime.reverse()
        };
    },

    getEntityAnalytics: async (entityId, entityType) => {
        const db = getDb();
        // For simplicity, we correlate via clarifying if we had actual mappings.
        // Here we'll return mockable/calculatable stats for the entity.
        const mapping = await db.get(`
            SELECT clarityId FROM insight_entity_mappings 
            WHERE entityId = ? AND entityType = ?
        `, [entityId, entityType]);

        if (!mapping) return null;

        const sessions = await db.all(`
            SELECT * FROM insight_sessions 
            WHERE sessionId IN (
                SELECT sessionId FROM insight_events 
                WHERE url LIKE '%' || ? || '%'
            )
        `, [mapping.clarityId]);

        return {
            mapping,
            sessionCount: sessions.length,
            sessions: sessions.slice(0, 10)
        };
    },

    getSessions: async (userId, limit = 20, offset = 0) => {
        const db = getDb();
        return await db.all(`
            SELECT * FROM insight_sessions 
            WHERE userId = ? 
            ORDER BY createdAt DESC 
            LIMIT ? OFFSET ?
        `, [userId, limit, offset]);
    },

    getSessionDetail: async (sessionId) => {
        const db = getDb();
        const session = await db.get(`SELECT * FROM insight_sessions WHERE sessionId = ?`, sessionId);
        if (!session) return null;

        const events = await db.all(`
            SELECT * FROM insight_events 
            WHERE sessionId = ? 
            ORDER BY timestamp ASC
        `, sessionId);

        return { ...session, events };
    },

    createSession: async (sessionData) => {
        const db = getDb();
        await db.run(`
            INSERT INTO insight_sessions (
                userId, sessionId, device, browser, os, country, city, duration, pageViews, isRageClick, isDeadClick
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            sessionData.userId, sessionData.sessionId, sessionData.device, sessionData.browser,
            sessionData.os, sessionData.country, sessionData.city, sessionData.duration,
            sessionData.pageViews, sessionData.isRageClick ? 1 : 0, sessionData.isDeadClick ? 1 : 0
        ]);
        return await db.get(`SELECT * FROM insight_sessions WHERE sessionId = ?`, sessionData.sessionId);
    },

    logEvent: async (eventData) => {
        const db = getDb();
        await db.run(`
            INSERT INTO insight_events (sessionId, type, target, url)
            VALUES (?, ?, ?, ?)
        `, [eventData.sessionId, eventData.type, eventData.target, eventData.url]);
    }
};

export default Insight;
