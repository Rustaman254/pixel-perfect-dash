import { createConnection } from '../shared/db.js';

const db = () => createConnection('ripplify_db');

export const getMethods = async (req, res) => {
  try {
    const methods = await db()('user_payout_methods')
      .where({ userId: req.user.id, isActive: true })
      .orderBy('isDefault', 'desc')
      .orderBy('createdAt', 'asc');
    res.json(methods);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addMethod = async (req, res) => {
  try {
    const { method, label, details, isDefault } = req.body;
    const userId = req.user.id;

    if (!method || !details) return res.status(400).json({ message: 'Method and details are required' });
    if (!['mpesa', 'bank'].includes(method)) return res.status(400).json({ message: 'Only M-Pesa and Bank methods are supported' });

    if (method === 'mpesa') {
      const phone = details.replace(/\D/g, '');
      if (phone.length < 9) return res.status(400).json({ message: 'Invalid M-Pesa phone number' });
    } else if (method === 'bank') {
      try {
        const bankData = JSON.parse(details);
        if (!bankData.account || !bankData.bankCode) {
          return res.status(400).json({ message: 'Bank account and bank code are required' });
        }
      } catch {
        return res.status(400).json({ message: 'Bank details must be valid JSON with account and bankCode' });
      }
    }

    const existing = await db()('user_payout_methods')
      .where({ userId, method, details, isActive: true })
      .first();
    if (existing) return res.status(400).json({ message: 'This payout method already exists' });

    if (isDefault) {
      await db()('user_payout_methods').where({ userId }).update({ isDefault: false });
    }

    const [newMethod] = await db()('user_payout_methods')
      .insert({
        userId,
        method,
        label: label || (method === 'mpesa' ? 'M-Pesa' : 'Bank Account'),
        details,
        isDefault: isDefault || false,
      })
      .returning('*');

    res.status(201).json(newMethod);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateMethod = async (req, res) => {
  try {
    const { id } = req.params;
    const { label, details, isDefault } = req.body;
    const userId = req.user.id;

    const existing = await db()('user_payout_methods').where({ id, userId }).first();
    if (!existing) return res.status(404).json({ message: 'Payout method not found' });

    if (isDefault) {
      await db()('user_payout_methods').where({ userId }).update({ isDefault: false });
    }

    const updateObj = {};
    if (label !== undefined) updateObj.label = label;
    if (details !== undefined) updateObj.details = details;
    if (isDefault !== undefined) updateObj.isDefault = isDefault;
    updateObj.updatedAt = db().fn.now();

    if (Object.keys(updateObj).length === 1) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    const [updated] = await db()('user_payout_methods')
      .where({ id, userId })
      .update(updateObj)
      .returning('*');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteMethod = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existing = await db()('user_payout_methods').where({ id, userId }).first();
    if (!existing) return res.status(404).json({ message: 'Payout method not found' });

    await db()('user_payout_methods').where({ id, userId }).update({ isActive: false });

    if (existing.isDefault) {
      const nextDefault = await db()('user_payout_methods')
        .where({ userId, isActive: true })
        .orderBy('createdAt', 'asc')
        .first();
      if (nextDefault) {
        await db()('user_payout_methods').where({ id: nextDefault.id }).update({ isDefault: true });
      }
    }

    res.json({ message: 'Payout method removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default { getMethods, addMethod, updateMethod, deleteMethod };
