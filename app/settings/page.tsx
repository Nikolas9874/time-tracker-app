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
  
  if (!user) {
    return null; // Не отображаем страницу, пока не проверим авторизацию
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Настройки профиля</h1>
      
      <div className="bg-white rounded-lg shadow p-6 max-w-md">
        <h2 className="text-xl font-semibold mb-4">Изменение пароля</h2>
        
        <form onSubmit={handleSubmit}>
          {formError && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
              {formError}
            </div>
          )}
          
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-md text-sm">
              {successMessage}
            </div>
          )}
          
          <div className="mb-4">
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Текущий пароль
            </label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Введите текущий пароль"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Новый пароль
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Введите новый пароль"
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Подтвердите новый пароль
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Подтвердите новый пароль"
            />
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isSubmitting ? 'Сохранение...' : 'Изменить пароль'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage; 