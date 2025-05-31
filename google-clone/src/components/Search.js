import * as React from 'react';
import { useState } from 'react';
import './Search.css';

function Search() {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    // TODO: Implement search functionality
    console.log('Searching for:', query);
  };

  return (
    <div className={`search-container ${isFocused ? 'focused' : ''}`}>
      <form onSubmit={handleSearch} className="search-form">
        <span className="material-icons search-icon">search</span>
        <input
          type="text"
          placeholder="Search your photos"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="search-input"
        />
        {query && (
          <button
            type="button"
            className="clear-button"
            onClick={() => setQuery('')}
          >
            <span className="material-icons">close</span>
          </button>
        )}
      </form>
    </div>
  );
}

export default Search; 