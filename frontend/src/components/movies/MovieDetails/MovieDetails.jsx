// src/components/movies/MovieDetails/MovieDetails.jsx
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTelegram } from '../../../hooks/useTelegram';

export function MovieDetails() {
  const { id } = useParams();
  const movie = useSelector(state => 
    state.movies.items.find(m => m.id === id)
  );
  const { showMainButton, hideMainButton, sendToBot } = useTelegram();

  useEffect(() => {
    if (movie) {
      showMainButton('Выбрать фильм', () => {
        sendToBot({
          type: 'MOVIE_SELECTED',
          payload: {
            id: movie.id,
            title: movie.title,
            year: movie.year
          }
        });
      });
    }

    return () => hideMainButton();
  }, [movie, showMainButton, hideMainButton, sendToBot]);

  if (!movie) return <div>Loading...</div>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold">{movie.title}</h2>
      {/* Остальной контент */}
    </div>
  );
}
