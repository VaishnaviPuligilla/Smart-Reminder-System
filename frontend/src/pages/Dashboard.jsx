import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { remindersAPI } from '../services/api';
import Swal from 'sweetalert2';
import ReminderForm from '../components/ReminderForm';
import bgImage from '../assets/bg1.jpg';

export const Dashboard = () => {
  const { user, logout, deleteAccount, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('pending');
  const [reminders, setReminders] = useState([]);
  const [deletedReminders, setDeletedReminders] = useState([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, deleted: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingReminder, setEditingReminder] = useState(null);

  useEffect(() => {
    fetchData();
  }, [refreshKey]);

  // Auto-refresh every 30 seconds to update completed reminders
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [remindersRes, deletedRes, statsRes] = await Promise.all([
        remindersAPI.getReminders(),
        remindersAPI.getDeletedReminders(),
        remindersAPI.getStats()
      ]);
      setReminders(remindersRes.data.reminders || []);
      setDeletedReminders(deletedRes.data.deletedReminders || []);
      setStats(statsRes.data.stats || { total: 0, completed: 0, pending: 0, deleted: 0 });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const handleDeleteAccount = async () => {
    const result = await Swal.fire({
      title: 'Delete Account?',
      text: 'This action is irreversible. All your data will be deleted.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ff6b6b',
      cancelButtonColor: '#667eea',
      confirmButtonText: 'Delete my account',
      input: 'password',
      inputPlaceholder: 'Enter your password to confirm'
    });

    if (result.isConfirmed && result.value) {
      const response = await deleteAccount(result.value);
      if (response.success) {
        Swal.fire({ icon: 'success', title: 'Account Deleted', confirmButtonColor: '#667eea' });
        navigate('/auth');
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: response.error, confirmButtonColor: '#667eea' });
      }
    }
  };

  const handleCreateReminder = async (reminderData) => {
    try {
      await remindersAPI.createReminder(reminderData);
      Swal.fire({ icon: 'success', title: 'Reminder Created!', timer: 1500, showConfirmButton: false });
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'Failed to create' });
    }
  };

  const handleEditReminder = async (reminderData) => {
    try {
      await remindersAPI.updateReminder(editingReminder.id, reminderData);
      Swal.fire({ icon: 'success', title: 'Updated!', timer: 1500, showConfirmButton: false });
      setEditingReminder(null);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'Failed to update' });
    }
  };

  const handleDeleteReminder = async (reminderId) => {
    const result = await Swal.fire({
      title: 'Move to Trash?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ff6b6b',
      confirmButtonText: 'Delete'
    });
    if (result.isConfirmed) {
      try {
        await remindersAPI.softDeleteReminder(reminderId);
        setRefreshKey(prev => prev + 1);
      } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to delete' });
      }
    }
  };

  const handlePermanentDelete = async (reminderId) => {
    const result = await Swal.fire({
      title: 'Delete Permanently?',
      text: 'This cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ff6b6b',
      confirmButtonText: 'Delete Forever'
    });
    if (result.isConfirmed) {
      try {
        await remindersAPI.permanentlyDeleteReminder(reminderId);
        setRefreshKey(prev => prev + 1);
      } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to delete' });
      }
    }
  };

  const pendingReminders = reminders.filter(r => !r.isCompleted);
  const completedReminders = reminders.filter(r => r.isCompleted);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const canEditReminder = (reminder) => {
    if (reminder.isCompleted) return false;
    const reminderDateTime = new Date(reminder.date);
    const [hours, minutes] = reminder.time.split(':');
    reminderDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    const now = new Date();
    const diffMinutes = (reminderDateTime - now) / (1000 * 60);
    return diffMinutes > 2;
  };

  const handleEditClick = (reminder) => {
    if (!canEditReminder(reminder)) {
      Swal.fire({
        icon: 'warning',
        title: 'Cannot Edit',
        text: 'This reminder cannot be edited within 2 minutes of the scheduled time.',
        confirmButtonColor: '#667eea'
      });
      return;
    }
    setEditingReminder(reminder);
  };

  if (isLoading) {
    return (
      <div className="dashboard-layout">
        <div className="dashboard-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout" style={{
      backgroundImage: `url(${bgImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      minHeight: '100vh'
    }}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>🔔 Reminders</h2>
          <p>Hi, {user?.username}!</p>
        </div>

        <nav className="sidebar-nav">
          <button className={`sidebar-btn ${activeView === 'pending' ? 'active' : ''}`} onClick={() => setActiveView('pending')}>
            Pending <span className="badge">{pendingReminders.length}</span>
          </button>
          <button className={`sidebar-btn ${activeView === 'completed' ? 'active' : ''}`} onClick={() => setActiveView('completed')}>
            Completed <span className="badge">{completedReminders.length}</span>
          </button>
          <button className={`sidebar-btn ${activeView === 'deleted' ? 'active' : ''}`} onClick={() => setActiveView('deleted')}>
            Trash <span className="badge">{deletedReminders.length}</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-btn logout-btn" onClick={handleLogout}>
            Logout
          </button>
          <button className="sidebar-btn delete-account-btn" onClick={handleDeleteAccount} disabled={authLoading}>
            ❌ Delete Account
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Stats */}
        <div className="stats-bar">
          <div className="stat-item"><span className="stat-num">{stats.total}</span><span className="stat-label">Total</span></div>
          <div className="stat-item"><span className="stat-num">{stats.pending}</span><span className="stat-label">Pending</span></div>
          <div className="stat-item"><span className="stat-num">{stats.completed}</span><span className="stat-label">Completed</span></div>
          <div className="stat-item"><span className="stat-num">{stats.deleted}</span><span className="stat-label">Deleted</span></div>
        </div>

        {/* Add New Reminder */}
        {activeView === 'pending' && (
          <div className="form-section">
            <h3>➕ Add New Reminder</h3>
            <ReminderForm onSubmit={handleCreateReminder} />
          </div>
        )}

        {/* Edit Reminder Modal */}
        {editingReminder && (
          <div className="modal-overlay" onClick={() => setEditingReminder(null)}>
            <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
              <div className="edit-modal-header">
                <h3>✏️ Edit Reminder</h3>
                <button className="close-btn" onClick={() => setEditingReminder(null)}>✕</button>
              </div>
              <div className="edit-modal-body">
                <p className="editing-name">Editing: <strong>{editingReminder.reminderName}</strong></p>
                <ReminderForm 
                  initialData={{
                    reminderName: editingReminder.reminderName,
                    description: editingReminder.description,
                    date: editingReminder.date.split('T')[0],
                    time: editingReminder.time
                  }}
                  isEditing={true}
                  onSubmit={handleEditReminder}
                />
                <button className="btn btn-secondary" onClick={() => setEditingReminder(null)} style={{ marginTop: '15px', width: '100%' }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pending Reminders */}
        {activeView === 'pending' && (
          <div className="reminders-section">
            <h3>Pending Reminders</h3>
            {pendingReminders.length === 0 ? (
              <div className="empty-state">No pending reminders. Create one above!</div>
            ) : (
              <div className="reminders-list">
                {pendingReminders.map(reminder => (
                  <div key={reminder.id} className="reminder-card">
                    <div className="reminder-info">
                      <h4>{reminder.reminderName}</h4>
                      {reminder.description && <p>{reminder.description}</p>}
                      <div className="reminder-meta">
                        <span>📅 {formatDate(reminder.date)}</span>
                        <span>⏰ {reminder.time}</span>
                      </div>
                    </div>
                    <div className="reminder-actions">
                      <button 
                        className={`btn btn-warning btn-sm ${!canEditReminder(reminder) ? 'btn-disabled-look' : ''}`}
                        onClick={() => handleEditClick(reminder)}
                      >
                        Edit
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteReminder(reminder.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Completed Reminders */}
        {activeView === 'completed' && (
          <div className="reminders-section">
            <h3>Completed Reminders</h3>
            {completedReminders.length === 0 ? (
              <div className="empty-state">No completed reminders yet.</div>
            ) : (
              <div className="reminders-list">
                {completedReminders.map(reminder => (
                  <div key={reminder.id} className="reminder-card completed">
                    <div className="reminder-info">
                      <h4>{reminder.reminderName} <span className="completed-badge">✓ Completed</span></h4>
                      {reminder.description && <p>{reminder.description}</p>}
                      <div className="reminder-meta">
                        <span>📅 {formatDate(reminder.date)}</span>
                        <span>⏰ {reminder.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Deleted Reminders */}
        {activeView === 'deleted' && (
          <div className="reminders-section">
            <h3>Deleted Reminders</h3>
            {deletedReminders.length === 0 ? (
              <div className="empty-state">Trash is empty.</div>
            ) : (
              <div className="reminders-list">
                {deletedReminders.map(reminder => (
                  <div key={reminder.id} className="reminder-card deleted">
                    <div className="reminder-info">
                      <h4>{reminder.reminderName}</h4>
                      {reminder.description && <p>{reminder.description}</p>}
                      <div className="reminder-meta">
                        <span>📅 {formatDate(reminder.date)}</span>
                        <span>⏰ {reminder.time}</span>
                      </div>
                    </div>
                    <div className="reminder-actions">
                      <button className="btn btn-danger btn-sm" onClick={() => handlePermanentDelete(reminder.id)}>
                        Delete Forever
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
