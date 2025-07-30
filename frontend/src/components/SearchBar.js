import React from 'react';
import './SearchBar.css';

const SearchBar = ({ searchTerm, setSearchTerm, onSearch }) => {

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(searchTerm.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="Search-form">
      <input
        className="Search-input"
        type="text"
        placeholder="Search by title"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <button className="Search-button" type="submit">  Search</button>
    </form>
  );
};

export default SearchBar;