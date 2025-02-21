// src/services/telegram/telegramWebApp.js
class TelegramWebApp {
  constructor() {
    // Проверяем, запущено ли приложение в Telegram
    if (!window.Telegram.WebApp) {
      throw new Error('Telegram WebApp is not available');
    }
    this.webapp = window.Telegram.WebApp;
    this.init();
  }

  init() {
    // Инициализация приложения
    this.webapp.ready();
    
    // Настраиваем тему
    this.setupTheme();
    
    // Расширяем на всю высоту
    this.webapp.expand();
    
    // Включаем кнопку "Назад" если это не главная страница
    this.setupBackButton();
  }

  setupTheme() {
    // Получаем цветовую схему от Telegram
    document.documentElement.style.setProperty(
      '--tg-theme-bg-color', 
      this.webapp.themeParams.bg_color
    );
    document.documentElement.style.setProperty(
      '--tg-theme-text-color', 
      this.webapp.themeParams.text_color
    );
  }

  setupBackButton() {
    // Настраиваем кнопку "Назад"
    this.webapp.BackButton.onClick(() => {
      // Здесь будет логика навигации
      window.history.back();
    });
  }

  // Методы для работы с главной кнопкой
  showMainButton(text, onClick) {
    this.webapp.MainButton.text = text;
    this.webapp.MainButton.onClick(onClick);
    this.webapp.MainButton.show();
  }

  hideMainButton() {
    this.webapp.MainButton.hide();
  }

  // Метод для отправки данных боту
  sendDataToBot(data) {
    this.webapp.sendData(JSON.stringify(data));
  }

  // Метод для закрытия приложения
  close() {
    this.webapp.close();
  }
}

export const telegram = new TelegramWebApp();
