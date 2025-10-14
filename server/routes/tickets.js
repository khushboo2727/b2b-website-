import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Ticket from '../models/Ticket.js';
import { authenticateUser } from '../middleware/auth.js';
import adminAuth from '../middleware/adminAuth.js';
import { sendSupportTicketConfirmation } from '../services/emailService.js'

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/tickets';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'ticket-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only images, PDFs, and documents are allowed'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// @route   POST /api/tickets
// @desc    Create a new support ticket
// @access  Public
router.post('/', upload.single('attachment'), async (req, res) => {
  try {
    const { fullName, email, accountId, issueType, description } = req.body;

    // Validate required fields
    if (!fullName || !email || !issueType || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Validate description length
    if (description.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Description must be at least 10 characters long'
      });
    }

    // Create ticket data
    const ticketData = {
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      accountId: accountId ? accountId.trim() : null,
      issueType,
      description: description.trim()
    };

    // Add attachment info if file was uploaded
    if (req.file) {
      ticketData.attachment = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      };
    }

    // Create new ticket
    const ticket = new Ticket(ticketData);
    await ticket.save();

    // Send confirmation email with ticket number to user
    let emailSent = false;
    try {
      const emailRes = await sendSupportTicketConfirmation(
        ticket.email,
        ticket.fullName || fullName,
        ticket.ticketNumber,
        ticket.issueType,
        ticket.description
      );
      emailSent = !!emailRes?.success;
    } catch (mailErr) {
      console.error('Error sending support ticket confirmation:', mailErr);
      emailSent = false;
    }

    res.status(201).json({
      success: true,
      message: 'Support ticket created successfully',
      data: {
        ticketNumber: ticket.ticketNumber,
        status: ticket.status,
        createdAt: ticket.createdAt,
        emailSent
      }
    });

  } catch (error) {
    console.error('Error creating ticket:', error);
    
    // Clean up uploaded file if ticket creation failed
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating ticket'
    });
  }
});

// @route   GET /api/tickets/track/:ticketNumber
// @desc    Track a ticket by ticket number
// @access  Public
router.get('/track/:ticketNumber', async (req, res) => {
  try {
    const { ticketNumber } = req.params;
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required to track ticket'
      });
    }

    const ticket = await Ticket.findOne({
      ticketNumber,
      email: email.toLowerCase()
    }).populate('responses.respondedBy', 'name');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found or email does not match'
      });
    }

    // Filter public responses only
    const publicResponses = ticket.responses.filter(response => response.isPublic);

    res.json({
      success: true,
      data: {
        ticketNumber: ticket.ticketNumber,
        status: ticket.status,
        issueType: ticket.issueType,
        description: ticket.description,
        createdAt: ticket.createdAt,
        responses: publicResponses,
        ageInDays: ticket.ageInDays
      }
    });

  } catch (error) {
    console.error('Error tracking ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while tracking ticket'
    });
  }
});

// @route   GET /api/tickets/admin
// @desc    Get all tickets for admin
// @access  Private (Admin only)
router.get('/admin', [authenticateUser, adminAuth], async (req, res) => {
  try {
    const { status, page = 1, limit = 10, search, issueType } = req.query;
    
    // Build query
    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (issueType) {
      query.issueType = issueType;
    }
    
    if (search) {
      query.$or = [
        { ticketNumber: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: [
        { path: 'assignedTo', select: 'name email' },
        { path: 'responses.respondedBy', select: 'name email' }
      ]
    };

    const tickets = await Ticket.find(query)
      .populate('assignedTo', 'name email')
      .populate('responses.respondedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Ticket.countDocuments(query);

    res.json({
      success: true,
      data: {
        tickets,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching tickets'
    });
  }
});

// @route   GET /api/tickets/admin/:id
// @desc    Get single ticket details for admin
// @access  Private (Admin only)
router.get('/admin/:id', [authenticateUser, adminAuth], async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('responses.respondedBy', 'name email')
      .populate('adminNotes.addedBy', 'name email');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    res.json({
      success: true,
      data: ticket
    });

  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching ticket'
    });
  }
});

// @route   PUT /api/tickets/admin/:id/status
// @desc    Update ticket status
// @access  Private (Admin only)
router.put('/admin/:id/status', [authenticateUser, adminAuth], async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['Open', 'In Progress', 'Resolved', 'Closed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const ticket = await Ticket.findById(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    await ticket.updateStatus(status);

    res.json({
      success: true,
      message: 'Ticket status updated successfully',
      data: {
        ticketNumber: ticket.ticketNumber,
        status: ticket.status
      }
    });

  } catch (error) {
    console.error('Error updating ticket status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating ticket status'
    });
  }
});

// @route   POST /api/tickets/admin/:id/response
// @desc    Add response to ticket
// @access  Private (Admin only)
router.post('/admin/:id/response', [authenticateUser, adminAuth], async (req, res) => {
  try {
    const { message, isPublic = true } = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Response message is required'
      });
    }

    const ticket = await Ticket.findById(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    await ticket.addResponse(message.trim(), req.user.id, isPublic);

    res.json({
      success: true,
      message: 'Response added successfully'
    });

  } catch (error) {
    console.error('Error adding response:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding response'
    });
  }
});

// @route   POST /api/tickets/admin/:id/note
// @desc    Add admin note to ticket
// @access  Private (Admin only)
router.post('/admin/:id/note', [authenticateUser, adminAuth], async (req, res) => {
  try {
    const { note } = req.body;
    
    if (!note || note.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Note is required'
      });
    }

    const ticket = await Ticket.findById(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    await ticket.addAdminNote(note.trim(), req.user.id);

    res.json({
      success: true,
      message: 'Admin note added successfully'
    });

  } catch (error) {
    console.error('Error adding admin note:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding admin note'
    });
  }
});

// @route   PUT /api/tickets/admin/:id/assign
// @desc    Assign ticket to admin user
// @access  Private (Admin only)
router.put('/admin/:id/assign', [authenticateUser, adminAuth], async (req, res) => {
  try {
    const { assignedTo } = req.body;

    const ticket = await Ticket.findById(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    await ticket.assignTo(assignedTo);

    res.json({
      success: true,
      message: 'Ticket assigned successfully'
    });

  } catch (error) {
    console.error('Error assigning ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while assigning ticket'
    });
  }
});

// @route   GET /api/tickets/admin/stats
// @desc    Get ticket statistics for admin dashboard
// @access  Private (Admin only)
router.get('/admin/stats', [authenticateUser, adminAuth], async (req, res) => {
  try {
    const stats = await Promise.all([
      Ticket.countDocuments({ status: 'Open' }),
      Ticket.countDocuments({ status: 'In Progress' }),
      Ticket.countDocuments({ status: 'Resolved' }),
      Ticket.countDocuments({ status: 'Closed' }),
      Ticket.countDocuments({}),
      Ticket.aggregate([
        {
          $group: {
            _id: '$issueType',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const [open, inProgress, resolved, closed, total, issueTypeStats] = stats;

    res.json({
      success: true,
      data: {
        statusStats: {
          open,
          inProgress,
          resolved,
          closed,
          total
        },
        issueTypeStats
      }
    });

  } catch (error) {
    console.error('Error fetching ticket stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching ticket statistics'
    });
  }
});

export default router;