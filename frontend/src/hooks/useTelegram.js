// src/hooks/useTelegram.js
import { useEffect } from 'react';

export function useTelegram() {
  // Проверяем, доступен ли объект Telegram
  const isWebAppAvailable = typeof window !== 'undefined' && 
                           window.Telegram && 
                           window.Telegram.WebApp;
  
  // Если WebApp недоступен, создаем заглушку для тестирования вне Telegram
  const tg = isWebAppAvailable 
    ? window.Telegram.WebApp
    : {
        ready: () => console.log("Mock: WebApp ready called"),
        expand: () => console.log("Mock: WebApp expand called"),
        close: () => console.log("Mock: WebApp close called"),
        sendData: (data) => console.log("Mock data sent:", data),
        MainButton: {
          text: "",
          show: () => console.log("Mock: MainButton show"),
          hide: () => console.log("Mock: MainButton hide"),
          onClick: (cb) => console.log("Mock: MainButton onClick registered"),
          offClick: () => console.log("Mock: MainButton offClick")
        },
        BackButton: {
          show: () => console.log("Mock: BackButton show"),
          hide: () => console.log("Mock: BackButton hide"),
          onClick: (cb) => console.log("Mock: BackButton onClick registered")
        },
        colorScheme: "light",
        themeParams: {
          bg_color: "#ffffff",
          text_color: "#000000",
          button_color: "#40a7e3"
        },
        initDataUnsafe: {
          user: {
            id: 123456789,
            username: "test_user"
          }
        }
      };

  useEffect(() => {
    // Инициализируем WebApp при монтировании компонента
    if (isWebAppAvailable) {
      tg.ready();
      tg.expand();
    }
  }, [isWebAppAvailable]);

  const onClose = () => {
    if (isWebAppAvailable) {
      tg.close();
    } else {
      console.log("Mock: WebApp close called");
    }
  };

  const showMainButton = (text, onClick) => {
    if (isWebAppAvailable) {
      tg.MainButton.text = text;
      tg.MainButton.onClick(onClick);
      tg.MainButton.show();
    } else {
      console.log(`Mock: MainButton show with text "${text}"`);
    }
  };

  const hideMainButton = () => {
    if (isWebAppAvailable) {
      tg.MainButton.hide();
    } else {
      console.log("Mock: MainButton hide");
    }
  };

  const sendToBot = (data) => {
    if (isWebAppAvailable) {
      tg.sendData(JSON.stringify(data));
    } else {
      console.log("Mock data sent to bot:", data);
    }
  };

  return {
    onClose,
    showMainButton,
    hideMainButton,
    tg,
    user: tg.initDataUnsafe?.user,
    colorScheme: tg.colorScheme || 'light',
    sendToBot,
    isWebAppAvailable
  };
}
