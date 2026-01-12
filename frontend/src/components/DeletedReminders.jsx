import React from 'react';

const DeletedReminders = ({ reminders, onPermanentlyDelete }) => {
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  if (reminders.length === 0) {
    return (
      <div className="empty-state">
        <h2>No Deleted Reminders</h2>
        <p>Your deleted reminders will appear here</p>
      </div>
    );
  }

  return (
    <div className="reminders-section">
      {reminders.map(reminder => (
        <div key={reminder.id} className="reminder-card">
          <div className="reminder-content">
            <div className="reminder-title">{reminder.reminderName}</div>
            {reminder.description && (
              <div className="reminder-description">{reminder.description}</div>
            )}
            <div className="reminder-meta">
              <span>📅 {formatDate(reminder.date)}</span>
              <span>⏰ {reminder.time}</span>
              <span>Deleted {formatDate(reminder.deletedAt)}</span>
            </div>
          </div>
          <div className="reminder-actions">
            <button
              className="btn btn-danger"
              onClick={() => onPermanentlyDelete(reminder.id)}
            >
              Delete Permanently
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DeletedReminders;
