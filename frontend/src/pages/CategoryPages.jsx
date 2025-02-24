// src/pages/CategoryPage.jsx
import React, { useState, useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCategoryMovies } from '@/store/moviesSlice';
import MovieCard from "@/components/movies/MovieCard/MovieCard";
import { useTelegram } from '@/hooks/useTelegram';

const categoryTitles = {
  popular: 'Популярные фильмы',
  nowPlaying: 'Сейчас в кино',
  topRated: 'Лучшие по рейтингу',
  upcoming: 'Скоро в кино'
};

const CategoryPage = ({ category, onBack }) => {
  const dispatch = useDispatch();
  const { sendToBot } = useTelegram();
  const { 
    items: movies, 
    loading, 
    error, 
    currentPage, 
    totalPages 
  } = useSelector(state => state.movies.categoryPage);

  useEffect(() => {
    // Загружаем фильмы при монтировании и смене категории
    dispatch(fetchCategoryMovies({ category, page: 1 }));
  }, [category, dispatch]);

  const handlePageChange = (page) => {
    dispatch(fetchCategoryMovies({ category, page }));
  };

  const handleMovieSelect = (movie) => {
    sendToBot({
      type: 'MOVIE_SELECTED',
      payload: {
        id: movie.id,
        title: movie.title,
        year: new Date(movie.release_date).getFullYear(),
        rating: movie.vote_average,
        posterPath: movie.poster_path,
        overview: movie.overview
      }
    });
  };

  // Компонент пагинации
  const Pagination = () => (
    <div className="flex justify-center gap-2 mt-6">
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="px-4 py-2 rounded-lg bg-gray-100 disabled:opacity-50 dark:bg-gray-700 dark:text-white"
      >
        Предыдущая
      </button>
      
      <div className="flex gap-2">
        {[...Array(Math.min(5, totalPages))].map((_, i) => {
          let pageNum;
          if (totalPages <= 5) {
            pageNum = i + 1;
          } else {
            const middle = Math.min(Math.max(currentPage, 3), totalPages - 2);
            pageNum = middle - 2 + i;
          }
          
          return (
            <button
              key={pageNum}
              onClick={() => handlePageChange(pageNum)}
              className={`px-4 py-2 rounded-lg ${
                currentPage === pageNum 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 dark:text-white'
              }`}
            >
              {pageNum}
            </button>
          );
        })}
      </div>
      
      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="px-4 py-2 rounded-lg bg-gray-100 disabled:opacity-50 dark:bg-gray-700 dark:text-white"
      >
        Следующая
      </button>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen">
      {/* Шапка */}
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow-sm">
        <div className="flex items-center px-4 h-14">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold ml-2">
            {categoryTitles[category] || 'Категория'}
          </h1>
        </div>
      </header>

      {/* Основной контент */}
      <main className="flex-1 p-4">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={() => handlePageChange(currentPage)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Повторить попытку
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {movies.map(movie => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onClick={() => handleMovieSelect(movie)}
                />
              ))}
            </div>
            
            {totalPages > 1 && (
              <div className="mt-6 mb-20">
                <Pagination />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default CategoryPage;
