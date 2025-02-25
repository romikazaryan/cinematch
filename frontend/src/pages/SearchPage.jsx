import React, { useState } from 'react';
import SearchBar from "@/components/search/SearchBar";
import MovieList from "@/components/movies/MovieList";
import { useMovieSearch } from "@/hooks/useMovieSearch";
import { useTelegram } from "@/hooks/useTelegram";
import { useMovieCategories } from '@/hooks/useMovieCategories';
import MovieRow from '@/components/movies/MovieRow/MovieRow';

const SearchPage = () => {
  const { sendToBot, colorScheme } = useTelegram();
  const [searchQuery, setSearchQuery] = useState('');
  const { movies, loading, error, page, totalPages, setPage } = useMovieSearch(searchQuery);
  
  // Для главной страницы
  const popularMovies = useMovieCategories('popular');
  const nowPlayingMovies = useMovieCategories('nowPlaying');
  const topRatedMovies = useMovieCategories('topRated');
  const upcomingMovies = useMovieCategories('upcoming');

  const handleMovieSelect = (movie) => {
    sendToBot({
      type: 'MOVIE_SELECTED',
      payload: {
        id: movie.id,
        title: movie.title || movie.name,
        type: movie.media_type,
        year: new Date(movie.release_date || movie.first_air_date).getFullYear(),
        rating: movie.vote_average,
        poster_path: movie.poster_path,
        genre_ids: movie.genre_ids,
        overview: movie.overview
      }
    });
  };

  return (
    <div className={`flex flex-col min-h-screen ${colorScheme === 'dark' ? 'dark bg-gray-900 text-white' : 'bg-white text-black'}`}>
      <div className="p-4 pb-20">
        <SearchBar 
          value={searchQuery}
          onChange={setSearchQuery}
        />
        
        {searchQuery ? (
          // Показываем результаты поиска
          loading ? (
            <div className="flex justify-center">
              <span className="animate-spin">🔄</span>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center">{error}</div>
          ) : (
            <MovieList 
              movies={movies}
              onMovieSelect={handleMovieSelect}
            />
          )
        ) : (
          // Показываем категории фильмов
          <>
            <MovieRow
              title="Популярное"
              movies={popularMovies.items}
              loading={popularMovies.loading}
              onMovieSelect={handleMovieSelect}
            />
            <MovieRow
              title="Сейчас в кино"
              movies={nowPlayingMovies.items}
              loading={nowPlayingMovies.loading}
              onMovieSelect={handleMovieSelect}
            />
            <MovieRow
              title="Лучшие по рейтингу"
              movies={topRatedMovies.items}
              loading={topRatedMovies.loading}
              error={topRatedMovies.error}
              onSeeAll={() => {}}
              onMovieSelect={handleMovieSelect}
            />
            <MovieRow
              title="Скоро в кино"
              movies={upcomingMovies.items}
              loading={upcomingMovies.loading}
              error={upcomingMovies.error}
              onSeeAll={() => {}}
              onMovieSelect={handleMovieSelect}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
