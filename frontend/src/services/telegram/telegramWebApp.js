const WEB_APP_URL = 'https://cinematch-kappa.vercel.app'

class TelegramWebApp {
  constructor() {
    if (!window.Telegram?.WebApp) {
      console.warn('Telegram WebApp is not available. Running in fallback mode.');
      return;
    }
    this.webapp = window.Telegram.WebApp;
    this.init();
  }

  init() {
    this.webapp.ready();
    this.setupTheme();
    this.webapp.expand();
    this.setupBackButton();
  }

  setupTheme() {
    document.documentElement.style.setProperty(
      '--tg-theme-bg-color', 
      this.webapp.themeParams.bg_color
    );
    document.documentElement.style.setProperty(
      '--tg-theme-text-color', 
      this.webapp.themeParams.text_color
    );
    document.documentElement.style.setProperty(
      '--tg-theme-button-color', 
      this.webapp.themeParams.button_color
    );
  }

  setupBackButton() {
    this.webapp.BackButton.onClick(() => {
      window.history.back();
    });
  }

  showMainButton(text, onClick) {
    this.webapp.MainButton.text = text;
    this.webapp.MainButton.offClick(); // Очищаем предыдущие обработчики
    this.webapp.MainButton.onClick(onClick);
    this.webapp.MainButton.show();
  }

  hideMainButton() {
    this.webapp.MainButton.offClick(); // Очищаем обработчики
    this.webapp.MainButton.hide();
  }

  sendDataToBot(data) {
    if (!data || typeof data !== 'object') {
      console.error('Invalid data format');
      return;
    }
    this.webapp.sendData(JSON.stringify(data));
  }

  close() {
    this.saveState();
    this.webapp.close();
  }

  saveState() {
    // Логика сохранения состояния
    console.log('State saved before closing');
  }
}

export const telegram = new TelegramWebApp();
