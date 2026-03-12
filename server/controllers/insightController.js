import asyncHandler from 'express-async-handler';
import Insight from '../models/Insight.js';

// @desc    Get high-level analytics overview
// @route   GET /api/insights/overview
// @access  Private (Seller)
export const getOverview = asyncHandler(async (req, res) => {
    const overview = await Insight.getOverview(req.user.id);
    res.json(overview);
});

// @desc    Get analytics for a specific entity
// @route   GET /api/insights/entity/:id
// @access  Private (Seller)
export const getEntityAnalytics = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { type } = req.query; // e.g., 'payment-link'
    
    const analytics = await Insight.getEntityAnalytics(id, type || 'payment-link');
    
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
    
    const sessions = await Insight.getSessions(req.user.id, limit, offset);
    res.json(sessions);
});

// @desc    Get session detail/events
// @route   GET /api/insights/sessions/:id
// @access  Private (Seller)
export const getSessionDetail = asyncHandler(async (req, res) => {
    const detail = await Insight.getSessionDetail(req.params.id);
    
    if (!detail) {
        res.status(404);
        throw new Error('Session not found');
    }
    
    res.json(detail);
});

// @desc    Ingest clarity-like data (Simulated)
// @route   POST /api/insights/ingest
// @access  Public (from frontend tracking)
export const ingestData = asyncHandler(async (req, res) => {
    const { session, events } = req.body;
    
    // In a real scenario, we'd verify the sessionId and handle user mapping.
    // For this implementation, we'll assume the session data is sent correctly.
    
    const newSession = await Insight.createSession(session);
    
    if (events && events.length > 0) {
        for (const event of events) {
            await Insight.logEvent({ sessionId: session.sessionId, ...event });
        }
    }
    
    res.status(201).json({ message: 'Data ingested successfully', sessionId: newSession.sessionId });
});
