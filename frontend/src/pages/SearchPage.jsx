// src/pages/SearchPage.jsx
import React, { useState } from 'react';
import SearchBar from "@/components/search/SearchBar";
import MovieList from "@/components/movies/MovieList";
import { useMovieSearch } from "@/hooks/useMovieSearch";
import { useTelegram } from "@/hooks/useTelegram";

const SearchPage = () => {
  const { sendToBot } = useTelegram();
  const [searchQuery, setSearchQuery] = useState('');
  const { movies, loading, error, page, totalPages, setPage } = useMovieSearch(searchQuery);

  const handleMovieSelect = (movie) => {
    sendToBot({
      type: 'MOVIE_SELECTED',
      payload: {
        id: movie.id,
        title: movie.title || movie.name,
        type: movie.media_type,
        year: new Date(movie.release_date || movie.first_air_date).getFullYear(),
        rating: movie.vote_average
      }
    });
  };

  return (
    <div className="p-4">
      <SearchBar 
        value={searchQuery}
        onChange={setSearchQuery}
      />
      
      {loading ? (
        <div className="flex justify-center">
          <span className="animate-spin">🔄</span>
        </div>
      ) : error ? (
        <div className="text-red-500 text-center">
          {error}
        </div>
      ) : (
        <>
          <MovieList 
            movies={movies}
            onMovieSelect={handleMovieSelect}
          />
          
          {totalPages > 1 && (
            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
              >
                Назад
              </button>
              <span className="px-4 py-2">
                {page} из {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
              >
                Вперед
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SearchPage;
