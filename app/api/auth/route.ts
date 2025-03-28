import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, createSession, endSession } from '@/lib/auth';

// Авторизация пользователя
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Проверяем наличие необходимых полей
    if (!body.username || !body.password) {
      return NextResponse.json(
        { error: 'Логин и пароль обязательны' },
        { status: 400 }
      );
    }
    
    // Аутентифицируем пользователя
    const user = await authenticateUser(body.username, body.password);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Неверные учетные данные' },
        { status: 401 }
      );
    }
    
    // Создаем сессию
    const session = createSession(user);
    
    // Возвращаем пользователя и токен
    return NextResponse.json({
      user,
      token: session.token,
      expiresAt: session.expiresAt
    });
  } catch (error) {
    console.error('Ошибка авторизации:', error);
    return NextResponse.json(
      { error: 'Не удалось выполнить вход' },
      { status: 500 }
    );
  }
}

// Выход пользователя
export async function DELETE(request: NextRequest) {
  try {
    // Получаем токен из заголовка
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Токен не предоставлен' },
        { status: 401 }
      );
    }
    
    // Завершаем сессию
    const success = endSession(token);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Сессия не найдена' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Выход выполнен успешно' });
  } catch (error) {
    console.error('Ошибка выхода:', error);
    return NextResponse.json(
      { error: 'Не удалось выполнить выход' },
      { status: 500 }
    );
  }
} 