// src/components/common/Pagination/Pagination.jsx
import React from 'react';

export function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange 
}) {
  return (
    <div className="flex justify-center gap-2 mt-6">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="px-4 py-2 rounded-lg bg-gray-100 disabled:opacity-50"
      >
        Предыдущая
      </button>
      
      {[...Array(totalPages)].map((_, i) => (
        <button
          key={i + 1}
          onClick={() => onPageChange(i + 1)}
          className={`px-4 py-2 rounded-lg ${
            currentPage === i + 1 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100'
          }`}
        >
          {i + 1}
        </button>
      ))}
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="px-4 py-2 rounded-lg bg-gray-100 disabled:opacity-50"
      >
        Следующая
      </button>
    </div>
  );
}
