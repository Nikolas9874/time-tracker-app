'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/AuthContext'
import { useState } from 'react'
import ThemeToggle from './ThemeToggle'

const Navbar = () => {
  const pathname = usePathname()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const { theme, toggleTheme } = useTheme()
  const { user, logout, isLoading } = useAuth()
  const [showAccountMenu, setShowAccountMenu] = useState(false)
  
  // Навигационные ссылки
  const navLinks = [
    { href: '/', label: 'Главная' },
    { href: '/timesheet', label: 'Табель' },
    { href: '/employees', label: 'Сотрудники' },
    { href: '/reports', label: 'Отчеты' },
    { href: '/settings', label: 'Настройки' },
    // Страница управления пользователями доступна только администратору
    ...(user && user.role === 'ADMIN' ? [{ href: '/admin/users', label: 'Пользователи' }] : [])
  ]
  
  const toggleAccountMenu = () => {
    setShowAccountMenu(!showAccountMenu)
  }
  
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Логотип */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="ml-2 font-bold text-gray-900 dark:text-white">Time Tracker</span>
            </Link>
          </div>
          
          {/* Десктопная навигация */}
          {!isMobile && (
            <nav className="ml-6 flex items-center space-x-4">
              {navLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium h-16
                    ${pathname === link.href
                      ? 'border-indigo-500 text-gray-900 dark:text-white dark:border-indigo-400'
                      : 'border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 hover:text-gray-700 dark:hover:text-white'
                    }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}
          
          {/* Действия */}
          <div className="flex items-center">
            {/* Переключатель темы */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"
              aria-label={theme === 'dark' ? 'Переключить на светлую тему' : 'Переключить на темную тему'}
            >
              {theme === 'dark' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            
            {/* Профиль пользователя (иконка) */}
            <button
              className="ml-3 p-2 rounded-md text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"
              aria-label="Профиль пользователя"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Мобильная навигация */}
      {isMobile && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-1 pb-1 overflow-x-auto no-scrollbar">
          <div className="flex space-x-4 px-4">
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href}
                className={`whitespace-nowrap flex-shrink-0 inline-flex items-center px-3 py-2 text-xs font-medium rounded-md
                  ${pathname === link.href
                    ? 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300'
                    : 'text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-700 dark:hover:text-white'
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}

export default Navbar 