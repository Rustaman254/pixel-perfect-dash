import { createConnection } from '../shared/db.js';

const db = () => createConnection('shopalize_db');

// GET /campaigns
export const getCampaigns = async (req, res) => {
  try {
    const campaigns = await db()('campaigns').where({ userId: req.user.id }).orderBy('createdAt', 'desc');
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /campaigns
export const createCampaign = async (req, res) => {
  try {
    const { name, type, content, audience, scheduledAt } = req.body;
    if (!name || !type) return res.status(400).json({ message: 'name and type are required' });

    const [campaign] = await db()('campaigns')
      .insert({
        userId: req.user.id,
        name,
        type,
        content: content ? JSON.stringify(content) : null,
        audience: audience || 'all',
        scheduledAt: scheduledAt || null,
        status: 'draft',
      })
      .returning('*');

    res.status(201).json(campaign);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /campaigns/:id
export const updateCampaign = async (req, res) => {
  try {
    const { name, type, content, audience, status, scheduledAt } = req.body;
    const campaign = await db()('campaigns').where({ id: parseInt(req.params.id), userId: req.user.id }).first();
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

    const updates = { updatedAt: db().fn.now() };
    if (name !== undefined) updates.name = name;
    if (type !== undefined) updates.type = type;
    if (content !== undefined) updates.content = JSON.stringify(content);
    if (audience !== undefined) updates.audience = audience;
    if (status !== undefined) updates.status = status;
    if (scheduledAt !== undefined) updates.scheduledAt = scheduledAt;

    const [updated] = await db()('campaigns').where({ id: parseInt(req.params.id) }).update(updates).returning('*');
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /campaigns/:id
export const deleteCampaign = async (req, res) => {
  try {
    const campaign = await db()('campaigns').where({ id: parseInt(req.params.id), userId: req.user.id }).first();
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    await db()('campaigns').where({ id: campaign.id }).delete();
    res.json({ message: 'Campaign deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /campaigns/:id/send
export const sendCampaign = async (req, res) => {
  try {
    const campaign = await db()('campaigns').where({ id: parseInt(req.params.id), userId: req.user.id }).first();
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

    // In a real app, this would trigger email/social sending
    await db()('campaigns').where({ id: campaign.id }).update({
      status: 'active',
      sentAt: db.fn.now(),
      sentCount: 0,
      updatedAt: db.fn.now(),
    });

    res.json({ message: 'Campaign sent' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default { getCampaigns, createCampaign, updateCampaign, deleteCampaign, sendCampaign };
