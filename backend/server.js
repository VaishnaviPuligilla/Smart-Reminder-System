import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js';
import { sendReminderNotifications } from './controllers/reminderController.js';
import authRoutes from './routes/authRoutes.js';
import reminderRoutes from './routes/reminderRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/reminders', reminderRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Cron job to send reminders every minute
cron.schedule('* * * * *', () => {
  sendReminderNotifications();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
