// src/app/Router.jsx
import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import SearchPage from '../pages/SearchPage';

// Создаем простой роутер для отладки
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/search',
    element: <SearchPage />,
  }
]);

export function Router() {
  console.log('Router component rendering');
  return <RouterProvider router={router} />;
}

export default Router;
