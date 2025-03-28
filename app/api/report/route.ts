import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { DayType, WorkDay } from '@/lib/types'
import { mockEmployees } from '@/lib/mockData'

// Переменная для отслеживания инициализации
let isInitialized = false
let workDaysData: WorkDay[] = []

// GET /api/report?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&employeeId=id
export async function GET(request: NextRequest) {
  try {
    // Если данные еще не инициализированы, загрузим все существующие данные
    if (!isInitialized) {
      try {
        // Получаем данные за текущую дату и предыдущий день для демонстрации
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        // Загружаем данные за текущий день
        const todayResponse = await fetch(`${request.nextUrl.origin}/api/workdays?date=${todayStr}`);
        const todayData = await todayResponse.json();
        
        if (Array.isArray(todayData)) {
          workDaysData = [...workDaysData, ...todayData];
        }
        
        // Загружаем данные за вчерашний день
        const yesterdayResponse = await fetch(`${request.nextUrl.origin}/api/workdays?date=${yesterdayStr}`);
        const yesterdayData = await yesterdayResponse.json();
        
        if (Array.isArray(yesterdayData)) {
          workDaysData = [...workDaysData, ...yesterdayData];
        }
        
        console.log(`Загружено ${workDaysData.length} записей из API`);
      } catch (error) {
        console.error('Ошибка загрузки данных из API:', error);
      }
      
      isInitialized = true;
    }
    
    const searchParams = request.nextUrl.searchParams
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')
    const employeeId = searchParams.get('employeeId')
    
    if (!startDateParam || !endDateParam) {
      return NextResponse.json(
        { error: 'Необходимо указать начальную и конечную даты' },
        { status: 400 }
      )
    }
    
    // Для отладки
    console.log(`Запрос отчета для периода: ${startDateParam} - ${endDateParam}`);
    
    // Конвертируем строковые даты в объекты Date для внутренних расчетов
    const startDate = new Date(startDateParam)
    const endDate = new Date(endDateParam)
    
    // Проверяем валидность дат
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Неверный формат даты. Используйте YYYY-MM-DD' },
        { status: 400 }
      )
    }
    
    // Для сравнения мы используем строки YYYY-MM-DD
    const startDateStr = startDateParam
    const endDateStr = endDateParam
    
    console.log(`Преобразованные даты: ${startDateStr} - ${endDateStr}`);
    
    // Загружаем данные для запрошенного периода
    try {
      const response = await fetch(`${request.nextUrl.origin}/api/workdays?date=${startDateStr}`);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        // Проверяем, есть ли уже эти записи, чтобы избежать дубликатов
        const newRecords = data.filter(newItem => 
          !workDaysData.some(existingItem => existingItem.id === newItem.id)
        );
        
        workDaysData = [...workDaysData, ...newRecords];
        console.log(`Дополнительно загружено ${newRecords.length} записей для даты ${startDateStr}`);
      }
      
      // Если есть несколько дат в периоде, загружаем и их
      if (startDateStr !== endDateStr) {
        const endResponse = await fetch(`${request.nextUrl.origin}/api/workdays?date=${endDateStr}`);
        const endData = await endResponse.json();
        
        if (Array.isArray(endData)) {
          const newEndRecords = endData.filter(newItem => 
            !workDaysData.some(existingItem => existingItem.id === newItem.id)
          );
          
          workDaysData = [...workDaysData, ...newEndRecords];
          console.log(`Дополнительно загружено ${newEndRecords.length} записей для даты ${endDateStr}`);
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки данных для отчетного периода:', error);
    }
    
    // Фильтруем рабочие дни по дате и сотруднику
    const filteredWorkDays = workDaysData.filter((day: WorkDay) => {
      // Сравниваем даты как строки YYYY-MM-DD
      const dayDate = typeof day.date === 'string' ? day.date : new Date(day.date).toISOString().split('T')[0];
      const inRange = dayDate >= startDateStr && dayDate <= endDateStr;
      
      // Проверяем, соответствует ли сотрудник, если указан
      const employeeMatch = !employeeId || day.employeeId === employeeId;
      
      console.log(`Проверка записи ${day.id}: дата=${dayDate}, в диапазоне=${inRange}, сотрудник=${employeeMatch}`);
      
      return inRange && employeeMatch;
    });
    
    console.log(`Найдено ${filteredWorkDays.length} записей за указанный период`);
    
    // Группируем данные по сотрудникам
    const reportByEmployee: Record<string, any> = {}
    
    filteredWorkDays.forEach((day: WorkDay) => {
      const empId = day.employeeId
      
      if (!reportByEmployee[empId]) {
        reportByEmployee[empId] = {
          employee: day.employee,
          days: [],
          summary: {
            totalDays: 0,
            workDays: 0,
            daysOff: 0,
            vacation: 0,
            sickLeave: 0,
            absence: 0,
            unpaidLeave: 0,
            totalWorkHours: 0,
            totalTasks: 0,      // Счетчик выполненных задач
            totalConnections: 0 // Счетчик подключений
          }
        }
      }
      
      // Добавляем день в список дней
      reportByEmployee[empId].days.push(day)
      
      // Обновляем статистику
      reportByEmployee[empId].summary.totalDays++
      
      // Подсчитываем статистику по типу дня
      const dayType = day.dayType as DayType
      switch (dayType) {
        case 'WORK_DAY':
          reportByEmployee[empId].summary.workDays++
          
          // Считаем рабочие часы, если есть timeEntry с началом и концом
          if (day.timeEntry?.startTime && day.timeEntry?.endTime) {
            // Правильный подсчет часов из строковых данных формата "HH:MM"
            const calculateHours = (start: string, end: string, 
                                   lunchStart?: string | null, lunchEnd?: string | null) => {
              // Парсим часы и минуты
              const [startHours, startMinutes] = start.split(':').map(Number)
              const [endHours, endMinutes] = end.split(':').map(Number)
              
              // Вычисляем общее количество минут
              let totalMinutes = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes)
              
              // Вычитаем время обеда, если указано
              if (lunchStart && lunchEnd) {
                const [lunchStartHours, lunchStartMinutes] = lunchStart.split(':').map(Number)
                const [lunchEndHours, lunchEndMinutes] = lunchEnd.split(':').map(Number)
                
                const lunchMinutes = (lunchEndHours * 60 + lunchEndMinutes) - 
                                    (lunchStartHours * 60 + lunchStartMinutes)
                
                totalMinutes -= Math.max(0, lunchMinutes)
              }
              
              return Math.max(0, totalMinutes / 60)
            }
            
            try {
              const hours = calculateHours(
                day.timeEntry.startTime, 
                day.timeEntry.endTime,
                day.timeEntry.lunchStartTime, 
                day.timeEntry.lunchEndTime
              )
              
              reportByEmployee[empId].summary.totalWorkHours += hours
              
              console.log(`Рассчитано ${hours} часов для сотрудника ${empId} в день ${day.date}`);
            } catch (error) {
              console.error(`Ошибка при расчете часов для записи ${day.id}:`, error)
            }
          }
          
          // Добавляем статистику по задачам и подключениям
          if (day.workStats) {
            reportByEmployee[empId].summary.totalTasks += day.workStats.tasksCompleted || 0
            reportByEmployee[empId].summary.totalConnections += day.workStats.connectionsEstablished || 0
            
            console.log(`Учтено ${day.workStats.tasksCompleted || 0} задач и ${day.workStats.connectionsEstablished || 0} подключений`);
          }
          break
        case 'DAY_OFF':
          reportByEmployee[empId].summary.daysOff++
          break
        case 'VACATION':
          reportByEmployee[empId].summary.vacation++
          break
        case 'SICK_LEAVE':
          reportByEmployee[empId].summary.sickLeave++
          break
        case 'ABSENCE':
          reportByEmployee[empId].summary.absence++
          break
        case 'UNPAID_LEAVE':
          reportByEmployee[empId].summary.unpaidLeave++
          break
      }
    });
    
    // Преобразуем объект в массив для удобства использования на клиенте
    const report = Object.values(reportByEmployee)
    
    return NextResponse.json({
      period: {
        startDate,
        endDate
      },
      report
    })
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { error: 'Не удалось сгенерировать отчет' },
      { status: 500 }
    )
  }
} 