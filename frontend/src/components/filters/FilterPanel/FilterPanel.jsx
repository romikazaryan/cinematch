// src/components/filters/FilterPanel/FilterPanel.jsx
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setFilters } from '../../../store/filtersSlice';

export function FilterPanel() {
  const dispatch = useDispatch();
  const filters = useSelector(state => state.filters);

  const handleFilterChange = (filterName, value) => {
    dispatch(setFilters({ [filterName]: value }));
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Фильтры</h3>
      
      {/* Жанры */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Жанр</label>
        <select
          value={filters.genre}
          onChange={(e) => handleFilterChange('genre', e.target.value)}
          className="w-full p-2 border rounded-md"
        >
          <option value="">Все жанры</option>
          <option value="action">Боевик</option>
          <option value="comedy">Комедия</option>
          {/* Другие жанры */}
        </select>
      </div>

      {/* Год */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Год</label>
        <div className="flex gap-2">
          <input
            type="number"
            value={filters.yearFrom}
            onChange={(e) => handleFilterChange('yearFrom', e.target.value)}
            placeholder="От"
            className="w-1/2 p-2 border rounded-md"
          />
          <input
            type="number"
            value={filters.yearTo}
            onChange={(e) => handleFilterChange('yearTo', e.target.value)}
            placeholder="До"
            className="w-1/2 p-2 border rounded-md"
          />
        </div>
      </div>

      {/* Рейтинг */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Минимальный рейтинг: {filters.rating}
        </label>
        <input
          type="range"
          min="0"
          max="10"
          step="0.5"
          value={filters.rating}
          onChange={(e) => handleFilterChange('rating', e.target.value)}
          className="w-full"
        />
      </div>
    </div>
  );
}
