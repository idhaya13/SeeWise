import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import useStore from '../store/useStore';
import './Login.css';

export default function Login() {
  const { loginUser, registerUser, enterGuestMode } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('login');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (mode === 'login') {
      if (!email || !password) {
        setError('Both fields are required');
        setLoading(false);
        return;
      }
      const response = await loginUser(email, password);
      if (!response.success) {
        setError(response.error || 'Invalid email or password');
      } else {
        navigate('/');
      }
    } else {
      if (!email || !password) {
        setError('Both fields are required');
        setLoading(false);
        return;
      }
      const response = await registerUser(email, password);
      if (!response.success) {
        setError(response.error || 'An error occurred during registration');
      } else {
        navigate('/');
      }
    }
    setLoading(false);
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
            Email Address
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
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
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Processing...' : (mode === 'login' ? 'Login' : 'Register')}
          </button>
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
