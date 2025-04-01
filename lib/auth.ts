import { User, Session } from './types';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { mockUsers } from './mockData';

// Секретный ключ для JWT
const JWT_SECRET = process.env.JWT_SECRET || 'ваш-секретный-ключ-для-jwt';

// Хранилище сессий (в реальной системе это будет в базе данных)
let sessions: Session[] = [];

// Аутентификация пользователя
export async function authenticateUser(username: string, password: string): Promise<User | null> {
  // Ищем пользователя по имени
  const user = mockUsers.find(u => u.username === username);
  
  if (!user) {
    console.log(`Пользователь с именем ${username} не найден`);
    return null;
  }
  
  // Проверяем пароль напрямую без bcrypt
  const passwordMatch = user.password === password;
  
  if (!passwordMatch) {
    console.log(`Неверный пароль для пользователя ${username}`);
    return null;
  }
  
  console.log(`Успешная аутентификация пользователя ${username}`);
  
  // Возвращаем пользователя без пароля
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword as User;
}

// Создание новой сессии для пользователя
export function createSession(user: User): Session {
  // Удаляем старые сессии пользователя
  sessions = sessions.filter(s => s.userId !== user.id);
  
  // Генерируем JWT токен
  const token = jwt.sign(
    { 
      userId: user.id,
      role: user.role
    }, 
    JWT_SECRET, 
    { expiresIn: '7d' }
  );
  
  // Создаем новую сессию
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // Сессия действует 7 дней
  
  const session: Session = {
    id: uuidv4(),
    userId: user.id,
    token,
    expiresAt,
    createdAt: new Date(),
    updatedAt: new Date(),
    user
  };
  
  // Сохраняем сессию в "базе данных"
  sessions.push(session);
  
  return session;
}

// Проверка действительности сессии
export function validateSession(token: string): Session | null {
  try {
    // Проверяем токен
    jwt.verify(token, JWT_SECRET);
    
    // Ищем сессию по токену
    const session = sessions.find(s => s.token === token);
    
    if (!session) {
      return null;
    }
    
    // Проверяем, не истек ли срок сессии
    if (new Date() > session.expiresAt) {
      return null;
    }
    
    return session;
  } catch (error) {
    return null;
  }
}

// Получение текущего пользователя по токену
export function getCurrentUser(token: string): User | null {
  const session = validateSession(token);
  
  if (!session) {
    return null;
  }
  
  const user = mockUsers.find(u => u.id === session.userId);
  
  if (!user) {
    return null;
  }
  
  // Возвращаем пользователя без пароля
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword as User;
}

// Проверка авторизации в API запросах
export async function verifyAuth(
  request: Request, 
  options?: { requireAuth?: boolean }
): Promise<{ success: boolean; user?: User }> {
  try {
    // Извлекаем токен из заголовка Authorization
    const authHeader = request.headers.get('Authorization');
    
    // Проверяем наличие токена в куки
    const cookieHeader = request.headers.get('Cookie');
    let token = null;
    
    // Ищем токен в заголовке Authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } 
    // Ищем токен в куки
    else if (cookieHeader) {
      // Поиск токена в разных вариантах куки
      const cookieMatchAuthToken = cookieHeader.match(/authToken=([^;]+)/);
      const cookieMatchAuth = cookieHeader.match(/auth_token=([^;]+)/);
      
      if (cookieMatchAuthToken && cookieMatchAuthToken[1]) {
        token = cookieMatchAuthToken[1];
      } else if (cookieMatchAuth && cookieMatchAuth[1]) {
        token = cookieMatchAuth[1];
      }
    }
    
    // Если токен не найден, проверяем, требуется ли авторизация
    if (!token) {
      // Если авторизация необязательна, возвращаем успех без пользователя
      if (options?.requireAuth === false) {
        return { success: true };
      }
      console.log('Токен не найден в запросе');
      return { success: false };
    }
    
    // Проверяем токен и получаем пользователя
    const user = getCurrentUser(token);
    
    if (!user) {
      // Если авторизация необязательна, возвращаем успех без пользователя
      if (options?.requireAuth === false) {
        return { success: true };
      }
      console.log('Пользователь не найден по токену');
      return { success: false };
    }
    
    console.log(`Успешная аутентификация пользователя ${user.username} с ролью ${user.role}`);
    return { success: true, user };
  } catch (error) {
    console.error('Auth verification error:', error);
    return { success: false };
  }
}

// Завершение сессии
export function endSession(token: string): boolean {
  const sessionIndex = sessions.findIndex(s => s.token === token);
  
  if (sessionIndex === -1) {
    return false;
  }
  
  // Удаляем сессию
  sessions.splice(sessionIndex, 1);
  
  return true;
}

// Сохранение базы данных (сессий и пользователей)
export function backupDatabase(): { users: User[], sessions: Session[] } {
  return { users: [...mockUsers], sessions: [...sessions] };
}

// Восстановление базы данных из резервной копии
export function restoreDatabase(backup: { users: User[], sessions: Session[] }): void {
  if (backup.users) {
    // Заменяем пользователей
    mockUsers.length = 0;
    mockUsers.push(...backup.users);
  }
  
  if (backup.sessions) {
    // Заменяем сессии
    sessions.length = 0;
    sessions.push(...backup.sessions);
  }
}

// Изменение пароля пользователя
export async function changeUserPassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
  // Найти пользователя по ID
  const userIndex = mockUsers.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    console.log(`Пользователь с ID ${userId} не найден`);
    return false;
  }
  
  const user = mockUsers[userIndex];
  
  // Проверить текущий пароль 
  if (user.password !== currentPassword) {
    console.log(`Неверный текущий пароль для пользователя ${user.username}`);
    return false;
  }
  
  // Обновить пароль
  mockUsers[userIndex] = {
    ...user,
    password: newPassword,
    updatedAt: new Date()
  };
  
  console.log(`Пароль успешно изменен для пользователя ${user.username}`);
  return true;
} 