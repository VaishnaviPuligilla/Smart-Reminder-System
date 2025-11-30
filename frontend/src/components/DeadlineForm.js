// components/DeadlineForm.js
import React, { useState } from 'react';
import { Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';

const DeadlineForm = ({ onDeadlineAdded }) => {
  const [formData, setFormData] = useState({
    title: '',
    deadline: '',
    description: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { addReminder } = useAuth(); // ✅ REMOVED: validateDeadlineTime

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate form
      if (!formData.title.trim()) {
        throw new Error('Title is required');
      }
      
      if (!formData.deadline) {
        throw new Error('Deadline date is required');
      }

      const deadlineDate = new Date(formData.deadline);
      const now = new Date();
      
      // Check if deadline is in the future
      if (deadlineDate <= now) {
        throw new Error('Deadline must be in the future');
      }

      // ✅ REMOVED: 2-minute validation

      // Add reminder using AuthContext
      const newReminder = await addReminder({
        title: formData.title.trim(),
        deadline: formData.deadline,
        description: formData.description || ''
      });

      // Reset form
      setFormData({
        title: '',
        deadline: '',
        description: ''
      });

      // Notify parent
      if (onDeadlineAdded) {
        onDeadlineAdded(newReminder);
      }

    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ UPDATED: Set minimum datetime to current time (no 2-minute restriction)
  const getMinDateTime = () => {
    const now = new Date();
    // Allow any future time, just add 1 minute buffer
    const oneMinuteFromNow = new Date(now.getTime() + 1 * 60 * 1000);
    return oneMinuteFromNow.toISOString().slice(0, 16);
  };

  return (
    <Form onSubmit={handleSubmit} className="mb-4 p-3 border rounded">
      <h4>Add New Reminder</h4>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Row>
        <Col md={6}>
          <Form.Group controlId="title" className="mb-3">
            <Form.Label>Title *</Form.Label>
            <Form.Control 
              type="text" 
              name="title" 
              value={formData.title} 
              onChange={handleChange} 
              required 
              placeholder="Enter reminder title"
            />
          </Form.Group>
        </Col>
        
        <Col md={6}>
          <Form.Group controlId="deadline" className="mb-3">
            <Form.Label>Deadline *</Form.Label>
            <Form.Control 
              type="datetime-local" 
              name="deadline" 
              value={formData.deadline} 
              onChange={handleChange} 
              required 
              min={getMinDateTime()} // ✅ UPDATED: 1-minute minimum
            />
            <Form.Text className="text-muted">
              Choose any future date and time
            </Form.Text>
          </Form.Group>
        </Col>
      </Row>
      
      <Form.Group controlId="description" className="mb-3">
        <Form.Label>Description</Form.Label>
        <Form.Control 
          as="textarea" 
          rows={2} 
          name="description" 
          value={formData.description} 
          onChange={handleChange} 
          placeholder="Optional description"
        />
      </Form.Group>
      
      <Button 
        variant="primary" 
        type="submit" 
        disabled={loading}
        className="w-100"
      >
        {loading ? 'Adding Reminder...' : 'Add Reminder'}
      </Button>
    </Form>
  );
};

export default DeadlineForm;