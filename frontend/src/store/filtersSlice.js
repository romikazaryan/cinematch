import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  genre: '',
  yearFrom: '',
  yearTo: '',
  rating: 0
};

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      return { ...state, ...action.payload };
    }
  }
});

export const { setFilters } = filtersSlice.actions;
export default filtersSlice.reducer;
