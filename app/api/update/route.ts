import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { verifyAuth } from '@/lib/auth'
import { Employee, WorkDay } from '@/lib/types'
import { mockEmployees, mockWorkDays } from '@/lib/mockData'
import { v4 as uuidv4 } from 'uuid'
import { getLastCommits } from './utils'

const execAsync = promisify(exec)

// Глобальные переменные для хранения данных
let employees: Employee[] = [...mockEmployees]
let workdays: WorkDay[] = [...mockWorkDays]

/**
 * API-маршрут для обновления приложения из GitHub
 * 
 * Доступ только для администраторов
 * POST /api/update - обновляет приложение, выполняя git pull и перезапуск сервера
 */
export async function POST(request: NextRequest) {
  console.log('Получен запрос на обновление приложения')
  
  try {
    // Проверка авторизации - с проверкой куки и опциональной авторизацией
    const authResult = await verifyAuth(request, { requireAuth: false })
    console.log('Результат авторизации:', authResult)
    
    // Если проверка авторизации прошла успешно и это админ, или если авторизация не требуется для тестов
    if (authResult.success && authResult.user?.role === 'ADMIN') {
      console.log('Успешная авторизация, начинаем процесс обновления')
      
      // Сохраняем текущий коммит перед обновлением
      const { stdout: currentCommit } = await execAsync('git rev-parse HEAD')
      console.log('Текущий коммит перед обновлением:', currentCommit.trim())
      
      console.log('Начало процесса обновления приложения из GitHub')
      
      // Запускаем git pull для получения обновлений
      try {
        const { stdout: pullOutput, stderr: pullError } = await execAsync('git pull')
        
        console.log('Результат git pull:', pullOutput)
        
        if (pullError) {
          console.warn('Git pull warning:', pullError)
        }
        
        // Проверяем, были ли изменения, по выводу git pull
        const noChanges = pullOutput.includes('Already up to date') || 
                          pullOutput.includes('Already up-to-date') ||
                          pullOutput.includes('Уже обновлено')
        
        if (noChanges) {
          return NextResponse.json({
            success: true,
            message: 'Приложение уже обновлено до последней версии',
            updated: false,
            details: { pullOutput }
          })
        }
        
        // Обновляем зависимости npm install (не помешает после обновления)
        console.log('Обновление npm зависимостей...')
        const { stdout: npmOutput, stderr: npmError } = await execAsync('npm install')
        
        if (npmError) {
          console.warn('NPM install warning:', npmError)
        }
        
        // Запускаем сборку, если были изменения
        console.log('Сборка приложения...')
        const { stdout: buildOutput, stderr: buildError } = await execAsync('npm run build')
        
        if (buildError) {
          console.warn('Build warning:', buildError)
        }
        
        // Получаем новый коммит после обновления
        const { stdout: newCommit } = await execAsync('git rev-parse HEAD')
        
        // Обновляем историю коммитов
        await getLastCommits()
        
        return NextResponse.json({
          success: true,
          message: 'Приложение успешно обновлено из GitHub',
          updated: true,
          previousCommit: currentCommit.trim(),
          currentCommit: newCommit.trim(),
          details: {
            pullOutput,
            npmOutput,
            buildOutput,
          }
        })
      } catch (processError) {
        console.error('Ошибка выполнения команд обновления:', processError)
        return NextResponse.json(
          { 
            error: 'Ошибка выполнения команд обновления', 
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
    console.error('Ошибка при обновлении приложения:', error)
    return NextResponse.json(
      { error: 'Ошибка при обновлении приложения' },
      { status: 500 }
    )
  }
} 