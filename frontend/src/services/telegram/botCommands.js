// src/services/telegram/botCommands.js
import { telegramWebApp } from './telegramWebApp';

export const botCommands = {
  sendMovieSelection: async (movie) => {
    try {
      telegramWebApp.sendData({
        type: 'MOVIE_SELECTED',
        payload: {
          id: movie.id,
          title: movie.title,
          year: movie.year,
        },
      });
    } catch (error) {
      console.error('Error sending movie selection:', error);
      telegramWebApp.showAlert('Произошла ошибка при выборе фильма');
    }
  },

  showError: (message) => {
    telegramWebApp.showAlert(message);
  },

  confirmAction: async (message) => {
    try {
      const isConfirmed = await telegramWebApp.showConfirm(message);
      return isConfirmed;
    } catch (error) {
      console.error('Error showing confirmation:', error);
      return false;
    }
  },
};
