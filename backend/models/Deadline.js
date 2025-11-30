// models/Deadline.js
const mongoose = require('mongoose');

const deadlineSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  deadline: {
    type: Date,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'deleted'],
    default: 'active'
  },
  completedAt: {
    type: Date,
    default: null
  },
  notified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  editHistory: [{
    previousTitle: String,
    previousDeadline: Date,
    editedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// ✅ FIXED: 1 minute restriction for editing/deleting (not 2 minutes)
deadlineSchema.methods.canEdit = function() {
  const now = new Date();
  const oneMinuteBefore = new Date(this.deadline.getTime() - 1 * 60 * 1000);
  return now < oneMinuteBefore;
};

// ❌ REMOVED: canRestore method completely

// Virtual for overdue check
deadlineSchema.virtual('isOverdue').get(function() {
  return this.status === 'active' && new Date() > this.deadline;
});

// Apply virtuals
deadlineSchema.set('toJSON', { virtuals: true });

// ✅ FIXED: Pre-save hook - REMOVED 2-minute restriction for creation
deadlineSchema.pre('save', function(next) {
  // Validate deadline is in future when creating
  if (this.isNew && this.deadline <= new Date()) {
    return next(new Error('Deadline must be in the future'));
  }
  
  // Check edit restriction for active deadlines (1 minute before)
  if (this.isModified('deadline') && this.status === 'active') {
    const now = new Date();
    const oneMinuteBefore = new Date(this.deadline.getTime() - 1 * 60 * 1000);
    
    if (now >= oneMinuteBefore) {
      return next(new Error('Cannot modify deadline within 1 minute of its time'));
    }
  }
  next();
});

module.exports = mongoose.model('Deadline', deadlineSchema);