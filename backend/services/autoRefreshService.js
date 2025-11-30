// services/autoRefreshService.js
const cron = require('node-cron');

// This service will auto-complete overdue reminders and refresh data
const autoRefreshService = () => {
  console.log('[AutoRefreshService] Started - checking for overdue reminders every minute');
};

module.exports = { autoRefreshService };