import express from 'express';
import {
  createReminder,
  getReminders,
  getDeletedReminders,
  updateReminder,
  softDeleteReminder,
  permanentlyDeleteReminder,
  getReminderStats
} from '../controllers/reminderController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// All reminder routes are protected
router.use(authMiddleware);

router.post('/create', createReminder);
router.get('/all', getReminders);
router.get('/deleted', getDeletedReminders);
router.put('/update/:reminderId', updateReminder);
router.delete('/soft-delete/:reminderId', softDeleteReminder);
router.delete('/permanent-delete/:reminderId', permanentlyDeleteReminder);
router.get('/stats', getReminderStats);

export default router;
