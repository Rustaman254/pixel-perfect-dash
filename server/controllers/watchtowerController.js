import asyncHandler from 'express-async-handler';
import Watchtower from '../models/Watchtower.js';
import geoip from 'geoip-lite';
import requestIp from 'request-ip';

// @desc    Get feature-specific insights and health
// @route   GET /api/insights/features
// @access  Private (Seller)
export const getFeatureInsights = asyncHandler(async (req, res) => {
    const analysis = await Watchtower.getFeatureInsights(req.user.id);
    res.json(analysis);
});

// @desc    Get insights for specific products (Payment Links)
// @route   GET /api/insights/products
// @access  Private (Seller)
export const getProductAnalytics = asyncHandler(async (req, res) => {
    const analysis = await Watchtower.getProductInsights(req.user.id);
    res.json(analysis);
});

// @desc    Get high-level analytics overview
// @route   GET /api/insights/overview
// @access  Private (Seller)
export const getOverview = asyncHandler(async (req, res) => {
    const overview = await Watchtower.getOverview(req.user.id);
    res.json(overview);
});

// @desc    Get analytics for a specific entity
// @route   GET /api/insights/entity/:id
// @access  Private (Seller)
export const getEntityAnalytics = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { type } = req.query; // e.g., 'payment-link'
    
    const analytics = await Watchtower.getEntityAnalytics(id, type || 'payment-link');
    
    if (!analytics) {
        res.status(404);
        throw new Error('Analytics not found for this entity');
    }
    
    res.json(analytics);
});

// @desc    Get session list
// @route   GET /api/insights/sessions
// @access  Private (Seller)
export const getSessions = asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    
    const sessions = await Watchtower.getSessions(req.user.id, limit, offset);
    res.json(sessions);
});

// @desc    Get session detail/events
// @route   GET /api/insights/sessions/:id
// @access  Private (Seller)
export const getSessionDetail = asyncHandler(async (req, res) => {
    const detail = await Watchtower.getSessionDetail(req.params.id);
    
    if (!detail) {
        res.status(404);
        throw new Error('Session not found');
    }
    
    res.json(detail);
});

// @desc    Ingest clarity-like data (Simulated)
// @route   POST /api/insights/ingest
// @access  Public (from frontend tracking)
const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

export const ingestData = asyncHandler(async (req, res) => {
    const { session, events } = req.body;
    
    if (!session || !session.projectId) {
        console.error('Missing session or projectId in ingestData');
        return res.status(400).json({ error: 'Missing session or projectId' });
    }

    // Ensure sessionId exists
    if (!session.sessionId) {
        console.warn('Missing sessionId in payload, generating one');
        session.sessionId = generateId();
    }

    const clientIp = requestIp.getClientIp(req);
    const geo = geoip.lookup(clientIp);
    const country = geo ? geo.country : session.country || 'Unknown';
    const city = geo ? geo.city : session.city || 'Unknown';

    console.log(`Ingesting data for Project ID: ${session.projectId}, Session: ${session.sessionId}`);
    console.log(`Events: ${events?.length || 0}, IP: ${clientIp}, Geo: ${city}, ${country}`);
    
    // In a real scenario, we'd verify the sessionId and handle user mapping.
    // For this implementation, we'll assume the session data is sent correctly.
    // Map projectId (from frontend) to userId (owner in DB)
    const sessionToCreate = {
        ...session,
        userId: session.projectId,
        endUserId: session.userId, // The tracked person
        country: country,
        city: city,
        metadata: session.timezone ? `Timezone: ${session.timezone}` : session.metadata
    };
    
    // Check if session exists to update or create
    const existing = await Watchtower.getSessionDetail(session.sessionId);
    if (!existing) {
        await Watchtower.createSession(sessionToCreate);
    }
    
    if (events && events.length > 0) {
        for (const event of events) {
            await Watchtower.logEvent({ sessionId: session.sessionId, ...event });
        }
    }
    
    res.status(201).json({ message: 'Data ingested successfully', sessionId: session.sessionId });
});

// @desc    Get platform-wide overview (Admin)
// @route   GET /api/watchtower/platform-overview
// @access  Private (Admin)
export const getPlatformOverview = asyncHandler(async (req, res) => {
    const overview = await Watchtower.getPlatformOverview();
    res.json(overview);
});
