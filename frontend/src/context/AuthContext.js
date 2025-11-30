// contexts/AuthContext.js
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useState({
    active: [],
    completed: [],
    deleted: []
  });
  const [remindersLoading, setRemindersLoading] = useState(false);

  // ✅ UPDATED: addReminder without 2-minute validation
  const addReminder = async (reminderData) => {
    try {
      const res = await api.post('/deadlines', reminderData);
      const newReminder = res.data;
      
      // Add to active reminders
      setReminders(prev => ({
        ...prev,
        active: [...prev.active, newReminder]
      }));
      
      console.log('Reminder added:', newReminder.title);
      return newReminder;
    } catch (err) {
      console.error('Error adding reminder:', err);
      throw err;
    }
  };

  // ✅ UPDATED: updateReminder without 2-minute validation
  const updateReminder = async (id, updateData) => {
    try {
      const res = await api.put(`/deadlines/${id}`, updateData);
      const updatedReminder = res.data;
      
      // Update in active reminders
      setReminders(prev => ({
        ...prev,
        active: prev.active.map(r => 
          r._id === id ? { ...updatedReminder, canEdit: updatedReminder.canEdit } : r
        )
      }));
      
      console.log('Reminder updated:', updatedReminder.title);
      return updatedReminder;
    } catch (err) {
      console.error('Error updating reminder:', err);
      throw err;
    }
  };

  // Fetch all reminders for the logged-in user
  const fetchAllReminders = useCallback(async () => {
    if (!user) return;
    
    setRemindersLoading(true);
    try {
      const [activeRes, completedRes, deletedRes] = await Promise.all([
        api.get('/deadlines/active'),
        api.get('/deadlines/completed'),
        api.get('/deadlines/deleted')
      ]);

      setReminders({
        active: activeRes.data || [],
        completed: completedRes.data || [],
        deleted: deletedRes.data || []
      });
    } catch (err) {
      console.error('Error fetching reminders:', err);
    } finally {
      setRemindersLoading(false);
    }
  }, [user]);

  // ✅ ADDED: Auto-refresh reminders every 30 seconds
  useEffect(() => {
    let interval;
    if (user) {
      interval = setInterval(() => {
        fetchAllReminders();
      }, 30000); // Refresh every 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user, fetchAllReminders]);

  // Fetch reminders whenever user changes
  useEffect(() => {
    if (user) {
      console.log('User logged in, fetching reminders...');
      fetchAllReminders();
    } else {
      console.log('User logged out, clearing reminders...');
      setReminders({ active: [], completed: [], deleted: [] });
    }
  }, [user, fetchAllReminders]);

  const checkLoggedIn = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }

      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const res = await api.get('/auth/verify');
      setUser(res.data.user);
      console.log('User verified, reminders will be fetched automatically');
      
    } catch (err) {
      console.error('Token verification failed:', err);
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkLoggedIn();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });

      if (!res.data.token) {
        console.error('Token not received in response');
        return false;
      }

      localStorage.setItem('token', res.data.token);
      api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      setUser(res.data.user);
      
      console.log('Login successful, reminders will be fetched automatically');
      return true;
    } catch (err) {
      console.error('Login failed:', err.response?.data || err.message);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    console.log('Logout successful, reminders cleared');
  };

  const completeReminder = async (id) => {
    try {
      const response = await api.put(`/deadlines/${id}/complete`);
      
      // Update local state immediately
      setReminders(prev => ({
        active: prev.active.filter(r => r._id !== id),
        completed: [...prev.completed, response.data],
        deleted: prev.deleted
      }));
      
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const deleteReminder = async (id) => {
    try {
      const response = await api.delete(`/deadlines/${id}`);
      
      setReminders(prev => ({
        active: prev.active.filter(r => r._id !== id),
        completed: prev.completed,
        deleted: [...prev.deleted, response.data.deadline]
      }));
      
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  // ❌ REMOVED: restoreReminder function completely

  const permanentDeleteReminder = async (id) => {
    try {
      await api.delete(`/deadlines/${id}/permanent`);
      
      setReminders(prev => ({
        ...prev,
        deleted: prev.deleted.filter(r => r._id !== id)
      }));
      
      console.log('Reminder permanently deleted:', id);
      return true;
    } catch (err) {
      console.error('Error permanently deleting reminder:', err);
      throw err;
    }
  };

  const refreshReminders = () => {
    console.log('Manually refreshing reminders...');
    fetchAllReminders();
  };

  return (
    <AuthContext.Provider value={{
      // Auth properties
      user,
      loading,
      login,
      logout,
      
      // Reminder properties
      reminders,
      remindersLoading,
      
      // Reminder functions
      addReminder,
      completeReminder,
      deleteReminder,
      // ❌ REMOVED: restoreReminder
      permanentDeleteReminder,
      updateReminder,
      refreshReminders,
      fetchAllReminders
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);