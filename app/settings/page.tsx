'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

// Интерфейс для коммита
interface Commit {
  hash: string;
  date: string;
  message: string;
  author: string;
}

// Компонент для отображения истории коммитов
const CommitHistory: React.FC<{ onRollback: (hash: string) => void }> = ({ onRollback }) => {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  
  // Загрузка истории коммитов
  const fetchCommits = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Получаем токен из контекста авторизации
      const authToken = token;
      
      // Сохраняем токен в localStorage для использования на других страницах
      if (authToken && typeof window !== 'undefined') {
        localStorage.setItem('auth_token', authToken);
      }
      
      const response = await fetch('/api/update/history', {
        headers: {
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('API маршрут истории коммитов не найден');
        } else if (response.status === 401) {
          setError('Ошибка при загрузке истории коммитов: У вас нет доступа к этому ресурсу. Необходимы права администратора.');
        } else {
          throw new Error(`Ошибка при загрузке истории коммитов: ${response.status}`);
        }
        return;
      }
      
      const data = await response.json();
      
      if (data.success && data.commits) {
        setCommits(data.commits);
      } else {
        setError(data.error || 'Не удалось получить историю коммитов');
      }
    } catch (err: any) {
      setError(err.message || 'Не удалось загрузить историю коммитов');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Загружаем историю коммитов при монтировании компонента
  useEffect(() => {
    fetchCommits();
  }, [token]);
  
  if (isLoading) {
    return <div className="text-center text-gray-600 p-4">Загрузка истории коммитов...</div>;
  }
  
  if (error) {
    return (
      <div className="mt-4 border dark:border-gray-700 rounded-md overflow-hidden">
        <h4 className="text-md font-medium p-3 bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
          История версий
        </h4>
        <div className="p-4 text-center text-red-500">
          {error}
          <div className="mt-2">
            <button 
              onClick={fetchCommits} 
              className="px-3 py-1 text-xs bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-800 dark:text-blue-100 dark:hover:bg-blue-700 rounded-md transition-colors"
            >
              Повторить попытку
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (commits.length === 0) {
    return (
      <div className="mt-4 border dark:border-gray-700 rounded-md overflow-hidden">
        <h4 className="text-md font-medium p-3 bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
          История версий
        </h4>
        <div className="p-4 text-center text-gray-600 dark:text-gray-400">
          История коммитов не найдена
          <div className="mt-2">
            <button 
              onClick={fetchCommits} 
              className="px-3 py-1 text-xs bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-800 dark:text-blue-100 dark:hover:bg-blue-700 rounded-md transition-colors"
            >
              Обновить
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="mt-4 border dark:border-gray-700 rounded-md overflow-hidden">
      <h4 className="text-md font-medium p-3 bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
        История версий
      </h4>
      <div className="max-h-64 overflow-y-auto">
        {commits.map((commit, index) => (
          <div 
            key={commit.hash} 
            className={`p-3 ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-750'} hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex justify-between items-center`}
          >
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{commit.hash.slice(0, 7)}</span>
                <span className="text-sm font-medium">{commit.message}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1 flex items-center space-x-2">
                <span>{commit.author}</span>
                <span>•</span>
                <span>{new Date(commit.date).toLocaleString()}</span>
              </div>
            </div>
            <button
              onClick={() => onRollback(commit.hash)}
              className="text-xs bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-800 dark:text-amber-100 dark:hover:bg-amber-700 px-2 py-1 rounded-md transition-colors"
            >
              Откатиться
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

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
  
  const { user, error: authError, changePassword, token } = useAuth();
  const router = useRouter();
  
  // Перенаправляем на страницу входа, если пользователь не авторизован
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);
  
  // Обновляем ошибку из контекста авторизации
  useEffect(() => {
    if (authError) {
      setFormError(authError);
    }
  }, [authError]);
  
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
      setFormError(err.message || 'Не удалось обновить данные');
    } finally {
      setIsDataLoading(false);
    }
  };
  
  // Добавляем новую функцию для отката к предыдущей версии
  const handleRollback = async (commitHash: string) => {
    if (!window.confirm(`Вы уверены, что хотите откатиться к версии ${commitHash.slice(0, 7)}? Это может привести к потере несохраненных изменений.`)) {
      return;
    }
    
    try {
      setIsDataLoading(true);
      setFormError(null);
      setSuccessMessage(null);
      
      // Получаем токен из контекста или localStorage
      const authToken = token || localStorage.getItem('auth_token');
      
      const response = await fetch('/api/update/rollback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({ commitHash }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Ошибка при откате приложения: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setSuccessMessage(`Приложение успешно откачено к версии ${commitHash.slice(0, 7)}`);
        
        // Предлагаем перезагрузить страницу через 3 секунды
        setTimeout(() => {
          if (window.confirm('Приложение откачено к предыдущей версии. Перезагрузить страницу для применения изменений?')) {
            window.location.reload();
          }
        }, 3000);
      } else {
        setFormError(result.error || 'Не удалось откатить приложение');
      }
    } catch (err: any) {
      setFormError(err.message || 'Не удалось откатить приложение');
    } finally {
      setIsDataLoading(false);
    }
  };
  
  // Функция для обновления истории коммитов
  const fetchCommitHistory = async () => {
    try {
      // Получаем токен из контекста авторизации
      const authToken = token;
      
      // Сохраняем токен в localStorage для использования на других страницах
      if (authToken && typeof window !== 'undefined') {
        localStorage.setItem('auth_token', authToken);
      }
      
      const response = await fetch('/api/update/history', {
        headers: {
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        // Ошибка обрабатывается в компоненте CommitHistory
      }
      
      // Результат обрабатывается в компоненте CommitHistory
    } catch (error) {
      // Ошибка обрабатывается в компоненте CommitHistory
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
            <div className="mb-6">
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
                    
                    // Получаем токен из контекста или localStorage
                    const authToken = token || localStorage.getItem('auth_token');
                    
                    const response = await fetch('/api/update', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
                      },
                      credentials: 'include'
                    });
                    
                    if (!response.ok) {
                      const errorData = await response.json().catch(() => ({}));
                      throw new Error(errorData.error || `Ошибка при обновлении приложения: ${response.status}`);
                    }
                    
                    const result = await response.json();
                    if (result.success) {
                      setSuccessMessage(result.message);
                      
                      // Если было обновление, предлагаем перезагрузить страницу через 3 секунды
                      if (result.updated) {
                        setTimeout(() => {
                          if (window.confirm('Приложение обновлено. Перезагрузить страницу для применения изменений?')) {
                            window.location.reload();
                          }
                        }, 3000);
                        
                        // Обновить список коммитов, если было обновление
                        fetchCommitHistory();
                      }
                    } else {
                      setFormError(result.error || 'Не удалось обновить приложение');
                    }
                  } catch (err: any) {
                    console.error('Ошибка при обновлении приложения:', err);
                    setFormError(err.message || 'Не удалось обновить приложение');
                  } finally {
                    setIsDataLoading(false);
                  }
                }}
                disabled={isDataLoading}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-purple-700 dark:hover:bg-purple-600 mb-4"
              >
                {isDataLoading ? 'Обновление приложения...' : 'Обновить приложение'}
              </button>
              
              {/* История коммитов и откат */}
              <CommitHistory onRollback={(hash) => handleRollback(hash)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 