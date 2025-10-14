import express from 'express';
import { authenticateUser, authorizeRoles } from '../middleware/auth.js';
import { Lead, User, Product, MembershipPlan } from '../models/index.js';
import NotificationService from '../services/notificationService.js';
import { sendLeadNotificationToSeller, sendLeadThankYouToBuyer } from '../services/emailService.js';

const router = express.Router();

// @route   POST /api/leads
// @desc    Create new lead/inquiry with quote distribution
// @access  Private (Buyer only)
router.post('/',
  authenticateUser,
  authorizeRoles(['buyer']),
  async (req, res) => {
    const { productId, message, buyerContact, quantity, budget } = req.body;

    try {
      // Get product details to find category
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      // Find all sellers in the same category
      const categoryProducts = await Product.find({ 
        category: product.category,
        isActive: true 
      }).distinct('sellerId');

      const newLead = new Lead({
        buyerId: req.user.user.id,
        productId,
        message,
        buyerContact,
        quantity,
        budget,
        category: product.category,
        distributedTo: categoryProducts.map(sellerId => ({ sellerId }))
      });

      const lead = await newLead.save();
      await lead.populate(['buyerId', 'productId']);

      // Notify all sellers in the category about new inquiry and send emails
      try {
        const buyer = await User.findById(req.user.user.id);
        for (const sellerId of categoryProducts) {
          // In-app notification
          await NotificationService.createInquiryNotification(
            sellerId,
            lead,
            buyer || {}
          );

          // Email notification to seller
          try {
            const sellerUser = await User.findById(sellerId);
            if (sellerUser?.email) {
              await sendLeadNotificationToSeller(
                sellerUser.email,
                lead,
                {
                  name: buyer?.name || buyerContact?.name || 'Buyer',
                  email: buyer?.email || buyerContact?.email,
                  phone: buyer?.phone || buyerContact?.phone,
                  companyName: buyerContact?.companyName
                },
                product
              );
            }
          } catch (sellerEmailErr) {
            console.error('Seller email send error:', sellerEmailErr);
          }
        }

        // Thank you email to buyer
        try {
          if (buyer?.email) {
            await sendLeadThankYouToBuyer(
              buyer.email,
              buyer?.name || 'Buyer',
              product?.title || 'your selected product'
            );
          } else if (buyerContact?.email) {
            await sendLeadThankYouToBuyer(
              buyerContact.email,
              buyerContact?.name || 'Buyer',
              product?.title || 'your selected product'
            );
          }
        } catch (buyerEmailErr) {
          console.error('Buyer thank-you email send error:', buyerEmailErr);
        }
      } catch (notifyErr) {
        console.error('Notification error (quote distribution):', notifyErr);
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

// @route   GET /api/leads/all
// @desc    Get all leads with category filtering (for All Leads section)
// @access  Private (Seller only)
router.get('/all',
  authenticateUser,
  authorizeRoles(['seller']),
  async (req, res) => {
    try {
      const { 
        category,
        status, 
        dateFrom, 
        dateTo,
        page = 1, 
        limit = 10 
      } = req.query;
      
      // Build filter query for all leads
      let filterQuery = {};
      
      // Remove leads older than 48 hours
      const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
      filterQuery.createdAt = { $gte: fortyEightHoursAgo };
      
      // Apply filters
      if (status) filterQuery.status = status;
      
      // Date range filter (override 48 hour filter if specified)
      if (dateFrom || dateTo) {
        filterQuery.createdAt = {};
        if (dateFrom) filterQuery.createdAt.$gte = new Date(dateFrom);
        if (dateTo) filterQuery.createdAt.$lte = new Date(dateTo);
      }
      
      let aggregationPipeline = [
        { $match: filterQuery },
        {
          $lookup: {
            from: 'products',
            localField: 'productId',
            foreignField: '_id',
            as: 'product'
          }
        },
        { $unwind: '$product' },
        {
          $lookup: {
            from: 'users',
            localField: 'buyerId',
            foreignField: '_id',
            as: 'buyer'
          }
        },
        { $unwind: '$buyer' }
      ];
      
      // Category filter
      if (category) {
        aggregationPipeline.push({
          $match: { 'product.category': category }
        });
      }
      
      // Count total leads
      const countPipeline = [...aggregationPipeline, { $count: 'total' }];
      const countResult = await Lead.aggregate(countPipeline);
      const totalLeads = countResult[0]?.total || 0;
      
      // Add pagination
      aggregationPipeline.push(
        { $sort: { createdAt: -1 } },
        { $skip: (page - 1) * limit },
        { $limit: parseInt(limit) }
      );
      
      const leads = await Lead.aggregate(aggregationPipeline);
      
      res.json({
        leads,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalLeads / limit),
          totalLeads,
          hasNext: page * limit < totalLeads,
          hasPrev: page > 1
        }
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

// @route   POST /api/lead/:id/purchase
// @desc    Purchase lead access
// @access  Private (Seller only)
router.post('/:id/purchase',
  authenticateUser,
  authorizeRoles(['seller']),
  async (req, res) => {
    try {
      const leadId = req.params.id;
      const sellerId = req.user.user.id;
      const { amount } = req.body;

      const lead = await Lead.findById(leadId);
      if (!lead) {
        return res.status(404).json({ message: 'Lead not found' });
      }

      // Check if lead is still active
      if (!lead.isActive || lead.status === 'inactive') {
        return res.status(400).json({ message: 'Lead is no longer active' });
      }

      // Check if seller already purchased this lead
      const alreadyPurchased = lead.purchasedBy.some(
        purchase => purchase.sellerId.toString() === sellerId
      );
      if (alreadyPurchased) {
        return res.status(400).json({ message: 'Lead already purchased' });
      }

      // Check if seller is in the distributed list
      const isDistributed = lead.distributedTo.some(
        dist => dist.sellerId.toString() === sellerId
      );
      if (!isDistributed) {
        return res.status(403).json({ message: 'Lead not available for this seller' });
      }

      // Add to purchased list
      lead.purchasedBy.push({
        sellerId,
        amount: amount || 100 // Default amount
      });

      await lead.save();
      
      res.json({ message: 'Lead purchased successfully', lead });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   POST /api/lead/:id/view
// @desc    Mark lead as viewed and check 5-view limit
// @access  Private (Seller only)
router.post('/:id/view',
  authenticateUser,
  authorizeRoles(['seller']),
  async (req, res) => {
    try {
      const leadId = req.params.id;
      const sellerId = req.user.user.id;

      const lead = await Lead.findById(leadId);
      if (!lead) {
        return res.status(404).json({ message: 'Lead not found' });
      }

      // Check if seller has purchased this lead
      const hasPurchased = lead.purchasedBy.some(
        purchase => purchase.sellerId.toString() === sellerId
      );
      if (!hasPurchased) {
        return res.status(403).json({ message: 'Lead access not purchased' });
      }

      // Check if already viewed by this seller
      const alreadyViewed = lead.viewedBy.some(
        view => view.sellerId.toString() === sellerId
      );
      
      if (!alreadyViewed) {
        // Add to viewed list
        lead.viewedBy.push({ sellerId });
        
        // Check if reached max views limit
        if (lead.viewedBy.length >= lead.maxViews) {
          lead.isActive = false;
          lead.status = 'inactive';
        }
        
        await lead.save();
      }
      
      // Return lead with buyer details only if active
      const leadData = await Lead.findById(leadId)
        .populate('buyerId', 'name email')
        .populate('productId', 'title category');
      
      // Hide buyer contact details if lead is inactive
      if (!lead.isActive) {
        leadData.buyerContact = {
          email: 'Hidden - Lead inactive',
          phone: 'Hidden - Lead inactive',
          companyName: 'Hidden - Lead inactive'
        };
      }
      
      res.json(leadData);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET /api/leads/purchased
// @desc    Get purchased leads for seller
// @access  Private (Seller only)
router.get('/purchased',
  authenticateUser,
  authorizeRoles(['seller']),
  async (req, res) => {
    try {
      const sellerId = req.user.user.id;
      const { page = 1, limit = 10, category } = req.query;
      
      let query = {
        'purchasedBy.sellerId': sellerId
      };
      
      if (category) {
        query.category = category;
      }
      
      const leads = await Lead.find(query)
        .populate('buyerId', 'name email')
        .populate('productId', 'title category')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
      
      const total = await Lead.countDocuments(query);
      
      res.json({
        leads,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

export default router;