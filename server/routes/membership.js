import express from 'express';
import mongoose from 'mongoose';
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
      const planParam = req.params.planId;
      let plan = null;

      // Try by ObjectId
      if (mongoose.Types.ObjectId.isValid(planParam)) {
        plan = await MembershipPlan.findById(planParam);
      }

      // If not found, try by name (param or body)
      if (!plan) {
        const nameCandidate = (req.body?.name || planParam || '').toLowerCase();
        const normalizedName =
          nameCandidate.includes('standard') || nameCandidate.includes('gold') || nameCandidate.includes('premium')
            ? 'Premium'
            : nameCandidate.includes('basic')
            ? 'Basic'
            : 'Free';

        plan = await MembershipPlan.findOne({ name: normalizedName });

        // If still not found, create a minimal plan for testing
        if (!plan) {
          plan = await MembershipPlan.create({ name: normalizedName, isActive: true });
        }
      }
      
      // // Update user's membership plan
      // const user = await User.findByIdAndUpdate(
      //   req.user.user.id,
      //   { membershipPlan: plan._id },
      //   { new: true }
      // ).populate('membershipPlan');
      
      // res.json({
      //   msg: `Successfully subscribed to ${plan.name} plan`,
      //   user: {
      //     id: user._id,
      //     name: user.name,
      //     email: user.email,
      //     role: user.role,
      //     membershipPlan: user.membershipPlan
      //   }
      // });

// Fetch user first
const user = await User.findById(req.user.user.id);

// Assign plan
user.membershipPlan = plan._id;

// For testing, mark it active immediately
user.planStatus = 'active';         // add new field in User model
user.planActivatedAt = new Date();  // add new field in User model

await user.save();

// Populate for response
await user.populate('membershipPlan');

res.json({
  msg: `Successfully activated ${plan.name} plan (testing mode)`,
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