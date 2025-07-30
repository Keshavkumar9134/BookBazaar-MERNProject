import React, { useState } from 'react';
import './FilterBar.css';

const FilterBar = ({ onFilter }) => {
  const [genre, setGenre] = useState('');

  const handleFilter = (e) => {
    e.preventDefault();
    onFilter(genre);
  };

  return (
    <form onSubmit={handleFilter} className='filterForm'>
      <input
      className='filterBar'
        type="text"
        placeholder="Filter by genre"
        value={genre}
        onChange={(e) => setGenre(e.target.value)}
      />
      <button className='filterSearch' type="submit">Filter</button>
    </form>
  );
};

export default FilterBar;