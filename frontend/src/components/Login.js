import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Login.css';

// Import local images
import bg1 from '../components/bgg1.jpg';
import bg2 from '../components/bgg2.jpg';
import bg3 from '../components/bgg3.jpg';
import bg4 from '../components/bgg4.jpg';

const images = [bg1, bg2, bg3, bg4];

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors

    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        username,
        password,
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
      if (err.response?.status === 400) {
        setError('Incorrect username or password.');
      } else {
        setError('An error occurred. Please try again later.');
      }
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

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="username">Username<span className='red'> *</span></label>
            <input
              type="text"
              id="username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password<span className='red'> *</span></label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="remember-me">
            <label>
              <input type="checkbox" /> Remember me
            </label>
          </div>
          <button type="submit" className="login-button">Login</button>
        </form>
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