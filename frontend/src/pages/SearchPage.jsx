// В компоненте SearchPage.jsx
import React, { useState } from 'react';
import SearchBar from "@/components/search/SearchBar";
import MovieList from "@/components/movies/MovieList/MovieList";
import { useMovieSearch } from "@/hooks/useMovieSearch";
import { useTelegram } from "@/hooks/useTelegram";

const SearchPage = () => {
  const { sendToBot } = useTelegram();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('search'); // Добавляем состояние для отслеживания активной вкладки
  const { movies, loading, error, page, totalPages, setPage } = useMovieSearch(searchQuery);

  // Обработчик для выбора фильма
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

  // Рендеринг контента в зависимости от выбранной вкладки
  const renderContent = () => {
    switch(activeTab) {
      case 'search':
        return (
          <>
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
          </>
        );
      case 'home':
        return (
          <div className="p-4">
            <h1 className="text-lg font-bold mb-4">Популярные фильмы</h1>
            {/* Здесь компоненты для главной страницы */}
          </div>
        );
      case 'filters':
        return (
          <div className="p-4">
            <h1 className="text-lg font-bold mb-4">Фильтры</h1>
            {/* Здесь компоненты фильтров */}
          </div>
        );
      case 'favorites':
        return (
          <div className="p-4">
            <h1 className="text-lg font-bold mb-4">Избранное</h1>
            {/* Здесь список избранных фильмов */}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Основной контент */}
      <div className="flex-1 overflow-auto p-4 pb-16">
        {renderContent()}
      </div>
      
      {/* Нижняя навигация */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-around h-16">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center justify-center w-full ${activeTab === 'home' ? 'text-blue-500' : 'text-gray-500'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h2a1 1 0 001-1v-7m-6 0l2-2m0 0l2 2m-2-2v10" />
            </svg>
            <span className="text-xs">Главная</span>
          </button>
          
          <button
            onClick={() => setActiveTab('search')}
            className={`flex flex-col items-center justify-center w-full ${activeTab === 'search' ? 'text-blue-500' : 'text-gray-500'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-xs">Поиск</span>
          </button>
          
          <button
            onClick={() => setActiveTab('filters')}
            className={`flex flex-col items-center justify-center w-full ${activeTab === 'filters' ? 'text-blue-500' : 'text-gray-500'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span className="text-xs">Фильтры</span>
          </button>
          
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex flex-col items-center justify-center w-full ${activeTab === 'favorites' ? 'text-blue-500' : 'text-gray-500'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span className="text-xs">Избранное</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
