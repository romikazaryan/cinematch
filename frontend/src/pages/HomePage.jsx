// src/pages/HomePage.jsx
import React from 'react';
import { useDispatch } from 'react-redux';
import MovieRow from '@/components/movies/MovieRow/MovieRow';
import { useMovieCategories } from '@/hooks/useMovieCategories';
import { useTelegram } from '@/hooks/useTelegram';

/**
 * Главная страница приложения, отображающая различные категории фильмов
 * 
 * @param {Object} props
 * @param {Function} props.onNavigate - Функция для навигации между страницами
 */
const HomePage = ({ onNavigate }) => {
  const dispatch = useDispatch();
  const { sendToBot } = useTelegram();

  // Получаем данные для каждой категории фильмов
  const popularMovies = useMovieCategories('popular');
  const nowPlayingMovies = useMovieCategories('nowPlaying');
  const topRatedMovies = useMovieCategories('topRated');
  const upcomingMovies = useMovieCategories('upcoming');

  /**
   * Обработчик выбора фильма
   * Отправляет информацию о выбранном фильме в бот
   */
  const handleMovieSelect = (movie) => {
    sendToBot({
      type: 'MOVIE_SELECTED',
      payload: {
        id: movie.id,
        title: movie.title || movie.name,
        type: movie.media_type,
        year: new Date(movie.release_date || movie.first_air_date).getFullYear(),
        rating: movie.vote_average,
        // Дополнительная информация о фильме
        poster_path: movie.poster_path,
        genre_ids: movie.genre_ids,
        overview: movie.overview
      }
    });
  };

  /**
   * Обработчик перехода к полному списку категории
   */
  const handleSeeAll = (category) => {
    onNavigate({ name: 'category', params: { category } });
  };

  return (
    <div className="pt-4 pb-20">
      {/* Секция популярных фильмов */}
      <MovieRow
        title="Популярное"
        movies={popularMovies.items}
        loading={popularMovies.loading}
        error={popularMovies.error}
        onSeeAll={() => handleSeeAll('popular')}
        onMovieSelect={handleMovieSelect}
      />

      {/* Секция фильмов в кинотеатрах */}
      <MovieRow
        title="Сейчас в кино"
        movies={nowPlayingMovies.items}
        loading={nowPlayingMovies.loading}
        error={nowPlayingMovies.error}
        onSeeAll={() => handleSeeAll('nowPlaying')}
        onMovieSelect={handleMovieSelect}
      />

      {/* Секция фильмов с высоким рейтингом */}
      <MovieRow
        title="Лучшие по рейтингу"
        movies={topRatedMovies.items}
        loading={topRatedMovies.loading}
        error={topRatedMovies.error}
        onSeeAll={() => handleSeeAll('topRated')}
        onMovieSelect={handleMovieSelect}
      />

      {/* Секция ожидаемых фильмов */}
      <MovieRow
        title="Скоро в кино"
        movies={upcomingMovies.items}
        loading={upcomingMovies.loading}
        error={upcomingMovies.error}
        onSeeAll={() => handleSeeAll('upcoming')}
        onMovieSelect={handleMovieSelect}
      />
    </div>
  );
};

export default HomePage;
