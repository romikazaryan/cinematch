// src/app/Router.jsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import MovieList from '../components/movies/MovieList';
import MovieDetails from '../components/movies/MovieDetails';
import SearchPage from '../components/pages/SearchPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <SearchPage />,
  },
  {
    path: '/movies',
    element: <MovieList />,
  },
  {
    path: '/movies/:id',
    element: <MovieDetails />,
  },
]);

export function Router() {
  return <RouterProvider router={router} />;
}
