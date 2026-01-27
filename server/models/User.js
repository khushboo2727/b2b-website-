import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['buyer', 'seller', 'admin'],
    default: 'buyer'
  },
  phone: {
    type: String,
    trim: true
  },
  // Seller-specific fields
  companyName: {
    type: String,
    trim: true
  },
  gstNumber: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'suspended', 'approved'],
    default: 'active'
  },
  // Add rejection details
  rejectionReason: {
    type: String,
    trim: true
  },
  rejectedAt: {
    type: Date
  },
  membershipPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MembershipPlan'
  },


  planStatus: { // NEW: track if plan is active/pending/expired
    type: String,
    enum: ['active', 'pending', 'expired'],
    default: 'pending'
  },
  planActivatedAt: { // NEW: store activation date
    type: Date
  },



  verified: {
    type: Boolean,
    default: false
  },
  // Optional buyer proof
  proofType: {
    type: String,
    trim: true
  },
  proofImage: {
    type: String // Base64 or URL
  },
  // Password reset fields
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);
