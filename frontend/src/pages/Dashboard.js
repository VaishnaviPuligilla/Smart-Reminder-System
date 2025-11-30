import React, { useState } from 'react';
import { Container, Row, Col, Toast, Button, Tabs, Tab, Badge, Modal, Form, Card } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import moment from 'moment';

const Dashboard = () => {
  const { 
    user, 
    reminders, 
    remindersLoading,
    addReminder, 
    completeReminder, 
    deleteReminder,
    restoreReminder,
    permanentDeleteReminder,
    updateReminder,
    refreshReminders
  } = useAuth();

  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [activeTab, setActiveTab] = useState('active');

  // Add Reminder modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);

  const showAlert = (msg, type = 'success') => {
    setNotificationMessage(msg);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const handleComplete = async (id) => {
    try {
      await completeReminder(id);
      showAlert('Reminder marked as completed');
    } catch (err) {
      showAlert(err.response?.data?.message || 'Failed to complete reminder', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this reminder?')) return;
    try {
      await deleteReminder(id);
      showAlert('Reminder moved to deleted section');
    } catch (err) {
      showAlert(err.response?.data?.message || 'Failed to delete reminder', 'error');
    }
  };

  const handleRestore = async (id) => {
    try {
      await restoreReminder(id);
      showAlert('Reminder restored successfully');
    } catch (err) {
      showAlert(err.response?.data?.message || 'Failed to restore reminder', 'error');
    }
  };

  const handlePermanentDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this reminder? This action cannot be undone.')) return;
    try {
      await permanentDeleteReminder(id);
      showAlert('Reminder permanently deleted');
    } catch (err) {
      showAlert(err.response?.data?.message || 'Failed to delete reminder', 'error');
    }
  };

  const handleEdit = (reminder) => {
    setEditingReminder(reminder);
    setNewTitle(reminder.title);
    setNewDeadline(moment(reminder.deadline).format('YYYY-MM-DDTHH:mm'));
    setNewDescription(reminder.description || '');
    setShowEditModal(true);
  };

  const handleUpdateReminder = async (e) => {
    e.preventDefault();
    if (!newTitle || !newDeadline) {
      showAlert('Please fill in title and deadline', 'error');
      return;
    }
    if (newTitle.length > 100) {
      showAlert('Title must be 100 characters or less', 'error');
      return;
    }
    
    const deadlineDate = new Date(newDeadline);
    if (deadlineDate <= new Date()) {
      showAlert('Deadline must be in the future', 'error');
      return;
    }
    
    setEditing(true);
    try {
      if (editingReminder && updateReminder) {
        await updateReminder(editingReminder._id, {
          title: newTitle,
          deadline: newDeadline,
          description: newDescription
        });
      } else {
        await refreshReminders();
      }
      
      setShowEditModal(false);
      setEditingReminder(null);
      showAlert('Reminder updated successfully');
    } catch (err) {
      showAlert(err.response?.data?.message || 'Failed to update reminder', 'error');
    } finally {
      setEditing(false);
    }
  };

  const handleAddReminder = async (e) => {
    e.preventDefault();
    if (!newTitle || !newDeadline) {
      showAlert('Please fill in title and deadline', 'error');
      return;
    }
    if (newTitle.length > 100) {
      showAlert('Title must be 100 characters or less', 'error');
      return;
    }
    
    const deadlineDate = new Date(newDeadline);
    if (deadlineDate <= new Date()) {
      showAlert('Deadline must be in the future', 'error');
      return;
    }
    
    setAdding(true);
    try {
      await addReminder({
        title: newTitle,
        deadline: newDeadline,
        description: newDescription
      });
      setShowAddModal(false);
      setNewTitle('');
      setNewDeadline('');
      setNewDescription('');
      showAlert('Reminder added successfully');
    } catch (err) {
      showAlert(err.response?.data?.message || 'Failed to add reminder', 'error');
    } finally {
      setAdding(false);
    }
  };

  const ReminderItem = ({ reminder, type = 'active' }) => {
    const isPast = new Date(reminder.deadline) < new Date();
    
    return (
      <Card className="mb-3">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start">
            <div className="flex-grow-1">
              <Card.Title className="d-flex align-items-center">
                {reminder.title}
                {isPast && type === 'active' && (
                  <Badge bg="warning" className="ms-2">Overdue</Badge>
                )}
                {type === 'completed' && (
                  <Badge bg="success" className="ms-2">Completed</Badge>
                )}
                {type === 'deleted' && (
                  <Badge bg="danger" className="ms-2">Deleted</Badge>
                )}
              </Card.Title>
              <Card.Subtitle className="mb-2 text-muted">
                Due: {moment(reminder.deadline).format('MMMM Do YYYY, h:mm a')}
              </Card.Subtitle>
              {reminder.description && (
                <Card.Text>{reminder.description}</Card.Text>
              )}
              <div className="text-muted small">
                Created: {moment(reminder.createdAt).format('MMM D, YYYY')}
                {reminder.completedAt && (
                  <div>Completed: {moment(reminder.completedAt).format('MMM D, YYYY h:mm A')}</div>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="d-flex flex-column gap-2">
              {type === 'active' && (
                <>
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={() => handleEdit(reminder)}
                    disabled={!reminder.canEdit}
                    title={!reminder.canEdit ? "Cannot edit within 1 minute of deadline" : "Edit reminder"}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="outline-danger" 
                    size="sm"
                    onClick={() => handleDelete(reminder._id)}
                    disabled={!reminder.canEdit}
                    title={!reminder.canEdit ? "Cannot delete within 1 minute of deadline" : "Delete reminder"}
                  >
                    Delete
                  </Button>
                  {!reminder.canEdit && (
                    <small className="text-muted text-center">
                      ❌ Actions disabled
                    </small>
                  )}
                </>
              )}
              
              {type === 'completed' && (
                <small className="text-muted text-center">
                  🔒 Completed reminders cannot be modified
                </small>
              )}
              
              {type === 'deleted' && (
                <>
                  <Button 
                    variant="outline-success" 
                    size="sm"
                    onClick={() => handleRestore(reminder._id)}
                  >
                    Restore
                  </Button>
                  <Button 
                    variant="danger" 
                    size="sm"
                    onClick={() => handlePermanentDelete(reminder._id)}
                  >
                    Delete Forever
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card.Body>
      </Card>
    );
  };

  if (remindersLoading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <h2>Loading reminders...</h2>
        </div>
      </Container>
    );
  }

  const activeReminders = reminders.active || [];
  const completedReminders = reminders.completed || [];
  const deletedReminders = reminders.deleted || [];

  return (
    <Container className="mt-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1>Welcome, {user?.email}</h1>
              <p className="text-muted">Manage your reminders efficiently</p>
            </div>
            <Button variant="primary" onClick={() => setShowAddModal(true)}>
              + Add New Reminder
            </Button>
          </div>
        </Col>
      </Row>

      {/* Notification Toast */}
      <Toast 
        show={showNotification} 
        onClose={() => setShowNotification(false)} 
        style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999 }}
        bg="success"
      >
        <Toast.Header closeButton>
          <strong className="me-auto">Notification</strong>
        </Toast.Header>
        <Toast.Body className="text-white">{notificationMessage}</Toast.Body>
      </Toast>

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="text-center border-primary">
            <Card.Body>
              <Card.Title className="text-primary">Active</Card.Title>
              <h2 className="text-primary">{activeReminders.length}</h2>
              <small className="text-muted">Reminders pending</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center border-success">
            <Card.Body>
              <Card.Title className="text-success">Completed</Card.Title>
              <h2 className="text-success">{completedReminders.length}</h2>
              <small className="text-muted">Finished reminders</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center border-danger">
            <Card.Body>
              <Card.Title className="text-danger">Deleted</Card.Title>
              <h2 className="text-danger">{deletedReminders.length}</h2>
              <small className="text-muted">In trash</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Tabs for different reminder types */}
      <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-3">
        <Tab eventKey="active" title={`Active (${activeReminders.length})`}>
          {activeReminders.length === 0 ? (
            <div className="text-center py-5">
              <h4>No active reminders</h4>
              <p className="text-muted">Add your first reminder using the button above</p>
            </div>
          ) : (
            activeReminders.map(reminder => (
              <ReminderItem key={reminder._id} reminder={reminder} type="active" />
            ))
          )}
        </Tab>
        
        <Tab eventKey="completed" title={`Completed (${completedReminders.length})`}>
          {completedReminders.length === 0 ? (
            <div className="text-center py-5">
              <h4>No completed reminders</h4>
              <p className="text-muted">Completed reminders will appear here</p>
            </div>
          ) : (
            completedReminders.map(reminder => (
              <ReminderItem key={reminder._id} reminder={reminder} type="completed" />
            ))
          )}
        </Tab>
        
        <Tab eventKey="deleted" title={`Deleted (${deletedReminders.length})`}>
          {deletedReminders.length === 0 ? (
            <div className="text-center py-5">
              <h4>No deleted reminders</h4>
              <p className="text-muted">Deleted reminders will appear here</p>
            </div>
          ) : (
            deletedReminders.map(reminder => (
              <ReminderItem key={reminder._id} reminder={reminder} type="deleted" />
            ))
          )}
        </Tab>
      </Tabs>

      {/* Add Reminder Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Form onSubmit={handleAddReminder}>
          <Modal.Header closeButton>
            <Modal.Title>Add New Reminder</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3" controlId="formTitle">
              <Form.Label>Title *</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="Enter reminder title" 
                value={newTitle} 
                onChange={e => setNewTitle(e.target.value)} 
                maxLength={100}
                required
              />
              <Form.Text className="text-muted">
                {newTitle.length}/100 characters
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3" controlId="formDeadline">
              <Form.Label>Deadline *</Form.Label>
              <Form.Control 
                type="datetime-local" 
                value={newDeadline} 
                onChange={e => setNewDeadline(e.target.value)} 
                min={new Date().toISOString().slice(0, 16)}
                required
              />
              <Form.Text className="text-muted">
                Must be in the future
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3" controlId="formDescription">
              <Form.Label>Description (optional)</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3} 
                placeholder="Add a description for your reminder"
                value={newDescription} 
                onChange={e => setNewDescription(e.target.value)} 
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={adding}>
              {adding ? 'Adding...' : 'Add Reminder'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Edit Reminder Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Form onSubmit={handleUpdateReminder}>
          <Modal.Header closeButton>
            <Modal.Title>Edit Reminder</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3" controlId="editFormTitle">
              <Form.Label>Title *</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="Enter reminder title" 
                value={newTitle} 
                onChange={e => setNewTitle(e.target.value)} 
                maxLength={100}
                required
              />
              <Form.Text className="text-muted">
                {newTitle.length}/100 characters
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3" controlId="editFormDeadline">
              <Form.Label>Deadline *</Form.Label>
              <Form.Control 
                type="datetime-local" 
                value={newDeadline} 
                onChange={e => setNewDeadline(e.target.value)} 
                min={new Date().toISOString().slice(0, 16)}
                required
              />
              <Form.Text className="text-muted">
                Must be in the future
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3" controlId="editFormDescription">
              <Form.Label>Description (optional)</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3} 
                placeholder="Add a description for your reminder"
                value={newDescription} 
                onChange={e => setNewDescription(e.target.value)} 
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={editing}>
              {editing ? 'Updating...' : 'Update Reminder'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default Dashboard;