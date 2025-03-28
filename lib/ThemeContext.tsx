'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Проверяем сначала localStorage, затем системные настройки
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    // Загрузка темы из localStorage при инициализации
    const savedTheme = localStorage.getItem('theme') as Theme;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (prefersDark) {
      setTheme('dark');
    }
  }, []);

  useEffect(() => {
    // Применяем тему к документу
    const html = document.documentElement;
    
    // Удаляем предыдущие классы темы
    html.classList.remove('light-theme', 'dark-theme', 'dark');
    
    // Добавляем текущий класс темы для собственных стилей и Tailwind
    html.classList.add(`${theme}-theme`);
    
    // Добавляем класс 'dark' для Tailwind если тема темная
    if (theme === 'dark') {
      html.classList.add('dark');
    }
    
    // Сохраняем в localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Функция для переключения темы
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Хук для использования темы в компонентах
export function useTheme() {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
} 