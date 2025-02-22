import React from 'react';

const SearchBar = ({ value, onChange }) => {
  return (
    <div className="w-full max-w-md mx-auto mb-4">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Поиск фильмов и сериалов..."
        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
};

export default SearchBar;
