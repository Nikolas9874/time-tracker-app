'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/AuthContext'
import { useState } from 'react'

const NavbarNew = () => {
  const pathname = usePathname()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const { theme, toggleTheme } = useTheme()
  const { user, logout, isLoading } = useAuth()
  
  // Навигационные ссылки
  const navLinks = [
    { href: '/', label: 'Главная' },
    { href: '/timesheet', label: 'Табель' },
    { href: '/employees', label: 'Сотрудники' },
    { href: '/reports', label: 'Отчеты' },
    { href: '/tasks', label: 'Задачи' },
    { href: '/settings', label: 'Настройки' },
    // Страница управления пользователями доступна только администратору
    ...(user && user.role === 'ADMIN' ? [{ href: '/admin/users', label: 'Пользователи' }] : [])
  ]
  
  const handleLogout = () => {
    logout()
  }
  
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-12">
          {/* Логотип */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-sm font-bold text-gray-900 dark:text-white">Time Tracker</span>
            </Link>
          </div>
          
          {/* Десктопная навигация */}
          {!isMobile && (
            <nav className="ml-6 flex items-center space-x-3">
              {navLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-xs font-medium h-12
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
            {/* Кнопка выхода */}
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded-md shadow-sm font-medium"
            >
              ВЫХОД
            </button>
          </div>
        </div>
      </div>
      
      {/* Мобильная навигация */}
      {isMobile && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-0.5 pb-0.5 overflow-x-auto no-scrollbar">
          <div className="flex items-center justify-between px-3">
            <div className="flex space-x-3 overflow-x-auto">
              {navLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href}
                  className={`whitespace-nowrap flex-shrink-0 inline-flex items-center px-2 py-1 text-xs font-medium rounded-md
                    ${pathname === link.href
                      ? 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300'
                      : 'text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-700 dark:hover:text-white'
                    }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            
            {/* Мобильная кнопка выхода */}
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 rounded-md shadow-sm ml-2 flex-shrink-0"
            >
              Выход
            </button>
          </div>
        </div>
      )}
    </header>
  )
}

export default NavbarNew 