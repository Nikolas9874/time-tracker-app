import { NextRequest, NextResponse } from 'next/server';
import { changeUserPassword, getCurrentUser } from '@/lib/auth';

// Смена пароля пользователя
export async function POST(request: NextRequest) {
  try {
    // Получаем токен из заголовка
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Требуется авторизация' },
        { status: 401 }
      );
    }
    
    // Получаем текущего пользователя
    const currentUser = getCurrentUser(token);
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }
    
    const body = await request.json();
    
    // Проверяем наличие необходимых полей
    if (!body.currentPassword || !body.newPassword) {
      return NextResponse.json(
        { error: 'Текущий и новый пароли обязательны' },
        { status: 400 }
      );
    }
    
    // Проверка нового пароля на сложность
    if (body.newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Новый пароль должен содержать не менее 6 символов' },
        { status: 400 }
      );
    }
    
    // Меняем пароль
    const success = await changeUserPassword(
      currentUser.id,
      body.currentPassword,
      body.newPassword
    );
    
    if (!success) {
      return NextResponse.json(
        { error: 'Неверный текущий пароль' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ message: 'Пароль успешно изменен' });
  } catch (error) {
    console.error('Ошибка при смене пароля:', error);
    return NextResponse.json(
      { error: 'Не удалось изменить пароль' },
      { status: 500 }
    );
  }
} 