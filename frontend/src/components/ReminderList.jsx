import React, { useState } from 'react';
import Swal from 'sweetalert2';
import ReminderForm from './ReminderForm';

const ReminderList = ({ reminders, onEdit, onDelete }) => {
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState(null);

  const handleStartEdit = (reminder) => {
    setEditingId(reminder.id);
    setEditData({
      reminderName: reminder.reminderName,
      description: reminder.description,
      date: reminder.date.split('T')[0],
      time: reminder.time
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData(null);
  };

  const handleSaveEdit = async (updatedData) => {
    try {
      await onEdit(editingId, updatedData);
      setEditingId(null);
      setEditData(null);
    } catch (error) {
      console.error('Error editing reminder:', error);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const calculateMinutesUntil = (dateString, timeString) => {
    const reminderDateTime = new Date(dateString);
    const [hours, minutes] = timeString.split(':');
    reminderDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    const now = new Date();
    return Math.round((reminderDateTime - now) / (1000 * 60));
  };

  if (reminders.length === 0) {
    return (
      <div className="empty-state">
        <h2>📭 No Reminders Yet</h2>
        <p>Create your first reminder to get started!</p>
      </div>
    );
  }

  return (
    <div className="reminders-section">
      {editingId && editData ? (
        <div className="card">
          <ReminderForm
            initialData={editData}
            isEditing={true}
            onSubmit={handleSaveEdit}
          />
          <button className="btn btn-secondary" onClick={handleCancelEdit} style={{ marginTop: '10px' }}>
            Cancel Edit
          </button>
        </div>
      ) : null}

      {reminders.map(reminder => {
        const minutesUntil = calculateMinutesUntil(reminder.date, reminder.time);
        const canEdit = reminder.canEdit;

        return (
          <div
            key={reminder.id}
            className={`reminder-card ${reminder.isCompleted ? 'completed' : ''} ${!canEdit ? 'cannot-edit' : ''}`}
          >
            <div className="reminder-content">
              <div className="reminder-title">
                {reminder.reminderName}
                {reminder.isCompleted && ' ✓'}
              </div>
              {reminder.description && (
                <div className="reminder-description">{reminder.description}</div>
              )}
              <div className="reminder-meta">
                <span>📅 {formatDate(reminder.date)}</span>
                <span>⏰ {reminder.time}</span>
              </div>
              {!canEdit && minutesUntil <= 2 && minutesUntil >= 0 && (
                <div className="time-warning">
                  Cannot edit - reminder in {minutesUntil} minute(s)
                </div>
              )}
            </div>
            <div className="reminder-actions">
              <button
                className="btn btn-warning"
                onClick={() => handleStartEdit(reminder)}
                disabled={!canEdit}
                title={!canEdit ? 'Cannot edit within 2 minutes of scheduled time' : 'Edit reminder'}
              >
                Edit
              </button>
              <button
                className="btn btn-danger"
                onClick={() => onDelete(reminder.id)}
              >
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ReminderList;
