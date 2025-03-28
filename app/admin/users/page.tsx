'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { User, UserRole } from '@/lib/types';
import { mockUsers } from '@/lib/mockData';

// Компонент для редактирования пользователя
interface EditUserModalProps {
  user: User | null;
  onClose: () => void;
  onSave: (userData: Partial<User>) => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, onClose, onSave }) => {
  const [userData, setUserData] = useState<Partial<User>>({
    name: '',
    email: '',
    role: 'USER' as UserRole,
  });
  
  useEffect(() => {
    if (user) {
      setUserData({
        name: user.name,
        email: user.email,
        role: user.role,
      });
    }
  }, [user]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(userData);
  };
  
  if (!user) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Редактирование пользователя</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Имя пользователя
            </label>
            <input
              type="text"
              disabled
              value={user.username}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
            />
            <p className="text-xs text-gray-500 mt-1">Имя пользователя нельзя изменить</p>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Полное имя
            </label>
            <input
              type="text"
              name="name"
              value={userData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={userData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Роль
            </label>
            <select
              name="role"
              value={userData.role}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            >
              <option value="ADMIN">Администратор</option>
              <option value="MANAGER">Менеджер</option>
              <option value="USER">Пользователь</option>
            </select>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Страница управления пользователями
const UsersManagementPage = () => {
  const { user: currentUser, isLoading } = useAuth();
  const router = useRouter();
  
  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);
  const [operationStatus, setOperationStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Проверяем доступ к странице (только для админов)
  useEffect(() => {
    if (!isLoading && (!currentUser || currentUser.role !== 'ADMIN')) {
      router.push('/');
    }
  }, [currentUser, isLoading, router]);
  
  // Загружаем пользователей
  useEffect(() => {
    // В реальном приложении тут будет API запрос
    // Здесь мы используем mockedUsers из mockData
    setUsers(mockUsers.map(user => {
      // Возвращаем пользователя без пароля для безопасности
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    }));
  }, []);
  
  // Обновление пользователя
  const handleUpdateUser = (userData: Partial<User>) => {
    if (!editingUser) return;
    
    // Обновляем пользователя в локальном состоянии
    const updatedUsers = users.map(user => 
      user.id === editingUser.id ? { ...user, ...userData } : user
    );
    
    // В реальном приложении тут будет API запрос
    setUsers(updatedUsers);
    setEditingUser(null);
    setOperationStatus({
      type: 'success',
      message: `Пользователь ${editingUser.username} успешно обновлен`
    });
    
    // Скрываем сообщение через 5 секунд
    setTimeout(() => {
      setOperationStatus(null);
    }, 5000);
  };
  
  // Удаление пользователя
  const handleDeleteUser = (userId: string) => {
    // Не даем удалить текущего пользователя
    if (userId === currentUser?.id) {
      setOperationStatus({
        type: 'error',
        message: 'Вы не можете удалить свою учетную запись'
      });
      setShowConfirmDelete(null);
      return;
    }
    
    // Удаляем пользователя из локального состояния
    const deletedUser = users.find(user => user.id === userId);
    const filteredUsers = users.filter(user => user.id !== userId);
    
    // В реальном приложении тут будет API запрос
    setUsers(filteredUsers);
    setShowConfirmDelete(null);
    
    if (deletedUser) {
      setOperationStatus({
        type: 'success',
        message: `Пользователь ${deletedUser.username} успешно удален`
      });
    }
    
    // Скрываем сообщение через 5 секунд
    setTimeout(() => {
      setOperationStatus(null);
    }, 5000);
  };
  
  // Роли пользователей для отображения
  const roleLabels: Record<UserRole, string> = {
    'ADMIN': 'Администратор',
    'MANAGER': 'Менеджер',
    'USER': 'Пользователь'
  };
  
  // Цвета для ролей
  const roleColors: Record<UserRole, string> = {
    'ADMIN': 'bg-red-100 text-red-800',
    'MANAGER': 'bg-blue-100 text-blue-800',
    'USER': 'bg-green-100 text-green-800'
  };
  
  // Если загрузка или пользователь не админ, возвращаем заглушку
  if (isLoading || !currentUser || currentUser.role !== 'ADMIN') {
    return <div className="text-center p-8">Загрузка...</div>;
  }
  
  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Управление пользователями</h1>
      
      {operationStatus && (
        <div className={`mb-6 p-4 rounded-md ${
          operationStatus.type === 'success' 
            ? 'bg-green-50 text-green-700' 
            : 'bg-red-50 text-red-700'
        }`}>
          {operationStatus.message}
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Пользователь
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Роль
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        @{user.username}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${roleColors[user.role]}`}>
                    {roleLabels[user.role]}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {showConfirmDelete === user.id ? (
                    <div className="flex justify-end space-x-2">
                      <button 
                        onClick={() => setShowConfirmDelete(null)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        Отмена
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Подтвердить
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-end space-x-3">
                      <button 
                        onClick={() => setEditingUser(user)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Изменить
                      </button>
                      <button 
                        onClick={() => setShowConfirmDelete(user.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Удалить
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {editingUser && (
        <EditUserModal 
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleUpdateUser}
        />
      )}
    </div>
  );
};

export default UsersManagementPage; 