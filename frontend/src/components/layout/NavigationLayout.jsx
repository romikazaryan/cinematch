// src/components/layout/NavigationLayout.jsx
import React from 'react';
import { Home, Search, SlidersHorizontal, Heart } from 'lucide-react';
import { useTelegram } from '@/hooks/useTelegram';

const NavigationLayout = ({ onNavigate, activePage = 'home', children }) => {
  const { colorScheme } = useTelegram();
  
  const handleTabChange = (tab) => {
    if (onNavigate) {
      onNavigate(tab);
    }
  };

  const navItems = [
    { id: 'home', icon: Home, label: 'Главная' },
    { id: 'search', icon: Search, label: 'Поиск' },
    { id: 'filters', icon: SlidersHorizontal, label: 'Фильтры' },
    { id: 'favorites', icon: Heart, label: 'Избранное' }
  ];

  // Определяем цвета в зависимости от темы
  const activeColor = colorScheme === 'dark' ? 'text-blue-400' : 'text-blue-500';
  const inactiveColor = colorScheme === 'dark' ? 'text-gray-400' : 'text-gray-500';
  const navBgColor = colorScheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';

  return (
    <div className="flex flex-col min-h-screen relative">
      <main className="flex-1 pb-16">
        {children}
      </main>
      
      <nav className={`fixed bottom-0 left-0 right-0 ${navBgColor} border-t`}>
        <div className="flex justify-around items-center h-16">
          {navItems.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => handleTabChange(id)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1
                ${activePage === id ? activeColor : inactiveColor}`}
            >
              <Icon size={24} />
              <span className="text-xs">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default NavigationLayout;
