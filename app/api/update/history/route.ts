import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { getLastCommits } from '../utils'

/**
 * API-маршрут для получения истории коммитов
 * 
 * Доступно только для администраторов
 * GET /api/update/history - возвращает историю последних коммитов
 */
export async function GET(request: NextRequest) {
  try {
    console.log('API: Получен запрос на историю коммитов');
    // Проверка авторизации
    const authResult = await verifyAuth(request, { requireAuth: true })
    
    // Логируем заголовки запроса для диагностики
    console.log('API: Заголовки запроса:');
    console.log('Authorization:', request.headers.get('Authorization'));
    console.log('Cookie:', request.headers.get('Cookie'));
    
    console.log('API: Результат авторизации:', JSON.stringify({
      success: authResult.success,
      userRole: authResult.user?.role || 'не определена'
    }));
    
    // Если проверка авторизации прошла успешно и это админ, или если авторизация не требуется для тестов
    if (authResult.success && authResult.user?.role === 'ADMIN') {
      console.log('API: Доступ разрешен, получаем историю коммитов');
      // Получаем историю коммитов
      const commits = await getLastCommits(10)
      
      return NextResponse.json({
        success: true,
        commits
      })
    } else {
      console.log('API: Доступ запрещен. Необходима авторизация с правами администратора.');
      return NextResponse.json(
        { error: 'Доступ запрещен. Необходима авторизация с правами администратора.' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Ошибка при получении истории коммитов:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении истории коммитов' },
      { status: 500 }
    )
  }
} 