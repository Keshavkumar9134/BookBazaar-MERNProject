import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home-bg">
      <div className="home-container">
        <header className="home-content">
          <h1>Welcome to <span className="brand">Book Bazaar</span></h1>
          <h4 className="subtitle">A cozy place for every reader</h4>
          <p className="description">
            Explore a curated collection of books and discover your next favorite read.
          </p>
          <div className="auth-links">
            <Link to="/login" className="auth-link">Login</Link>
            <Link to="/register" className="auth-link">Register</Link>
          </div>
        </header>
      </div>
    </div>
  );
};

export default Home;