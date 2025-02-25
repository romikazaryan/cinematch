import React from 'react';
import { useMovieCategories } from '@/hooks/useMovieCategories';
import MovieRow from '@/components/movies/MovieRow/MovieRow';
import { FilterPanel } from '@/components/filters/FilterPanel/FilterPanel';

const MoviesPage = () => {
  const { items: movies, loading } = useMovieCategories('movies');
  
  return (
    <div className="p-4 pb-20">
      <FilterPanel />
      <MovieRow
        title="Фильмы"
        movies={movies}
        loading={loading}
      />
    </div>
  );
};

export default MoviesPage; 