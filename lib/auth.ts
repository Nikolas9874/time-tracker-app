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
    return null;
  }
  
  // Проверяем пароль напрямую без bcrypt
  const passwordMatch = user.password === password;
  
  if (!passwordMatch) {
    return null;
  }
  
  // Возвращаем пользователя без пароля
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword as User;
}

// Создание новой сессии для пользователя
export function createSession(user: User): Session {
  // Находим активные сессии пользователя
  const existingSessions = sessions.filter(s => s.userId === user.id);
  
  if (existingSessions.length > 0) {
    console.log(`Найдены существующие сессии для пользователя ${user.username} (${existingSessions.length}). Они будут завершены.`);
    
    // Логируем информацию о завершении сессий
    existingSessions.forEach(session => {
      console.log(`Завершена сессия ${session.id}, созданная ${session.createdAt.toISOString()}`);
    });
  }
  
  // Удаляем старые сессии пользователя
  sessions = sessions.filter(s => s.userId !== user.id);
  
  // Генерируем JWT токен
  const token = jwt.sign(
    { 
      userId: user.id,
      role: user.role,
      sessionId: uuidv4() // Добавляем уникальный идентификатор сессии в токен
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
    user,
    userAgent: 'Unknown', // Можно добавить информацию о браузере/устройстве
    ipAddress: 'Unknown'  // Можно добавить информацию об IP адресе
  };
  
  // Сохраняем сессию в "базе данных"
  sessions.push(session);
  console.log(`Создана новая сессия для пользователя ${user.username}, всего сессий: ${sessions.length}`);
  
  return session;
}

// Проверка действительности сессии
export function validateSession(token: string): Session | null {
  try {
    // Проверяем токен
    const decoded = jwt.verify(token, JWT_SECRET);
    
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
  try {
    // Декодируем токен без проверки
    const decoded = jwt.decode(token) as { userId: string, role: string } | null;
    
    if (!decoded) {
      return null;
    }
    
    // Находим пользователя по ID из токена
    const user = mockUsers.find(u => u.id === decoded.userId);
    
    if (!user) {
      return null;
    }
    
    // Возвращаем пользователя без пароля
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  } catch (error) {
    return null;
  }
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
      return { success: false };
    }
    
    // Проверяем токен и получаем пользователя
    const user = getCurrentUser(token);
    
    if (!user) {
      // Если авторизация необязательна, возвращаем успех без пользователя
      if (options?.requireAuth === false) {
        return { success: true };
      }
      return { success: false };
    }
    
    return { success: true, user };
  } catch (error) {
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
    return false;
  }
  
  const user = mockUsers[userIndex];
  
  // Проверить текущий пароль 
  if (user.password !== currentPassword) {
    return false;
  }
  
  // Обновить пароль
  mockUsers[userIndex] = {
    ...user,
    password: newPassword,
    updatedAt: new Date()
  };
  
  return true;
}

// Проверка наличия активной сессии пользователя
export function hasActiveSession(userId: string): boolean {
  // Ищем активные сессии пользователя
  const userSessions = sessions.filter(s => s.userId === userId);
  
  // Проверяем, есть ли активные сессии и не истек ли их срок
  const currentDate = new Date();
  const activeSessions = userSessions.filter(s => s.expiresAt > currentDate);
  
  return activeSessions.length > 0;
}

// Получение всех активных сессий пользователя
export function getUserActiveSessions(userId: string): Session[] {
  const currentDate = new Date();
  return sessions.filter(s => s.userId === userId && s.expiresAt > currentDate);
}

// Завершение всех сессий пользователя
export function endAllUserSessions(userId: string): number {
  const userSessionsCount = sessions.filter(s => s.userId === userId).length;
  
  // Удаляем все сессии пользователя
  sessions = sessions.filter(s => s.userId !== userId);
  
  return userSessionsCount;
} 