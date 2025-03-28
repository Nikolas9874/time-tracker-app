'use client';

import { useState, useEffect } from 'react';

/**
 * Хук для отслеживания медиа-запросов, например для определения мобильной версии
 * @param query Медиа-запрос для отслеживания, например '(max-width: 768px)'
 * @returns Булево значение, указывающее, соответствует ли текущий размер экрана запросу
 */
export function useMediaQuery(query: string): boolean {
  // Сначала устанавливаем значение по умолчанию (false на сервере, или результат запроса на клиенте)
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    // Проверяем, что мы на клиенте (браузере)
    if (typeof window !== 'undefined') {
      // Создаем медиа-запрос
      const media = window.matchMedia(query);
      
      // Устанавливаем начальное состояние
      setMatches(media.matches);
      
      // Функция-обработчик для обновления состояния при изменении размера
      const listener = (e: MediaQueryListEvent) => {
        setMatches(e.matches);
      };
      
      // Подписываемся на события изменения медиа-запроса
      media.addEventListener('change', listener);
      
      // Отписываемся при размонтировании компонента
      return () => {
        media.removeEventListener('change', listener);
      };
    }
  }, [query]); // Перезапускаем эффект, если изменился запрос

  return matches;
} 