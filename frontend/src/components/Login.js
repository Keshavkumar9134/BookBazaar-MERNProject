import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Login.css';
import { apiUrl } from '../api';

// Import local images
import bg1 from '../components/bgg1.jpg';
import bg2 from '../components/bgg2.jpg';
import bg3 from '../components/bgg3.jpg';
import bg4 from '../components/bgg4.jpg';

const images = [bg1, bg2, bg3, bg4];

const Login = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bgImage, setBgImage] = useState(images[0]);
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // Cycle background images every 5 seconds
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % images.length;
      setBgImage(images[index]);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      setIsSubmitting(true);
      const response = await axios.post(apiUrl('/api/auth/login-otp/request'), {
        email,
      });
      setOtpSent(true);
      setMessage(response.data.message || 'OTP sent to your email.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send OTP.');
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
      const response = await axios.post(apiUrl('/api/auth/login-otp/verify'), {
        email,
        otp,
      });
      const userData = {
        token: response.data.token,
        role: response.data.role,
        id: response.data.id,
      };
      localStorage.setItem('user', JSON.stringify(userData));
      login(response.data);

      if (response.data.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/Home1');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="login-container"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="login-box">
        <h1>Login</h1>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        {message && (
          <div className="success-message">
            {message}
          </div>
        )}

        <form onSubmit={handleRequestOtp}>
          <div className="input-group">
            <label htmlFor="email">Email<span className='red'> *</span></label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="login-button" disabled={isSubmitting}>
            {otpSent ? 'Send OTP Again' : 'Send OTP'}
          </button>
        </form>

        {otpSent && (
          <form onSubmit={handleVerifyOtp}>
            <div className="input-group">
              <label htmlFor="otp">OTP<span className='red'> *</span></label>
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
            <div className="remember-me">
              OTP is sent to your email. If SMTP is not configured, check the backend terminal.
            </div>
            <button type="submit" className="login-button" disabled={isSubmitting}>
              Verify OTP
            </button>
          </form>
        )}

        <div className="login-divider">Use your registered email address to receive a one-time code and sign in.</div>
        <div className="register-link">
          <p>Don't have an account? <a href="/register" className='register-btn'>Register</a></p>
        </div>
      </div>
      <div className="back-button-container">
        <button onClick={() => navigate('/')} className="back-button-login">
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default Login;
