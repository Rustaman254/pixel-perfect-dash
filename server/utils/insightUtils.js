/**
 * Normalizes Clarity JS event payloads into the internal Ripplify Insights schema.
 * 
 * @param {Object} rawData - The raw event data from Clarity
 * @returns {Object} Normalized session and event data
 */
export const normalizeClarityData = (rawData) => {
    const { sessionId, envelope, events } = rawData;
    
    // Extract session metadata from envelope
    const session = {
        sessionId: sessionId,
        device: envelope?.device || 'unknown',
        browser: envelope?.browser || 'unknown',
        os: envelope?.os || 'unknown',
        country: envelope?.geo?.country || 'unknown',
        city: envelope?.geo?.city || 'unknown',
        duration: envelope?.duration || 0,
        pageViews: envelope?.pageViews || 0,
        isRageClick: events?.some(e => e.type === 'rage-click') ? 1 : 0,
        isDeadClick: events?.some(e => e.type === 'dead-click') ? 1 : 0,
    };

    // Normalize events
    const normalizedEvents = (events || []).map(e => ({
        type: e.type,
        target: e.targetSelector || e.target,
        url: e.url || envelope?.url,
        timestamp: e.timestamp ? new Date(e.timestamp).toISOString() : new Date().toISOString()
    }));

    return { session, events: normalizedEvents };
};

/**
 * Helper to identify which Ripplify entity an event belongs to based on URL or tags.
 */
export const resolveEntity = (url) => {
    // Example: https://ripplify.com/pay/my-awesome-product
    const match = url.match(/\/pay\/([^/?#]+)/);
    if (match) {
        return { entityType: 'payment-link', slug: match[1] };
    }
    return null;
};
