import mongoose from 'mongoose';

const membershipPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ['Free', 'Basic', 'Standard', 'Gold', 'Premium'], 
    unique: true
  },
  price: {
    type: Number,
    required: true,
    default: 0
  },
  period: {
    type: String,
    default: '/year',
  },
  features: [{
    type: String,
    required: true
  }],
  limits: {
    leadsPerMonth: {
      type: Number,
      default: 0 // 0 means unlimited
    },
    productsAllowed: {
      type: Number,
      default: 0 // 0 means unlimited
    },
    verificationBadge: {
      type: Boolean,
      default: false
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model('MembershipPlan', membershipPlanSchema);


