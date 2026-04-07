// Register.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Register.css';
import { apiUrl } from '../api';

// Import local background images
import bg1 from '../components/bgg1.jpg';
import bg2 from '../components/bgg2.jpg';
import bg3 from '../components/bgg3.jpg';
import bg4 from '../components/bgg4.jpg';

const images = [bg1, bg2, bg3, bg4];

const Register = () => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('user');
  const [adminPassword, setAdminPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [bgImage, setBgImage] = useState(images[0]);
  const navigate = useNavigate();

  // Background image slideshow
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % images.length;
      setBgImage(images[index]);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    if (role === 'admin' && adminPassword !== 'Admin@123') {
      setError('Invalid admin password');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await axios.post(apiUrl('/api/auth/register'), {
        username,
        email,
        password,
        role,
      });
      setOtpSent(true);
      setMessage(response.data.message || 'OTP sent. Please verify your email.');
    } catch (err) {
      console.error('Registration error:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      setIsSubmitting(true);
      const response = await axios.post(apiUrl('/api/auth/verify-otp'), {
        email,
        otp,
      });
      setMessage(response.data.message || 'Email verified successfully.');
      setTimeout(() => navigate('/login'), 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setMessage('');

    try {
      setIsSubmitting(true);
      const response = await axios.post(apiUrl('/api/auth/resend-otp'), { email });
      setMessage(response.data.message || 'A new OTP has been sent.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not resend OTP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="register-container"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="register-box">
        <h1>Register</h1>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="name" className="params">
              Name<span className="red"> *</span>
            </label>
            <input
              type="text"
              id="name"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label htmlFor="username" className="params">
              Username<span className="red"> *</span>
            </label>
            <input
              type="text"
              id="username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label htmlFor="email" className="params">
              Email<span className="red"> *</span>
            </label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="password" className="params">
              Password<span className="red"> *</span>
            </label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label htmlFor="confirmPassword" className="params">
              Confirm Password<span className="red"> *</span>
            </label>
            <input
              type="password"
              id="confirmPassword"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label htmlFor="role">
              Role<span className="red"> *</span>
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {role === 'admin' && (
            <div className="input-group">
              <label htmlFor="adminPassword">
                Admin Password<span className="red"> *</span>
              </label>
              <input
                type="password"
                id="adminPassword"
                placeholder="Enter admin password"
                value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
            />
          </div>
          )}
          {message && <p className="success-message">{message}</p>}
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="register-button" disabled={isSubmitting}>
            {otpSent ? 'Send OTP Again' : 'Register'}
          </button>
        </form>

        {otpSent && (
          <form onSubmit={handleVerifyOtp} className="otp-form">
            <div className="input-group">
              <label htmlFor="otp" className="params">
                OTP<span className="red"> *</span>
              </label>
              <input
                type="text"
                id="otp"
                placeholder="Enter the 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                required
              />
            </div>
            <p className="otp-note">
              Check your inbox for the verification code. If SMTP is not configured yet, the OTP will appear in the backend terminal.
            </p>
            <button type="submit" className="register-button" disabled={isSubmitting}>
              Verify OTP
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={handleResendOtp}
              disabled={isSubmitting}
            >
              Resend OTP
            </button>
          </form>
        )}
        <div className="login-link">
          <p>
            Already have an account? <a href="/login">Login</a>
          </p>
        </div>
      </div>
      <button onClick={() => navigate('/')} className="back-button">
        Back to Home
      </button>
    </div>
  );
};

export default Register;
