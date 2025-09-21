import express from 'express';
import { authenticateUser, authorizeRoles } from '../middleware/auth.js';
import { Lead, User, Product, MembershipPlan } from '../models/index.js';
import NotificationService from '../services/notificationService.js';

const router = express.Router();

// @route   POST /api/lead
// @desc    Create new lead/inquiry
// @access  Private (Buyer only)
router.post('/',
  authenticateUser,
  authorizeRoles(['buyer']),
  async (req, res) => {
    const { productId, message, buyerContact, quantity, budget } = req.body;

    try {
      const newLead = new Lead({
        buyerId: req.user.user.id,
        productId,
        message,
        buyerContact,
        quantity,
        budget
      });

      const lead = await newLead.save();
      await lead.populate(['buyerId', 'productId']);

      // NEW: Notify seller about new inquiry
      try {
        const buyer = await User.findById(req.user.user.id);
        const productDoc = await Product.findById(productId).populate('sellerId');
        if (productDoc?.sellerId) {
          await NotificationService.createInquiryNotification(
            productDoc.sellerId._id,
            lead,
            buyer || {}
          );
        }
      } catch (notifyErr) {
        console.error('Notification error (inquiry):', notifyErr);
      }
      
      res.status(201).json(lead);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET /api/leads
// @desc    Get leads for seller with advanced filtering
// @access  Private (Seller only)
router.get('/',
  authenticateUser,
  authorizeRoles(['seller']),
  async (req, res) => {
    try {
      const { 
        status, 
        isRead, 
        dateFrom, 
        dateTo, 
        productId, 
        buyerName, 
        priority,
        page = 1, 
        limit = 10 
      } = req.query;
      
      const user = await User.findById(req.user.user.id).populate('membershipPlan');
      
      // CHANGED: Don’t block if no membership; default to 'Free'
      const membershipPlanName = user.membershipPlan?.name || 'Free';
      
      // Build filter query
      let filterQuery = {
        productId: { $in: await Product.find({ sellerId: req.user.user.id }).distinct('_id') }
      };
      
      // Apply filters
      if (status) filterQuery.status = status;
      if (isRead !== undefined) filterQuery.isRead = isRead === 'true';
      if (priority) filterQuery.priority = priority;
      if (productId) filterQuery.productId = productId;
      
      // Date range filter
      if (dateFrom || dateTo) {
        filterQuery.createdAt = {};
        if (dateFrom) filterQuery.createdAt.$gte = new Date(dateFrom);
        if (dateTo) filterQuery.createdAt.$lte = new Date(dateTo);
      }
      
      const totalLeads = await Lead.countDocuments(filterQuery);
      
      let leads = await Lead.find(filterQuery)
        .populate([
          { path: 'buyerId', select: 'name email' },
          { path: 'productId', select: 'name price category images' }
        ])
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));
      
      // Mask contact info for Free plan
      const enhancedLeads = leads.map(lead => {
        const leadObj = lead.toObject();
        
        if (membershipPlanName === 'Free') {
          if (leadObj.buyerContact) {
            leadObj.buyerContact = {
              companyName: leadObj.buyerContact.companyName || 'Hidden',
              email: '***@***.com',
              phone: '***-***-****'
            };
          }
          leadObj.buyerId = {
            name: 'Premium Required',
            email: 'upgrade@required.com'
          };
        }
        
        return leadObj;
      });
      
      res.json({
        leads: enhancedLeads,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalLeads / limit),
          totalLeads,
          hasNext: page * limit < totalLeads,
          hasPrev: page > 1
        },
        membershipPlan: membershipPlanName
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   PATCH /api/lead/:id/read
// @desc    Mark lead as read/unread
// @access  Private (Seller only)
router.patch('/:id/read',
  authenticateUser,
  authorizeRoles(['seller']),
  async (req, res) => {
    try {
      const { isRead } = req.body;
      
      const lead = await Lead.findById(req.params.id);
      if (!lead) {
        return res.status(404).json({ msg: 'Lead not found' });
      }
      
      // Verify seller owns this lead's product
      const product = await Product.findById(lead.productId);
      if (product.sellerId.toString() !== req.user.user.id) {
        return res.status(403).json({ msg: 'Access denied' });
      }
      
      lead.isRead = isRead;
      if (isRead) {
        lead.readAt = new Date();
      } else {
        lead.readAt = undefined;
      }
      
      await lead.save();
      
      res.json({ msg: 'Lead status updated', lead });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   PATCH /api/lead/:id/status
// @desc    Update lead status
// @access  Private (Seller only)
router.patch('/:id/status',
  authenticateUser,
  authorizeRoles(['seller']),
  async (req, res) => {
    const { status } = req.body;
    
    if (!['open', 'closed'].includes(status)) {
      return res.status(400).json({ msg: 'Invalid status. Must be "open" or "closed"' });
    }

    try {
      // Find the lead and verify it belongs to seller's product
      const lead = await Lead.findById(req.params.id).populate('productId');
      
      if (!lead) {
        return res.status(404).json({ msg: 'Lead not found' });
      }
      
      if (lead.productId.sellerId.toString() !== req.user.user.id) {
        return res.status(403).json({ msg: 'Not authorized to update this lead' });
      }
      
      lead.status = status;
      await lead.save();
      
      // Create notification for seller
      const buyer = await User.findById(buyerId);
      const product = await Product.findById(productId).populate('sellerId');
      
      if (product && product.sellerId) {
        await NotificationService.createInquiryNotification(
          product.sellerId._id,
          lead,
          buyer
        );
      }
      
      res.json({ msg: `Lead status updated to ${status}`, lead });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

export default router;