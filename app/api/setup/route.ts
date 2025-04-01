import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('Запуск быстрой настройки...')
    
    // Проверяем наличие сотрудников
    const existingEmployeesCount = await db.employee.count()
    
    if (existingEmployeesCount === 0) {
      console.log('Создаем тестовых сотрудников...')
      
      const employees = [
        {
          name: 'Иванов Иван',
          position: 'Разработчик',
          department: 'ИТ',
          email: 'ivanov@example.com'
        },
        {
          name: 'Петрова Анна',
          position: 'Дизайнер',
          department: 'ИТ',
          email: 'petrova@example.com'
        },
        {
          name: 'Сидоров Алексей',
          position: 'Менеджер проекта',
          department: 'Управление',
          email: 'sidorov@example.com'
        }
      ]
      
      // Добавляем сотрудников
      for (const employee of employees) {
        await db.employee.create({
          data: employee
        })
      }
      
      console.log(`Создано ${employees.length} тестовых сотрудников`)
      
      // Создаем рабочие дни на сегодня
      const today = new Date()
      const formattedDate = today.toISOString().split('T')[0]
      
      // Получаем созданных сотрудников
      const dbEmployees = await db.employee.findMany()
      
      // Для каждого сотрудника создаем рабочий день на сегодня
      for (const employee of dbEmployees) {
        // Создаем рабочий день с временем
        const startTime = new Date(today)
        startTime.setHours(9, 0, 0, 0)
        
        const endTime = new Date(today)
        endTime.setHours(18, 0, 0, 0)
        
        const lunchStartTime = new Date(today)
        lunchStartTime.setHours(13, 0, 0, 0)
        
        const lunchEndTime = new Date(today)
        lunchEndTime.setHours(14, 0, 0, 0)
        
        const timeEntry = {
          startTime,
          endTime,
          lunchStartTime,
          lunchEndTime
        }
        
        await db.workDay.create({
          data: {
            employeeId: employee.id,
            date: today,
            dayType: 'WORK_DAY',
            timeEntry: JSON.stringify(timeEntry),
            tasks: JSON.stringify([]),
            connections: JSON.stringify([]),
            comment: `Рабочий день ${formattedDate}`
          }
        })
      }
      
      return NextResponse.json({
        success: true,
        message: 'Быстрая настройка завершена успешно',
        employeesCreated: employees.length,
        workDaysCreated: dbEmployees.length
      })
    } else {
      return NextResponse.json({
        success: true,
        message: 'Сотрудники уже существуют, настройка не требуется',
        employeesExisting: existingEmployeesCount
      })
    }
  } catch (error) {
    console.error('Ошибка при выполнении быстрой настройки:', error)
    return NextResponse.json(
      { error: 'Произошла ошибка при выполнении быстрой настройки' },
      { status: 500 }
    )
  }
} 