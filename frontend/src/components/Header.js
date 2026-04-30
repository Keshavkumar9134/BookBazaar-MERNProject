import React, { useState, useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
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
        <img src="/icon.png" alt="BookGenie logo" className="logo-image" />
        <span className="logo-text">BookGenie</span>
      </div>
      <nav className={`nav-links ${menuOpen ? 'open' : ''}`}>
        <NavLink to="/home1" onClick={() => setMenuOpen(false)}>Home</NavLink>
        <NavLink to="/shop" onClick={() => setMenuOpen(false)}>Shop</NavLink>
        <NavLink to="/cart" onClick={() => setMenuOpen(false)}>Cart</NavLink>
        <NavLink to="/order-history" onClick={() => setMenuOpen(false)}>Orders</NavLink>
        {user && (
          <NavLink to="/chat" onClick={() => setMenuOpen(false)}>Contact</NavLink>
        )}
        <NavLink to="/about" onClick={() => setMenuOpen(false)}>About Us</NavLink>
        {!user && (
          <NavLink to="/login" onClick={() => setMenuOpen(false)}>Login</NavLink>
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

