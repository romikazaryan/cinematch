// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App.jsx'
import './index.css'

// Добавляем информацию для отладки
console.log('main.jsx executing');
console.log('React version:', React.version);
console.log('Document ready:', !!document.getElementById('root'));

// Проверяем доступность Telegram WebApp
if (window.Telegram) {
  console.log('Telegram object found in window');
  if (window.Telegram.WebApp) {
    console.log('WebApp object found in Telegram');
    console.log('WebApp version:', window.Telegram.WebApp.version);
  }
}

// Рендерим приложение
try {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log('App rendered successfully');
} catch (error) {
  console.error('Error rendering app:', error);
}
