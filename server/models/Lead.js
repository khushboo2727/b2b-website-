import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema({
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  message: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'closed', 'inactive'],
    default: 'open'
  },
  sharedWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  buyerContact: {
    email: String,
    phone: String,
    companyName: String
  },
  quantity: {
    type: Number,
    default: 1
  },
  budget: {
    type: Number
  },
  // NEW: Quote distribution system fields
  distributedTo: [{
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    distributedAt: {
      type: Date,
      default: Date.now
    }
  }],
  purchasedBy: [{
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    purchasedAt: {
      type: Date,
      default: Date.now
    },
    amount: {
      type: Number,
      required: true
    }
  }],
  viewedBy: [{
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  maxViews: {
    type: Number,
    default: 5
  },
  isActive: {
    type: Boolean,
    default: true
  },
  category: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Lead', leadSchema);
