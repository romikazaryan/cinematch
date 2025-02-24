import React, { useState } from 'react';
import { Home, Search, SlidersHorizontal, Heart } from 'lucide-react';

const NavigationLayout = ({ onNavigate, children }) => {
  const [activeTab, setActiveTab] = useState('home');
  
  const handleTabChange = (tab) => {
    setActiveTab(tab);
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

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 pb-16">
        {children}
      </main>
      
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="flex justify-around items-center h-16">
          {navItems.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => handleTabChange(id)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1
                ${activeTab === id ? 'text-blue-500' : 'text-gray-500'}`}
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
