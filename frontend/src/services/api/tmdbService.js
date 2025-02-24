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
  },

  async getNowPlaying(page = 1) {
    const response = await fetch(
      `${BASE_URL}/movie/now_playing?api_key=${TMDB_API_KEY}&language=ru&page=${page}`
    );
    return await response.json();
  },

  async getTopRated(page = 1) {
    const response = await fetch(
      `${BASE_URL}/movie/top_rated?api_key=${TMDB_API_KEY}&language=ru&page=${page}`
    );
    return await response.json();
  },

  async getUpcoming(page = 1) {
    const response = await fetch(
      `${BASE_URL}/movie/upcoming?api_key=${TMDB_API_KEY}&language=ru&page=${page}`
    );
    return await response.json();
  }

  async getPopularMovies(page = 1) {
    try {
      const response = await fetch(
        `${BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=ru&page=${page}`
      );
      return await response.json();
    } catch (error) {
      console.error('Error fetching popular movies:', error);
      throw error;
    }
  },

  async getNowPlaying(page = 1) {
    try {
      const response = await fetch(
        `${BASE_URL}/movie/now_playing?api_key=${TMDB_API_KEY}&language=ru&page=${page}`
      );
      return await response.json();
    } catch (error) {
      console.error('Error fetching now playing movies:', error);
      throw error;
    }
  },

  async getTopRated(page = 1) {
    try {
      const response = await fetch(
        `${BASE_URL}/movie/top_rated?api_key=${TMDB_API_KEY}&language=ru&page=${page}`
      );
      return await response.json();
    } catch (error) {
      console.error('Error fetching top rated movies:', error);
      throw error;
    }
  },

  async getUpcoming(page = 1) {
    try {
      const response = await fetch(
        `${BASE_URL}/movie/upcoming?api_key=${TMDB_API_KEY}&language=ru&page=${page}`
      );
      return await response.json();
    } catch (error) {
      console.error('Error fetching upcoming movies:', error);
      throw error;
    }
  }

};
