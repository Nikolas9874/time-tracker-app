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
        // Сначала пробуем загрузить из localStorage
        const savedToken = localStorage.getItem('auth_token');
        console.log('Инициализация auth: токен из localStorage:', savedToken ? 'Присутствует' : 'Отсутствует');
        
        if (savedToken) {
          try {
            // Получаем информацию о пользователе через API
            const response = await fetch('/api/auth/me', {
              headers: {
                'Authorization': `Bearer ${savedToken}`
              }
            });
            
            if (response.ok) {
              const data = await response.json();
              console.log('Пользователь найден:', data.user.username);
              setUser(data.user);
              setToken(savedToken);
            } else {
              console.log('Токен недействителен, удаляем его');
              localStorage.removeItem('auth_token');
              removeCookie('auth_token');
            }
          } catch (error) {
            console.error('Ошибка при проверке токена:', error);
            localStorage.removeItem('auth_token');
            removeCookie('auth_token');
          }
        } else {
          // Если нет в localStorage, пробуем из cookie
          const cookieToken = getCookie('auth_token');
          console.log('Токен из cookies:', cookieToken ? 'Присутствует' : 'Отсутствует');
          
          if (cookieToken) {
            try {
              // Сохраняем в localStorage
              localStorage.setItem('auth_token', cookieToken);
              
              // Получаем информацию о пользователе
              const response = await fetch('/api/auth/me', {
                headers: {
                  'Authorization': `Bearer ${cookieToken}`
                }
              });
              
              if (response.ok) {
                const data = await response.json();
                console.log('Пользователь найден:', data.user.username);
                setUser(data.user);
                setToken(cookieToken);
              } else {
                console.log('Токен из cookie недействителен, удаляем его');
                localStorage.removeItem('auth_token');
                removeCookie('auth_token');
              }
            } catch (error) {
              console.error('Ошибка при проверке токена из cookie:', error);
              localStorage.removeItem('auth_token');
              removeCookie('auth_token');
            }
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
      
      // Сохраняем токен в localStorage и куки
      localStorage.setItem('auth_token', data.token);
      setCookie('auth_token', data.token);
      
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
      
      // Удаляем токен и пользователя из localStorage и куки
      localStorage.removeItem('auth_token');
      removeCookie('auth_token');
      
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

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 