import React, { useState, useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';

const categoryTitles = {
  popular: 'Популярные фильмы',
  nowPlaying: 'Сейчас в кино',
  topRated: 'Лучшие по рейтингу',
  upcoming: 'Скоро в кино'
};

const TMDB_API_KEY = '854c15015f24286eb442e0484ec6f445';
const BASE_URL = 'https://api.themoviedb.org/3';

const CategoryPage = ({ category, onBack }) => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Функция для загрузки фильмов
  const fetchMovies = async (page) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `${BASE_URL}/movie/${category}?api_key=${TMDB_API_KEY}&language=ru&page=${page}`
      );
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.status_message || 'Произошла ошибка при загрузке фильмов');
      }
      
      setMovies(data.results);
      setTotalPages(Math.min(data.total_pages, 20)); // Ограничиваем до 20 страниц
      setCurrentPage(page);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Загружаем фильмы при монтировании и смене категории
  useEffect(() => {
    fetchMovies(1);
  }, [category]);

  // Функция для получения URL постера
  const getPosterUrl = (path) => {
    if (!path) return '/placeholder.jpg';
    return `https://image.tmdb.org/t/p/w500${path}`;
  };

  // Компонент карточки фильма
  const MovieCard = ({ movie, onClick }) => (
    <div 
      onClick={onClick}
      className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
    >
      <div className="relative">
        <img 
          src={getPosterUrl(movie.poster_path)} 
          alt={movie.title}
          className="w-full h-64 object-cover"
          onError={(e) => {
            e.target.src = '/placeholder.jpg';
          }}
        />
        {movie.vote_average > 0 && (
          <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded-full text-sm">
            ⭐ {movie.vote_average.toFixed(1)}
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-lg truncate">
          {movie.title}
        </h3>
        <p className="text-gray-600">
          {new Date(movie.release_date).getFullYear()}
        </p>
      </div>
    </div>
  );

  // Компонент пагинации
  const Pagination = () => (
    <div className="flex justify-center gap-2 mt-6">
      <button
        onClick={() => fetchMovies(currentPage - 1)}
        disabled={currentPage <= 1}
        className="px-4 py-2 rounded-lg bg-gray-100 disabled:opacity-50"
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
              onClick={() => fetchMovies(pageNum)}
              className={`px-4 py-2 rounded-lg ${
                currentPage === pageNum 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100'
              }`}
            >
              {pageNum}
            </button>
          );
        })}
      </div>
      
      <button
        onClick={() => fetchMovies(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="px-4 py-2 rounded-lg bg-gray-100 disabled:opacity-50"
      >
        Следующая
      </button>
    </div>
  );

  const handleMovieSelect = (movie) => {
    window.Telegram?.WebApp?.sendData(JSON.stringify({
      type: 'MOVIE_SELECTED',
      payload: {
        id: movie.id,
        title: movie.title,
        year: new Date(movie.release_date).getFullYear(),
        rating: movie.vote_average,
        posterPath: movie.poster_path,
        overview: movie.overview
      }
    }));
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Шапка */}
      <header className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="flex items-center px-4 h-14">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold ml-2">
            {categoryTitles[category]}
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
              onClick={() => fetchMovies(currentPage)}
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
