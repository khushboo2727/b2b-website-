import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
import { MembershipPlan, User } from '../models/index.js';

const router = express.Router();

// @route   GET /api/plans
// @desc    Get all membership plans
// @access  Public
router.get('/plans', async (req, res) => {
  try {
    const plans = await MembershipPlan.find({ isActive: true });
    res.json(plans);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/subscribe/:planId
// @desc    Subscribe to a membership plan
// @access  Private
router.post('/subscribe/:planId',
  authenticateUser,
  async (req, res) => {
    try {
      const plan = await MembershipPlan.findById(req.params.planId);
      
      if (!plan) {
        return res.status(404).json({ msg: 'Membership plan not found' });
      }
      
      // Update user's membership plan
      const user = await User.findByIdAndUpdate(
        req.user.user.id,
        { membershipPlan: plan._id },
        { new: true }
      ).populate('membershipPlan');
      
      res.json({
        msg: `Successfully subscribed to ${plan.name} plan`,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          membershipPlan: user.membershipPlan
        }
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

export default router;