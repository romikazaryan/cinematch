// Обновленный src/app/App.jsx с дополнительной отладкой
import React, { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { store } from "@/store/store";
import NavigationLayout from "@/components/layout/NavigationLayout";
import HomePage from "@/pages/HomePage";
import SearchPage from "@/pages/SearchPage";
import FilterPage from "@/pages/FilterPage";
import FavoritesPage from "@/pages/FavoritesPage";
import { useTelegram } from "@/hooks/useTelegram";

// Добавляем это для отладки - проверка загрузки компонентов
console.log("App.jsx is loading");
console.log("NavigationLayout imported:", typeof NavigationLayout);
console.log("HomePage imported:", typeof HomePage);
console.log("SearchPage imported:", typeof SearchPage);

function AppContent() {
  const { colorScheme, isWebAppAvailable, tg } = useTelegram();
  // Принудительно устанавливаем домашнюю страницу
  const [currentPage, setCurrentPage] = useState('home');
  
  useEffect(() => {
    // Логируем что рендерится и какие компоненты доступны
    console.log("AppContent rendered, current page:", currentPage);
    console.log("Telegram availability:", isWebAppAvailable);
    
    if (isWebAppAvailable) {
      tg.ready();
    }
  }, [currentPage, isWebAppAvailable]);

  const navigateTo = (page) => {
    console.log("Navigating to:", page);
    setCurrentPage(typeof page === 'object' ? page.name : page);
  };

  const renderContent = () => {
    console.log("Rendering content for page:", currentPage);
    
    // Временно отображаем информацию для отладки
    const debugInfo = (
      <div className="fixed top-0 right-0 bg-black bg-opacity-70 text-white p-2 text-xs z-50">
        Page: {currentPage}
      </div>
    );
    
    // Всегда отображаем NavigationLayout и текущую страницу
    // Временно принудительно отображаем все страницы для отладки
    return (
      <>
        {debugInfo}
        {currentPage === 'home' && <HomePage onNavigate={navigateTo} />}
        {currentPage === 'search' && <SearchPage />}
        {currentPage === 'filters' && <FilterPage />}
        {currentPage === 'favorites' && <FavoritesPage />}
      </>
    );
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
  console.log("Rendering App component");
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;
