import React from 'react';
import { Link } from 'react-router-dom';

function Navigation() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-tg-bg-color border-t border-tg-hint-color">
      <div className="flex justify-around py-2">
        <Link to="/" className="flex flex-col items-center">
          <span>🔍</span>
          <span>Поиск</span>
        </Link>
        <Link to="/movies" className="flex flex-col items-center">
          <span>🎬</span>
          <span>Фильмы</span>
        </Link>
        <Link to="/series" className="flex flex-col items-center">
          <span>📺</span>
          <span>Сериалы</span>
        </Link>
      </div>
    </nav>
  );
}

export default Navigation; 