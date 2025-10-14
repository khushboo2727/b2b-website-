import express from 'express';
import jwt from 'jsonwebtoken';   
import { User } from '../models/index.js';
import { validate, authenticateUser } from '../middleware/auth.js';
import { registerSchema, loginSchema } from '../middleware/auth.js';
import { OtpToken } from '../models/index.js';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { sendOtpEmail } from '../services/emailService.js';

const router = express.Router();

router.post('/register', validate(registerSchema), async (req, res) => {
  const { name, email, password, role, phone, companyName, gstNumber, address } = req.body;

  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    user = new User({
      name,
      email,
      password,
      role: role || 'buyer',
      phone,
      // Set seller status to pending if role is seller
      ...(role === 'seller' && { 
        status: 'pending',
        companyName,
        gstNumber,
        address
      })
    });

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

// // Send OTP for seller registration (email preferred)
// router.post('/send-otp', async (req, res) => {
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
