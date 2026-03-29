import { createConnection } from '../shared/db.js';

const db = () => createConnection('shopalize_db');

// GET /discounts
export const getDiscounts = async (req, res) => {
  try {
    const discounts = await db()('discounts').where({ userId: req.user.id }).orderBy('createdAt', 'desc');
    res.json(discounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /discounts/:id
export const getDiscount = async (req, res) => {
  try {
    const discount = await db()('discounts').where({ id: parseInt(req.params.id), userId: req.user.id }).first();
    if (!discount) return res.status(404).json({ message: 'Discount not found' });
    res.json(discount);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /discounts
export const createDiscount = async (req, res) => {
  try {
    const { code, type, value, minOrderAmount, usageLimit, appliesTo, startsAt, endsAt } = req.body;
    if (!code || !value) return res.status(400).json({ message: 'code and value are required' });

    const existing = await db()('discounts').where({ userId: req.user.id, code: code.toUpperCase() }).first();
    if (existing) return res.status(409).json({ message: 'Discount code already exists' });

    const [discount] = await db()('discounts')
      .insert({
        userId: req.user.id,
        code: code.toUpperCase(),
        type: type || 'percentage',
        value: parseFloat(value),
        minOrderAmount: parseFloat(minOrderAmount || 0),
        usageLimit: parseInt(usageLimit || 0),
        appliesTo: appliesTo || 'all',
        startsAt: startsAt || null,
        endsAt: endsAt || null,
        isActive: true,
      })
      .returning('*');

    res.status(201).json(discount);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /discounts/:id
export const updateDiscount = async (req, res) => {
  try {
    const { code, type, value, minOrderAmount, usageLimit, appliesTo, isActive, startsAt, endsAt } = req.body;
    const discount = await db()('discounts').where({ id: parseInt(req.params.id), userId: req.user.id }).first();
    if (!discount) return res.status(404).json({ message: 'Discount not found' });

    const updates = { updatedAt: db().fn.now() };
    if (code !== undefined) updates.code = code.toUpperCase();
    if (type !== undefined) updates.type = type;
    if (value !== undefined) updates.value = parseFloat(value);
    if (minOrderAmount !== undefined) updates.minOrderAmount = parseFloat(minOrderAmount);
    if (usageLimit !== undefined) updates.usageLimit = parseInt(usageLimit);
    if (appliesTo !== undefined) updates.appliesTo = appliesTo;
    if (isActive !== undefined) updates.isActive = isActive;
    if (startsAt !== undefined) updates.startsAt = startsAt;
    if (endsAt !== undefined) updates.endsAt = endsAt;

    const [updated] = await db()('discounts').where({ id: parseInt(req.params.id) }).update(updates).returning('*');
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /discounts/:id
export const deleteDiscount = async (req, res) => {
  try {
    const discount = await db()('discounts').where({ id: parseInt(req.params.id), userId: req.user.id }).first();
    if (!discount) return res.status(404).json({ message: 'Discount not found' });
    await db()('discounts').where({ id: discount.id }).delete();
    res.json({ message: 'Discount deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /discounts/validate - validate a discount code
export const validateDiscount = async (req, res) => {
  try {
    const { code, amount } = req.body;
    if (!code) return res.status(400).json({ message: 'code is required' });

    const discount = await db()('discounts').where({ code: code.toUpperCase(), isActive: true }).first();
    if (!discount) return res.status(404).json({ message: 'Invalid discount code' });

    if (discount.usageLimit > 0 && discount.usedCount >= discount.usageLimit) {
      return res.status(400).json({ message: 'Discount code has been fully redeemed' });
    }

    if (discount.endsAt && new Date(discount.endsAt) < new Date()) {
      return res.status(400).json({ message: 'Discount code has expired' });
    }

    if (discount.minOrderAmount > 0 && parseFloat(amount || 0) < discount.minOrderAmount) {
      return res.status(400).json({ message: `Minimum order of ${discount.minOrderAmount} required` });
    }

    let discountAmount = 0;
    if (discount.type === 'percentage') {
      discountAmount = (parseFloat(amount || 0) * discount.value) / 100;
    } else {
      discountAmount = discount.value;
    }

    res.json({ valid: true, discount: { ...discount, discountAmount } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default { getDiscounts, getDiscount, createDiscount, updateDiscount, deleteDiscount, validateDiscount };
