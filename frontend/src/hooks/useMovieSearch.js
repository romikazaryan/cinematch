// src/hooks/useMovieSearch.js
import { useState, useEffect } from 'react';
import { useDebounce } from './useDebounce';
import { tmdbService } from '../services/api/tmdbService';

export const useMovieSearch = (query) => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  
  const debouncedQuery = useDebounce(query, 500);

  useEffect(() => {
    const searchMovies = async () => {
      if (!debouncedQuery.trim()) {
        setMovies([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await tmdbService.searchMovies(debouncedQuery, page);
        
        // Фильтруем только фильмы и сериалы
        const filteredResults = data.results.filter(
          item => item.media_type === 'movie' || item.media_type === 'tv'
        );

        setMovies(filteredResults);
        setTotalPages(data.total_pages);
      } catch (err) {
        setError('Произошла ошибка при поиске');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    searchMovies();
  }, [debouncedQuery, page]);

  return { 
    movies, 
    loading, 
    error,
    page,
    totalPages,
    setPage 
  };
};
