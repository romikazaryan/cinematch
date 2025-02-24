import React, { useState } from 'react';
import SearchBar from "@/components/search/SearchBar";
import MovieList from "@/components/movies/MovieList";
import { useMovieSearch } from "@/hooks/useMovieSearch";
import { useTelegram } from "@/hooks/useTelegram";
import { Home, Search, SlidersHorizontal, Heart } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useMovieCategories } from '@/hooks/useMovieCategories';
import MovieRow from '@/components/movies/MovieRow/MovieRow';
import { FilterPanel } from '@/components/filters/FilterPanel/FilterPanel';

const SearchPage = () => {
  const { sendToBot, colorScheme } = useTelegram();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('home');
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

  const renderContent = () => {
    switch(activeTab) {
      case 'home':
        return (
          <div className="pt-4 pb-20">
            <MovieRow
              title="Популярное"
              movies={popularMovies.items}
              loading={popularMovies.loading}
              error={popularMovies.error}
              onSeeAll={() => {}}
              onMovieSelect={handleMovieSelect}
            />
            <MovieRow
              title="Сейчас в кино"
              movies={nowPlayingMovies.items}
              loading={nowPlayingMovies.loading}
              error={nowPlayingMovies.error}
              onSeeAll={() => {}}
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
          </div>
        );
      case 'search':
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
      case 'filters':
        return (
          <div className="p-4">
            <FilterPanel />
          </div>
        );
      case 'favorites':
        return (
          <div className="p-4">
            <h1 className="text-xl font-semibold mb-4">Избранное</h1>
            <p className="text-gray-500">Здесь будут ваши избранные фильмы</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`flex flex-col min-h-screen ${colorScheme === 'dark' ? 'dark bg-gray-900 text-white' : 'bg-white text-black'}`}>
      {/* Основной контент */}
      <div className="flex-1 overflow-auto pb-16">
        {renderContent()}
      </div>
      
      {/* Нижняя навигация */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-10">
        <div className="flex justify-around h-16">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center justify-center w-full space-y-1 ${activeTab === 'home' ? 'text-blue-500' : 'text-gray-500'}`}
          >
            <Home size={24} />
            <span className="text-xs">Главная</span>
          </button>
          
          <button
            onClick={() => setActiveTab('search')}
            className={`flex flex-col items-center justify-center w-full space-y-1 ${activeTab === 'search' ? 'text-blue-500' : 'text-gray-500'}`}
          >
            <Search size={24} />
            <span className="text-xs">Поиск</span>
          </button>
          
          <button
            onClick={() => setActiveTab('filters')}
            className={`flex flex-col items-center justify-center w-full space-y-1 ${activeTab === 'filters' ? 'text-blue-500' : 'text-gray-500'}`}
          >
            <SlidersHorizontal size={24} />
            <span className="text-xs">Фильтры</span>
          </button>
          
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex flex-col items-center justify-center w-full space-y-1 ${activeTab === 'favorites' ? 'text-blue-500' : 'text-gray-500'}`}
          >
            <Heart size={24} />
            <span className="text-xs">Избранное</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
