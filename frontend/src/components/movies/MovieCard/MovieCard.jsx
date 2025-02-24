// src/components/movies/MovieCard/MovieCard.jsx
import React from 'react';
import { tmdbService } from '@/services/api/tmdbService';

const MovieCard = ({ movie, onClick, compact = false }) => {
  const title = movie.title || movie.name;
  const year = new Date(movie.release_date || movie.first_air_date).getFullYear();
  const posterPath = tmdbService.getImageUrl(movie.poster_path, compact ? 'w185' : 'w500');
  const rating = movie.vote_average?.toFixed(1);

  return (
    <div 
      className={`bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer
        ${compact ? '' : 'h-full'}`}
      onClick={onClick}
    >
      <div className="relative">
        <img 
          src={posterPath} 
          alt={title}
          className={`w-full object-cover rounded-t-lg
            ${compact ? 'h-48' : 'h-64'}`}
          onError={(e) => {
            e.target.src = '/placeholder.jpg';
          }}
        />
        {rating && (
          <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded-full text-sm">
            ⭐ {rating}
          </div>
        )}
      </div>
      
      <div className={`p-${compact ? '2' : '4'}`}>
        <h3 className={`font-semibold ${compact ? 'text-sm' : 'text-lg'} truncate`}>
          {title}
        </h3>
        {!compact && (
          <p className="text-gray-600">{year || 'Нет даты'}</p>
        )}
      </div>
    </div>
  );
};

export default MovieCard;
