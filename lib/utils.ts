import { format, addDays, parseISO, isValid } from 'date-fns'
import { ru } from 'date-fns/locale'
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Утилита для объединения классов tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Форматирование даты в формате YYYY-MM-DD (ISO)
export function formatDateISO(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return format(dateObj, 'yyyy-MM-dd')
}

// Форматирование даты с учетом локали в формате 'dd MMMM yyyy'
export function formatDateLocale(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return format(dateObj, 'dd MMMM yyyy', { locale: ru })
}

// Форматирование дня недели
export function formatWeekday(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return format(dateObj, 'EEEE', { locale: ru })
}

// Форматирование времени в формате HH:mm
export function formatTime(date: Date | string | null): string {
  if (!date) return '--:--'
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj)) return '--:--'
    return format(dateObj, 'HH:mm')
  } catch (error) {
    console.error('Error formatting time:', error)
    return '--:--'
  }
}

// Получение следующего дня
export function getNextDay(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return addDays(dateObj, 1)
}

// Получение предыдущего дня
export function getPreviousDay(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return addDays(dateObj, -1)
}

// Расчет продолжительности рабочего дня
export function calculateDuration(startTime: Date | string | null, endTime: Date | string | null): string {
  if (!startTime || !endTime) return '--:--'
  
  try {
    const start = typeof startTime === 'string' ? new Date(startTime) : startTime
    const end = typeof endTime === 'string' ? new Date(endTime) : endTime
    
    if (!isValid(start) || !isValid(end)) return '--:--'
    
    // Разница в миллисекундах
    const diffMs = end.getTime() - start.getTime()
    
    // Если разница отрицательная, значит endTime раньше startTime
    if (diffMs < 0) return '--:--'
    
    // Конвертация в часы и минуты
    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  } catch (error) {
    console.error('Error calculating duration:', error)
    return '--:--'
  }
}

// Подписка на события изменения данных
const listeners: Set<() => void> = new Set();

// Функция подписки на изменения данных
export function subscribeToDataChanges(callback: () => void): () => void {
  listeners.add(callback);
  
  // Возвращаем функцию отписки
  return () => {
    listeners.delete(callback);
  };
}

// Функция уведомления о изменениях данных
export function notifyDataChanges(): void {
  listeners.forEach(callback => callback());
}

// Функция для сохранения данных в localStorage
export function saveToLocalStorage(key: string, data: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Ошибка сохранения в localStorage: ${error}`);
  }
}

// Функция для чтения данных из localStorage
export function loadFromLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error(`Ошибка чтения из localStorage: ${error}`);
    return defaultValue;
  }
}

// Функция для создания бэкапа данных
export function createDataBackup(): string {
  const data = {
    workDays: loadFromLocalStorage('workDays', []),
    employees: loadFromLocalStorage('employees', []),
    users: loadFromLocalStorage('users', []),
    sessions: loadFromLocalStorage('sessions', [])
  };
  
  // Создаем дату для имени файла
  const date = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
  const filename = `timetracker-backup-${date}.json`;
  
  // Создаем JSON-строку
  const jsonData = JSON.stringify(data, null, 2);
  
  // Создаем загружаемый файл
  const blob = new Blob([jsonData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  // Создаем ссылку для загрузки
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  
  // Эмулируем клик на ссылке
  document.body.appendChild(a);
  a.click();
  
  // Очищаем ресурсы
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
  
  return filename;
}

// Функция для восстановления данных из бэкапа
export function restoreFromBackup(jsonData: string): boolean {
  try {
    const data = JSON.parse(jsonData);
    
    // Проверяем структуру данных
    if (!data || typeof data !== 'object') {
      throw new Error('Неверный формат данных');
    }
    
    // Сохраняем данные в localStorage
    if (data.workDays) saveToLocalStorage('workDays', data.workDays);
    if (data.employees) saveToLocalStorage('employees', data.employees);
    if (data.users) saveToLocalStorage('users', data.users);
    if (data.sessions) saveToLocalStorage('sessions', data.sessions);
    
    // Уведомляем подписчиков об изменениях
    notifyDataChanges();
    
    return true;
  } catch (error) {
    console.error(`Ошибка восстановления данных: ${error}`);
    return false;
  }
}

// Установка cookie
export function setCookie(name: string, value: string, days = 7): void {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value};${expires};path=/`;
}

// Получение cookie
export function getCookie(name: string): string | null {
  const cookieName = `${name}=`;
  const cookies = document.cookie.split(';');
  
  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i].trim();
    if (cookie.indexOf(cookieName) === 0) {
      return cookie.substring(cookieName.length, cookie.length);
    }
  }
  
  return null;
}

// Удаление cookie
export function removeCookie(name: string): void {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
} 