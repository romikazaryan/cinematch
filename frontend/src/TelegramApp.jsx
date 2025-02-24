// src/TelegramApp.jsx
import React, { useState, useEffect } from 'react';
import './index.css'; // Импортируем стили

// Простой компонент для Telegram WebApp
function TelegramApp() {
  const [page, setPage] = useState('home');
  const [isWebAppReady, setIsWebAppReady] = useState(false);
  
  // Инициализация Telegram WebApp
  useEffect(() => {
    console.log('TelegramApp component mounted');
    
    if (window.Telegram && window.Telegram.WebApp) {
      console.log('Initializing Telegram WebApp');
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
      setIsWebAppReady(true);
    } else {
      console.log('Telegram WebApp is not available');
    }
  }, []);
  
  // Переключение страниц
  const handlePageChange = (newPage) => {
    console.log('Changing page to:', newPage);
    setPage(newPage);
  };
  
  // Рендеринг содержимого страницы
  const renderPageContent = () => {
    switch (page) {
      case 'home':
        return (
          <div className="p-4">
            <h1 className="text-xl font-bold mb-4">Главная страница</h1>
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((item) => (
                <div 
                  key={item} 
                  className="bg-white rounded-lg shadow p-2 h-40 flex items-center justify-center"
                  onClick={() => console.log('Выбран элемент', item)}
                >
                  Фильм {item}
                </div>
              ))}
            </div>
          </div>
        );
      case 'search':
        return (
          <div className="p-4">
            <h1 className="text-xl font-bold mb-4">Поиск</h1>
            <input 
              type="text" 
              placeholder="Поиск фильмов и сериалов..." 
              className="w-full px-4 py-2 border rounded mb-4"
            />
            <p>Введите название фильма для поиска</p>
          </div>
        );
      case 'filters':
        return (
          <div className="p-4">
            <h1 className="text-xl font-bold mb-4">Фильтры</h1>
            <div className="space-y-4">
              <div>
                <label className="block mb-1">Жанр</label>
                <select className="w-full p-2 border rounded">
                  <option>Все жанры</option>
                  <option>Боевик</option>
                  <option>Комедия</option>
                  <option>Драма</option>
                </select>
              </div>
              <div>
                <label className="block mb-1">Год</label>
                <div className="flex gap-2">
                  <input type="number" placeholder="От" className="w-1/2 p-2 border rounded" />
                  <input type="number" placeholder="До" className="w-1/2 p-2 border rounded" />
                </div>
              </div>
            </div>
          </div>
        );
      case 'favorites':
        return (
          <div className="p-4">
            <h1 className="text-xl font-bold mb-4">Избранное</h1>
            <p>Здесь будут отображаться ваши избранные фильмы</p>
          </div>
        );
      default:
        return <div>Неизвестная страница</div>;
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Информация о статусе Telegram WebApp */}
      {!isWebAppReady && (
        <div className="p-2 bg-yellow-100 text-yellow-800 text-xs">
          Telegram WebApp не инициализирован. Некоторые функции могут быть недоступны.
        </div>
      )}
      
      {/* Основное содержимое */}
      <main className="flex-1 pb-16">
        {renderPageContent()}
      </main>
      
      {/* Нижняя навигация */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="flex justify-around items-center h-16">
          <button
            onClick={() => handlePageChange('home')}
            className={`flex flex-col items-center justify-center w-full h-full
              ${page === 'home' ? 'text-blue-500' : 'text-gray-500'}`}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h2a1 1 0 001-1v-7m-6 0l2-2m0 0l2 2m-2-2v10" />
            </svg>
            <span className="text-xs mt-1">Главная</span>
          </button>
          
          <button
            onClick={() => handlePageChange('search')}
            className={`flex flex-col items-center justify-center w-full h-full
              ${page === 'search' ? 'text-blue-500' : 'text-gray-500'}`}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-xs mt-1">Поиск</span>
          </button>
          
          <button
            onClick={() => handlePageChange('filters')}
            className={`flex flex-col items-center justify-center w-full h-full
              ${page === 'filters' ? 'text-blue-500' : 'text-gray-500'}`}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span className="text-xs mt-1">Фильтры</span>
          </button>
          
          <button
            onClick={() => handlePageChange('favorites')}
            className={`flex flex-col items-center justify-center w-full h-full
              ${page === 'favorites' ? 'text-blue-500' : 'text-gray-500'}`}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a
