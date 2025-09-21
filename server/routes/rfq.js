import express from 'express';
import { authenticateUser, authorizeRoles } from '../middleware/auth.js';
import { RFQ, Product, User, SellerProfile, MessageLog } from '../models/index.js';
import { sendRFQNotification } from '../services/emailService.js';
import mongoose from 'mongoose';

const router = express.Router();

// @route   POST /api/rfq
// @desc    Submit new RFQ and distribute to relevant sellers with email notifications
// @access  Private (Buyer only)
router.post('/',
  authenticateUser,
  async (req, res) => {
    try {
      const {
        productId,
        quantity,
        targetPrice,
        deliveryLocation,
        expectedDeliveryDate,
        message,
        buyerContact
      } = req.body;

      // Validate product exists
      const product = await Product.findById(productId).populate('sellerId');
      if (!product) {
        return res.status(404).json({ msg: 'Product not found' });
      }

      // Get buyer details
      const buyer = await User.findById(req.user.user.id);
      if (!buyer) {
        return res.status(404).json({ msg: 'Buyer not found' });
      }

      // Find all sellers who have products in the same category
      const relevantProducts = await Product.find({ 
        category: product.category,
        isActive: true 
      }).populate('sellerId');
      
      const relevantSellerIds = [...new Set(relevantProducts.map(p => p.sellerId._id.toString()))];

      // Create RFQs for each relevant seller and send email notifications
      const rfqPromises = relevantSellerIds.map(async (sellerId) => {
        const newRFQ = new RFQ({
          buyerId: req.user.user.id,
          productId,
          sellerId,
          quantity,
          targetPrice,
          deliveryLocation,
          expectedDeliveryDate,
          message,
          buyerContact,
          category: product.category
        });
        
        const savedRFQ = await newRFQ.save();
        
        // Send email notification to seller
        try {
          const seller = await User.findById(sellerId);
          if (seller && seller.email) {
            const emailResult = await sendRFQNotification(
              {
                rfqNumber: savedRFQ.rfqNumber,
                quantity: savedRFQ.quantity,
                targetPrice: savedRFQ.targetPrice,
                expectedDeliveryDate: savedRFQ.expectedDeliveryDate,
                message: savedRFQ.message,
                deliveryLocation: savedRFQ.deliveryLocation
              },
              {
                name: buyerContact.name || buyer.name,
                email: buyerContact.email || buyer.email,
                phone: buyerContact.phone || buyer.phone,
                companyName: buyerContact.companyName,
                designation: buyerContact.designation
              },
              {
                title: product.title,
                category: product.category
              },
              seller.email,
              savedRFQ._id,
              req.user.user.id,
              sellerId
            );
            
            console.log(`Email notification ${emailResult.success ? 'sent' : 'failed'} to seller ${seller.email}`);
          }
        } catch (emailError) {
          console.error('Email notification error:', emailError);
          // Continue with RFQ creation even if email fails
        }
        
        return savedRFQ;
      });

      const createdRFQs = await Promise.all(rfqPromises);

      // Populate the response with detailed information
      const populatedRFQs = await RFQ.find({
        _id: { $in: createdRFQs.map(rfq => rfq._id) }
      })
      .populate('productId', ['title', 'images', 'category'])
      .populate('sellerId', ['name', 'email', 'verified'])
      .populate('buyerId', ['name', 'email', 'verified']);

      res.status(201).json({
        msg: `RFQ submitted successfully to ${createdRFQs.length} relevant sellers`,
        rfqs: populatedRFQs,
        totalSellers: createdRFQs.length,
        category: product.category
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET /api/rfq/seller
// @desc    Get all RFQs for logged-in seller with membership-based access
// @access  Private (Seller)
router.get('/seller',
  authenticateUser,
  authorizeRoles(['seller']),
  async (req, res) => {
    try {
      const { page = 1, limit = 10, status, priority } = req.query;
      
      let query = { sellerId: req.user.user.id };
      
      if (status && status !== 'all') {
        query.status = status;
      }
      
      if (priority && priority !== 'all') {
        query.priority = priority;
      }
      
      // Get seller's membership information
      const seller = await User.findById(req.user.user.id)
        .populate('membershipPlan');
      
      const hasActiveMembership = seller.membershipPlan && seller.membershipPlan.name === 'Premium';
      
      const rfqs = await RFQ.find(query)
        .populate('productId', ['title', 'images', 'category', 'priceRange'])
        .populate('buyerId', ['name', 'email', 'verified', 'phone'])
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();
      
      // Apply membership-based filtering to buyer details
      const processedRFQs = rfqs.map(rfq => {
        const rfqObj = rfq.toObject();
        
        if (!hasActiveMembership) {
          // Show teaser for non-premium members
          rfqObj.buyerContact = {
            name: rfqObj.buyerContact?.name?.substring(0, 2) + '***' || 'B***',
            email: rfqObj.buyerContact?.email?.substring(0, 3) + '***@***.com' || '***@***.com',
            phone: rfqObj.buyerContact?.phone ? '***-***-' + rfqObj.buyerContact.phone.slice(-4) : '***-***-****',
            companyName: rfqObj.buyerContact?.companyName?.substring(0, 3) + '***' || 'Company***'
          };
          
          // Blur buyer details
          if (rfqObj.buyerId) {
            rfqObj.buyerId.name = rfqObj.buyerId.name?.substring(0, 2) + '***' || 'B***';
            rfqObj.buyerId.email = rfqObj.buyerId.email?.substring(0, 3) + '***@***.com' || '***@***.com';
            rfqObj.buyerId.phone = rfqObj.buyerId.phone ? '***-***-' + rfqObj.buyerId.phone.slice(-4) : '***-***-****';
          }
          
          // Add membership upgrade prompt
          rfqObj.membershipRequired = true;
          rfqObj.upgradeMessage = 'Subscribe to Premium to view complete buyer details';
        }
        
        return rfqObj;
      });
      
      const total = await RFQ.countDocuments(query);
      
      res.json({
        rfqs: processedRFQs,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total,
        hasActiveMembership,
        membershipStatus: hasActiveMembership ? 'Premium' : 'Free'
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// NEW: Get RFQs for logged-in buyer
// @route   GET /api/rfq/buyer
// @desc    Get all RFQs submitted by the current buyer
// @access  Private (Buyer)
router.get('/buyer',
  authenticateUser,
  authorizeRoles(['buyer']),
  async (req, res) => {
    try {
      const { page = 1, limit = 10, status } = req.query;

      const query = { buyerId: req.user.user.id };
      if (status && status !== 'all') {
        query.status = status;
      }

      const rfqs = await RFQ.find(query)
        .populate('productId', ['title', 'images', 'category', 'priceRange'])
        .populate('sellerId', ['name', 'email', 'verified'])
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit));

      const total = await RFQ.countDocuments(query);

      return res.json({
        rfqs,
        totalPages: Math.ceil(total / Number(limit)),
        currentPage: Number(page),
        total
      });
    } catch (err) {
      console.error(err.message);
      return res.status(500).send('Server Error');
    }
  }
);

// @route   GET /api/rfq/:id
// @desc    Get RFQ by ID with membership-based access
// @access  Private (Buyer/Seller involved in RFQ)
router.get('/:id',
  authenticateUser,
  async (req, res) => {
    try {
      const rfq = await RFQ.findById(req.params.id)
        .populate('productId')
        .populate('sellerId', ['name', 'email', 'verified'])
        .populate('buyerId', ['name', 'email', 'verified', 'phone'])
        .populate('communications.from', ['name']);
      
      if (!rfq) {
        return res.status(404).json({ msg: 'RFQ not found' });
      }
      
      // Check if user is authorized to view this RFQ
      const isBuyer = rfq.buyerId._id.toString() === req.user.user.id;
      const isSeller = rfq.sellerId._id.toString() === req.user.user.id;
      
      if (!isBuyer && !isSeller) {
        return res.status(403).json({ msg: 'Access denied' });
      }
      
      let processedRFQ = rfq.toObject();
      
      // If seller is viewing, apply membership restrictions
      if (isSeller) {
        const seller = await User.findById(req.user.user.id)
          .populate('membershipPlan');
        
        const hasActiveMembership = seller.membershipPlan && seller.membershipPlan.name === 'Premium';
        
        if (!hasActiveMembership) {
          // Blur buyer details for non-premium sellers
          processedRFQ.buyerContact = {
            name: processedRFQ.buyerContact?.name?.substring(0, 2) + '***' || 'B***',
            email: processedRFQ.buyerContact?.email?.substring(0, 3) + '***@***.com' || '***@***.com',
            phone: processedRFQ.buyerContact?.phone ? '***-***-' + processedRFQ.buyerContact.phone.slice(-4) : '***-***-****',
            companyName: processedRFQ.buyerContact?.companyName?.substring(0, 3) + '***' || 'Company***'
          };
          
          if (processedRFQ.buyerId) {
            processedRFQ.buyerId.name = processedRFQ.buyerId.name?.substring(0, 2) + '***' || 'B***';
            processedRFQ.buyerId.email = processedRFQ.buyerId.email?.substring(0, 3) + '***@***.com' || '***@***.com';
            processedRFQ.buyerId.phone = processedRFQ.buyerId.phone ? '***-***-' + processedRFQ.buyerId.phone.slice(-4) : '***-***-****';
          }
          
          processedRFQ.membershipRequired = true;
          processedRFQ.upgradeMessage = 'Subscribe to Premium to view complete buyer details';
        }
      }
      
      res.json(processedRFQ);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'RFQ not found' });
      }
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET /api/rfq/category/:category
// @desc    Get RFQs by category for sellers
// @access  Private (Seller)
router.get('/category/:category',
  authenticateUser,
  authorizeRoles(['seller']),
  async (req, res) => {
    try {
      const { category } = req.params;
      const { page = 1, limit = 10, status } = req.query;
      
      let query = { 
        category: new RegExp(category, 'i'),
        sellerId: req.user.user.id 
      };
      
      if (status && status !== 'all') {
        query.status = status;
      }
      
      const seller = await User.findById(req.user.user.id)
        .populate('membershipPlan');
      
      const hasActiveMembership = seller.membershipPlan && seller.membershipPlan.name === 'Premium';
      
      const rfqs = await RFQ.find(query)
        .populate('productId', ['title', 'images', 'category', 'priceRange'])
        .populate('buyerId', ['name', 'email', 'verified'])
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();
      
      // Apply membership-based filtering
      const processedRFQs = rfqs.map(rfq => {
        const rfqObj = rfq.toObject();
        
        if (!hasActiveMembership) {
          // Show teaser for non-premium members
          rfqObj.buyerContact = {
            name: 'B***',
            email: '***@***.com',
            phone: '***-***-****'
          };
          
          if (rfqObj.buyerId) {
            rfqObj.buyerId.name = 'B***';
            rfqObj.buyerId.email = '***@***.com';
          }
          
          rfqObj.membershipRequired = true;
          rfqObj.upgradeMessage = 'Subscribe to Premium to view buyer details';
        }
        
        return rfqObj;
      });
      
      const total = await RFQ.countDocuments(query);
      
      res.json({
        rfqs: processedRFQs,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total,
        category,
        hasActiveMembership
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   PUT /api/rfq/:id/quote
// @desc    Submit quote for RFQ
// @access  Private (Seller)
router.put('/:id/quote',
  authenticateUser,
  authorizeRoles(['seller']),
  async (req, res) => {
    try {
      const {
        quotedPrice,
        quotedQuantity,
        deliveryTerms,
        paymentTerms,
        validityPeriod,
        additionalNotes
      } = req.body;
      
      const rfq = await RFQ.findById(req.params.id);
      
      if (!rfq) {
        return res.status(404).json({ msg: 'RFQ not found' });
      }
      
      // Check if seller is authorized
      if (rfq.sellerId.toString() !== req.user.user.id) {
        return res.status(403).json({ msg: 'Access denied' });
      }
      
      // Update RFQ with quote
      rfq.sellerQuote = {
        quotedPrice,
        quotedQuantity,
        deliveryTerms,
        paymentTerms,
        validityPeriod,
        additionalNotes,
        quotedAt: new Date()
      };
      rfq.status = 'quoted';
      
      await rfq.save();
      
      const updatedRFQ = await RFQ.findById(rfq._id)
        .populate('productId')
        .populate('sellerId', ['name', 'email'])
        .populate('buyerId', ['name', 'email']);
      
      res.json(updatedRFQ);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   PUT /api/rfq/:id/status
// @desc    Update RFQ status
// @access  Private (Buyer/Seller)
router.put('/:id/status',
  authenticateUser,
  async (req, res) => {
    try {
      const { status } = req.body;
      
      const rfq = await RFQ.findById(req.params.id);
      
      if (!rfq) {
        return res.status(404).json({ msg: 'RFQ not found' });
      }
      
      // Check authorization
      if (rfq.buyerId.toString() !== req.user.user.id && 
          rfq.sellerId.toString() !== req.user.user.id) {
        return res.status(403).json({ msg: 'Access denied' });
      }
      
      rfq.status = status;
      await rfq.save();
      
      const updatedRFQ = await RFQ.findById(rfq._id)
        .populate('productId')
        .populate('sellerId', ['name', 'email'])
        .populate('buyerId', ['name', 'email']);
      
      res.json(updatedRFQ);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   POST /api/rfq/:id/communication
// @desc    Add communication to RFQ
// @access  Private (Buyer/Seller)
router.post('/:id/communication',
  authenticateUser,
  async (req, res) => {
    try {
      const { message } = req.body;
      
      const rfq = await RFQ.findById(req.params.id);
      
      if (!rfq) {
        return res.status(404).json({ msg: 'RFQ not found' });
      }
      
      // Check authorization
      if (rfq.buyerId.toString() !== req.user.user.id && 
          rfq.sellerId.toString() !== req.user.user.id) {
        return res.status(403).json({ msg: 'Access denied' });
      }
      
      rfq.communications.push({
        from: req.user.user.id,
        message
      });
      
      await rfq.save();
      
      const updatedRFQ = await RFQ.findById(rfq._id)
        .populate('productId')
        .populate('sellerId', ['name', 'email'])
        .populate('buyerId', ['name', 'email'])
        .populate('communications.from', ['name']);
      
      res.json(updatedRFQ);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET /api/rfq/:id/messages
// @desc    Get message log for an RFQ
// @access  Private (Buyer/Seller involved in RFQ)
router.get('/:id/messages',
  authenticateUser,
  async (req, res) => {
    try {
      const rfq = await RFQ.findById(req.params.id);
      
      if (!rfq) {
        return res.status(404).json({ msg: 'RFQ not found' });
      }
      
      // Check if user is authorized to view this RFQ's messages
      const isBuyer = rfq.buyerId.toString() === req.user.user.id;
      const isSeller = rfq.sellerId.toString() === req.user.user.id;
      
      if (!isBuyer && !isSeller) {
        return res.status(403).json({ msg: 'Access denied' });
      }
      
      const messageLogs = await MessageLog.find({ rfqId: req.params.id })
        .populate('fromUserId', ['name', 'email'])
        .populate('toUserId', ['name', 'email'])
        .sort({ createdAt: -1 });
      
      res.json(messageLogs);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

export default router;