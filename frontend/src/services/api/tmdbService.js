// src/services/api/tmdbService.js
const TMDB_API_KEY = '854c15015f24286eb442e0484ec6f445';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p';

export const tmdbService = {
  async searchMovies(query, page = 1) {
    try {
      const response = await fetch(
        `${BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&language=ru&query=${query}&page=${page}`
      );
      return await response.json();
    } catch (error) {
      console.error('Error searching movies:', error);
      throw error;
    }
  },

  async getMovieDetails(id, type = 'movie') {
    try {
      const response = await fetch(
        `${BASE_URL}/${type}/${id}?api_key=${TMDB_API_KEY}&language=ru`
      );
      return await response.json();
    } catch (error) {
      console.error('Error getting movie details:', error);
      throw error;
    }
  },

  getImageUrl(path, size = 'w500') {
    if (!path) return '/placeholder.jpg';
    return `${IMG_URL}/${size}${path}`;
  }
};
