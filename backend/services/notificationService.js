const cron = require('node-cron');
const Deadline = require('../models/Deadline');
const Setting = require('../models/Setting');
const { sendEmail } = require('../utils/emailSender');

// Run every minute
cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();
    
    // Get all users with active deadlines
    const deadlines = await Deadline.find({
      status: 'active',
      notified: false,
      deadline: { $gt: now }
    }).populate('user');

    for (const deadline of deadlines) {
      // Get user settings
      const settings = await Setting.findOne({ user: deadline.user._id });
      const notificationTime = settings?.notificationTime || 30; // default 30 minutes
      
      const timeUntilDeadline = deadline.deadline.getTime() - now.getTime();
      const minutesUntilDeadline = Math.floor(timeUntilDeadline / 60000);
      
      // If deadline is within notification time
      if (minutesUntilDeadline <= notificationTime && minutesUntilDeadline > 0) {
        try {
          await sendEmail(
            deadline.user.email,
            `Reminder: ${deadline.title}`,
            `Your deadline "${deadline.title}" is coming up in ${minutesUntilDeadline} minutes!\n\nDeadline: ${deadline.deadline.toLocaleString()}\nDescription: ${deadline.description || 'No description'}`
          );
          
          deadline.notified = true;
          await deadline.save();
          
          console.log(`[NotificationService] Sent notification for: ${deadline.title}`);
        } catch (emailErr) {
          console.error(`[NotificationService] Email error for ${deadline.title}:`, emailErr.message);
        }
      }
    }
  } catch (err) {
    console.error('[NotificationService] Error:', err.message);
  }
});

console.log('[NotificationService] Started - checking every minute for upcoming deadlines');