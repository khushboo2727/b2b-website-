import express from 'express';
import { Message, User, Product } from '../models/index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Send a message (Buyer to Seller)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { receiverId, productId, leadId, content, messageType } = req.body;
    const senderId = req.user.user?.id;

    // Validate sender is buyer
    const sender = await User.findById(senderId);
    if (!sender) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (sender.role !== 'buyer') {
      return res.status(403).json({ message: 'Only buyers can send messages' });
    }

    // Validate receiver is seller
    const receiver = await User.findById(receiverId);
    if (!receiver || receiver.role !== 'seller') {
      return res.status(400).json({ message: 'Invalid receiver - must be a seller' });
    }

    // Create message
    const message = new Message({
      senderId,
      receiverId,
      productId,
      leadId,
      content,
      messageType: messageType || 'inquiry'
    });

    await message.save();

    // Populate sender and receiver info for response
    await message.populate([
      { path: 'senderId', select: 'name email companyName' },
      { path: 'receiverId', select: 'name email companyName' },
      { path: 'productId', select: 'name price' }
    ]);

    res.status(201).json({
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
});

// Get messages for seller (received messages)
router.get('/received', authenticateToken, async (req, res) => {
  try {
    const sellerId = req.user.user?.id;
    const { page = 1, limit = 20, isRead, productId } = req.query;

    // Validate user is seller
    const seller = await User.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }
    if (seller.role !== 'seller') {
      return res.status(403).json({ message: 'Only sellers can access received messages' });
    }

    // Build filter
    const filter = { receiverId: sellerId };
    if (isRead !== undefined) filter.isRead = isRead === 'true';
    if (productId) filter.productId = productId;

    const messages = await Message.find(filter)
      .populate('senderId', 'name email companyName phone')
      .populate('productId', 'name price images')
      .populate('leadId', 'status')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Message.countDocuments(filter);

    res.json({
      messages,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

// Get messages for buyer (sent messages)
router.get('/sent', authenticateToken, async (req, res) => {
  try {
    const buyerId = req.user.user?.id;
    const { page = 1, limit = 20, receiverId } = req.query;

    // Validate user is buyer
    const buyer = await User.findById(buyerId);
    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }
    if (buyer.role !== 'buyer') {
      return res.status(403).json({ message: 'Only buyers can access sent messages' });
    }

    // Build filter
    const filter = { senderId: buyerId };
    if (receiverId) filter.receiverId = receiverId;

    const messages = await Message.find(filter)
      .populate('receiverId', 'name email companyName')
      .populate('productId', 'name price images')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Message.countDocuments(filter);

    res.json({
      messages,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching sent messages:', error);
    res.status(500).json({ message: 'Failed to fetch sent messages' });
  }
});

// Mark message as read
router.patch('/:messageId/read', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
  const userId = req.user.user?.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Only receiver can mark as read
    if (message.receiverId.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized to mark this message as read' });
    }

    message.isRead = true;
    await message.save();

    res.json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ message: 'Failed to mark message as read' });
  }
});

// Admin Routes

// Send message to admin (Seller to Admin)
router.post('/admin', authenticateToken, async (req, res) => {
  try {
    const { message, type } = req.body;
    const senderId = req.user.user?.id;

    // Validate sender is seller
    const sender = await User.findById(senderId);
    if (!sender) {
      return res.status(404).json({ message: 'Sender not found' });
    }
    if (sender.role !== 'seller') {
      return res.status(403).json({ message: 'Only sellers can send messages to admin' });
    }

    // Create message to admin
    const adminMessage = new Message({
      senderId,
      receiverId: null, // Admin messages don't have specific receiver
      content: message,
      messageType: type || 'support_query',
      senderType: 'seller',
      receiverType: 'admin'
    });

    await adminMessage.save();

    res.status(201).json({
      message: 'Message sent to admin successfully',
      data: adminMessage
    });
  } catch (error) {
    console.error('Error sending message to admin:', error);
    res.status(500).json({ message: 'Failed to send message to admin' });
  }
});

// Get admin conversation (Seller)
router.get('/admin', authenticateToken, async (req, res) => {
  try {
    const sellerId = req.user.user?.id;

    // Validate sender is seller
    const seller = await User.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }
    if (seller.role !== 'seller') {
      return res.status(403).json({ message: 'Only sellers can access admin conversations' });
    }

    // Get messages between seller and admin
    const messages = await Message.find({
      $or: [
        { senderId: sellerId, receiverType: 'admin' },
        { senderType: 'admin', receiverId: sellerId }
      ]
    })
    .populate('senderId', 'name email')
    .sort({ createdAt: 1 });

    res.json({
      messages
    });
  } catch (error) {
    console.error('Error fetching admin conversation:', error);
    res.status(500).json({ message: 'Failed to fetch conversation' });
  }
});

export default router;