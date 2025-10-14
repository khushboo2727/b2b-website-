import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Not required for admin messages
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: false // Optional - message might be general inquiry
  },
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: false // Optional - message might be related to a lead
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  messageType: {
    type: String,
    enum: ['inquiry', 'follow_up', 'general', 'support_query', 'admin_reply'],
    default: 'inquiry'
  },
  senderType: {
    type: String,
    enum: ['buyer', 'seller', 'admin'],
    required: false
  },
  receiverType: {
    type: String,
    enum: ['buyer', 'seller', 'admin'],
    required: false
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
MessageSchema.index({ receiverId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, receiverId: 1 });
MessageSchema.index({ productId: 1 });
MessageSchema.index({ isRead: 1 });

// Update readAt when isRead is set to true
MessageSchema.pre('save', function(next) {
  if (this.isModified('isRead') && this.isRead && !this.readAt) {
    this.readAt = new Date();
  }
  next();
});

export default mongoose.model('Message', MessageSchema);