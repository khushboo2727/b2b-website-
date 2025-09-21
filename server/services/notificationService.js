import { Notification } from '../models/index.js';

class NotificationService {
  // Create notification for new inquiry
  static async createInquiryNotification(sellerId, lead, buyer) {
    try {
      const notification = new Notification({
        userId: sellerId,
        type: 'inquiry',
        title: 'New Inquiry Received',
        message: `You have received a new inquiry from ${buyer.name || buyer.companyName}`,
        relatedId: lead._id,
        relatedModel: 'Lead',
        priority: 'high',
        actionUrl: `/seller/leads/${lead._id}`,
        metadata: {
          senderName: buyer.name,
          companyName: buyer.companyName,
          quantity: lead.quantity
        }
      });

      await notification.save();
      return notification;
    } catch (error) {
      console.error('Error creating inquiry notification:', error);
      throw error;
    }
  }

  // Create notification for new message
  static async createMessageNotification(receiverId, message, sender) {
    try {
      const notification = new Notification({
        userId: receiverId,
        type: 'message',
        title: 'New Message Received',
        message: `You have received a new message from ${sender.name || sender.companyName}`,
        relatedId: message._id,
        relatedModel: 'Message',
        priority: 'medium',
        actionUrl: `/seller/messages/${message._id}`,
        metadata: {
          senderName: sender.name,
          companyName: sender.companyName
        }
      });

      await notification.save();
      return notification;
    } catch (error) {
      console.error('Error creating message notification:', error);
      throw error;
    }
  }

  // Create notification for new RFQ
  static async createRFQNotification(sellerId, rfq, buyer) {
    try {
      const notification = new Notification({
        userId: sellerId,
        type: 'rfq',
        title: 'New RFQ Received',
        message: `You have received a new RFQ from ${buyer.name || buyer.companyName}`,
        relatedId: rfq._id,
        relatedModel: 'RFQ',
        priority: 'high',
        actionUrl: `/seller/rfqs/${rfq._id}`,
        metadata: {
          senderName: buyer.name,
          companyName: buyer.companyName,
          quantity: rfq.quantity,
          amount: rfq.targetPrice
        }
      });

      await notification.save();
      return notification;
    } catch (error) {
      console.error('Error creating RFQ notification:', error);
      throw error;
    }
  }

  // Create notification for lead status update
  static async createLeadUpdateNotification(buyerId, lead, newStatus) {
    try {
      const notification = new Notification({
        userId: buyerId,
        type: 'lead_update',
        title: 'Lead Status Updated',
        message: `Your inquiry status has been updated to ${newStatus}`,
        relatedId: lead._id,
        relatedModel: 'Lead',
        priority: 'medium',
        actionUrl: `/buyer/inquiries/${lead._id}`,
        metadata: {
          status: newStatus
        }
      });

      await notification.save();
      return notification;
    } catch (error) {
      console.error('Error creating lead update notification:', error);
      throw error;
    }
  }

  // Get unread count for user
  static async getUnreadCount(userId) {
    try {
      return await Notification.countDocuments({ userId, isRead: false });
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }
}

export default NotificationService;