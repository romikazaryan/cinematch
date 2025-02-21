// src/store/store.js
import { configureStore } from '@reduxjs/toolkit';
import moviesReducer from './moviesSlice';
import filtersReducer from './filtersSlice';

export const store = configureStore({
  reducer: {
    movies: moviesReducer,
    filters: filtersReducer,
  },
});
