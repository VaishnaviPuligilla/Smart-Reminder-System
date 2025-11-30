require('dotenv').config({ path: __dirname + '/.env' });
require('./services/autoRefreshService');

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

console.log('Environment Variables:');
console.log('MONGO_URI:', process.env.MONGO_URI ? 'Set' : 'Not set');
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '******' : 'Not set');

// Load background services
require('./services/reminderService');
require('./services/notificationService');

// Middleware: JSON + CORS
app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  })
);

// ✅ FIXED: Safe logging middleware (no crash on DELETE, GET, empty bodies)
app.use((req, res, next) => {
  console.log(`\n${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);

  // Only log body for JSON requests
  if (req.headers['content-type']?.includes('application/json')) {
    if (req.body && typeof req.body === 'object') {
      const keys = Object.keys(req.body || {});
      if (keys.length > 0) {
        if (!['/api/auth/login', '/api/auth/register'].includes(req.originalUrl)) {
          console.log("Request Body:", req.body);
        }
      }
    }
  }

  next();
});

// ✅ MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('✔ MongoDB connected successfully');
    console.log(`   Database: ${mongoose.connection.db.databaseName}`);
    console.log(`   Host: ${mongoose.connection.host}`);
  })
  .catch((err) => {
    console.error('✘ MongoDB connection failed');
    console.error(err);
  });

// ✅ Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/deadlines', require('./routes/deadlines'));   // includes soft delete logic
app.use('/api/settings', require('./routes/settings'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Test database
app.get('/api/test-db', async (req, res) => {
  try {
    const User = require('./models/User');
    const count = await User.countDocuments();
    res.json({
      status: 'Database working',
      userCount: count,
      database: mongoose.connection.db.databaseName
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log('   Ready to receive requests...\n');
});

// Mongo events
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed through app termination');
  process.exit(0);
});
