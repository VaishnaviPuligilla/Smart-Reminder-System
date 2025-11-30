const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  theme: {
    type: String,
    enum: ['light', 'dark', 'auto'],
    default: 'light'
  },
  primaryColor: {
    type: String,
    default: '#4e73df'
  },
  secondaryColor: {
    type: String,
    default: '#858796'
  },
  notificationTime: {
    type: Number,
    default: 30
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Setting', SettingSchema);