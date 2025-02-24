// src/hooks/useTelegram.js
import { useEffect, useState } from 'react';

export function useTelegram() {
  const [colorScheme, setColorScheme] = useState('light');
  
  // Проверяем доступность Telegram WebApp
  const isWebAppAvailable = typeof window !== 'undefined' && 
                             window.Telegram && 
                             window.Telegram.WebApp;
  
  // Получаем объект WebApp, если он доступен
  const tg = isWebAppAvailable ? window.Telegram.WebApp : null;
  
  useEffect(() => {
    if (tg) {
      // Инициализируем WebApp
      tg.ready();
      
      // Устанавливаем цветовую схему
      setColorScheme(tg.colorScheme || 'light');
      
      // Подписываемся на изменение темы
      const handleThemeChange = () => {
        setColorScheme(tg.colorScheme || 'light');
      };
      
      tg.onEvent('themeChanged', handleThemeChange);
      
      return () => {
        tg.offEvent('themeChanged', handleThemeChange);
      };
    } else {
      // Если Telegram WebApp недоступен, используем светлую тему
      setColorScheme('light');
    }
  }, [tg]);
  
  // Функция для отправки данных обратно в бота
  const sendToBot = (data) => {
    if (tg) {
      tg.sendData(JSON.stringify(data));
    } else {
      console.log('Данные для бота:', data);
    }
  };
  
  return {
    tg,
    isWebAppAvailable,
    colorScheme,
    sendToBot
  };
}

export default useTelegram;
