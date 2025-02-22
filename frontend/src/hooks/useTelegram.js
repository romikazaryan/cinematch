export function useTelegram() {
  const tg = window.Telegram.WebApp;

  const onClose = () => {
    tg.close();
  };

  const onToggleButton = () => {
    if (tg.MainButton.isVisible) {
      tg.MainButton.hide();
    } else {
      tg.MainButton.show();
    }
  };

  return {
    onClose,
    onToggleButton,
    tg,
    user: tg.initDataUnsafe?.user,
    colorScheme: tg.colorScheme,
    sendToBot: (data) => tg.sendData(JSON.stringify(data))
  };
}
