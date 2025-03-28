'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/AuthContext'
import { useState } from 'react'

const Navbar = () => {
  const pathname = usePathname()
  const { user, logout, isLoading } = useAuth()
  const [showAccountMenu, setShowAccountMenu] = useState(false)
  
  // Пункты навигации зависят от авторизации и роли пользователя
  const navItems = [
    { href: '/timesheet', label: 'Табель' },
    { href: '/employees', label: 'Сотрудники' },
    { href: '/reports', label: 'Отчеты' },
    // Страница управления пользователями доступна только администратору
    ...(user && user.role === 'ADMIN' ? [{ href: '/admin/users', label: 'Пользователи' }] : [])
  ]
  
  const toggleAccountMenu = () => {
    setShowAccountMenu(!showAccountMenu)
  }
  
  return (
    <nav className="bg-white shadow-sm mb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold" style={{color: 'var(--primary-color)'}}>Учет рабочего времени</span>
            </div>
            <div className="hidden sm:ml-10 sm:flex sm:space-x-8">
              {navItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'inline-flex items-center px-3 pt-1 border-b-2 text-sm font-medium h-16',
                    pathname === item.href
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-800'
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          
          {/* Секция авторизации */}
          <div className="flex items-center">
            {isLoading ? (
              <div className="text-sm text-gray-500">Загрузка...</div>
            ) : user ? (
              <div className="relative">
                <button
                  onClick={toggleAccountMenu}
                  className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  <span>{user.name}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
                
                {showAccountMenu && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                    <div className="py-1">
                      <div className="px-4 py-2 text-sm text-gray-700">
                        <div className="font-bold">{user.name}</div>
                        {user.email && <div className="text-gray-500">{user.email}</div>}
                      </div>
                      <hr className="my-1" />
                      {user.role === 'ADMIN' && (
                        <Link
                          href="/admin/backup"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowAccountMenu(false)}
                        >
                          Резервное копирование
                        </Link>
                      )}
                      <Link
                        href="/settings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        onClick={() => setShowAccountMenu(false)}
                      >
                        <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                        Настройки
                      </Link>
                      <button
                        onClick={() => { logout(); setShowAccountMenu(false); }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Выйти
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex space-x-4">
                <Link href="/login" className="text-sm font-medium text-blue-600 hover:text-blue-800">
                  Войти
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Мобильная навигация */}
      <div className="sm:hidden border-t border-gray-200">
        <div className="flex justify-between">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex-1 text-center py-3 text-sm font-medium',
                pathname === item.href
                  ? 'text-blue-600 border-t-2 border-blue-500 -mt-px'
                  : 'text-gray-600 hover:text-gray-800'
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}

export default Navbar 