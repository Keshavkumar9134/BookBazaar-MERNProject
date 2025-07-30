// src/components/AdminFilterBar.js

import React from 'react';
import './FilterBar.css';

const AdminFilterBar = ({ onFilter }) => {
  const handleGenreChange = (e) => {
    onFilter(e.target.value);
  };

  return (
    <div className="filter-bar">
      <label htmlFor="genre">Filter by Genre:</label>
      <select id="genre" onChange={handleGenreChange}>
        <option value="">All</option>
        <option value="Fiction">Fiction</option>
        <option value="Non-fiction">Non-fiction</option>
        <option value="Horror">Horror</option>
        <option value="Romance">Romance</option>
        <option value="Sci-Fi">Sci-Fi</option>
        {/* Add your genres here */}
      </select>
    </div>
  );
};

export default AdminFilterBar;