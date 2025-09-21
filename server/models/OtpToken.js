import mongoose from 'mongoose';

const otpTokenSchema = new mongoose.Schema({
  email: { type: String, trim: true },
  phone: { type: String, trim: true },
  codeHash: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  verified: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true }
}, {
  timestamps: true
});

// TTL index based on expiresAt; document auto-removal after expiry
otpTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('OtpToken', otpTokenSchema);