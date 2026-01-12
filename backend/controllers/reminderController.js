import Reminder from '../models/Reminder.js';
import { sendReminderNotification } from '../utils/emailService.js';
import User from '../models/User.js';

// Create Reminder
export const createReminder = async (req, res) => {
  try {
    const { reminderName, description, date, time } = req.body;
    const userId = req.userId;

    if (!reminderName || !date || !time) {
      return res.status(400).json({ message: 'Reminder name, date, and time are required' });
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) {
      return res.status(400).json({ message: 'Invalid time format. Use HH:MM (24-hour)' });
    }

    // Check if date/time is in the past
    const reminderDateTime = new Date(date);
    const [hours, minutes] = time.split(':');
    reminderDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const now = new Date();
    if (reminderDateTime < now) {
      return res.status(400).json({ message: 'You cannot choose a time in the past' });
    }

    const reminder = new Reminder({
      userId,
      reminderName,
      description,
      date,
      time,
      isDeleted: false
    });

    await reminder.save();

    res.status(201).json({
      message: 'Reminder created successfully',
      reminder: {
        id: reminder._id,
        reminderName: reminder.reminderName,
        description: reminder.description,
        date: reminder.date,
        time: reminder.time,
        isDeleted: reminder.isDeleted
      }
    });
  } catch (error) {
    console.error('Create reminder error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get All Reminders (non-deleted)
export const getReminders = async (req, res) => {
  try {
    const userId = req.userId;

    const reminders = await Reminder.find({
      userId,
      isDeleted: false
    }).sort({ date: 1, time: 1 });

    // Add canEdit flag based on time
    const remindersWithEditFlag = reminders.map(reminder => {
      const reminderDateTime = new Date(reminder.date);
      const [hours, minutes] = reminder.time.split(':');
      reminderDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const now = new Date();
      const timeDiffMinutes = (reminderDateTime - now) / (1000 * 60);

      const canEdit = timeDiffMinutes > 2; // Can edit if more than 2 minutes away

      return {
        id: reminder._id,
        reminderName: reminder.reminderName,
        description: reminder.description,
        date: reminder.date,
        time: reminder.time,
        isDeleted: reminder.isDeleted,
        isCompleted: reminder.isCompleted || false,
        notificationSent: reminder.notificationSent || false,
        canEdit,
        minutesUntilReminder: Math.round(timeDiffMinutes)
      };
    });

    res.json({
      reminders: remindersWithEditFlag
    });
  } catch (error) {
    console.error('Get reminders error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get Deleted Reminders
export const getDeletedReminders = async (req, res) => {
  try {
    const userId = req.userId;

    const deletedReminders = await Reminder.find({
      userId,
      isDeleted: true
    }).sort({ updatedAt: -1 });

    res.json({
      deletedReminders: deletedReminders.map(reminder => ({
        id: reminder._id,
        reminderName: reminder.reminderName,
        description: reminder.description,
        date: reminder.date,
        time: reminder.time,
        deletedAt: reminder.updatedAt
      }))
    });
  } catch (error) {
    console.error('Get deleted reminders error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update Reminder
export const updateReminder = async (req, res) => {
  try {
    const { reminderId } = req.params;
    const { reminderName, description, date, time } = req.body;
    const userId = req.userId;

    const reminder = await Reminder.findById(reminderId);
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    if (reminder.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Check if reminder is deleted
    if (reminder.isDeleted) {
      return res.status(400).json({ message: 'Cannot edit deleted reminders' });
    }

    // Check if edit is allowed (must be at least 2 minutes before reminder)
    const reminderDateTime = new Date(reminder.date);
    const [hours, minutes] = reminder.time.split(':');
    reminderDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const now = new Date();
    const timeDiffMinutes = (reminderDateTime - now) / (1000 * 60);

    if (timeDiffMinutes <= 2) {
      return res.status(400).json({
        message: 'Cannot edit reminder within 2 minutes of scheduled time',
        scheduledTime: reminder.time
      });
    }

    // Validate new date/time if provided
    if (date && time) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(time)) {
        return res.status(400).json({ message: 'Invalid time format. Use HH:MM (24-hour)' });
      }

      const newReminderDateTime = new Date(date);
      const [newHours, newMinutes] = time.split(':');
      newReminderDateTime.setHours(parseInt(newHours), parseInt(newMinutes), 0, 0);

      if (newReminderDateTime < now) {
        return res.status(400).json({ message: 'You cannot choose a time in the past' });
      }

      reminder.date = date;
      reminder.time = time;
    }

    if (reminderName) reminder.reminderName = reminderName;
    if (description) reminder.description = description;

    reminder.updatedAt = new Date();
    await reminder.save();

    res.json({
      message: 'Reminder updated successfully',
      reminder: {
        id: reminder._id,
        reminderName: reminder.reminderName,
        description: reminder.description,
        date: reminder.date,
        time: reminder.time
      }
    });
  } catch (error) {
    console.error('Update reminder error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Soft Delete Reminder
export const softDeleteReminder = async (req, res) => {
  try {
    const { reminderId } = req.params;
    const userId = req.userId;

    const reminder = await Reminder.findById(reminderId);
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    if (reminder.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    reminder.isDeleted = true;
    reminder.updatedAt = new Date();
    await reminder.save();

    res.json({ message: 'Reminder moved to trash' });
  } catch (error) {
    console.error('Delete reminder error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Permanent Delete Reminder
export const permanentlyDeleteReminder = async (req, res) => {
  try {
    const { reminderId } = req.params;
    const userId = req.userId;

    const reminder = await Reminder.findById(reminderId);
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    if (reminder.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await Reminder.findByIdAndDelete(reminderId);

    res.json({ message: 'Reminder permanently deleted' });
  } catch (error) {
    console.error('Permanent delete error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Send Reminder Notifications (to be called by cron job)
export const sendReminderNotifications = async () => {
  try {
    console.log('Checking for reminders to send...');

    // Get current time in IST (Indian Standard Time = UTC+5:30)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    const istTime = new Date(now.getTime() + istOffset);
    
    const currentHours = String(istTime.getUTCHours()).padStart(2, '0');
    const currentMinutes = String(istTime.getUTCMinutes()).padStart(2, '0');
    const currentTime = `${currentHours}:${currentMinutes}`;

    console.log(`Server UTC time: ${now.toISOString()}`);
    console.log(`IST time: ${istTime.toISOString()} -> ${currentTime}`);

    // Debug: Check all unprocessed reminders
    const allReminders = await Reminder.find({
      isDeleted: false,
      notificationSent: false
    }).select('reminderName date time userId');
    
    console.log('All unprocessed reminders:');
    allReminders.forEach(r => {
      const reminderDate = new Date(r.date);
      console.log(`- ${r.reminderName}: ${reminderDate.toDateString()} at ${r.time}`);
    });

    // Get today's date range in IST
    const todayStartIST = new Date(Date.UTC(
      istTime.getUTCFullYear(), 
      istTime.getUTCMonth(), 
      istTime.getUTCDate(), 
      0, 0, 0
    ));
    todayStartIST.setTime(todayStartIST.getTime() - istOffset); // Convert to UTC for DB query
    
    const todayEndIST = new Date(Date.UTC(
      istTime.getUTCFullYear(), 
      istTime.getUTCMonth(), 
      istTime.getUTCDate(), 
      23, 59, 59
    ));
    todayEndIST.setTime(todayEndIST.getTime() - istOffset); // Convert to UTC for DB query

    console.log(`Looking for reminders between ${todayStartIST.toISOString()} and ${todayEndIST.toISOString()}`);

    // Find reminders that match current time and are for today
    const reminders = await Reminder.find({
      isDeleted: false,
      notificationSent: false,
      date: { $gte: todayStartIST, $lte: todayEndIST },
      time: currentTime
    }).populate('userId', 'email username');

    console.log(`Found ${reminders.length} reminders to send for time ${currentTime}`);

    for (const reminder of reminders) {
      try {
        console.log(`Sending notification for: ${reminder.reminderName} to ${reminder.userId.email}`);
        
        // Send email notification
        const emailSent = await sendReminderNotification(
          reminder.userId.email,
          reminder.reminderName,
          reminder.description
        );

        if (emailSent) {
          // Mark as notification sent
          reminder.notificationSent = true;
          reminder.isCompleted = true;
          await reminder.save();

          console.log(`Notification sent successfully for reminder: ${reminder.reminderName}`);
        } else {
          console.log(`Failed to send email for reminder: ${reminder.reminderName}`);
        }
      } catch (error) {
        console.error(`Error sending notification for reminder ${reminder._id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in sendReminderNotifications:', error);
  }
};

// Get Reminder Statistics
export const getReminderStats = async (req, res) => {
  try {
    const userId = req.userId;

    const totalReminders = await Reminder.countDocuments({
      userId,
      isDeleted: false
    });

    const completedReminders = await Reminder.countDocuments({
      userId,
      isDeleted: false,
      isCompleted: true
    });

    const deletedReminders = await Reminder.countDocuments({
      userId,
      isDeleted: true
    });

    res.json({
      stats: {
        total: totalReminders,
        completed: completedReminders,
        pending: totalReminders - completedReminders,
        deleted: deletedReminders
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
