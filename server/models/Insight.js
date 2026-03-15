import { getDb } from '../config/db.js';

const Insight = {
    getOverview: async (userId) => {
        const db = getDb();
        
        // Behavioral Stats
        const behavioralStats = await db.get(`
            SELECT 
                COUNT(*) as totalSessions,
                SUM(pageViews) as totalPageViews,
                AVG(duration) as avgDuration,
                SUM(CASE WHEN isRageClick = 1 THEN 1 ELSE 0 END) as totalRageClicks
            FROM insight_sessions
            WHERE userId = ?
        `, userId);

        // Interaction Stats (Scroll & Dead Clicks)
        const interactionStats = await db.get(`
            SELECT 
                AVG(CAST(json_extract(data, '$.depth') AS FLOAT)) as avgScrollDepth,
                COUNT(CASE WHEN type = 'dead_click' THEN 1 END) as totalDeadClicks
            FROM insight_events
            WHERE sessionId IN (SELECT sessionId FROM insight_sessions WHERE userId = ?)
        `, [userId]);
        
        // Business Stats (Cross-Product)
        const businessStats = await db.get(`
            SELECT 
                SUM(CASE WHEN status IN ('Completed', 'Funds locked', 'Shipped') THEN amount ELSE 0 END) as totalRevenue,
                COUNT(CASE WHEN status IN ('Completed', 'Funds locked', 'Shipped', 'Pending') THEN 1 ELSE NULL END) as transactionCount,
                COUNT(CASE WHEN status IN ('Completed', 'Funds locked', 'Shipped') THEN 1 ELSE NULL END) as successfulSales
            FROM transactions
            WHERE userId = ?
        `, userId);

        const linkStats = await db.get(`
            SELECT SUM(clicks) as totalLinkClicks
            FROM payment_links
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

        const conversionRate = behavioralStats?.totalSessions > 0 
            ? ((businessStats?.successfulSales || 0) / behavioralStats.totalSessions * 100).toFixed(1)
            : 0;

        return {
            stats: {
                totalSessions: behavioralStats?.totalSessions || 0,
                totalPageViews: behavioralStats?.totalPageViews || 0,
                avgDuration: Math.round(behavioralStats?.avgDuration || 0),
                totalRageClicks: behavioralStats?.totalRageClicks || 0,
                totalRevenue: businessStats?.totalRevenue || 0,
                transactionCount: businessStats?.transactionCount || 0,
                conversionRate: conversionRate,
                avgScrollDepth: Math.round(interactionStats?.avgScrollDepth || 0),
                totalDeadClicks: interactionStats?.totalDeadClicks || 0,
                totalLinkClicks: linkStats?.totalLinkClicks || 0
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
                userId, sessionId, device, browser, os, country, city, duration, pageViews, isRageClick, isDeadClick, endUserId, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            sessionData.userId, sessionData.sessionId, sessionData.device, sessionData.browser,
            sessionData.os, sessionData.country, sessionData.city, sessionData.duration || 0,
            sessionData.pageViews || 1, sessionData.isRageClick ? 1 : 0, sessionData.isDeadClick ? 1 : 0,
            sessionData.endUserId || null, sessionData.metadata || null
        ]);
        return await db.get(`SELECT * FROM insight_sessions WHERE sessionId = ?`, sessionData.sessionId);
    },

    logEvent: async (eventData) => {
        const db = getDb();
        await db.run(`
            INSERT INTO insight_events (sessionId, type, target, url, data)
            VALUES (?, ?, ?, ?, ?)
        `, [
            eventData.sessionId, 
            eventData.type, 
            eventData.target || null, 
            eventData.url, 
            eventData.data || null
        ]);
        
        // If it's a rage click, mark the session as having one
        if (eventData.type === 'rage_click') {
            await db.run(`UPDATE insight_sessions SET isRageClick = 1 WHERE sessionId = ?`, eventData.sessionId);
        }
    },

    getFeatureInsights: async (userId) => {
        const db = getDb();
        // Aggregating clicks and rage clicks per target
        const analysis = await db.all(`
            SELECT 
                target,
                COUNT(CASE WHEN type = 'click' THEN 1 END) as usages,
                COUNT(CASE WHEN type = 'rage_click' THEN 1 END) as rageClicks,
                COUNT(CASE WHEN type = 'dwell' THEN 1 END) as dwellEvents
            FROM insight_events
            WHERE sessionId IN (SELECT sessionId FROM insight_sessions WHERE userId = ?)
            AND target IS NOT NULL
            GROUP BY target
            HAVING usages > 0 OR dwellEvents > 0
        `, userId);

        return analysis.map(row => {
            let recommendation = 'Maintain';
            let color = 'emerald';
            
            if (row.rageClicks > 0) {
                recommendation = 'Simplify';
                color = 'amber';
            } else if (row.usages === 0 && row.dwellEvents > 0) {
                recommendation = 'Move'; // People look at it but don't click
                color = 'indigo';
            } else if (row.usages < 5 && row.dwellEvents < 2) {
                recommendation = 'Deprecate';
                color = 'red';
            }

            return {
                ...row,
                recommendation,
                color
            };
        });
    },

    getProductInsights: async (userId) => {
        const db = getDb();
        
        // 1. Get all products (Payment Links)
        const products = await db.all(`SELECT id, name, slug, price, currency FROM payment_links WHERE userId = ?`, userId);
        
        const insights = [];
        
        for (const product of products) {
            // Visits to the payment page
            const visits = await db.get(`
                SELECT COUNT(DISTINCT sessionId) as count 
                FROM insight_events 
                WHERE url LIKE '%' || ? || '%' AND type = 'pageview'
            `, product.slug);
            
            // Clicks on the payment page (intent)
            const clicks = await db.get(`
                SELECT COUNT(*) as count 
                FROM insight_events 
                WHERE url LIKE '%' || ? || '%' AND type = 'click'
            `, product.slug);

            // Actual Successful Sales
            const sales = await db.get(`
                SELECT COUNT(*) as count, SUM(amount) as revenue
                FROM transactions
                WHERE linkId = ? AND status IN ('Completed', 'Funds locked', 'Shipped')
            `, product.id);

            const convRate = visits?.count > 0 
                ? ((sales?.count || 0) / visits.count * 100).toFixed(1) 
                : 0;

            insights.push({
                id: product.id,
                name: product.name,
                slug: product.slug,
                visits: visits?.count || 0,
                clicks: clicks?.count || 0,
                sales: sales?.count || 0,
                revenue: sales?.revenue || 0,
                conversionRate: convRate,
                health: convRate > 10 ? 'Healthy' : convRate > 2 ? 'Needs Attention' : 'Critical'
            });
        }
        
        return insights.sort((a, b) => b.revenue - a.revenue);
    }
};

export default Insight;
