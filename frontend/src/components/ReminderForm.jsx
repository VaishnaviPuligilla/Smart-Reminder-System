import React, { useState } from 'react';
import Swal from 'sweetalert2';

const ReminderForm = ({ onSubmit, initialData = null, isEditing = false }) => {
  const [formData, setFormData] = useState(
    initialData || {
      reminderName: '',
      description: '',
      date: '',
      time: ''
    }
  );
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.reminderName.trim()) {
      newErrors.reminderName = 'Reminder name is required';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (!formData.time) {
      newErrors.time = 'Time is required';
    } else if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(formData.time)) {
      newErrors.time = 'Invalid time format. Use HH:MM (24-hour)';
    }

    // Check if date/time is in the past
    if (formData.date && formData.time) {
      const reminderDateTime = new Date(formData.date);
      const [hours, minutes] = formData.time.split(':');
      reminderDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const now = new Date();
      if (reminderDateTime < now) {
        newErrors.datetime = 'You cannot choose a time in the past';
      }
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(formData);
      setFormData({
        reminderName: '',
        description: '',
        date: '',
        time: ''
      });
      setErrors({});
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="add-reminder-section card">
      <h2>{isEditing ? 'Edit Reminder' : 'Add New Reminder'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="reminderName">Reminder Name *</label>
          <input
            type="text"
            id="reminderName"
            name="reminderName"
            value={formData.reminderName}
            onChange={handleChange}
            placeholder="e.g., Meeting with Team"
            className={errors.reminderName ? 'error' : ''}
          />
          {errors.reminderName && <small style={{ color: '#c62828' }}>{errors.reminderName}</small>}
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Add a short description (optional)"
            className={errors.description ? 'error' : ''}
          />
          {errors.description && <small style={{ color: '#c62828' }}>{errors.description}</small>}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="date">Date *</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className={errors.date ? 'error' : ''}
            />
            {errors.date && <small style={{ color: '#c62828' }}>{errors.date}</small>}
          </div>

          <div className="form-group">
            <label htmlFor="time">Time (24-hour IST) *</label>
            <input
              type="time"
              id="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              className={errors.time ? 'error' : ''}
            />
            {errors.time && <small style={{ color: '#c62828' }}>{errors.time}</small>}
          </div>
        </div>

        {errors.datetime && (
          <div className="alert alert-error" style={{ marginBottom: '20px' }}>
            {errors.datetime}
          </div>
        )}

        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? 'Creating...' : (isEditing ? 'Update Reminder' : 'Add Reminder')}
        </button>
      </form>
    </div>
  );
};

export default ReminderForm;
