// components/DeadlineList.js
import React from 'react';
import { Card, Button, Badge, Row, Col } from 'react-bootstrap';
import moment from 'moment';
import { useAuth } from '../contexts/AuthContext';

const DeadlineList = ({ deadlines = [], type = 'active' }) => {
  const { 
    completeReminder, 
    deleteReminder, 
    permanentDeleteReminder
  } = useAuth();

  const handleComplete = async (id) => {
    try {
      await completeReminder(id);
    } catch (err) {
      alert('Error completing reminder: ' + err.response?.data?.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to move this reminder to deleted?')) {
      try {
        await deleteReminder(id);
      } catch (err) {
        alert('Error deleting reminder: ' + err.response?.data?.message);
      }
    }
  };

  const handlePermanentDelete = async (id) => {
    if (window.confirm('Are you sure you want to permanently delete this reminder? This action cannot be undone.')) {
      try {
        await permanentDeleteReminder(id);
      } catch (err) {
        alert('Error permanently deleting reminder: ' + err.response?.data?.message);
      }
    }
  };

  if (!deadlines || deadlines.length === 0) {
    return (
      <div className="text-center mt-4">
        <h5>No {type} reminders</h5>
        <p className="text-muted">
          {type === 'active' && 'Add your first reminder using the form above'}
          {type === 'completed' && 'Completed reminders will appear here'}
          {type === 'deleted' && 'Deleted reminders will appear here'}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <h4>{type.charAt(0).toUpperCase() + type.slice(1)} Reminders ({deadlines.length})</h4>
      <Row>
        {deadlines.map((deadline) => (
          <Col key={deadline._id} md={6} lg={4} className="mb-3">
            <Card 
              className={`h-100 ${deadline.isOverdue ? 'border-warning' : ''} ${
                type === 'completed' ? 'border-success' : 
                type === 'deleted' ? 'border-danger' : ''
              }`}
            >
              <Card.Body>
                <Card.Title className="d-flex justify-content-between align-items-start">
                  <span>{deadline.title}</span>
                  {deadline.isOverdue && (
                    <Badge bg="warning" text="dark">Overdue</Badge>
                  )}
                  {type === 'completed' && (
                    <Badge bg="success">Completed</Badge>
                  )}
                  {type === 'deleted' && (
                    <Badge bg="danger">Deleted</Badge>
                  )}
                </Card.Title>
                
                <Card.Text className="text-muted small">
                  Due: {moment(deadline.deadline).format('MMM D, YYYY h:mm A')}
                </Card.Text>
                
                {deadline.description && (
                  <Card.Text>{deadline.description}</Card.Text>
                )}

                {/* Action Buttons */}
                <div className="mt-3">
                  {type === 'active' && (
                    <>
                      <Button 
                        variant="success" 
                        size="sm" 
                        className="me-2"
                        onClick={() => handleComplete(deadline._id)}
                        disabled={!deadline.canEdit}
                      >
                        Complete
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => handleDelete(deadline._id)}
                        disabled={!deadline.canEdit}
                      >
                        Delete
                      </Button>
                      {!deadline.canEdit && (
                        <small className="text-muted d-block mt-1">
                          ❌ Edit/Delete disabled (within 1 minute of deadline)
                        </small>
                      )}
                    </>
                  )}
                  
                  {type === 'deleted' && (
                    // ❌ REMOVED: Restore button completely - Only show Delete Forever
                    <Button 
                      variant="danger" 
                      size="sm"
                      onClick={() => handlePermanentDelete(deadline._id)}
                    >
                      Delete Forever
                    </Button>
                  )}
                </div>

                <div className="mt-2 text-muted small">
                  Created: {moment(deadline.createdAt).format('MMM D, YYYY')}
                  {deadline.completedAt && (
                    <div>Completed: {moment(deadline.completedAt).format('MMM D, YYYY h:mm A')}</div>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default DeadlineList;