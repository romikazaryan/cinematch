import React from 'react';
import MovieCard from "@/components/movies/MovieCard/MovieCard";

const MovieList = ({ movies, onMovieSelect }) => {
  if (!movies.length) {
    return (
      <div className="text-center text-gray-500 mt-8">
        Фильмы не найдены
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {movies.map((movie) => (
        <MovieCard
          key={movie.id}
          movie={movie}
          onClick={() => onMovieSelect(movie)}
        />
      ))}
    </div>
  );
};

export default MovieList;
