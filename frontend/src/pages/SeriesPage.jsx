import React from 'react';
import { useMovieCategories } from '@/hooks/useMovieCategories';
import MovieRow from '@/components/movies/MovieRow/MovieRow';
import { FilterPanel } from '@/components/filters/FilterPanel/FilterPanel';

const SeriesPage = () => {
  const { items: series, loading } = useMovieCategories('series');
  
  return (
    <div className="p-4 pb-20">
      <FilterPanel />
      <MovieRow
        title="Сериалы"
        movies={series}
        loading={loading}
      />
    </div>
  );
};

export default SeriesPage; 