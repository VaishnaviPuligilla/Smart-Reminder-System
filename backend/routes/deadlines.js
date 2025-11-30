// routes/deadlines.js
const express = require('express');
const router = express.Router();
const Deadline = require('../models/Deadline');
const { protect } = require('../middleware/auth');

// ✅ FIXED: CREATE NEW REMINDER
router.post('/', protect, async (req, res) => {
  try {
    const { title, deadline, description } = req.body;

    console.log("Received deadline creation:", { title, deadline, description });

    // Validation
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Title is required' });
    }
    
    if (!deadline) {
      return res.status(400).json({ message: 'Deadline date is required' });
    }

    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime())) {
      return res.status(400).json({ message: 'Invalid deadline date' });
    }

    // ✅ FIXED: Allow any future time (no restriction)
    if (deadlineDate <= new Date()) {
      return res.status(400).json({ message: 'Deadline must be in the future' });
    }

    const newDeadline = new Deadline({
      title: title.trim(),
      deadline: deadlineDate,
      description: description || '',
      user: req.user.id
    });

    const savedDeadline = await newDeadline.save();
    
    // Return with additional properties
    const responseDeadline = {
      ...savedDeadline.toObject(),
      canEdit: savedDeadline.canEdit(),
      isOverdue: savedDeadline.isOverdue
    };

    res.status(201).json(responseDeadline);
  } catch (err) {
    console.error('Error creating deadline:', err.message);
    
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(error => error.message);
      return res.status(400).json({ message: errors.join(', ') });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ FIXED: GET ACTIVE REMINDERS (CURRENT)
router.get('/active', protect, async (req, res) => {
  try {
    const deadlines = await Deadline.find({ 
      user: req.user.id,
      status: 'active'
    }).sort({ deadline: 1 });
    
    const deadlinesWithStatus = deadlines.map(deadline => ({
      ...deadline.toObject(),
      canEdit: deadline.canEdit(),
      isOverdue: deadline.isOverdue
    }));
    
    res.json(deadlinesWithStatus);
  } catch (err) {
    console.error('Error fetching active deadlines:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ FIXED: GET COMPLETED REMINDERS
router.get('/completed', protect, async (req, res) => {
  try {
    const deadlines = await Deadline.find({ 
      user: req.user.id,
      status: 'completed'
    }).sort({ completedAt: -1 });
    
    res.json(deadlines);
  } catch (err) {
    console.error('Error fetching completed deadlines:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ FIXED: GET DELETED REMINDERS
router.get('/deleted', protect, async (req, res) => {
  try {
    const deadlines = await Deadline.find({ 
      user: req.user.id,
      status: 'deleted'
    }).sort({ updatedAt: -1 });
    
    res.json(deadlines);
  } catch (err) {
    console.error('Error fetching deleted deadlines:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ FIXED: COMPLETE REMINDER - MOVES TO COMPLETED
router.put('/:id/complete', protect, async (req, res) => {
  try {
    const deadline = await Deadline.findOne({ 
      _id: req.params.id, 
      user: req.user.id 
    });

    if (!deadline) {
      return res.status(404).json({ message: 'Deadline not found' });
    }

    deadline.status = 'completed';
    deadline.completedAt = new Date();
    
    const updatedDeadline = await deadline.save();
    res.json(updatedDeadline);
  } catch (err) {
    console.error('Error completing deadline:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ FIXED: DELETE REMINDER - MOVES TO DELETED
router.delete('/:id', protect, async (req, res) => {
  try {
    const deadline = await Deadline.findOne({ 
      _id: req.params.id, 
      user: req.user.id 
    });

    if (!deadline) {
      return res.status(404).json({ message: 'Deadline not found' });
    }

    // ✅ FIXED: 1 minute restriction (not 2 minutes)
    if (!deadline.canEdit()) {
      return res.status(400).json({ message: 'Cannot delete deadline within 1 minute of its time' });
    }

    // Move to deleted
    deadline.status = 'deleted';
    await deadline.save();

    res.json({ 
      message: 'Deadline moved to deleted section',
      deadline: {
        _id: deadline._id,
        title: deadline.title,
        deadline: deadline.deadline,
        status: deadline.status
      }
    });
  } catch (err) {
    console.error('Error deleting deadline:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ❌ REMOVED: RESTORE ENDPOINT COMPLETELY

// ✅ FIXED: PERMANENT DELETE
router.delete('/:id/permanent', protect, async (req, res) => {
  try {
    const deadline = await Deadline.findOne({ 
      _id: req.params.id, 
      user: req.user.id,
      status: 'deleted'
    });

    if (!deadline) {
      return res.status(404).json({ message: 'Deleted deadline not found' });
    }

    await Deadline.findByIdAndDelete(req.params.id);

    res.json({ message: 'Deadline permanently deleted' });
  } catch (err) {
    console.error('Error permanently deleting deadline:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ FIXED: UPDATE REMINDER
router.put('/:id', protect, async (req, res) => {
  const { title, deadline: newDeadline, description } = req.body;

  try {
    let deadlineDoc = await Deadline.findOne({ 
      _id: req.params.id, 
      user: req.user.id 
    });

    if (!deadlineDoc) {
      return res.status(404).json({ message: 'Deadline not found' });
    }

    // ✅ FIXED: 1 minute restriction (not 2 minutes)
    if (!deadlineDoc.canEdit()) {
      return res.status(400).json({ message: 'Cannot edit deadline within 1 minute of its time' });
    }

    // Add to edit history before updating
    if (title && title !== deadlineDoc.title) {
      deadlineDoc.editHistory.push({
        previousTitle: deadlineDoc.title,
        previousDeadline: deadlineDoc.deadline,
        editedAt: new Date()
      });
    }

    if (title && title.trim()) {
      deadlineDoc.title = title.trim();
    }
    
    if (newDeadline) {
      const deadlineDate = new Date(newDeadline);
      if (isNaN(deadlineDate.getTime())) {
        return res.status(400).json({ message: 'Invalid deadline date' });
      }
      if (deadlineDate <= new Date()) {
        return res.status(400).json({ message: 'Deadline must be in the future' });
      }
      deadlineDoc.deadline = deadlineDate;
    }
    
    if (description !== undefined) {
      deadlineDoc.description = description;
    }

    const updatedDeadline = await deadlineDoc.save();
    
    const responseDeadline = {
      ...updatedDeadline.toObject(),
      canEdit: updatedDeadline.canEdit(),
      isOverdue: updatedDeadline.isOverdue
    };
    
    res.json(responseDeadline);
  } catch (err) {
    console.error('Error updating deadline:', err.message);
    
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(error => error.message);
      return res.status(400).json({ message: errors.join(', ') });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ GET STATS
router.get('/stats/overview', protect, async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const activeDeadlines = await Deadline.countDocuments({ 
      user: req.user.id, 
      status: 'active' 
    });
    
    const completedDeadlines = await Deadline.countDocuments({ 
      user: req.user.id, 
      status: 'completed' 
    });
    
    const deletedDeadlines = await Deadline.countDocuments({ 
      user: req.user.id, 
      status: 'deleted' 
    });

    const todayDeadlines = await Deadline.countDocuments({
      user: req.user.id,
      status: 'active',
      deadline: {
        $gte: todayStart,
        $lt: todayEnd
      }
    });

    const overdueDeadlines = await Deadline.countDocuments({
      user: req.user.id,
      status: 'active',
      deadline: {
        $lt: now
      }
    });

    res.json({
      active: activeDeadlines,
      completed: completedDeadlines,
      deleted: deletedDeadlines,
      today: todayDeadlines,
      overdue: overdueDeadlines
    });
  } catch (err) {
    console.error('Error fetching stats:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;