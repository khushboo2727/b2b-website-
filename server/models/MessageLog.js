import mongoose from 'mongoose';

const MessageLogSchema = new mongoose.Schema({
  rfqId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RFQ',
    required: true
  },
  fromUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  toUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  emailType: {
    type: String,
    enum: ['rfq_notification', 'quote_response', 'status_update', 'communication'],
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  recipientEmail: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['sent', 'failed', 'pending'],
    default: 'pending'
  },
  sentAt: {
    type: Date
  },
  errorMessage: {
    type: String
  },
  metadata: {
    emailProvider: String,
    messageId: String,
    deliveryStatus: String
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
MessageLogSchema.index({ rfqId: 1, createdAt: -1 });
MessageLogSchema.index({ fromUserId: 1, toUserId: 1 });
MessageLogSchema.index({ emailType: 1, status: 1 });
MessageLogSchema.index({ sentAt: -1 });

export default mongoose.model('MessageLog', MessageLogSchema);