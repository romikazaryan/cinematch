import { createSlice } from '@reduxjs/toolkit';
const initialState = {
  items: [],
  loading: false,
  error: null,
  selectedMovie: null
};

const moviesSlice = createSlice({
  name: 'movies',
  initialState,
  reducers: {
    setMovies: (state, action) => {
      state.items = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setSelectedMovie: (state, action) => {
      state.selectedMovie = action.payload;
    }
  }
});

export const { setMovies, setLoading, setError, setSelectedMovie } = moviesSlice.actions;
export default moviesSlice.reducer;
