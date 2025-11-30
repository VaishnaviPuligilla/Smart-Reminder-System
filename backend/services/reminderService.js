const cron = require("node-cron");
const Deadline = require("../models/Deadline");
const { sendEmail } = require("../utils/emailSender");

cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();

    console.log(`[ReminderService] Running check at ${now.toISOString()}`);

    // ✅ Send notifications for upcoming deadlines (1 minute before)
    const upcomingReminders = await Deadline.find({
      status: "active",
      deadline: {
        $gt: now,
        $lte: new Date(now.getTime() + 60000) // 1 minute from now
      },
      notified: false
    }).populate('user', 'email');

    for (const reminder of upcomingReminders) {
      try {
        console.log(`[ReminderService] Sending reminder: ${reminder.title}`);
        
        await sendEmail(
          reminder.user.email,
          'OnTime Reminder - Time is Now!',
          `This is your reminder: "${reminder.title}"\nScheduled time: ${reminder.deadline.toLocaleString()}\n\nThank you for using OnTime.`
        );

        reminder.notified = true;
        await reminder.save();

        console.log(`[ReminderService] Email sent for: ${reminder.title}`);
      } catch (emailErr) {
        console.error(`[ReminderService] Failed to send email for "${reminder.title}":`, emailErr.message);
      }
    }

    // ✅ Auto-complete overdue tasks
    const overdue = await Deadline.find({
      status: "active",
      deadline: { $lt: now }
    });

    for (const deadline of overdue) {
      deadline.status = "completed";
      deadline.completedAt = new Date();
      await deadline.save();
      console.log(`[ReminderService] Auto-completed overdue: ${deadline.title}`);
    }

  } catch (err) {
    console.error("[ReminderService] Error:", err.message);
  }
});

console.log("[ReminderService] Started (runs every minute)");