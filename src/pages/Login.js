import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import useStore from '../store/useStore';
import './Login.css';

export default function Login() {
  const { loginUser, registerUser, enterGuestMode } = useStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState('login');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'login') {
      if (!loginUser(username, password)) {
        setError('Invalid username/password');
        return;
      }
      navigate('/');
    } else {
      if (!username || !password) {
        setError('Both fields are required');
        return;
      }
      if (!registerUser(username, password)) {
        setError('Username already exists');
        return;
      }
      navigate('/');
    }
  };

  const handleSkipLogin = () => {
    const confirmed = window.confirm(
      'You are continuing without logging in. Features like personalized recommendations, saving playlists, and ratings will not be available. Do you want to continue?'
    );
    if (confirmed) {
      enterGuestMode();
      navigate('/');
    }
  };

  return (
    <div className="login-page container">
      <div className="login-card">
        <h2>{mode === 'login' ? 'Sign In' : 'Create Account'}</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Username
            <input value={username} onChange={(e) => setUsername(e.target.value)} />
          </label>
          <label>
            Password
            <div className="password-input-container">
              <input 
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
              />
              <button 
                type="button" 
                className="password-toggle" 
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </label>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="btn btn-primary">{mode === 'login' ? 'Login' : 'Register'}</button>
        </form>
        <button className="btn btn-link" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
          {mode === 'login' ? 'Create a new account' : 'Already have an account? Login'}
        </button>
        <button className="btn btn-secondary" onClick={handleSkipLogin}>
          Continue as Guest
        </button>
      </div>
    </div>
  );
}
