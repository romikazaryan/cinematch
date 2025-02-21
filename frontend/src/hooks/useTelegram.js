// src/hooks/useTelegram.js
import { useEffect, useCallback } from 'react';
import { telegram } from '../services/telegram/telegramWebApp';

export function useTelegram() {
  useEffect(() => {
    // Подписываемся на события темы
    const handleThemeChange = () => {
      telegram.setupTheme();
    };
    
    telegram.webapp.onEvent('themeChanged', handleThemeChange);
    
    return () => {
      telegram.webapp.offEvent('themeChanged', handleThemeChange);
    };
  }, []);

  const showMainButton = useCallback((text, onClick) => {
    telegram.showMainButton(text, onClick);
  }, []);

  const hideMainButton = useCallback(() => {
    telegram.hideMainButton();
  }, []);

  const sendToBot = useCallback((data) => {
    telegram.sendDataToBot(data);
  }, []);

  return {
    showMainButton,
    hideMainButton,
    sendToBot,
    user: telegram.webapp.initDataUnsafe?.user,
    colorScheme: telegram.webapp.colorScheme,
    themeParams: telegram.webapp.themeParams,
  };
}
