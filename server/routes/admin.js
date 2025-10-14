import express from 'express';
import { User } from '../models/index.js';
import { Lead } from '../models/index.js';
import { Message } from '../models/index.js';
import { authenticateUser } from '../middleware/auth.js';
import { SellerProfile } from '../models/index.js';
import { sendSellerRejectionEmail } from '../services/emailService.js';

const router = express.Router();

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
  next();
};

// Apply authentication and admin check to all routes
router.use(authenticateUser);
router.use(requireAdmin);

// @route   GET /api/admin/dashboard-stats
// @desc    Get dashboard statistics
// @access  Private (Admin only)
router.get('/dashboard-stats', async (req, res) => {
  try {
    const totalBuyers = await User.countDocuments({ role: 'buyer' });
    const totalSellers = await User.countDocuments({ role: 'seller' });
    const pendingSellers = await User.countDocuments({ role: 'seller', status: 'pending' });
    const activeSellers = await User.countDocuments({ role: 'seller', status: 'active' });
    const totalInquiries = await Lead.countDocuments();
    const recentInquiries = await Lead.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    res.json({
      totalBuyers,
      totalSellers,
      pendingSellers,
      activeSellers,
      totalInquiries,
      recentInquiries
    });
  } catch (error) {
    console.error('Dashboard stats error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/pending-sellers
// @desc    Get all pending sellers
// @access  Private (Admin only)
router.get('/pending-sellers', async (req, res) => {
  try {
    const pendingSellers = await User.find({ 
      role: 'seller', 
      status: 'pending' 
    }).select('-password').sort({ createdAt: -1 });
    
    res.json(pendingSellers);
  } catch (error) {
    console.error('Get pending sellers error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/seller/:id
// @desc    Get full details of a seller (user + seller profile)
// @access  Private (Admin only)
router.get('/seller/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Seller not found' });
    }
    if (user.role !== 'seller') {
      return res.status(400).json({ message: 'User is not a seller' });
    }

    const profile = await SellerProfile.findOne({ userId: user._id }).lean();

    // Response contains everything admin needs to review
    return res.json({
      user,
      profile
    });
  } catch (error) {
    console.error('Get seller detail error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/approve-seller/:id
// @desc    Approve a seller
// @access  Private (Admin only)
router.put('/approve-seller/:id', async (req, res) => {
  try {
    const seller = await User.findById(req.params.id);
    
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }
    
    if (seller.role !== 'seller') {
      return res.status(400).json({ message: 'User is not a seller' });
    }
    
    seller.status = 'active';
    // Clear old rejection info if any
    seller.rejectionReason = undefined;
    seller.rejectedAt = undefined;
    await seller.save();
    
    res.json({ message: 'Seller approved successfully', seller: {
      id: seller._id,
      name: seller.name,
      email: seller.email,
      status: seller.status
    }});
  } catch (error) {
    console.error('Approve seller error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/reject-seller/:id
// @desc    Reject a seller
// @access  Private (Admin only)
router.put('/reject-seller/:id', async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason || typeof reason !== 'string' || !reason.trim()) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const seller = await User.findById(req.params.id);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }
    if (seller.role !== 'seller') {
      return res.status(400).json({ message: 'User is not a seller' });
    }

    seller.status = 'suspended';
    seller.rejectionReason = reason.trim();
    seller.rejectedAt = new Date();
    await seller.save();

    // send email with reason
    try {
      await sendSellerRejectionEmail(seller.email, seller.name, seller.rejectionReason);
    } catch (e) {
      console.error('Failed to send rejection email:', e.message);
    }

    res.json({
      message: 'Seller rejected successfully',
      seller: {
        id: seller._id,
        name: seller.name,
        email: seller.email,
        status: seller.status,
        rejectionReason: seller.rejectionReason
      }
    });
  } catch (error) {
    console.error('Reject seller error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/buyers
// @desc    Get all buyers
// @access  Private (Admin only)
router.get('/buyers', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const query = { role: 'buyer' };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } }
      ];
    }
    
    const buyers = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await User.countDocuments(query);
    
    res.json({
      buyers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get buyers error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/sellers
// @desc    Get all sellers with membership info
// @access  Private (Admin only)
router.get('/sellers', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', country = '', state = '' } = req.query;
    const matchQuery = { role: 'seller' };
    if (search) {
      matchQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) {
      matchQuery.status = status;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const pipeline = [
      { $match: matchQuery },
      {
        $lookup: {
          from: 'membershipplans',
          localField: 'membershipPlan',
          foreignField: '_id',
          as: 'membershipPlan'
        }
      },
      { $unwind: { path: '$membershipPlan', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'sellerprofiles',
          localField: '_id',
          foreignField: 'userId',
          as: 'sellerProfile'
        }
      },
      { $unwind: { path: '$sellerProfile', preserveNullAndEmptyArrays: true } }
    ];

    const addrMatch = {};
    if (country) addrMatch['sellerProfile.address.country'] = { $regex: country, $options: 'i' };
    if (state) addrMatch['sellerProfile.address.state'] = { $regex: state, $options: 'i' };
    if (Object.keys(addrMatch).length) {
      pipeline.push({ $match: addrMatch });
    }

    pipeline.push(
      { $project: { password: 0 } },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          data: [
            { $skip: (pageNum - 1) * limitNum },
            { $limit: limitNum }
          ],
          totalCount: [{ $count: 'count' }]
        }
      }
    );

    const result = await User.aggregate(pipeline);
    const data = result[0]?.data || [];
    const total = result[0]?.totalCount?.[0]?.count || 0;

    res.json({
      sellers: data,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      total
    });
  } catch (error) {
    console.error('Get sellers error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/block-user/:id
// @desc    Block/suspend a user
// @access  Private (Admin only)
router.put('/block-user/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot block admin user' });
    }
    
    user.status = 'suspended';
    await user.save();
    
    res.json({ message: 'User blocked successfully', user: {
      id: user._id,
      name: user.name,
      email: user.email,
      status: user.status
    }});
  } catch (error) {
    console.error('Block user error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/unblock-user/:id
// @desc    Unblock/activate a user
// @access  Private (Admin only)
router.put('/unblock-user/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.status = 'active';
    await user.save();
    
    res.json({ message: 'User unblocked successfully', user: {
      id: user._id,
      name: user.name,
      email: user.email,
      status: user.status
    }});
  } catch (error) {
    console.error('Unblock user error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/inquiries
// @desc    Get all inquiries/leads
// @access  Private (Admin only)
router.get('/inquiries', async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '', search = '' } = req.query;
    const query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { buyerName: { $regex: search, $options: 'i' } },
        { buyerEmail: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }
    
    const inquiries = await Lead.find(query)
      .populate('product', 'name category')
      .populate('seller', 'name email companyName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Lead.countDocuments(query);
    
    res.json({
      inquiries,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get inquiries error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/messages
// @desc    Get all messages from sellers to admin
// @access  Private (Admin only)
router.get('/messages', async (req, res) => {
  try {
    const messages = await Message.find({
      receiverType: 'admin'
    })
    .populate('senderId', 'name email companyName')
    .sort({ createdAt: -1 });

    // Group messages by sender
    const conversations = {};
    messages.forEach(message => {
      const senderId = message.senderId._id.toString();
      if (!conversations[senderId]) {
        conversations[senderId] = {
          seller: message.senderId,
          messages: [],
          lastMessage: null,
          unreadCount: 0
        };
      }
      conversations[senderId].messages.push(message);
      if (!message.isRead) {
        conversations[senderId].unreadCount++;
      }
      if (!conversations[senderId].lastMessage || 
          message.createdAt > conversations[senderId].lastMessage.createdAt) {
        conversations[senderId].lastMessage = message;
      }
    });

    res.json(Object.values(conversations));
  } catch (error) {
    console.error('Get admin messages error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/messages/:sellerId
// @desc    Get conversation with specific seller
// @access  Private (Admin only)
router.get('/messages/:sellerId', async (req, res) => {
  try {
    const { sellerId } = req.params;

    const messages = await Message.find({
      $or: [
        { senderId: sellerId, receiverType: 'admin' },
        { senderType: 'admin', receiverId: sellerId }
      ]
    })
    .populate('senderId', 'name email')
    .sort({ createdAt: 1 });

    // Mark messages as read
    await Message.updateMany(
      { senderId: sellerId, receiverType: 'admin', isRead: false },
      { isRead: true }
    );

    res.json({ messages });
  } catch (error) {
    console.error('Get conversation error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admin/messages/:sellerId/reply
// @desc    Send reply to seller
// @access  Private (Admin only)
router.post('/messages/:sellerId/reply', async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { message } = req.body;

    // Validate seller exists
    const seller = await User.findById(sellerId);
    if (!seller || seller.role !== 'seller') {
      return res.status(400).json({ message: 'Invalid seller' });
    }

  // Create admin reply
  const adminReply = new Message({
      senderId: req.user.user.id,
      receiverId: sellerId,
      content: message,
      messageType: 'admin_reply',
      senderType: 'admin',
      receiverType: 'seller'
  });

    await adminReply.save();

    res.status(201).json({
      message: 'Reply sent successfully',
      data: adminReply
    });
  } catch (error) {
    console.error('Send admin reply error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;