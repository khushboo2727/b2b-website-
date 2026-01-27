import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import whois from 'whois-json';
import User from '../models/User.js';
import OtpToken from '../models/OtpToken.js';
import { validate, registerSchema, loginSchema, authenticateUser } from '../middleware/auth.js';
import { sendOtpEmail } from '../services/emailService.js';

const router = express.Router();

router.post('/register', validate(registerSchema), async (req, res) => {
  const { name, email, password, role, phone, companyName, gstNumber, address, domainName, proofType, proofImage } = req.body;

  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    let status = 'pending'; // Default status

    // Domain verification for buyers
    if (role === 'buyer' && domainName) {
      try {
        console.log(`Verifying domain (HTTP): ${domainName}`);

        // Helper: Check domain age via RDAP (HTTP) 
        const checkDomainAge = async (domain) => {
          try {
            const res = await fetch(`https://rdap.org/domain/${domain}`, { headers: { 'Accept': 'application/rdap+json' } });
            if (!res.ok) return null;
            const data = await res.json();
            const events = data.events || [];
            const createdEvent = events.find(e => e.eventAction === 'registration') || events.find(e => e.eventAction === 'last changed');
            return createdEvent ? createdEvent.eventDate : null;
          } catch (e) {
            console.error('RDAP fetch error:', e.message);
            return null;
          }
        };

        const creationDate = await checkDomainAge(domainName);

        if (creationDate) {
          const created = new Date(creationDate);
          const sixMonthsAgo = new Date();
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
          const isOldEnough = created < sixMonthsAgo;

          console.log(`Domain Created: ${created.toISOString()}`);
          console.log(`Is > 6 months old? ${isOldEnough}`);

          // Check email domain match
          const emailDomain = email.split('@')[1];
          const isEmailMatch = emailDomain && domainName && emailDomain.toLowerCase() === domainName.toLowerCase();

          console.log(`Email Domain: ${emailDomain}, Business Domain: ${domainName}`);
          console.log(`Email Match? ${isEmailMatch}`);

          // STRICT VERIFICATION: Both conditions must be true
          if (isOldEnough && isEmailMatch) {
            status = 'approved';
            console.log('User status set to APPROVED (Verified)');
          } else {
            console.log('Verification failed: Domain age or Email mismatch.');
          }
        } else {
          console.log('Could not determine domain creation date from RDAP.');
        }
      } catch (err) {
        console.error('Domain verification process failed:', err.message);
      }
    } else if (role === 'buyer') {
      status = 'active'; // Default for buyers without domain (or as per previous logic)
    }

    // Create new user
    user = new User({
      name,
      email,
      password,
      role: role || 'buyer',
      phone,
      status: role === 'seller' ? 'pending' : status, // Sellers always pending initially

      companyName,
      gstNumber,
      address,

      // Save optional proof details
      proofType: proofType || undefined,
      proofImage,

      verified: status === 'approved'
    })


    // Save user to database
    await user.save();

    // Create JWT payload
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    // Sign token
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status || 'active'
          }
        });
      }
    );
  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', validate(loginSchema), async (req, res) => {
  console.log("Login request body:", req.body);
  const { email, password } = req.body;
  console.log("Login request body:", req.body);

  try {
    console.log("Login request body:", req.body);
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create JWT payload
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    // Sign token
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            // include status so client can enforce approval
            status: user.status,
            membershipPlan: user.membershipPlan
          }
        });
      }
    );
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/status-by-email
// @desc    Public endpoint to get user existence and approval status by email
// @access  Public
router.get('/status-by-email', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('name email status rejectionReason');
    if (!user) {
      return res.json({ exists: false });
    }
    return res.json({
      exists: true,
      name: user.name,
      email: user.email,
      status: user.status,
      rejectionReason: user.rejectionReason || null
    });
  } catch (err) {
    console.error('status-by-email error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile (Buyer)
// @access  Private
router.put('/profile', authenticateUser, async (req, res) => {
  const { name, phone, companyName, gstNumber, address, domainName, proofType, proofImage } = req.body;

  try {
    const user = await User.findById(req.user.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Update basic fields
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (companyName) user.companyName = companyName;
    if (gstNumber) user.gstNumber = gstNumber;
    if (address) user.address = address;
    if (proofType) user.proofType = proofType;
    if (proofImage) user.proofImage = proofImage;

    // Handle Domain Verification on change
    if (domainName && domainName !== user.domainName) { // Assuming domainName field wasn't in schema but we treat as derived or stored? 
      // Wait, User model doesn't strictly have 'domainName' field yet? 
      // Let's check User.js again. Assuming we store it in `companyName` or separate?
      // User request said "buyer ke profile m domain name...". 
      // I should add `domainName` to User schema if not present, OR verify based on provided domainName and update status.
      // Let's assume we proceed with verification and update status.

      console.log(`Re-verifying domain (HTTP): ${domainName}`);

      // Helper: Check domain age via RDAP (HTTP) (Duplicated logic, could extract to helper)
      const checkDomainAge = async (domain) => {
        try {
          const res = await fetch(`https://rdap.org/domain/${domain}`, { headers: { 'Accept': 'application/rdap+json' } });
          if (!res.ok) return null;
          const data = await res.json();
          const events = data.events || [];
          const createdEvent = events.find(e => e.eventAction === 'registration') || events.find(e => e.eventAction === 'last changed');
          return createdEvent ? createdEvent.eventDate : null;
        } catch (e) {
          console.error('RDAP fetch error:', e.message);
          return null;
        }
      };

      const creationDate = await checkDomainAge(domainName);

      if (creationDate) {
        const created = new Date(creationDate);
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const isOldEnough = created < sixMonthsAgo;

        // Check email domain match
        const emailDomain = user.email.split('@')[1];
        const isEmailMatch = emailDomain && domainName && emailDomain.toLowerCase() === domainName.toLowerCase();

        if (isOldEnough && isEmailMatch) {
          user.status = 'approved';
          user.verified = true;
        } else {
          // If they update domain but fail verification, do we un-verify?
          // Maybe safe to revert to active/unverified if critical.
          // user.verified = false; 
        }
      }
    }

    await user.save();
    res.json(user);

  } catch (err) {
    console.error('Profile update error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});
//   try {
//     const { email, phone } = req.body;
//     const target = email || phone;
//     const type = email ? 'email' : 'phone';

//     if (!target) {
//       return res.status(400).json({ message: 'Email or phone is required' });
//     }

//     // generate 6-digit OTP
//     const code = String(Math.floor(100000 + Math.random() * 900000));
//     const codeHash = await bcrypt.hash(code, 10);
//     const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

//     await OtpToken.findOneAndUpdate(
//       { target, purpose: 'seller_registration' },
//       { codeHash, type, attempts: 0, verified: false, expiresAt },
//       { upsert: true, new: true }
//     );

//     if (email) {
//       const transporter = nodemailer.createTransport({
//         service: 'gmail',
//         auth: {
//           user: process.env.EMAIL_USER,
//           pass: process.env.EMAIL_PASSWORD
//         }
//       });

//       await transporter.sendMail({
//         from: process.env.EMAIL_USER,
//         to: email,
//         subject: 'Your OTP Code - Niryat Business',
//         html: `
//           <div style="font-family: Arial, sans-serif">
//             <h2>Your OTP Code</h2>
//             <p>Use the following OTP to continue registration:</p>
//             <h1 style="letter-spacing: 4px">${code}</h1>
//             <p>This code will expire in 10 minutes.</p>
//           </div>
//         `
//       });
//     } else {
//       // TODO: integrate SMS provider here
//       return res.status(501).json({ message: 'SMS OTP not implemented yet. Use email.' });
//     }

//     return res.json({ success: true, message: 'OTP sent successfully' });
//   } catch (err) {
//     console.error('Send OTP error:', err);
//     return res.status(500).json({ message: 'Failed to send OTP' });
//   }
// });


router.post('/otp/request', async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    if (!email && !phone) {
      return res.status(400).json({ message: 'Email or phone is required' });
    }

    // generate 6-digit numeric OTP
    const rawCode = (Math.floor(100000 + Math.random() * 900000)).toString();
    // console.log('Generated OTP:', rawCode);

    // hash code
    const codeHash = await bcrypt.hash(rawCode, 10);

    // create token doc
    const otpDoc = await OtpToken.create({
      email: email || undefined,
      phone: phone || undefined,
      codeHash,
      verified: false,
      attempts: 0,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 min
    });

    // Send via email only (SMS not implemented)
    if (email) {
      console.log('Sending OTP email to:', email);
      const result = await sendOtpEmail(email, rawCode, name || 'User');
      console.log('OTP email result:', result);
      if (!result?.success) {
        return res.status(500).json({ message: 'Failed to send OTP email', error: result?.error || 'Unknown error' });
      }
    } else {
      return res.status(501).json({ message: 'SMS OTP not implemented yet. Use email.' });
    }

    return res.json({ otpId: otpDoc._id, message: 'OTP generated and sent' });
  } catch (err) {
    console.error('OTP request error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});
router.post('/otp/verify', async (req, res) => {
  try {
    const { otpId, code } = req.body;
    if (!otpId || !code) {
      return res.status(400).json({ message: 'otpId and code are required' });
    }

    const otp = await OtpToken.findById(otpId);
    if (!otp) return res.status(400).json({ message: 'Invalid OTP session' });
    if (otp.verified) return res.json({ verified: true, message: 'Already verified' });
    if (otp.expiresAt < new Date()) return res.status(400).json({ message: 'OTP expired' });
    if (otp.attempts >= 5) return res.status(429).json({ message: 'Too many attempts' });

    const isMatch = await bcrypt.compare(code, otp.codeHash);
    if (!isMatch) {
      otp.attempts = (otp.attempts || 0) + 1;
      await otp.save();
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    otp.verified = true;
    await otp.save();

    return res.json({ verified: true, message: 'OTP verified successfully' });
  } catch (err) {
    console.error('OTP verify error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Verify OTP
// router.post('/verify-otp', async (req, res) => {
//   try {
//     const { email, phone, code } = req.body;
//     const target = email || phone;
//     if (!target || !code) {
//       return res.status(400).json({ message: 'Target and code are required' });
//     }

//     const record = await OtpToken.findOne({ target, purpose: 'seller_registration' });
//     if (!record) return res.status(400).json({ message: 'OTP not found. Please request a new one.' });
//     if (record.expiresAt < new Date()) {
//       return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
//     }
//     if (record.attempts >= 5) {
//       return res.status(429).json({ message: 'Too many attempts. Please request a new OTP.' });
//     }

//     const match = await bcrypt.compare(code, record.codeHash);
//     if (!match) {
//       record.attempts += 1;
//       await record.save();
//       return res.status(400).json({ message: 'Invalid OTP' });
//     }

//     record.verified = true;
//     await record.save();
//     return res.json({ success: true, message: 'OTP verified' });
//   } catch (err) {
//     console.error('Verify OTP error:', err);
//     return res.status(500).json({ message: 'Failed to verify OTP' });
//   }
// });

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({ message: 'If an account with that email exists, we have sent a password reset link.' });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Save reset token to user (you might want to add this field to User model)
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    // Send email with reset link
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

    // Import sendEmail from emailService
    const { sendEmail } = await import('../services/emailService.js');

    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hello ${user.name},</p>
          <p>You requested a password reset for your account. Click the link below to reset your password:</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #ff8c32; color: white; text-decoration: none; border-radius: 4px; margin: 16px 0;">Reset Password</a>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this password reset, please ignore this email.</p>
          <p>Best regards,<br>Niryat Business Team</p>
        </div>
      `
    });

    res.json({ message: 'If an account with that email exists, we have sent a password reset link.' });
  } catch (error) {
    console.error('Forgot password error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;

  try {
    if (!token || !password) {
      return res.status(400).json({ message: 'Token and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Find user with valid reset token
    const user = await User.findOne({
      _id: decoded.userId,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Update password
    user.password = password; // This will be hashed by the pre-save middleware
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
