// src/app/App.jsx
import React, { useState, useEffect } from 'react';

function App() {
  const [page, setPage] = useState('home');
  const [debugInfo, setDebugInfo] = useState({});
  
  // Эта функция будет вызываться при монтировании компонента
  useEffect(() => {
    console.log('App mounted');
    setDebugInfo({
      appMounted: true,
      telegramAvailable: !!window.Telegram,
      webAppAvailable: !!(window.Telegram && window.Telegram.WebApp),
      windowSize: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    });
    
    // Если доступен Telegram WebApp, инициализируем его
    if (window.Telegram && window.Telegram.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
      
      setDebugInfo(prev => ({
        ...prev,
        webAppInitialized: true,
        colorScheme: window.Telegram.WebApp.colorScheme
      }));
    }
  }, []);
  
  // Функция для переключения между страницами
  const changePage = (newPage) => {
    console.log('Changing page to:', newPage);
    setPage(newPage);
  };
  
  // Содержимое для разных страниц
  const renderPageContent = () => {
    switch (page) {
      case 'home':
        return (
          <div className="p-4">
            <h1 className="text-xl font-bold mb-4">Главная страница</h1>
            <p className="mb-4">Это тестовая главная страница.</p>
            <button 
              className="bg-blue-500 text-white px-4 py-2 rounded"
              onClick={() => console.log('Button clicked')}
            >
              Тестовая кнопка
            </button>
          </div>
        );
      case 'search':
        return (
          <div className="p-4">
            <h1 className="text-xl font-bold mb-4">Поиск фильмов</h1>
            <input 
              type="text" 
              placeholder="Поиск фильмов и сериалов..." 
              className="w-full px-4 py-2 border rounded"
            />
          </div>
        );
      case 'favorites':
        return (
          <div className="p-4">
            <h1 className="text-xl font-bold mb-4">Избранное</h1>
            <p>Здесь будут ваши избранные фильмы.</p>
          </div>
        );
      default:
        return <div>Неизвестная страница</div>;
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Основное содержимое */}
      <main className="flex-1 pb-20">
        {renderPageContent()}
        
        {/* Отладочная информация */}
        <div className="p-4 mt-8 border-t text-xs">
          <h3 className="font-bold">Отладочная информация:</h3>
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      </main>
      
      {/* Нижняя навигация */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="flex justify-around items-center h-16">
          <button
            onClick={() => changePage('home')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1
              ${page === 'home' ? 'text-blue-500' : 'text-gray-500'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h2a1 1 0 001-1v-7m-6 0l2-2m0 0l2 2m-2-2v10" />
            </svg>
            <span className="text-xs">Главная</span>
          </button>
          
          <button
            onClick={() => changePage('search')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1
              ${page === 'search' ? 'text-blue-500' : 'text-gray-500'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-xs">Поиск</span>
          </button>
          
          <button
            onClick={() => changePage('favorites')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1
              ${page === 'favorites' ? 'text-blue-500' : 'text-gray-500'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span className="text-xs">Избранное</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

export default App;
