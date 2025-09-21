import mongoose from 'mongoose';

const sellerProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  gstNumber: {
    type: String,
    trim: true,
    uppercase: true
  },
  // NEW: Business Details
  businessType: {
    type: String,
    enum: ['Proprietorship', 'Partnership', 'Pvt. Ltd.', 'LLP'],
  },
  businessCategory: {
    type: String,
    enum: ['Textiles', 'Electronics', 'Food & Beverages', 'Automobiles', 'Furniture', 'Handicrafts', 'Health & Beauty', 'Stationery', 'Construction', 'IT Services']
  },
  // NEW: Seller role (Register user as)
  sellerRole: {
    type: String,
    enum: ['Merchant Exporter', 'Manufacturer & Exporter', 'Merchant & Manufacturer Exporter', 'Only Manufacturer']
  },
  description: { type: String, trim: true },
  // NEW: Contact
  contact: {
    businessEmail: { type: String, trim: true },
    phone: { type: String, trim: true },
    alternatePhone: { type: String, trim: true }
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    // NEW: District
    district: String,
    country: {
      type: String,
      default: 'India'
    }
  },
  websiteUrl: {
    type: String,
    trim: true
  },
  // NEW: Social links
  facebook: { type: String, trim: true },
  instagram: { type: String, trim: true },
  linkedin: { type: String, trim: true },

  companyLogo: {
    type: String, // URL or base64
    default: null
  },
  // NEW: Documents & Bank
  gstCertificate: { type: String, default: null }, // URL or base64
  panNumber: { type: String, trim: true },
  bankDetails: {
    accountHolderName: { type: String, trim: true },
    accountNumber: { type: String, trim: true },
    ifscCode: { type: String, trim: true },
    upiId: { type: String, trim: true }
  },
  yearsInBusiness: { type: Number, min: 0 },
  totalEmployees: { type: Number, min: 0 },

  // NEW: Business Images (array of URLs/base64 with tags)
  images: [{
    url: String,
    tag: { type: String, enum: ['landmark', 'board', 'other'], default: 'other' }
  }],

  certifications: [{
    name: String,
    issuedBy: String,
    validUntil: Date,
    documentUrl: String
  }]
}, {
  timestamps: true
});

export default mongoose.model('SellerProfile', sellerProfileSchema);
