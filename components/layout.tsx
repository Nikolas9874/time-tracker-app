'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const pathname = usePathname();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Навигационные ссылки
  const navLinks = [
    { href: '/', label: 'Главная' },
    { href: '/timesheet', label: 'Табель' },
    { href: '/employees', label: 'Сотрудники' },
    { href: '/reports', label: 'Отчеты' },
  ];
  
  return (
    <div className="flex flex-col min-h-screen">
      {/* Шапка приложения */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Логотип */}
            <div className="flex items-center">
              <Link href="/" className="flex-shrink-0 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="ml-2 font-bold text-gray-900">Time Tracker</span>
              </Link>
            </div>
            
            {/* Десктопная навигация */}
            {!isMobile && (
              <nav className="hidden md:ml-6 md:flex md:space-x-4">
                {navLinks.map((link) => (
                  <Link 
                    key={link.href} 
                    href={link.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium h-full
                      ${pathname === link.href
                        ? 'border-indigo-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            )}
          </div>
        </div>
        
        {/* Мобильная навигация */}
        {isMobile && (
          <div className="border-t border-gray-200 pt-1 pb-1 overflow-x-auto no-scrollbar">
            <div className="flex space-x-4 px-4">
              {navLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href}
                  className={`whitespace-nowrap flex-shrink-0 inline-flex items-center px-3 py-2 text-xs font-medium rounded-md
                    ${pathname === link.href
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                    }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>
      
      {/* Основное содержимое */}
      <main className="flex-grow">
        <div className={`max-w-7xl mx-auto ${isMobile ? 'px-3 py-3' : 'px-4 sm:px-6 lg:px-8 py-6'}`}>
          {children}
        </div>
      </main>
      
      {/* Подвал */}
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-xs">
          <p>© {new Date().getFullYear()} Система учета рабочего времени</p>
        </div>
      </footer>
    </div>
  );
} 