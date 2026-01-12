import React from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useAuth } from '../utils/AuthContext';

const Navbar = ({ user, logout }) => {
  const navigate = useNavigate();
  const { deleteAccount, isLoading } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    const result = await Swal.fire({
      title: 'Delete Account?',
      text: 'This action is irreversible. All your reminders will be deleted.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ff6b6b',
      cancelButtonColor: '#667eea',
      confirmButtonText: 'Delete my account',
      input: 'password',
      inputPlaceholder: 'Enter your password to confirm',
      inputAttributes: {
        autocapitalize: 'off',
        autocorrect: 'off'
      }
    });

    if (result.isConfirmed && result.value) {
      const response = await deleteAccount(result.value);
      if (response.success) {
        Swal.fire({
          icon: 'success',
          title: 'Account Deleted',
          text: 'Your account has been permanently deleted',
          confirmButtonColor: '#667eea'
        });
        navigate('/login');
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: response.error,
          confirmButtonColor: '#667eea'
        });
      }
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-title">🔔 Reminder App</div>
      <div className="navbar-user">
        <span>Hello, {user?.username}!</span>
        <button className="btn btn-secondary" onClick={handleLogout}>
          Logout
        </button>
        <button className="btn btn-danger" onClick={handleDeleteAccount} disabled={isLoading}>
          Delete Account
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
