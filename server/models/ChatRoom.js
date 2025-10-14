import mongoose from 'mongoose';

const ChatRoomSchema = new mongoose.Schema(
  {
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: false // Optional: chat tied to a specific product
    },
    // Room status & metadata
    lastMessage: { type: String, trim: true },
    lastMessageAt: { type: Date },
    lastMessageBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    unreadCountForBuyer: { type: Number, default: 0 },
    unreadCountForSeller: { type: Number, default: 0 },

    isArchivedForBuyer: { type: Boolean, default: false },
    isArchivedForSeller: { type: Boolean, default: false },

    isBlocked: { type: Boolean, default: false },
    blockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    metadata: {
      type: Map,
      of: String
    }
  },
  { timestamps: true }
);

// Ensure one room per buyer-seller-product combination
ChatRoomSchema.index({ buyerId: 1, sellerId: 1, productId: 1 }, { unique: true });
// Common query indexes
ChatRoomSchema.index({ sellerId: 1, lastMessageAt: -1 });
ChatRoomSchema.index({ buyerId: 1, lastMessageAt: -1 });

export default mongoose.model('ChatRoom', ChatRoomSchema);