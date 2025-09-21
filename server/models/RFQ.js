import mongoose from 'mongoose';

const RFQSchema = new mongoose.Schema({
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
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rfqNumber: {
    type: String,
    unique: true,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  targetPrice: {
    type: Number,
    min: 0
  },
  deliveryLocation: {
    address: String,
    city: String,
    state: String,
    pincode: String,
    country: {
      type: String,
      default: 'India'
    }
  },
  expectedDeliveryDate: {
    type: Date
  },
  message: {
    type: String,
    required: true
  },
  buyerContact: {
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    companyName: {
      type: String,
      required: true
    }
  },
  status: {
    type: String,
    enum: ['pending', 'sent_to_sellers', 'seller_responded', 'closed'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  validUntil: {
    type: Date,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  specifications: {
    type: String
  },
  attachments: [{
    filename: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  responses: [{
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    quotedPrice: {
      type: Number,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    deliveryTime: {
      type: String
    },
    validUntil: {
      type: Date
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    respondedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Generate unique RFQ number
RFQSchema.pre('save', async function(next) {
  if (!this.rfqNumber) {
    const count = await mongoose.model('RFQ').countDocuments();
    this.rfqNumber = `RFQ${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Index for efficient queries
RFQSchema.index({ buyerId: 1, createdAt: -1 });
RFQSchema.index({ sellerId: 1, status: 1, createdAt: -1 });
RFQSchema.index({ productId: 1 });
RFQSchema.index({ rfqNumber: 1 });
RFQSchema.index({ validUntil: 1 });

// Add index for category-based queries
RFQSchema.index({ category: 1, sellerId: 1, status: 1 });
RFQSchema.index({ sellerId: 1, createdAt: -1 });

export default mongoose.model('RFQ', RFQSchema);