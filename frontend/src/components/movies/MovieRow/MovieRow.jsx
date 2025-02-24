// src/components/movies/MovieRow/MovieRow.jsx
import React from 'react';
import MovieCard from '@/components/movies/MovieCard/MovieCard';
import { ChevronRight } from 'lucide-react';

const MovieRow = ({ 
  title, 
  movies = [], 
  loading, 
  error, 
  onSeeAll, 
  onMovieSelect 
}) => {
  if (loading) {
    return (
      <div className="mb-6">
        <div className="flex justify-between items-center px-4 mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        <div className="flex justify-center p-4">
          <span className="animate-spin">🔄</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-6">
        <div className="flex justify-between items-center px-4 mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        <div className="text-red-500 p-4">
          Произошла ошибка при загрузке данных
        </div>
      </div>
    );
  }

  if (!movies.length) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center px-4 mb-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        <button 
          onClick={onSeeAll}
          className="flex items-center text-blue-500 text-sm group"
        >
          <span className="group-hover:underline">Все</span>
          <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>
      
      <div className="relative">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-3 px-4 pb-4">
            {movies.map(movie => (
              <div key={movie.id} className="flex-none w-32">
                <MovieCard
                  movie={movie}
                  onClick={() => onMovieSelect(movie)}
                  compact
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieRow;
