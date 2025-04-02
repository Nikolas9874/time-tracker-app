import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface WorkDayWithJson {
  id: string
  employeeId: string
  employee: any
  date: Date
  dayType: string
  timeEntry: string | null
  tasks: string | null
  connections: string | null
  comment: string | null
  createdAt: Date
  updatedAt: Date
}

// GET /api/workdays - получение списка рабочих дней с фильтрацией
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const employeeId = searchParams.get('employeeId')
    const date = searchParams.get('date') // Добавляем поддержку просто даты для табеля

    // Поддержка как для reports (с startDate и endDate), так и для timesheet (с date)
    if ((!startDate || !endDate) && !date) {
      return NextResponse.json(
        { error: 'Необходимо указать либо date, либо startDate и endDate' },
        { status: 400 }
      )
    }

    // Создаем объект с условиями запроса
    let where: any = {}

    if (date) {
      // Для табеля - только одна дата
      const dateObj = new Date(date)
      
      // Устанавливаем временные границы для поиска по всему дню
      const startOfDay = new Date(dateObj)
      startOfDay.setHours(0, 0, 0, 0)
      
      const endOfDay = new Date(dateObj)
      endOfDay.setHours(23, 59, 59, 999)
      
      where.date = {
        gte: startOfDay,
        lte: endOfDay
      }
    } else {
      // Для отчетов - диапазон дат
      where.date = {
        gte: new Date(startDate!),
        lte: new Date(`${endDate!}T23:59:59.999Z`)
      }
    }

    // Добавляем фильтр по сотруднику, если указан
    if (employeeId) {
      where.employeeId = employeeId
    }

    // Получаем рабочие дни с учетом фильтров
    const workDays = await db.workDay.findMany({
      where,
      include: {
        employee: true
      },
      orderBy: {
        date: 'asc'
      }
    })

    // Форматируем timeEntry, tasks и connections (преобразуем JSON строки в объекты)
    const formattedWorkDays = workDays.map((day: any) => {
      try {
        // Обработка timeEntry с защитой от ошибок
        let timeEntry = null;
        if (day.timeEntry) {
          try {
            // Проверяем, не является ли timeEntry уже объектом
            if (typeof day.timeEntry === 'object' && !Array.isArray(day.timeEntry)) {
              timeEntry = day.timeEntry;
            } else {
              const parsed = JSON.parse(day.timeEntry);
              // Проверяем, не получили ли мы строку JSON вместо объекта
              if (typeof parsed === 'string') {
                timeEntry = JSON.parse(parsed);
              } else {
                timeEntry = parsed;
              }
            }
          } catch (e) {
            console.error('Ошибка парсинга timeEntry:', e);
            timeEntry = null;
          }
        }

        // Обработка tasks с защитой от ошибок
        let tasks = [];
        if (day.tasks) {
          try {
            tasks = typeof day.tasks === 'object' ? day.tasks : JSON.parse(day.tasks);
            if (typeof tasks === 'string') {
              tasks = JSON.parse(tasks);
            }
          } catch (e) {
            console.error('Ошибка парсинга tasks:', e);
            tasks = [];
          }
        }

        // Обработка connections с защитой от ошибок
        let connections = [];
        if (day.connections) {
          try {
            connections = typeof day.connections === 'object' ? day.connections : JSON.parse(day.connections);
            if (typeof connections === 'string') {
              connections = JSON.parse(connections);
            }
  } catch (e) {
            console.error('Ошибка парсинга connections:', e);
            connections = [];
          }
        }

        return {
          ...day,
          timeEntry,
          tasks,
          connections
        };
      } catch (error) {
        console.error('Ошибка обработки рабочего дня:', error, day);
        return {
          ...day,
          timeEntry: null,
          tasks: [],
          connections: []
        };
      }
    })

    return NextResponse.json(formattedWorkDays)
  } catch (error) {
    console.error('Ошибка при получении рабочих дней:', error)
    return NextResponse.json(
      { error: 'Произошла ошибка при получении рабочих дней' },
      { status: 500 }
    )
  }
}

