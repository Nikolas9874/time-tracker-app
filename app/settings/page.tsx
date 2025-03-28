'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

const SettingsPage = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [backupInfo, setBackupInfo] = useState<string | null>(null);
  const [isBackupLoading, setIsBackupLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  
  const { user, error, changePassword } = useAuth();
  const router = useRouter();
  
  // Перенаправляем на страницу входа, если пользователь не авторизован
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);
  
  // Обновляем ошибку из контекста авторизации
  useEffect(() => {
    if (error) {
      setFormError(error);
    }
  }, [error]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);
    
    // Проверка заполнения полей
    if (!currentPassword || !newPassword || !confirmPassword) {
      setFormError('Заполните все поля');
      return;
    }
    
    // Проверка совпадения паролей
    if (newPassword !== confirmPassword) {
      setFormError('Новый пароль и подтверждение не совпадают');
      return;
    }
    
    // Проверка длины пароля
    if (newPassword.length < 6) {
      setFormError('Новый пароль должен содержать не менее 6 символов');
      return;
    }
    
    try {
      setIsSubmitting(true);
      const success = await changePassword(currentPassword, newPassword);
      
      if (success) {
        setSuccessMessage('Пароль успешно изменен');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Функция для создания резервной копии данных
  const handleBackupData = async () => {
    try {
      setIsBackupLoading(true);
      setBackupInfo(null);
      setFormError(null);
      
      // Получаем данные сотрудников
      const employeesResponse = await fetch('/api/employees');
      const employees = await employeesResponse.json();
      
      // Получаем данные рабочих дней за последние 3 месяца
      const now = new Date();
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      const dateFrom = threeMonthsAgo.toISOString().split('T')[0];
      const dateTo = now.toISOString().split('T')[0];
      
      const workdaysResponse = await fetch(`/api/workdays?dateFrom=${dateFrom}&dateTo=${dateTo}`);
      const workdays = await workdaysResponse.json();
      
      // Создаем объект с данными для резервной копии
      const backupData = {
        timestamp: new Date().toISOString(),
        employees,
        workdays,
      };
      
      // Создаем Blob и ссылку для скачивания
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Создаем временную ссылку для скачивания файла
      const a = document.createElement('a');
      a.href = url;
      a.download = `time-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      
      // Очищаем ресурсы
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      setBackupInfo(`Резервная копия создана: ${new Date().toLocaleString()}`);
    } catch (err) {
      console.error('Ошибка при создании резервной копии:', err);
      setFormError('Не удалось создать резервную копию данных');
    } finally {
      setIsBackupLoading(false);
    }
  };
  
  // Функция для восстановления данных из резервной копии
  const handleRestoreData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;
      
      setIsDataLoading(true);
      setFormError(null);
      setSuccessMessage(null);
      
      // Читаем файл с резервной копией
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string;
          const backupData = JSON.parse(content);
          
          // Проверяем структуру данных
          if (!backupData.employees || !backupData.workdays) {
            throw new Error('Некорректный формат файла резервной копии');
          }
          
          // Отправляем запрос на обновление данных сотрудников
          const uploadEmployeesResponse = await fetch('/api/employees/restore', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ employees: backupData.employees }),
          });
          
          if (!uploadEmployeesResponse.ok) {
            throw new Error(`Ошибка при восстановлении данных сотрудников: ${uploadEmployeesResponse.status}`);
          }
          
          // Отправляем запрос на обновление данных рабочих дней
          const uploadWorkdaysResponse = await fetch('/api/workdays/restore', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ workdays: backupData.workdays }),
          });
          
          if (!uploadWorkdaysResponse.ok) {
            throw new Error(`Ошибка при восстановлении данных рабочих дней: ${uploadWorkdaysResponse.status}`);
          }
          
          setSuccessMessage(`Данные успешно восстановлены из резервной копии от ${new Date(backupData.timestamp).toLocaleString()}`);
        } catch (err: any) {
          console.error('Ошибка при обработке файла резервной копии:', err);
          setFormError(err.message || 'Не удалось восстановить данные из резервной копии');
        } finally {
          setIsDataLoading(false);
        }
      };
      
      reader.onerror = () => {
        setFormError('Ошибка при чтении файла');
        setIsDataLoading(false);
      };
      
      reader.readAsText(file);
    } catch (err) {
      console.error('Ошибка при восстановлении данных:', err);
      setFormError('Не удалось загрузить файл резервной копии');
      setIsDataLoading(false);
    }
  };
  
  // Функция для обновления данных из API
  const handleUpdateData = async () => {
    try {
      setIsDataLoading(true);
      setFormError(null);
      setSuccessMessage(null);
      
      // Запрос на обновление данных из внешнего API
      const response = await fetch('/api/update/data', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка при обновлении данных: ${response.status}`);
      }
      
      const result = await response.json();
      setSuccessMessage(`Данные успешно обновлены. Добавлено ${result.added || 0} записей, обновлено ${result.updated || 0} записей.`);
    } catch (err: any) {
      console.error('Ошибка при обновлении данных:', err);
      setFormError(err.message || 'Не удалось обновить данные');
    } finally {
      setIsDataLoading(false);
    }
  };
  
  if (!user) {
    return null; // Не отображаем страницу, пока не проверим авторизацию
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Настройки профиля</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Раздел изменения пароля */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Изменение пароля</h2>
          
          <form onSubmit={handleSubmit}>
            {formError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md text-sm">
                {formError}
              </div>
            )}
            
            {successMessage && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-md text-sm">
                {successMessage}
              </div>
            )}
            
            <div className="mb-4">
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Текущий пароль
              </label>
              <input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Введите текущий пароль"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Новый пароль
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Введите новый пароль"
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Подтвердите новый пароль
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Подтвердите новый пароль"
              />
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-600"
            >
              {isSubmitting ? 'Сохранение...' : 'Изменить пароль'}
            </button>
          </form>
        </div>
        
        {/* Раздел управления данными */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Управление данными</h2>
          
          {/* Резервное копирование */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Резервное копирование</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Создайте резервную копию данных и сохраните ее локально для последующего восстановления.
            </p>
            
            {backupInfo && (
              <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-md text-sm">
                {backupInfo}
              </div>
            )}
            
            <button
              onClick={handleBackupData}
              disabled={isBackupLoading}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-green-700 dark:hover:bg-green-600"
            >
              {isBackupLoading ? 'Создание резервной копии...' : 'Создать резервную копию'}
            </button>
          </div>
          
          {/* Восстановление данных */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Восстановление данных</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Восстановите данные из ранее созданной резервной копии.
            </p>
            
            <label className="block w-full py-2 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-center cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600">
              {isDataLoading ? 'Восстановление данных...' : 'Загрузить резервную копию'}
              <input
                type="file"
                accept=".json"
                onChange={handleRestoreData}
                disabled={isDataLoading}
                className="hidden"
              />
            </label>
          </div>
          
          {/* Обновление данных */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Обновление данных</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Обновите данные из внешнего источника или API.
            </p>
            
            <button
              onClick={handleUpdateData}
              disabled={isDataLoading}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-indigo-700 dark:hover:bg-indigo-600"
            >
              {isDataLoading ? 'Обновление данных...' : 'Обновить данные'}
            </button>
          </div>
          
          {/* Обновление приложения из Git */}
          {user && user.role === 'ADMIN' && (
            <div>
              <h3 className="text-lg font-medium mb-2">Обновление приложения</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Обновите приложение из репозитория GitHub.
              </p>
              
              <button
                onClick={async () => {
                  try {
                    setIsDataLoading(true);
                    setFormError(null);
                    setSuccessMessage(null);
                    
                    const response = await fetch('/api/update', {
                      method: 'POST',
                    });
                    
                    if (!response.ok) {
                      throw new Error(`Ошибка при обновлении приложения: ${response.status}`);
                    }
                    
                    const result = await response.json();
                    if (result.success) {
                      setSuccessMessage(result.message);
                    } else {
                      setFormError('Не удалось обновить приложение');
                    }
                  } catch (err: any) {
                    console.error('Ошибка при обновлении приложения:', err);
                    setFormError(err.message || 'Не удалось обновить приложение');
                  } finally {
                    setIsDataLoading(false);
                  }
                }}
                disabled={isDataLoading}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-purple-700 dark:hover:bg-purple-600"
              >
                {isDataLoading ? 'Обновление приложения...' : 'Обновить приложение'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 