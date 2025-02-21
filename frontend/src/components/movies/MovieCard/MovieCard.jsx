// src/components/movies/MovieCard/MovieCard.jsx
import React from 'react';
import { tmdbService } from '../../../services/api/tmdbService';

const MovieCard = ({ movie, onClick }) => {
  const title = movie.title || movie.name;
  const year = new Date(movie.release_date || movie.first_air_date).getFullYear();
  const posterPath = tmdbService.getImageUrl(movie.poster_path);
  const rating = movie.vote_average?.toFixed(1);

  return (
    <div 
      className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="relative">
        <img 
          src={posterPath} 
          alt={title}
          className="w-full h-48 object-cover rounded-t-lg"
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
      
      <div className="p-4">
        <h3 className="font-semibold text-lg truncate">{title}</h3>
        <p className="text-gray-600">{year || 'Нет даты'}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {movie.genre_ids?.slice(0, 2).map((genreId) => (
            <span 
              key={genreId} 
              className="text-xs bg-gray-100 px-2 py-1 rounded-full"
            >
              {/* Здесь можно добавить преобразование ID жанра в название */}
              {genreId}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
