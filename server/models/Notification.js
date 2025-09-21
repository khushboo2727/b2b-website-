import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['inquiry', 'message', 'rfq', 'lead_update', 'system'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false // Can reference Lead, Message, RFQ, etc.
  },
  relatedModel: {
    type: String,
    enum: ['Lead', 'Message', 'RFQ', 'User', 'Product'],
    required: false
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  actionUrl: {
    type: String // Frontend URL to navigate when notification is clicked
  },
  metadata: {
    senderName: String,
    productName: String,
    companyName: String,
    amount: Number,
    quantity: Number
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ type: 1, userId: 1 });
NotificationSchema.index({ relatedId: 1, relatedModel: 1 });

// Update readAt when isRead is set to true
NotificationSchema.pre('save', function(next) {
  if (this.isModified('isRead') && this.isRead && !this.readAt) {
    this.readAt = new Date();
  }
  next();
});

export default mongoose.model('Notification', NotificationSchema);