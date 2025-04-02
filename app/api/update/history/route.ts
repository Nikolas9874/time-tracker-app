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
    // Проверка авторизации
    const authResult = await verifyAuth(request, { requireAuth: true })
    
    // Если проверка авторизации прошла успешно и это админ, или если авторизация не требуется для тестов
    if (authResult.success && authResult.user?.role === 'ADMIN') {
      // Получаем историю коммитов
      const commits = await getLastCommits(10)
      
      return NextResponse.json({
        success: true,
        commits
      })
    } else {
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