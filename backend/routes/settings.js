const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting'); // FIXED: Changed from '../models/Settings'
const { protect } = require('../middleware/auth');

// Get user settings
router.get('/', protect, async (req, res) => {
  try {
    let settings = await Setting.findOne({ user: req.user.id });
    
    if (!settings) {
      // Create default settings if not found
      settings = new Setting({
        user: req.user.id,
        theme: 'light',
        primaryColor: '#4e73df',
        secondaryColor: '#858796',
        notificationTime: 30
      });
      await settings.save();
    }
    
    res.json(settings);
  } catch (err) {
    console.error('Error fetching settings:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user settings
router.put('/', protect, async (req, res) => {
  const { theme, primaryColor, secondaryColor, notificationTime } = req.body;

  try {
    let settings = await Setting.findOne({ user: req.user.id });
    
    if (!settings) {
      settings = new Setting({
        user: req.user.id,
        theme: theme || 'light',
        primaryColor: primaryColor || '#4e73df',
        secondaryColor: secondaryColor || '#858796',
        notificationTime: notificationTime || 30
      });
    } else {
      if (theme) settings.theme = theme;
      if (primaryColor) settings.primaryColor = primaryColor;
      if (secondaryColor) settings.secondaryColor = secondaryColor;
      if (notificationTime) settings.notificationTime = notificationTime;
    }
    
    const savedSettings = await settings.save();
    res.json(savedSettings);
  } catch (err) {
    console.error('Error saving settings:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;