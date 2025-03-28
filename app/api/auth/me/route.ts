import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

// Получение информации о текущем пользователе
export async function GET(request: NextRequest) {
  try {
    // Получаем токен из заголовка
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Токен не предоставлен' },
        { status: 401 }
      );
    }
    
    // Получаем пользователя по токену
    const user = getCurrentUser(token);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Недействительный токен или сессия истекла' },
        { status: 401 }
      );
    }
    
    // Возвращаем информацию о пользователе
    return NextResponse.json({ user });
  } catch (error) {
    console.error('Ошибка получения информации о пользователе:', error);
    return NextResponse.json(
      { error: 'Не удалось получить информацию о пользователе' },
      { status: 500 }
    );
  }
} 