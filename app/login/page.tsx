'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  
  const { login, user, error } = useAuth();
  const router = useRouter();
  
  // Перенаправляем на главную страницу, если пользователь уже авторизован
  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);
  
  // Обновляем ошибку из контекста авторизации
  useEffect(() => {
    if (error) {
      setLoginError(error);
    }
  }, [error]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    
    if (!username || !password) {
      setLoginError('Введите логин и пароль');
      return;
    }
    
    try {
      setIsSubmitting(true);
      await login(username, password);
    } catch (error) {
      // Ошибка обрабатывается в контексте авторизации
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Вход в систему</h1>
          <p className="mt-2 text-sm text-gray-600">
            Введите свои учетные данные для доступа к системе учета рабочего времени
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {loginError && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
              {loginError}
            </div>
          )}
          
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Имя пользователя
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Введите имя пользователя"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Пароль
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Введите пароль"
            />
          </div>
          
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Вход...' : 'Войти'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage; 