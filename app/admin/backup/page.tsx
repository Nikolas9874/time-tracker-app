'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { createDataBackup, restoreFromBackup } from '@/lib/utils';

const BackupPage = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [backupStatus, setBackupStatus] = useState<string | null>(null);
  const [restoreStatus, setRestoreStatus] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Проверяем доступ к странице (только для админов)
  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/');
    }
  }, [user, isLoading, router]);
  
  // Создание резервной копии
  const handleCreateBackup = async () => {
    try {
      setIsProcessing(true);
      setBackupStatus(null);
      
      // Получаем токен из локального хранилища
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        throw new Error('Токен авторизации не найден. Возможно, сессия истекла. Попробуйте перелогиниться.');
      }
      
      // Получаем данные резервной копии
      const response = await fetch('/api/backup', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Не удалось создать резервную копию (${response.status})`);
      }
      
      // Получаем данные как Blob для скачивания
      const blob = await response.blob();
      
      // Создаем ссылку для скачивания
      const url = URL.createObjectURL(blob);
      const date = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
      const filename = `timetracker-backup-${date}.json`;
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Очищаем ресурсы
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);
      
      setBackupStatus(`Резервная копия успешно создана: ${filename}`);
    } catch (error: any) {
      console.error('Ошибка создания резервной копии:', error);
      setBackupStatus(`Ошибка: ${error.message || 'Не удалось создать резервную копию'}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Обработка выбора файла
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    setRestoreStatus(null);
  };
  
  // Восстановление из резервной копии
  const handleRestore = async () => {
    if (!selectedFile) {
      setRestoreStatus('Ошибка: Файл не выбран');
      return;
    }
    
    try {
      setIsProcessing(true);
      setRestoreStatus(null);
      
      // Получаем токен из локального хранилища
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        throw new Error('Токен авторизации не найден. Возможно, сессия истекла. Попробуйте перелогиниться.');
      }
      
      // Читаем файл как текст
      const fileContent = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsText(selectedFile);
      });
      
      let backupData;
      try {
        backupData = JSON.parse(fileContent);
      } catch (e) {
        throw new Error('Недействительный формат резервной копии');
      }
      
      // Отправляем данные на сервер
      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(backupData)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Не удалось восстановить из резервной копии (${response.status})`);
      }
      
      setRestoreStatus('База данных успешно восстановлена');
      
      // Очищаем выбранный файл
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setSelectedFile(null);
    } catch (error: any) {
      console.error('Ошибка восстановления из резервной копии:', error);
      setRestoreStatus(`Ошибка: ${error.message || 'Не удалось восстановить из резервной копии'}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Если загрузка или пользователь не админ, возвращаем заглушку
  if (isLoading || !user || user.role !== 'ADMIN') {
    return <div className="text-center p-8">Загрузка...</div>;
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Управление резервными копиями</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Создание резервной копии</h2>
        <p className="text-gray-600 mb-4">
          Создайте резервную копию всех данных системы, включая информацию о пользователях, сотрудниках и рабочем времени.
        </p>
        
        <button
          onClick={handleCreateBackup}
          disabled={isProcessing}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isProcessing ? 'Создание...' : 'Создать резервную копию'}
        </button>
        
        {backupStatus && (
          <div className={`mt-4 p-3 rounded-md ${backupStatus.includes('Ошибка') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {backupStatus}
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Восстановление из резервной копии</h2>
        <p className="text-gray-600 mb-4">
          Восстановите данные системы из ранее созданной резервной копии. <strong className="text-red-600">Внимание:</strong> это действие заменит все текущие данные!
        </p>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Выберите файл резервной копии
          </label>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
        
        <button
          onClick={handleRestore}
          disabled={!selectedFile || isProcessing}
          className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50"
        >
          {isProcessing ? 'Восстановление...' : 'Восстановить из резервной копии'}
        </button>
        
        {restoreStatus && (
          <div className={`mt-4 p-3 rounded-md ${restoreStatus.includes('Ошибка') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {restoreStatus}
          </div>
        )}
      </div>
    </div>
  );
};

export default BackupPage; 