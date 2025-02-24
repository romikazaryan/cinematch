// src/app/App.jsx
import React from 'react';
import { Provider } from 'react-redux';
import { store } from "@/store/store";
import NavigationLayout from "@/components/layout/NavigationLayout";
import HomePage from "@/pages/HomePage";
import SearchPage from "@/pages/SearchPage";
import FilterPage from "@/pages/FilterPage";
import FavoritesPage from "@/pages/FavoritesPage";
import { useTelegram } from "@/hooks/useTelegram";

function AppContent() {
  const { colorScheme } = useTelegram();
  const [currentPage, setCurrentPage] = React.useState('home');

  const renderContent = () => {
    switch(currentPage) {
      case 'home':
        return <HomePage />;
      case 'search':
        return <SearchPage />;
      case 'filters':
        return <FilterPage />;
      case 'favorites':
        return <FavoritesPage />;
      case 'category':
        return <CategoryPage category={currentPage.params.category} />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className={`min-h-screen ${colorScheme}`}>
      <NavigationLayout onNavigate={setCurrentPage}>
        {renderContent()}
      </NavigationLayout>
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
