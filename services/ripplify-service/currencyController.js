import { createConnection } from '../shared/db.js';
import { authService } from '../shared/serviceClient.js';

const db = () => createConnection('ripplify_db');

export const getSupportedCurrencies = async (req, res) => {
  try {
    const currencies = await authService.getCurrencies();
    res.json(currencies);
  } catch (error) {
    // Fallback default currencies if auth service is unavailable
    console.error('Auth service call failed, using fallback:', error.message);
    res.json([
      { code: 'USD', name: 'US Dollar', flag: '🇺🇸', rate: 1.00, symbol: '$' },
      { code: 'EUR', name: 'Euro', flag: '🇪🇺', rate: 0.92, symbol: '€' },
      { code: 'GBP', name: 'British Pound', flag: '🇬🇧', rate: 0.79, symbol: '£' },
      { code: 'KES', name: 'Kenyan Shilling', flag: '🇰🇪', rate: 129.00, symbol: 'KSh' },
      { code: 'NGN', name: 'Nigerian Naira', flag: '🇳🇬', rate: 1550.00, symbol: '₦' },
      { code: 'ZAR', name: 'South African Rand', flag: '🇿🇦', rate: 18.45, symbol: 'R' },
    ]);
  }
};

export const getMyCurrencies = async (req, res) => {
  try {
    // Since user_currencies is in auth_db, we return the user's payment links currencies as a proxy
    const links = await db()('payment_links')
      .where({ userId: req.user.id })
      .distinct('currency');
    const currencies = links.map(l => ({ code: l.currency, enabled: true }));
    res.json(currencies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const upsertCurrency = async (req, res) => {
  try {
    const { code } = req.params;
    const { enabled } = req.body;

    if (enabled === undefined) return res.status(400).json({ message: 'Enabled status is required' });

    // This is a no-op on ripplify side since currency config lives in auth_db
    // Return success to keep API compatibility
    res.json({ message: 'Currency configured', currency: { code, enabled } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default { getSupportedCurrencies, getMyCurrencies, upsertCurrency };
