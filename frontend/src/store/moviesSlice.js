// src/store/moviesSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { tmdbService } from '@/services/api/tmdbService';

// Async thunks
export const searchMovies = createAsyncThunk(
  'movies/search',
  async ({ query, page = 1 }) => {
    const response = await tmdbService.searchMovies(query, page);
    return response;
  }
);

export const fetchMoviesByCategory = createAsyncThunk(
  'movies/fetchByCategory',
  async ({ category, page = 1 }) => {
    let response;
    switch (category) {
      case 'popular':
        response = await tmdbService.getPopularMovies(page);
        break;
      case 'nowPlaying':
        response = await tmdbService.getNowPlaying(page);
        break;
      case 'topRated':
        response = await tmdbService.getTopRated(page);
        break;
      case 'upcoming':
        response = await tmdbService.getUpcoming(page);
        break;
      default:
        throw new Error('Unknown category');
    }
    return { category, data: response };
  }
);

export const fetchCategoryMovies = createAsyncThunk(
  'movies/fetchCategoryMovies',
  async ({ category, page = 1 }) => {
    let response;
    switch (category) {
      case 'popular':
        response = await tmdbService.getPopularMovies(page);
        break;
      case 'nowPlaying':
        response = await tmdbService.getNowPlaying(page);
        break;
      case 'topRated':
        response = await tmdbService.getTopRated(page);
        break;
      case 'upcoming':
        response = await tmdbService.getUpcoming(page);
        break;
      default:
        throw new Error('Unknown category');
    }
    return response;
  }
);

const moviesSlice = createSlice({
  name: 'movies',
  initialState: {
    // Состояние поиска
    searchResults: {
      items: [],
      loading: false,
      error: null,
      currentPage: 1,
      totalPages: 1
    },
    // Состояние категорий на главной странице
    categories: {
      popular: { items: [], loading: false, error: null },
      nowPlaying: { items: [], loading: false, error: null },
      topRated: { items: [], loading: false, error: null },
      upcoming: { items: [], loading: false, error: null }
    },
    // Состояние страницы категории
    categoryPage: {
      items: [],
      loading: false,
      error: null,
      currentPage: 1,
      totalPages: 1,
      currentCategory: null
    }
  },
  reducers: {
    clearSearch: (state) => {
      state.searchResults = {
        items: [],
        loading: false,
        error: null,
        currentPage: 1,
        totalPages: 1
      };
    },
    clearCategoryPage: (state) => {
      state.categoryPage = {
        items: [],
        loading: false,
        error: null,
        currentPage: 1,
        totalPages: 1,
        currentCategory: null
      };
    }
  },
  extraReducers: (builder) => {
    // Search movies reducers
    builder
      .addCase(searchMovies.pending, (state) => {
        state.searchResults.loading = true;
        state.searchResults.error = null;
      })
      .addCase(searchMovies.fulfilled, (state, action) => {
        state.searchResults.items = action.payload.results;
        state.searchResults.currentPage = action.meta.arg.page;
        state.searchResults.totalPages = action.payload.total_pages;
        state.searchResults.loading = false;
      })
      .addCase(searchMovies.rejected, (state, action) => {
        state.searchResults.loading = false;
        state.searchResults.error = action.error.message;
      })

    // Fetch category movies for homepage
    builder
      .addCase(fetchMoviesByCategory.pending, (state, action) => {
        const { category } = action.meta.arg;
        state.categories[category].loading = true;
        state.categories[category].error = null;
      })
      .addCase(fetchMoviesByCategory.fulfilled, (state, action) => {
        const { category, data } = action.payload;
        state.categories[category].items = data.results;
        state.categories[category].loading = false;
      })
      .addCase(fetchMoviesByCategory.rejected, (state, action) => {
        const { category } = action.meta.arg;
        state.categories[category].loading = false;
        state.categories[category].error = action.error.message;
      })

    // Fetch category movies for category page
    builder
      .addCase(fetchCategoryMovies.pending, (state) => {
        state.categoryPage.loading = true;
        state.categoryPage.error = null;
      })
      .addCase(fetchCategoryMovies.fulfilled, (state, action) => {
        state.categoryPage.items = action.payload.results;
        state.categoryPage.currentPage = action.meta.arg.page;
        state.categoryPage.totalPages = action.payload.total_pages;
        state.categoryPage.loading = false;
        state.categoryPage.currentCategory = action.meta.arg.category;
      })
      .addCase(fetchCategoryMovies.rejected, (state, action) => {
        state.categoryPage.loading = false;
        state.categoryPage.error = action.error.message;
      });
  }
});

export const { clearSearch, clearCategoryPage } = moviesSlice.actions;
export default moviesSlice.reducer;
