import { createConnection } from '../shared/db.js';

const db = () => createConnection('shopalize_db');

/**
 * Record a user activity
 * @param {Object} params
 * @param {number} params.userId - The ID of the user performing the action
 * @param {string} params.action - The type of action (e.g., 'theme_saved')
 * @param {number} [params.projectId] - The associated project ID
 * @param {string} [params.description] - A human-readable description
 * @param {Object} [params.metadata] - Additional JSON metadata
 */
export const recordActivity = async ({ userId, action, projectId, description, metadata }) => {
  try {
    await db()('activity_logs').insert({
      userId,
      action,
      projectId: projectId || null,
      description: description || '',
      metadata: metadata ? JSON.stringify(metadata) : null,
      createdAt: db().fn.now()
    });
  } catch (error) {
    console.error('Failed to record activity:', error);
  }
};

// GET /api/shopalize/activities
export const getMyActivities = async (req, res) => {
  try {
    const activities = await db()('activity_logs')
      .where({ userId: req.user.id })
      .orderBy('createdAt', 'desc')
      .limit(50);
    
    res.json(activities);
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ message: error.message });
  }
};

export default { recordActivity, getMyActivities };