// POST /api/workdays - создание нового рабочего дня
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Проверка обязательных полей
    if (!data.employeeId || !data.date || !data.dayType) {
      return NextResponse.json(
        { error: 'Отсутствуют обязательные поля: employeeId, date, dayType' },
        { status: 400 }
      )
    }

    // Проверяем, существует ли уже запись для этого сотрудника и даты
    const existingWorkDay = await db.workDay.findFirst({
      where: {
        employeeId: data.employeeId,
        date: new Date(data.date)
      }
    })

    if (existingWorkDay) {
      return NextResponse.json(
        { error: 'Запись для этого сотрудника и даты уже существует' },
        { status: 409 }
      )
    }

    // Удаляем лишние поля
    const { id, employee, createdAt, updatedAt, ...createData } = data

    // Проверяем, является ли timeEntry уже строкой JSON
    let timeEntryData = createData.timeEntry
    if (timeEntryData) {
      try {
        // Если timeEntry - это объект, сериализуем его
        if (typeof timeEntryData === 'object') {
          timeEntryData = JSON.stringify(timeEntryData)
        } 
        // Если это строка, проверяем, не является ли она уже сериализованным JSON
        else if (typeof timeEntryData === 'string') {
          try {
            // Пробуем распарсить - если успешно, значит это валидный JSON
            const parsed = JSON.parse(timeEntryData)
            // Если parsed - строка, возможно это двойная сериализация
            if (typeof parsed === 'string') {
              try {
                // Пробуем распарсить еще раз
                JSON.parse(parsed)
                // Если дошли сюда без ошибок, значит это была двойная сериализация
                // Оставляем как есть, т.к. первый JSON.parse уже вернул правильный формат
                timeEntryData = parsed
              } catch (e) {
                // Если не удалось распарсить второй раз, то первый парсинг был корректным
                timeEntryData = JSON.stringify(parsed)
              }
            } else {
              // Если parsed не строка, то первоначальная строка была корректным JSON
              // Просто обеспечиваем, что это валидный JSON-формат
              timeEntryData = JSON.stringify(parsed)
            }
          } catch (e) {
            // Если не удалось распарсить, то это не JSON - сериализуем
            timeEntryData = JSON.stringify(timeEntryData)
          }
        }
      } catch (error) {
        console.error('Ошибка обработки timeEntry:', error)
        timeEntryData = null
      }
    }

    // Форматируем данные перед сохранением
    const formattedData = {
      ...createData,
      date: new Date(createData.date),
      timeEntry: timeEntryData,
      tasks: createData.tasks ? (typeof createData.tasks === 'string' ? createData.tasks : JSON.stringify(createData.tasks)) : null,
      connections: createData.connections ? (typeof createData.connections === 'string' ? createData.connections : JSON.stringify(createData.connections)) : null
    }

    // Создаем новый рабочий день
    const newWorkDay = await db.workDay.create({
      data: formattedData,
      include: {
        employee: true
      }
    })

    // Форматируем ответ
    const result = {
      ...newWorkDay,
      timeEntry: newWorkDay.timeEntry ? JSON.parse(newWorkDay.timeEntry as string) : null,
      tasks: newWorkDay.tasks ? JSON.parse(newWorkDay.tasks as string) : [],
      connections: newWorkDay.connections ? JSON.parse(newWorkDay.connections as string) : []
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    // Расширенная обработка ошибок
    console.error('Ошибка при создании рабочего дня:', error)
    let errorMessage = 'Произошла ошибка при создании рабочего дня'
    
    if (error.message) {
      errorMessage += `: ${error.message}`
    }
    
    if (error.code) {
      errorMessage += ` (код: ${error.code})`
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

// PUT /api/workdays - обновление рабочего дня
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    
    console.log('Получен запрос на обновление рабочего дня:', {
      id: data.id,
      employeeId: data.employeeId,
      dayType: data.dayType
    })
    
    // Проверка ID
    if (!data.id) {
      console.log('Ошибка: отсутствует ID записи')
      return NextResponse.json(
        { error: 'Отсутствует ID записи' },
        { status: 400 }
      )
    }

    try {
      // Получаем существующую запись
      const existingWorkDay = await db.workDay.findUnique({
        where: { id: data.id }
      })

      if (!existingWorkDay) {
        console.log(`Ошибка: запись с ID ${data.id} не найдена`)
        return NextResponse.json(
          { error: 'Запись не найдена' },
          { status: 404 }
        )
      }

      // Подготавливаем данные для обновления
      // Удаляем поля, которые не должны быть в запросе обновления
      const { employee, employeeId, createdAt, updatedAt, ...updateData } = data
      
      // Проверяем, является ли timeEntry уже строкой JSON
      let timeEntryData = updateData.timeEntry
      if (timeEntryData && typeof timeEntryData === 'object') {
        timeEntryData = JSON.stringify(timeEntryData)
      }
      
      // Форматируем данные перед обновлением
      const formattedData = {
        ...updateData,
        date: updateData.date ? new Date(updateData.date) : undefined,
        timeEntry: timeEntryData,
        tasks: updateData.tasks ? (typeof updateData.tasks === 'string' ? updateData.tasks : JSON.stringify(updateData.tasks)) : undefined,
        connections: updateData.connections ? (typeof updateData.connections === 'string' ? updateData.connections : JSON.stringify(updateData.connections)) : undefined
      }

      // Обновляем запись
      const updatedWorkDay = await db.workDay.update({
        where: { id: data.id },
        data: formattedData,
        include: {
          employee: true
        }
      })

      console.log('Запись успешно обновлена:', {
        id: updatedWorkDay.id,
        dayType: updatedWorkDay.dayType
      })

      // Форматируем ответ
      const result = {
        ...updatedWorkDay,
        timeEntry: updatedWorkDay.timeEntry ? JSON.parse(updatedWorkDay.timeEntry as string) : null,
        tasks: updatedWorkDay.tasks ? JSON.parse(updatedWorkDay.tasks as string) : [],
        connections: updatedWorkDay.connections ? JSON.parse(updatedWorkDay.connections as string) : []
      }

      return NextResponse.json(result)
    } catch (dbError) {
      console.error('Ошибка при работе с базой данных:', dbError)
      throw dbError
    }
  } catch (error: any) {
    // Расширенная обработка ошибок
    console.error('Ошибка при обновлении рабочего дня:', error)
    let errorMessage = 'Произошла ошибка при обновлении рабочего дня'
    
    if (error.message) {
      errorMessage += `: ${error.message}`
    }
    
    if (error.code) {
      errorMessage += ` (код: ${error.code})`
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

// DELETE /api/workdays - удаление рабочего дня
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Отсутствует ID записи' },
        { status: 400 }
      )
    }

    // Проверяем существование записи
    const existingWorkDay = await db.workDay.findUnique({
      where: { id }
    })

    if (!existingWorkDay) {
      return NextResponse.json(
        { error: 'Запись не найдена' },
        { status: 404 }
      )
    }

    // Удаляем запись
    await db.workDay.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Ошибка при удалении рабочего дня:', error)
    return NextResponse.json(
      { error: 'Произошла ошибка при удалении рабочего дня' },
      { status: 500 }
    )
  }
} 