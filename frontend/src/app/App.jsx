// src/app/App.jsx
import React from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { store } from "@/store/store";
import SearchPage from "@/pages/SearchPage";
import MoviesPage from "@/pages/MoviesPage";
import SeriesPage from "@/pages/SeriesPage";
import { useTelegram } from "@/hooks/useTelegram";
import Navigation from "@/components/Navigation";

function AppContent() {
  const { colorScheme, tg } = useTelegram();
  
  // Инициализируем Telegram WebApp
  React.useEffect(() => {
    if (tg) {
      tg.ready();
      tg.expand();
    }
  }, [tg]);

  return (
    <div className={`min-h-screen ${colorScheme}`}>
      <BrowserRouter>
        <Navigation />
        <Routes>
          <Route path="/" element={<SearchPage />} />
          <Route path="/movies" element={<MoviesPage />} />
          <Route path="/series" element={<SeriesPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;
