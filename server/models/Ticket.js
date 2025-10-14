import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    required: false,
    unique: true,
    index: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address']
  },
  accountId: {
    type: String,
    trim: true,
    default: null
  },
  issueType: {
    type: String,
    required: true,
    enum: [
      'Technical Issue',
      'Order / Delivery Issue',
      'Billing / Payment Problem',
      'Product Query',
      'Other'
    ]
  },
  description: {
    type: String,
    required: true,
    minlength: [10, 'Description must be at least 10 characters long'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  attachment: {
    filename: {
      type: String,
      default: null
    },
    originalName: {
      type: String,
      default: null
    },
    mimetype: {
      type: String,
      default: null
    },
    size: {
      type: Number,
      default: null
    },
    path: {
      type: String,
      default: null
    }
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
    default: 'Open'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  adminNotes: [{
    note: {
      type: String,
      required: true
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  responses: [{
    message: {
      type: String,
      required: true
    },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    respondedAt: {
      type: Date,
      default: Date.now
    },
    isPublic: {
      type: Boolean,
      default: true
    }
  }],
  tags: [{
    type: String,
    trim: true
  }],
  resolvedAt: {
    type: Date,
    default: null
  },
  closedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for ticket age
ticketSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for response time
ticketSchema.virtual('responseTime').get(function() {
  if (this.responses.length > 0) {
    const firstResponse = this.responses[0];
    return Math.floor((firstResponse.respondedAt - this.createdAt) / (1000 * 60 * 60)); // in hours
  }
  return null;
});

// Index for better query performance
ticketSchema.index({ status: 1, createdAt: -1 });
ticketSchema.index({ email: 1, createdAt: -1 });
ticketSchema.index({ issueType: 1, status: 1 });
ticketSchema.index({ assignedTo: 1, status: 1 });

// Pre-save middleware to generate ticket number
ticketSchema.pre('save', async function(next) {
  if (this.isNew && !this.ticketNumber) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.ticketNumber = `T${timestamp}${random}`;
    
    // Ensure uniqueness
    let isUnique = false;
    while (!isUnique) {
      const existingTicket = await this.constructor.findOne({ ticketNumber: this.ticketNumber });
      if (!existingTicket) {
        isUnique = true;
      } else {
        const newRandom = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        this.ticketNumber = `T${timestamp}${newRandom}`;
      }
    }
  }
  next();
});

// Pre-save middleware to update resolved/closed timestamps
ticketSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (this.status === 'Resolved' && !this.resolvedAt) {
      this.resolvedAt = new Date();
    }
    if (this.status === 'Closed' && !this.closedAt) {
      this.closedAt = new Date();
    }
  }
  next();
});

// Static method to get tickets by status
ticketSchema.statics.getByStatus = function(status) {
  return this.find({ status })
    .populate('assignedTo', 'name email')
    .populate('responses.respondedBy', 'name email')
    .sort({ createdAt: -1 });
};

// Static method to get tickets by email
ticketSchema.statics.getByEmail = function(email) {
  return this.find({ email: email.toLowerCase() })
    .sort({ createdAt: -1 });
};

// Instance method to add response
ticketSchema.methods.addResponse = function(message, respondedBy, isPublic = true) {
  this.responses.push({
    message,
    respondedBy,
    isPublic
  });
  return this.save();
};

// Instance method to add admin note
ticketSchema.methods.addAdminNote = function(note, addedBy) {
  this.adminNotes.push({
    note,
    addedBy
  });
  return this.save();
};

// Instance method to assign ticket
ticketSchema.methods.assignTo = function(userId) {
  this.assignedTo = userId;
  return this.save();
};

// Instance method to update status
ticketSchema.methods.updateStatus = function(newStatus) {
  this.status = newStatus;
  return this.save();
};

export default mongoose.model('Ticket', ticketSchema);