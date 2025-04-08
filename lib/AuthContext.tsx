'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from './types';
import { getCookie, setCookie, removeCookie, saveToLocalStorage, loadFromLocalStorage } from './utils';

// Тип для контекста авторизации
interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
}

// Значения по умолчанию
const defaultContextValue: AuthContextType = {
  user: null,
  token: null,
  isLoading: true,
  error: null,
  login: async () => {},
  logout: async () => {},
  changePassword: async () => false
};

// Создаем контекст
const AuthContext = createContext<AuthContextType>(defaultContextValue);

// Кастомный хук для использования контекста авторизации
export const useAuth = () => useContext(AuthContext);

// Провайдер контекста авторизации
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Загрузка текущего пользователя при инициализации
  useEffect(() => {
    const initAuth = async () => {
      try {
        setIsLoading(true);
        let authToken = null;
        
        // Получаем токен из cookie
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
          const [name, value] = cookie.trim().split('=');
          if (name === 'auth_token' && value) {
            authToken = value;
            console.log('Инициализация auth: токен из cookie найден');
            break;
          }
        }
        
        // Если токен не найден в cookie, пробуем localStorage 
        if (!authToken) {
          authToken = localStorage.getItem('auth_token');
          console.log('Инициализация auth: токен из localStorage:', authToken ? 'Присутствует' : 'Отсутствует');
          
          // Если нашли в localStorage, но нет в cookie, добавляем в cookie
          if (authToken) {
            const expiresDate = new Date();
            expiresDate.setDate(expiresDate.getDate() + 7);
            document.cookie = `auth_token=${authToken}; expires=${expiresDate.toUTCString()}; path=/; SameSite=Strict`;
            console.log('Токен из localStorage добавлен в cookie');
          }
        }
        
        // Если токен найден, проверяем его валидность
        if (authToken) {
          try {
            // Получаем информацию о пользователе через API
            const response = await fetch('/api/auth/me', {
              headers: {
                'Authorization': `Bearer ${authToken}`
              }
            });
            
            if (response.ok) {
              const data = await response.json();
              console.log('Пользователь найден:', data.user.username);
              setUser(data.user);
              setToken(authToken);
            } else {
              console.log('Токен недействителен, удаляем его');
              localStorage.removeItem('auth_token');
              document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict';
            }
          } catch (error) {
            console.error('Ошибка при проверке токена:', error);
            localStorage.removeItem('auth_token');
            document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict';
          }
        }
      } catch (error) {
        console.error('Ошибка при инициализации авторизации:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initAuth();
  }, []);

  // Авторизация пользователя
  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Не удалось выполнить вход');
      }
      
      console.log('Успешная авторизация, сохраняем токен');
      
      // Сохраняем токен только в cookie (для доступа из middleware)
      // используем правильный формат и срок действия
      const expiresDate = new Date();
      expiresDate.setDate(expiresDate.getDate() + 7); // 7 дней, как в JWT
      
      document.cookie = `auth_token=${data.token}; expires=${expiresDate.toUTCString()}; path=/; SameSite=Strict`;
      
      // В localStorage сохраняем только для резервного доступа
      localStorage.setItem('auth_token', data.token);
      
      // Устанавливаем данные пользователя и токен
      setUser(data.user);
      setToken(data.token);
    } catch (error: any) {
      setError(error.message || 'Произошла ошибка при входе');
      console.error('Ошибка авторизации:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Выход пользователя
  const logout = async () => {
    try {
      setIsLoading(true);
      
      if (token) {
        await fetch('/api/auth', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
      
      // Удаляем токен из localStorage
      localStorage.removeItem('auth_token');
      
      // Удаляем токен из cookie, устанавливая срок действия в прошлом
      document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict';
      
      // Сбрасываем состояние
      setUser(null);
      setToken(null);
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Изменение пароля пользователя
  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      if (!token || !user) {
        setError('Необходимо войти в систему');
        return false;
      }

      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Не удалось изменить пароль');
        return false;
      }
      
      return true;
    } catch (error: any) {
      setError(error.message || 'Произошла ошибка при изменении пароля');
      console.error('Ошибка при изменении пароля:', error);
      return false;
    }
  };

  // Значение контекста
  const contextValue: AuthContextType = {
    user,
    token,
    isLoading,
    error,
    login,
    logout,
    changePassword
  };

  // Для отладки добавляем вывод данных авторизации в консоль
  useEffect(() => {
    if (user) {
      console.log(`Пользователь авторизован: ${user.username}, роль: ${user.role}`);
      console.log(`Токен ${token ? 'присутствует' : 'отсутствует'}`);
    } else {
      console.log('Пользователь не авторизован');
    }
  }, [user, token]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 