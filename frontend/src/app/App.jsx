// src/app/App.jsx
import React, { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { store } from "@/store/store";
import NavigationLayout from "@/components/layout/NavigationLayout";
import HomePage from "@/pages/HomePage";
import SearchPage from "@/pages/SearchPage";
import FilterPage from "@/pages/FilterPage";
import FavoritesPage from "@/pages/FavoritesPage";
import CategoryPage from "@/pages/CategoryPage";
import { useTelegram } from "@/hooks/useTelegram";

function AppContent() {
  const { colorScheme, isWebAppAvailable, tg } = useTelegram();
  const [currentPage, setCurrentPage] = useState('home');
  const [categoryParams, setCategoryParams] = useState(null);

  useEffect(() => {
    // При монтировании компонента сообщаем Telegram, что приложение готово
    if (isWebAppAvailable) {
      tg.ready();
      
      // Проверяем, есть ли параметры страницы в URL или инициализационных данных
      const urlParams = new URLSearchParams(window.location.search);
      const startParam = urlParams.get('page') || 'home';
      
      // Устанавливаем начальную страницу
      if (startParam && startParam !== currentPage) {
        setCurrentPage(startParam);
      }
    }
  }, [isWebAppAvailable]);

  // Функция для навигации между страницами
  const navigateTo = (page, params = null) => {
    if (typeof page === 'object' && page.name) {
      // Формат { name: 'category', params: { category: 'popular' } }
      setCurrentPage(page.name);
      setCategoryParams(page.params);
    } else {
      // Простой формат 'home', 'search', и т.д.
      setCurrentPage(page);
      setCategoryParams(null);
    }
  };

  const renderContent = () => {
    switch(currentPage) {
      case 'home':
        return <HomePage onNavigate={navigateTo} />;
      case 'search':
        return <SearchPage />;
      case 'filters':
        return <FilterPage />;
      case 'favorites':
        return <FavoritesPage />;
      case 'category':
        return categoryParams ? (
          <CategoryPage 
            category={categoryParams.category} 
            onBack={() => navigateTo('home')} 
          />
        ) : (
          <HomePage onNavigate={navigateTo} />
        );
      default:
        return <HomePage onNavigate={navigateTo} />;
    }
  };

  return (
    <div className={`min-h-screen ${colorScheme === 'dark' ? 'dark bg-gray-900 text-white' : 'bg-white text-black'}`}>
      <NavigationLayout onNavigate={navigateTo} activePage={currentPage}>
        {renderContent()}
      </NavigationLayout>
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
