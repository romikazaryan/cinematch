// src/hooks/useMovieCategories.js
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMoviesByCategory } from '@/store/moviesSlice';

export const useMovieCategories = (category) => {
  const dispatch = useDispatch();
  const categoryData = useSelector(state => state.movies.categories[category]);

  useEffect(() => {
    if (!categoryData.items.length && !categoryData.loading) {
      dispatch(fetchMoviesByCategory({ category }));
    }
  }, [category, dispatch, categoryData.items.length, categoryData.loading]);

  return categoryData;
};
