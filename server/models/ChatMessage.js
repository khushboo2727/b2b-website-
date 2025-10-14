import mongoose from 'mongoose';

const ChatMessageSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatRoom',
      required: true
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },
    attachments: [
      {
        url: { type: String },
        type: { type: String, enum: ['image', 'file', 'video', 'audio'] },
        name: { type: String },
        size: { type: Number } // in bytes
      }
    ],
    isRead: { type: Boolean, default: false },
    readAt: { type: Date }
  },
  { timestamps: true }
);

// Indexes for efficient querying
ChatMessageSchema.index({ roomId: 1, createdAt: -1 });
ChatMessageSchema.index({ receiverId: 1, isRead: 1 });

// Auto set readAt when isRead becomes true
ChatMessageSchema.pre('save', function (next) {
  if (this.isModified('isRead') && this.isRead && !this.readAt) {
    this.readAt = new Date();
  }
  next();
});

export default mongoose.model('ChatMessage', ChatMessageSchema);