const Deadline = require('../models/Deadline');

const autoCompleteOverdueReminders = async () => {
  try {
    const now = new Date();
    
    // Find active deadlines that are past their deadline time
    const overdueDeadlines = await Deadline.find({
      status: 'active',
      deadline: { $lt: now }
    });

    console.log(`[AutoCompleteService] Found ${overdueDeadlines.length} overdue reminders`);

    for (const deadline of overdueDeadlines) {
      try {
        // Auto-complete overdue reminders
        deadline.status = 'completed';
        deadline.completedAt = new Date();
        await deadline.save();
        
        console.log(`[AutoCompleteService] Auto-completed overdue reminder: "${deadline.title}"`);
      } catch (err) {
        console.error(`[AutoCompleteService] Error auto-completing reminder "${deadline.title}":`, err.message);
      }
    }
  } catch (err) {
    console.error('[AutoCompleteService] Error checking overdue reminders:', err);
  }
};

// Run every 5 minutes to auto-complete overdue reminders
setInterval(autoCompleteOverdueReminders, 5 * 60 * 1000);

// Initial run
autoCompleteOverdueReminders();

console.log('Auto-complete service started, checking every 5 minutes.');

module.exports = { autoCompleteOverdueReminders };