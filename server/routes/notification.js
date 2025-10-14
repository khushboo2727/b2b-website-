import express from 'express';
import { Notification } from '../models/index.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

// Get notifications for authenticated user
router.get('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.user.id;
    const { page = 1, limit = 20, isRead, type } = req.query;

    // Build filter
    const filter = { userId };
    if (isRead !== undefined) filter.isRead = isRead === 'true';
    if (type) filter.type = type;

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('relatedId', 'name title')
      .lean();

    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({ userId, isRead: false });

    res.json({
      notifications,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      },
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

// Get unread count
router.get('/unread-count', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.user.id;
    const unreadCount = await Notification.countDocuments({ userId, isRead: false });
    
    res.json({ unreadCount });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'Failed to fetch unread count' });
  }
});

// Mark notification as read
router.patch('/:notificationId/read', authenticateUser, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.user.id;

    const notification = await Notification.findOne({ _id: notificationId, userId });
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.isRead = true;
    await notification.save();

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.patch('/mark-all-read', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.user.id;

    await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Failed to mark all notifications as read' });
  }
});

// Create notification (internal route)
router.post('/', authenticateUser, async (req, res) => {
  try {
    const { userId, type, title, message, relatedId, relatedModel, priority, actionUrl, metadata } = req.body;

    const notification = new Notification({
      userId,
      type,
      title,
      message,
      relatedId,
      relatedModel,
      priority,
      actionUrl,
      metadata
    });

    await notification.save();

    res.status(201).json({
      message: 'Notification created successfully',
      notification
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ message: 'Failed to create notification' });
  }
});

export default router;