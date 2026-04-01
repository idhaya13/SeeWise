import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import './Login.css';

export default function Login() {
  const { loginUser, registerUser } = useStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="btn btn-primary">{mode === 'login' ? 'Login' : 'Register'}</button>
        </form>
        <button className="btn btn-link" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
          {mode === 'login' ? 'Create a new account' : 'Already have an account? Login'}
        </button>
      </div>
    </div>
  );
}
