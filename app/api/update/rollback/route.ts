import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { verifyAuth } from '@/lib/auth'
import path from 'path'
import { getLastCommits } from '../utils'

const execAsync = promisify(exec)

/**
 * API-маршрут для отката приложения к определенной версии
 * 
 * Доступ только для администраторов
 * POST /api/update/rollback - откатывает приложение к указанному коммиту
 */
export async function POST(request: NextRequest) {
  console.log('Получен запрос на откат приложения')
  
  try {
    // Проверка авторизации
    const authResult = await verifyAuth(request, { requireAuth: false })
    
    // Если проверка авторизации прошла успешно и это админ
    if (authResult.success && authResult.user?.role === 'ADMIN') {
      // Получаем данные о коммите, к которому нужно откатиться
      const data = await request.json().catch(() => ({}))
      const { commitHash } = data
      
      if (!commitHash) {
        return NextResponse.json(
          { error: 'Не указан хеш коммита для отката' },
          { status: 400 }
        )
      }
      
      console.log(`Выполняем откат к коммиту ${commitHash}`)
      
      // Сохраняем текущий коммит перед откатом
      const { stdout: currentCommit } = await execAsync('git rev-parse HEAD')
      
      try {
        // Проверяем наличие несохраненных изменений
        const { stdout: statusOutput } = await execAsync('git status --porcelain')
        
        if (statusOutput.trim()) {
          console.warn('Обнаружены несохраненные изменения, сбрасываем их')
          await execAsync('git reset --hard HEAD')
        }
        
        // Выполняем переключение на указанный коммит
        const { stdout: checkoutOutput, stderr: checkoutError } = await execAsync(`git checkout ${commitHash}`)
        
        if (checkoutError && !checkoutError.includes('switching to')) {
          console.error('Ошибка при переключении на коммит:', checkoutError)
          throw new Error(checkoutError)
        }
        
        console.log('Результат git checkout:', checkoutOutput)
        
        // Обновляем зависимости после отката
        console.log('Обновление npm зависимостей...')
        const { stdout: npmOutput, stderr: npmError } = await execAsync('npm install')
        
        if (npmError) {
          console.warn('NPM install warning:', npmError)
        }
        
        // Запускаем сборку
        console.log('Сборка приложения...')
        const { stdout: buildOutput, stderr: buildError } = await execAsync('npm run build')
        
        if (buildError) {
          console.warn('Build warning:', buildError)
        }
        
        // Обновляем историю коммитов
        await getLastCommits()
        
        return NextResponse.json({
          success: true,
          message: `Приложение успешно откачено к версии ${commitHash.slice(0, 7)}`,
          previousCommit: currentCommit.trim(),
          currentCommit: commitHash,
          details: {
            checkoutOutput,
            npmOutput,
            buildOutput,
          }
        })
      } catch (processError) {
        console.error('Ошибка выполнения команд отката:', processError)
        
        // Пытаемся вернуться к предыдущему коммиту в случае ошибки
        try {
          await execAsync(`git checkout ${currentCommit.trim()}`)
          console.log('Восстановлен предыдущий коммит после ошибки')
        } catch (restoreError) {
          console.error('Ошибка при восстановлении предыдущего коммита:', restoreError)
        }
        
        return NextResponse.json(
          { 
            error: 'Ошибка выполнения команд отката', 
            details: processError instanceof Error ? processError.message : String(processError)
          },
          { status: 500 }
        )
      }
    } else {
      console.log('Доступ запрещен: не администратор или не авторизован')
      return NextResponse.json(
        { error: 'Доступ запрещен. Необходима авторизация с правами администратора.' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Ошибка при откате приложения:', error)
    return NextResponse.json(
      { error: 'Ошибка при откате приложения' },
      { status: 500 }
    )
  }
} 