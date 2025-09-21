import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  images: [{
    type: String // URLs to uploaded images
  }],
  category: {
    type: String,
    required: true,
    trim: true
  },
  priceRange: {
    min: {
      type: Number,
      required: false
    },
    max: {
      type: Number,
      required: false
    },
    currency: {
      type: String,
      default: 'INR'
    }
  },
  specifications: {
    type: Map,
    of: String // Key-value pairs for product specifications
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Ratings & Reviews (NEW)
  reviews: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      name: { type: String, trim: true },
      rating: { type: Number, min: 1, max: 5, required: true },
      comment: { type: String, trim: true },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  averageRating: { type: Number, default: 0 },
  ratingsCount: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Index for search functionality
productSchema.index({ title: 'text', description: 'text', category: 'text' });

export default mongoose.model('Product', productSchema);
