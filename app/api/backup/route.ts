import { NextRequest, NextResponse } from 'next/server';
import { backupDatabase, restoreDatabase } from '@/lib/auth';
import { getCurrentUser } from '@/lib/auth';

// Создание резервной копии базы данных
export async function GET(request: NextRequest) {
  try {
    console.log('API: Запрос на создание резервной копии получен');
    
    // Проверяем права доступа (только администратор)
    const authHeader = request.headers.get('Authorization');
    console.log('API: Заголовок авторизации:', authHeader ? 'Присутствует' : 'Отсутствует');
    
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      console.log('API: Токен не предоставлен');
      return NextResponse.json(
        { error: 'Токен не предоставлен' },
        { status: 401 }
      );
    }
    
    console.log('API: Проверка пользователя по токену');
    const user = getCurrentUser(token);
    
    if (!user) {
      console.log('API: Пользователь не найден или токен недействителен');
      return NextResponse.json(
        { error: 'Недействительный токен или сессия истекла' },
        { status: 401 }
      );
    }
    
    console.log(`API: Пользователь найден: ${user.username}, роль: ${user.role}`);
    
    if (user.role !== 'ADMIN') {
      console.log('API: У пользователя нет прав администратора');
      return NextResponse.json(
        { error: 'У вас нет прав на выполнение этой операции' },
        { status: 403 }
      );
    }
    
    console.log('API: Создание резервной копии базы данных');
    // Создаем резервную копию
    const backup = backupDatabase();
    console.log('API: Резервная копия создана:', 
      `Пользователей: ${backup.users?.length || 0}, ` +
      `Сессий: ${backup.sessions?.length || 0}`
    );
    
    // Создаем имя файла с датой
    const date = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
    const filename = `timetracker-backup-${date}.json`;
    
    console.log(`API: Отправка резервной копии клиенту: ${filename}`);
    // Возвращаем резервную копию
    return new NextResponse(JSON.stringify(backup), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  } catch (error: any) {
    console.error('API: Ошибка создания резервной копии:', error);
    return NextResponse.json(
      { error: error.message || 'Не удалось создать резервную копию' },
      { status: 500 }
    );
  }
}

// Восстановление из резервной копии
export async function POST(request: NextRequest) {
  try {
    console.log('API: Запрос на восстановление базы данных получен');
    
    // Проверяем права доступа (только администратор)
    const authHeader = request.headers.get('Authorization');
    console.log('API: Заголовок авторизации:', authHeader ? 'Присутствует' : 'Отсутствует');
    
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      console.log('API: Токен не предоставлен');
      return NextResponse.json(
        { error: 'Токен не предоставлен' },
        { status: 401 }
      );
    }
    
    console.log('API: Проверка пользователя по токену');
    const user = getCurrentUser(token);
    
    if (!user) {
      console.log('API: Пользователь не найден или токен недействителен');
      return NextResponse.json(
        { error: 'Недействительный токен или сессия истекла' },
        { status: 401 }
      );
    }
    
    console.log(`API: Пользователь найден: ${user.username}, роль: ${user.role}`);
    
    if (user.role !== 'ADMIN') {
      console.log('API: У пользователя нет прав администратора');
      return NextResponse.json(
        { error: 'У вас нет прав на выполнение этой операции' },
        { status: 403 }
      );
    }
    
    // Получаем данные для восстановления
    const data = await request.json();
    console.log('API: Данные резервной копии получены');
    
    // Проверяем структуру данных
    if (!data || typeof data !== 'object') {
      console.log('API: Неверный формат данных резервной копии - не является объектом');
      return NextResponse.json(
        { error: 'Неверный формат данных резервной копии' },
        { status: 400 }
      );
    }
    
    if (!data.users || !Array.isArray(data.users)) {
      console.log('API: Неверный формат данных резервной копии - отсутствуют пользователи');
      return NextResponse.json(
        { error: 'Неверный формат данных резервной копии - отсутствуют пользователи' },
        { status: 400 }
      );
    }
    
    if (!data.sessions || !Array.isArray(data.sessions)) {
      console.log('API: Неверный формат данных резервной копии - отсутствуют сессии');
      return NextResponse.json(
        { error: 'Неверный формат данных резервной копии - отсутствуют сессии' },
        { status: 400 }
      );
    }
    
    console.log(`API: Восстановление базы данных: Пользователей ${data.users.length}, Сессий ${data.sessions.length}`);
    // Восстанавливаем из резервной копии
    restoreDatabase(data);
    console.log('API: База данных успешно восстановлена');
    
    return NextResponse.json({ message: 'База данных успешно восстановлена' });
  } catch (error: any) {
    console.error('API: Ошибка восстановления базы данных:', error);
    return NextResponse.json(
      { error: error.message || 'Не удалось восстановить базу данных' },
      { status: 500 }
    );
  }
} 