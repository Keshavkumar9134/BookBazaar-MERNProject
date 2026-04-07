import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css';
import { AuthContext } from '../context/AuthContext';

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  const handleMenuToggle = () => setMenuOpen(!menuOpen);
  const handleNavClick = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="main-header">
      <div className="logo" onClick={() => handleNavClick('/home1')}>
        <img src="/icon.png" alt="BookBazaar logo" className="logo-image" />
        <span className="logo-text">BookBazaar</span>
      </div>
      <nav className={`nav-links ${menuOpen ? 'open' : ''}`}>
        <Link to="/home1" onClick={() => setMenuOpen(false)}>Home</Link>
        <Link to="/shop" onClick={() => setMenuOpen(false)}>Shop</Link>
        <Link to="/cart" onClick={() => setMenuOpen(false)}>Cart</Link>
        <Link to="/order-history" onClick={() => setMenuOpen(false)}>Orders</Link>
        {user && (
          <Link to="/chat" onClick={() => setMenuOpen(false)}>Chat</Link>
        )}
        <Link to="/about" onClick={() => setMenuOpen(false)}>About Us</Link>
        {!user && (
          <Link to="/login" onClick={() => setMenuOpen(false)}>Login</Link>
        )}
        {user && (
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        )}
      </nav>
      <div className={`hamburger ${menuOpen ? 'open' : ''}`} onClick={handleMenuToggle}>
        <span />
        <span />
        <span />
      </div>
    </header>
  );
};

export default Header;
