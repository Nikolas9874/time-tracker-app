'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

const UpdateAppPage = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateDetails, setUpdateDetails] = useState<any>(null);
  
  // Проверяем доступ к странице (только для админов)
  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/');
    }
  }, [user, isLoading, router]);
  
  // Обновление приложения
  const handleUpdate = async () => {
    try {
      setIsUpdating(true);
      setUpdateStatus(null);
      setUpdateDetails(null);
      
      // Получаем токен из локального хранилища
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        throw new Error('Токен авторизации не найден. Возможно, сессия истекла. Попробуйте перелогиниться.');
      }
      
      // Отправляем запрос на обновление
      const response = await fetch('/api/update', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Не удалось обновить приложение (${response.status})`);
      }
      
      const result = await response.json();
      
      if (result.updated) {
        setUpdateStatus('Приложение успешно обновлено из GitHub. Обновление будет применено после перезапуска сервера.');
      } else {
        setUpdateStatus(result.message || 'Приложение уже обновлено до последней версии.');
      }
      
      setUpdateDetails(result.details);
    } catch (error: any) {
      console.error('Ошибка обновления приложения:', error);
      setUpdateStatus(`Ошибка: ${error.message || 'Не удалось обновить приложение'}`);
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Если загрузка или пользователь не админ, возвращаем заглушку
  if (isLoading || !user || user.role !== 'ADMIN') {
    return <div className="text-center p-8">Загрузка...</div>;
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Обновление приложения</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Обновление из GitHub</h2>
        <p className="text-gray-600 mb-4">
          Обновите приложение до последней версии из репозитория GitHub. Убедитесь, что у вас нет несохраненных изменений.
        </p>
        
        <button
          onClick={handleUpdate}
          disabled={isUpdating}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isUpdating ? 'Обновление...' : 'Обновить приложение'}
        </button>
        
        {updateStatus && (
          <div className={`mt-4 p-3 rounded-md ${updateStatus.includes('Ошибка') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {updateStatus}
          </div>
        )}
        
        {updateDetails && (
          <div className="mt-4">
            <h3 className="text-md font-medium mb-2">Детали обновления:</h3>
            <div className="bg-gray-50 p-3 rounded-md text-sm font-mono overflow-x-auto max-h-56 overflow-y-auto">
              <pre>{JSON.stringify(updateDetails, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Информация о приложении</h2>
        <div className="space-y-2">
          <p><strong>Название приложения:</strong> Time Tracker App</p>
          <p><strong>Репозиторий:</strong> <a href="https://github.com/Nikolas9874/time-tracker-app" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">GitHub Repository</a></p>
        </div>
      </div>
    </div>
  );
};

export default UpdateAppPage; 