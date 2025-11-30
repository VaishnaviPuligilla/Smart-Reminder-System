import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const Settings = () => {
  // Removed unused 'user' variable to fix warning
  const [settings, setSettings] = useState({
    theme: 'light',
    primaryColor: '#4e73df',
    secondaryColor: '#858796',
    notificationTime: 30
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      setSettings(res.data);
      // Apply theme
      document.body.setAttribute('data-bs-theme', res.data.theme);
      setInitialized(true);
    } catch (err) {
      console.error('Error fetching settings:', err);
      setInitialized(true);
    }
  };

  const updateSettings = async (newSettings) => {
    setLoading(true);
    try {
      const res = await api.put('/settings', newSettings);
      setSettings(res.data);
      // Apply theme
      document.body.setAttribute('data-bs-theme', res.data.theme);
      setMessage('Settings saved successfully!');
      
      // ✅ CRITICAL: Settings update doesn't affect reminders
      // Reminders remain intact in AuthContext
      console.log('Settings updated - reminders remain unchanged');
      
    } catch (err) {
      console.error('Error updating settings:', err);
      setMessage('Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleThemeChange = (e) => {
    const newTheme = e.target.value;
    setSettings(prev => ({ ...prev, theme: newTheme }));
    // Apply immediately for better UX
    document.body.setAttribute('data-bs-theme', newTheme);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateSettings(settings);
  };

  if (!initialized) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <h2>Loading settings...</h2>
        </div>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <Card>
            <Card.Header>
              <h3 className="mb-0">Settings</h3>
            </Card.Header>
            <Card.Body>
              {message && (
                <Alert variant={message.includes('successfully') ? 'success' : 'danger'}>
                  {message}
                </Alert>
              )}
              
              <Alert variant="info" className="mb-4">
                <strong>✅ Reminders are safe!</strong> Changing settings will not affect your reminders.
                They are stored securely and will persist across sessions.
              </Alert>

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Theme</Form.Label>
                  <div>
                    <Form.Check
                      inline
                      type="radio"
                      label="Light"
                      name="theme"
                      value="light"
                      checked={settings.theme === 'light'}
                      onChange={handleThemeChange}
                    />
                    <Form.Check
                      inline
                      type="radio"
                      label="Dark"
                      name="theme"
                      value="dark"
                      checked={settings.theme === 'dark'}
                      onChange={handleThemeChange}
                    />
                    <Form.Check
                      inline
                      type="radio"
                      label="Auto"
                      name="theme"
                      value="auto"
                      checked={settings.theme === 'auto'}
                      onChange={handleThemeChange}
                    />
                  </div>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Notification Time (minutes before deadline)</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    max="1440"
                    value={settings.notificationTime}
                    onChange={(e) => setSettings({...settings, notificationTime: parseInt(e.target.value) || 30})}
                  />
                  <Form.Text className="text-muted">
                    How many minutes before the deadline should we send you a notification?
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Primary Color</Form.Label>
                  <Form.Control
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) => setSettings({...settings, primaryColor: e.target.value})}
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Secondary Color</Form.Label>
                  <Form.Control
                    type="color"
                    value={settings.secondaryColor}
                    onChange={(e) => setSettings({...settings, secondaryColor: e.target.value})}
                  />
                </Form.Group>

                <Button 
                  variant="primary" 
                  type="submit" 
                  disabled={loading}
                  className="w-100"
                >
                  {loading ? 'Saving Settings...' : 'Save Settings'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </div>
      </div>
    </Container>
  );
};

export default Settings;