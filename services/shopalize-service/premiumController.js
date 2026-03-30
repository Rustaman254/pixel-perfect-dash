import { createConnection } from '../shared/db.js';
import { recordActivity } from './activityController.js';

const db = () => createConnection('shopalize_db');
const ripplifyDb = () => createConnection('ripplify_db');

export const upgradeToPremium = async (req, res) => {
  try {
    const projectId = req.params.id || req.body.projectId;
    const { plan = 'premium' } = req.body;
    const userId = req.user.id;

    if (!projectId) return res.status(400).json({ message: 'projectId is required' });

    const project = await db()('projects').where({ id: projectId, userId }).first();
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.isPremium) return res.status(400).json({ message: 'Project is already premium' });

    // Premium prices
    const prices = { premium: 50.00, diamond: 150.00 };
    const price = prices[plan] || 50.00;

    // Check Ripplify balance (simplified)
    // In a real scenario, this would be an API call to ripplify-service
    // Here we check the ripplify_db directly
    const wallet = await ripplifyDb()('wallets').where({ userId, currency_code: 'USD' }).first();
    if (!wallet || parseFloat(wallet.balance) < price) {
      return res.status(400).json({ message: `Insufficient balance in your Ripplify USD wallet. Required: $${price}` });
    }

    // Deduct balance
    await ripplifyDb()('wallets')
      .where({ id: wallet.id })
      .decrement('balance', price)
      .update({ updatedAt: ripplifyDb().fn.now() });

    // Record Ripplify Transaction
    const txRef = 'PREM-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    await ripplifyDb()('transactions').insert({
      userId,
      amount: price,
      fee: 0,
      currency: 'USD',
      status: 'Completed',
      transactionId: txRef,
      type: 'Premium Upgrade',
      description: `Upgrade project ${project.name} to ${plan}`
    });

    // Update Project
    await db()('projects')
      .where({ id: projectId })
      .update({ 
        isPremium: true, 
        premiumStatus: plan,
        updatedAt: db().fn.now() 
      });

    // Record Activity
    await recordActivity({
      userId,
      action: 'project_upgraded',
      projectId,
      description: `Project "${project.name}" upgraded to ${plan} status.`,
      metadata: { plan, price, txRef }
    });

    res.json({ 
      message: `Successfully upgraded to ${plan}!`, 
      project: { ...project, isPremium: true, premiumStatus: plan } 
    });
  } catch (error) {
    console.error('Upgrade error:', error);
    res.status(500).json({ message: error.message });
  }
};

export default { upgradeToPremium };
