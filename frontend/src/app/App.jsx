// src/app/App.jsx
import React from 'react';
import { Provider } from 'react-redux';
import { store } from "@/store/store";
import SearchPage from "@/pages/SearchPage";
import { useTelegram } from "@/hooks/useTelegram";

function AppContent() {
  const { colorScheme, tg } = useTelegram();
  
  // Инициализируем Telegram WebApp
  React.useEffect(() => {
    if (tg) {
      tg.ready();
      tg.expand();
    }
  }, [tg]);

  return (
    <div className={`min-h-screen ${colorScheme}`}>
      <SearchPage />
    </div>
  );
}

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;
