import express from 'express';
import { authenticateUser, authorizeRoles } from '../middleware/auth.js';
import { SellerProfile, User, OtpToken } from '../models/index.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// GST Verify (stubbed - replace with real API integration)
router.post('/verify-gst', async (req, res) => {
  try {
    const { gstNumber, businessName } = req.body;
    if (!gstNumber) return res.status(400).json({ message: 'GST number is required' });

    // Basic format check for India GST (15 chars alphanumeric)
    const isFormatOk = /^[0-9A-Z]{15}$/.test(gstNumber);
    if (!isFormatOk) return res.status(400).json({ message: 'Invalid GST format' });

    // Stub: Assume valid if format ok; Optionally check businessName non-empty
    return res.json({ valid: true, legalName: businessName || 'N/A', message: 'Stub verification passed' });
  } catch (err) {
    console.error('GST verify error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Full Seller Registration (after OTP verified)
router.post('/register-full', async (req, res) => {
  try {
    // Debug: summarize incoming payload (no sensitive/base64)
    console.log('POST /api/seller/register-full - incoming', {
      email: req.body?.email,
      phone: req.body?.phone,
      companyName: req.body?.companyName,
      hasOtpId: Boolean(req.body?.otpId),
      imagesCount: Array.isArray(req.body?.images) ? req.body.images.length : 0,
      hasPasswordMin6: typeof req.body?.password === 'string' && req.body.password.length >= 6,
      disableVerifications: process.env.DISABLE_VERIFICATIONS === 'true'
    });

    const {
      otpId,
      // Step 1 (Basic + essential)
      name, email, phone, password,
      companyName, gstNumber, businessType, businessCategory, description,
      // NEW: seller role
      sellerRole,
      // Step 2 Contact
      businessEmail, alternatePhone,
      // Step 3 Address
      address, // { street, city, state, pincode, country, district }
      // Step 4 Online
      websiteUrl, facebook, instagram, linkedin,
      // Step 5 Documents/Bank
      gstCertificate, panNumber,
      bankDetails, // { accountHolderName, accountNumber, ifscCode, upiId }
      companyLogo, yearsInBusiness, totalEmployees,
      // Step 6 Media
      images, // [{url, tag}]
      // NEW: videos
      videos // [{url, title?, tag?}]
    } = req.body;

    const bypass = process.env.DISABLE_VERIFICATIONS === 'true';
    if (!bypass) {
      if (!otpId) {
        console.warn('register-full: missing otpId');
        return res.status(400).json({ message: 'otpId is required' });
      }

      const otp = await OtpToken.findById(otpId);
      if (!otp) {
        console.warn('register-full: OTP not found', { otpId });
        return res.status(400).json({ message: 'OTP not verified or mismatched' });
      }
      if (!otp.verified) {
        console.warn('register-full: OTP not verified', { otpId, verified: otp.verified });
        return res.status(400).json({ message: 'OTP not verified or mismatched' });
      }
      if (otp.email && otp.email !== email) {
        console.warn('register-full: OTP email mismatch', { otpEmail: otp.email, email });
        return res.status(400).json({ message: 'OTP not verified or mismatched' });
      }
      if (otp.phone && otp.phone !== phone) {
        console.warn('register-full: OTP phone mismatch', { otpPhone: otp.phone, phone });
        return res.status(400).json({ message: 'OTP not verified or mismatched' });
      }
    } else {
      console.warn('register-full: OTP verification bypassed (DISABLE_VERIFICATIONS=true)');
    }

    // Ensure password for user creation
    if (!password || password.length < 6) {
      console.warn('register-full: weak or missing password', { length: password ? password.length : 0 });
      return res.status(400).json({ message: 'Password is required (min 6 chars)' });
    }

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      console.warn('register-full: user already exists with email', { email });
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    console.log('register-full: creating user', { email, role: 'seller' });
    // Create user with role seller and pending status
    user = new User({
      name,
      email,
      password,
      role: 'seller',
      phone,
      status: 'pending'
    });
    await user.save();
    console.log('register-full: user created', { userId: user._id });

    console.log('register-full: creating seller profile', { userId: user._id, companyName });
    // Create seller profile
    const sellerProfile = new SellerProfile({
      userId: user._id,
      companyName,
      gstNumber,
      businessType,
      businessCategory,
      // NEW: role
      sellerRole,
      description,
      contact: {
        businessEmail: businessEmail || email,
        phone,
        alternatePhone
      },
      address: {
        street: address?.street || '',
        city: address?.city || '',
        state: address?.state || '',
        pincode: address?.pincode || '',
        // NEW: district
        district: address?.district || '',
        country: address?.country || 'India'
      },
      websiteUrl,
      facebook,
      instagram,
      linkedin,
      gstCertificate: gstCertificate || null,
      panNumber,
      bankDetails: {
        accountHolderName: bankDetails?.accountHolderName || '',
        accountNumber: bankDetails?.accountNumber || '',
        ifscCode: bankDetails?.ifscCode || '',
        upiId: bankDetails?.upiId || ''
      },
      companyLogo: companyLogo || null,
      yearsInBusiness: yearsInBusiness || 0,
      totalEmployees: totalEmployees || 0,
      images: Array.isArray(images) ? images : [],
      // NEW: videos
      videos: Array.isArray(videos) ? videos : []
    });
    await sellerProfile.save();
    console.log('register-full: seller profile created', { sellerProfileId: sellerProfile._id });

    // Issue token for immediate login (client may ignore for pending flow)
    const payload = { user: { id: user.id, role: user.role } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

    console.log('register-full: success', { userId: user._id, status: user.status });
    return res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (err) {
    console.error('Seller full register error (exception):', err);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/seller/profile
// @desc    Create or update seller profile
// @access  Private (Seller only)
router.post('/profile',
  authenticateUser,
  authorizeRoles(['seller']),
  async (req, res) => {
    const {
      companyName, gstNumber,
      // contact
      businessEmail, phone, alternatePhone,
      // address
      address,
      // online
      websiteUrl, social, companyLogo,
      // documents & bank
      documents, bank,
      // metrics
      yearsInBusiness, totalEmployees,
      // images
      businessImages,
      certifications,
      businessType, businessCategory, description
    } = req.body;

    const sellerProfileFields = {};
    sellerProfileFields.userId = req.user.user.id;

    if (companyName) sellerProfileFields.companyName = companyName;
    if (gstNumber) sellerProfileFields.gstNumber = gstNumber;

    if (businessEmail) sellerProfileFields.businessEmail = businessEmail;
    if (phone) sellerProfileFields.phone = phone;
    if (alternatePhone) sellerProfileFields.alternatePhone = alternatePhone;

    if (address) sellerProfileFields.address = address;

    if (websiteUrl) sellerProfileFields.websiteUrl = websiteUrl;
    if (social) sellerProfileFields.social = social;
    if (companyLogo) sellerProfileFields.companyLogo = companyLogo;

    if (documents) sellerProfileFields.documents = documents;
    if (bank) sellerProfileFields.bank = bank;

    if (yearsInBusiness !== undefined) sellerProfileFields.yearsInBusiness = yearsInBusiness;
    if (totalEmployees !== undefined) sellerProfileFields.totalEmployees = totalEmployees;

    if (businessImages) sellerProfileFields.businessImages = businessImages;

    if (certifications) sellerProfileFields.certifications = certifications;

    if (businessType) sellerProfileFields.businessType = businessType;
    if (businessCategory) sellerProfileFields.businessCategory = businessCategory;
    if (description) sellerProfileFields.description = description;

    try {
      let sellerProfile = await SellerProfile.findOne({ userId: req.user.user.id });

      if (sellerProfile) {
        sellerProfile = await SellerProfile.findOneAndUpdate(
          { userId: req.user.user.id },
          { $set: sellerProfileFields },
          { new: true }
        );
        return res.json(sellerProfile);
      } else {
        sellerProfile = new SellerProfile(sellerProfileFields);
        await sellerProfile.save();
        return res.status(201).json(sellerProfile);
      }
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET /api/seller/profile/:id
// @desc    Get seller profile by user ID
// @access  Public
router.get('/profile/:id', async (req, res) => {
  try {
    const sellerProfile = await SellerProfile.findOne({ userId: req.params.id }).populate('userId', ['name', 'email']);

    if (!sellerProfile) {
      return res.status(404).json({ msg: 'Seller profile not found' });
    }

    res.json(sellerProfile);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Seller profile not found' });
    }
    res.status(500).send('Server Error');
  }
});

// Add: Resubmit application for rejected seller
router.post('/resubmit', async (req, res) => {
  try {
    const {
      email, name, phone, password,
      companyName, gstNumber, businessType, businessCategory, description,
      businessEmail, alternatePhone,
      address,
      websiteUrl, facebook, instagram, linkedin,
      gstCertificate, panNumber,
      bankDetails, companyLogo, yearsInBusiness, totalEmployees,
      images
    } = req.body;

    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user) return res.status(404).json({ message: 'No seller found for this email' });
    if (user.role !== 'seller') return res.status(400).json({ message: 'User is not a seller' });
    if (user.status !== 'suspended') {
      return res.status(400).json({ message: 'Only rejected applications can be resubmitted' });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (password && typeof password === 'string') {
      if (password.length < 6) return res.status(400).json({ message: 'Password is too short (min 6 chars)' });
      user.password = password;
    }
    user.status = 'pending';
    user.rejectionReason = undefined;
    user.rejectedAt = undefined;
    await user.save();

    let sellerProfile = await SellerProfile.findOne({ userId: user._id });
    if (!sellerProfile) {
      sellerProfile = new SellerProfile({ userId: user._id });
    }

    if (companyName !== undefined) sellerProfile.companyName = companyName;
    if (gstNumber !== undefined) sellerProfile.gstNumber = gstNumber;
    if (businessType !== undefined) sellerProfile.businessType = businessType;
    if (businessCategory !== undefined) sellerProfile.businessCategory = businessCategory;
    if (description !== undefined) sellerProfile.description = description;

    sellerProfile.contact = {
      businessEmail: businessEmail || email,
      phone: phone || sellerProfile.contact?.phone || '',
      alternatePhone: alternatePhone || sellerProfile.contact?.alternatePhone || ''
    };

    sellerProfile.address = {
      street: address?.street || sellerProfile.address?.street || '',
      city: address?.city || sellerProfile.address?.city || '',
      state: address?.state || sellerProfile.address?.state || '',
      pincode: address?.pincode || sellerProfile.address?.pincode || '',
      country: address?.country || sellerProfile.address?.country || 'India'
    };

    sellerProfile.websiteUrl = websiteUrl ?? sellerProfile.websiteUrl;
    sellerProfile.facebook = facebook ?? sellerProfile.facebook;
    sellerProfile.instagram = instagram ?? sellerProfile.instagram;
    sellerProfile.linkedin = linkedin ?? sellerProfile.linkedin;
    sellerProfile.gstCertificate = gstCertificate ?? sellerProfile.gstCertificate;
    sellerProfile.panNumber = panNumber ?? sellerProfile.panNumber;

    sellerProfile.bankDetails = {
      accountHolderName: bankDetails?.accountHolderName || sellerProfile.bankDetails?.accountHolderName || '',
      accountNumber: bankDetails?.accountNumber || sellerProfile.bankDetails?.accountNumber || '',
      ifscCode: bankDetails?.ifscCode || sellerProfile.bankDetails?.ifscCode || '',
      upiId: bankDetails?.upiId || sellerProfile.bankDetails?.upiId || ''
    };

    sellerProfile.companyLogo = companyLogo ?? sellerProfile.companyLogo;

    const yib = Number(yearsInBusiness);
    sellerProfile.yearsInBusiness = Number.isFinite(yib) ? yib : (sellerProfile.yearsInBusiness || 0);
    const te = Number(totalEmployees);
    sellerProfile.totalEmployees = Number.isFinite(te) ? te : (sellerProfile.totalEmployees || 0);

    if (Array.isArray(images)) sellerProfile.images = images;

    await sellerProfile.save();

    return res.json({
      message: 'Application resubmitted. Your account is pending approval again.',
      user: { id: user.id, name: user.name, email: user.email, status: user.status }
    });
  } catch (err) {
    console.error('Seller resubmit error:', err);
    return res.status(500).json({ message: 'Server Error' });
  }
});

export default router;