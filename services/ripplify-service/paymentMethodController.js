import { createConnection } from '../shared/db.js';

const db = () => createConnection('ripplify_db');

export const getMethods = async (req, res) => {
  try {
    const methods = await db()('user_payment_methods').where({ userId: req.user.id });
    res.json(methods);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const upsertMethod = async (req, res) => {
  try {
    const { methodId } = req.params;
    const { enabled, fee } = req.body;

    if (enabled === undefined || !fee) {
      return res.status(400).json({ message: 'Enabled status and fee are required' });
    }

    const existing = await db()('user_payment_methods')
      .where({ userId: req.user.id, methodId })
      .first();

    let method;
    if (existing) {
      [method] = await db()('user_payment_methods')
        .where({ userId: req.user.id, methodId })
        .update({ enabled, fee })
        .returning('*');
    } else {
      [method] = await db()('user_payment_methods')
        .insert({ userId: req.user.id, methodId, enabled, fee })
        .returning('*');
    }

    res.json({ message: 'Payment method configured', method });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default { getMethods, upsertMethod };
