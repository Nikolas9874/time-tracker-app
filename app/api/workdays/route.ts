import { NextRequest, NextResponse } from 'next/server'
import { mockEmployees } from '@/lib/mockData'
import { WorkDay, DayType, Employee } from '@/lib/types'

// Объявляем массив для хранения данных в памяти
let workDaysData: WorkDay[] = []

// Функция для сохранения данных в localStorage на клиентской стороне
// (Будет вызываться при изменении данных)
const saveWorkDaysData = () => {
  // В серверном компоненте localStorage недоступен
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('workdays_data', JSON.stringify(workDaysData));
      console.log(`Сохранено ${workDaysData.length} записей в localStorage`);
    } catch (e) {
      console.error('Ошибка сохранения в localStorage:', e);
    }
  }
}

// Инициализация базы данных - попытка восстановить из localStorage
// или создание тестовых данных, если ничего не найдено
const initWorkDaysData = () => {
  // Сначала пытаемся загрузить данные из файловой системы
  try {
    const fs = require('fs');
    const path = require('path');
    const dataFilePath = path.join(process.cwd(), 'workdays_data.json');
    
    if (fs.existsSync(dataFilePath)) {
      try {
        const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
        if (Array.isArray(data) && data.length > 0) {
          // Преобразуем даты обратно в объекты Date, где необходимо
          workDaysData = data.map((wd: any) => ({
            ...wd,
            createdAt: new Date(wd.createdAt),
            updatedAt: new Date(wd.updatedAt),
            timeEntry: wd.timeEntry ? {
              ...wd.timeEntry,
              createdAt: new Date(wd.timeEntry.createdAt),
              updatedAt: new Date(wd.timeEntry.updatedAt)
            } : null
          }));
          console.log(`Восстановлено ${workDaysData.length} записей из файла`);
          return;
        }
      } catch (e) {
        console.error('Ошибка чтения из файла:', e);
      }
    }
  } catch (e) {
    console.error('Ошибка при попытке доступа к файловой системе:', e);
  }
  
  console.log('===== СОЗДАНИЕ ТЕСТОВЫХ ДАННЫХ =====');

  // Создаем тестовые данные на сегодня
  const todayDateStr = new Date().toISOString().split('T')[0];
  console.log(`Создаём данные на дату: ${todayDateStr}`);

  // Создаем записи для всех сотрудников
  mockEmployees.forEach((employee: Employee) => {
    const workDayId = `wd-${employee.id}-${todayDateStr}`;
    const timeEntryId = `te-${employee.id}-${todayDateStr}`;

    // Создаём тестовую запись
    const workDay: WorkDay = {
      id: workDayId,
      employeeId: employee.id,
      // Храним только дату в виде строки YYYY-MM-DD без времени
      date: todayDateStr,
      dayType: 'WORK_DAY',
      comment: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      employee,
      timeEntry: {
        id: timeEntryId,
        startTime: '08:00',
        endTime: '18:00',
        lunchStartTime: '13:00',
        lunchEndTime: '14:00',
        workDayId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      workStats: {
        tasksCompleted: 5,
        connectionsEstablished: 3
      }
    };

    workDaysData.push(workDay);
  });

  console.log(`База содержит ${workDaysData.length} записей`);
  
  // Сохраняем созданные данные в файл
  saveWorkDaysToFile();
}

// Функция для сохранения данных в файл
const saveWorkDaysToFile = () => {
  try {
    const fs = require('fs');
    const path = require('path');
    const dataFilePath = path.join(process.cwd(), 'workdays_data.json');
    
    fs.writeFileSync(dataFilePath, JSON.stringify(workDaysData, null, 2), 'utf8');
    console.log(`Сохранено ${workDaysData.length} записей в файл`);
  } catch (e) {
    console.error('Ошибка сохранения в файл:', e);
  }
}

// Инициализируем базу данных при запуске
initWorkDaysData();

// GET /api/workdays?date=YYYY-MM-DD - получить рабочие дни на указанную дату
export async function GET(request: NextRequest) {
  // Получаем дату из запроса
  const { searchParams } = new URL(request.url)
  const dateParam = searchParams.get('date')
  
  if (!dateParam) {
    return NextResponse.json(
      { error: 'Date parameter is required' },
      { status: 400 }
    )
  }
  
  console.log(`Запрошены рабочие дни на дату: ${dateParam}`);
  
  // Фильтруем рабочие дни по дате (строгое сравнение строк)
  const filteredWorkDays = workDaysData.filter(workDay => {
    // Сравниваем строки напрямую - обе даты хранятся в формате YYYY-MM-DD
    const match = workDay.date === dateParam;
    if (match) {
      console.log(`Найдена запись: id=${workDay.id}`);
    }
    return match;
  });
  
  console.log(`Найдено ${filteredWorkDays.length} записей на дату ${dateParam}`);
  
  // Дополняем информацией о сотруднике, если её ещё нет
  const workDaysWithEmployees = filteredWorkDays.map(workDay => {
    if (workDay.employee) return workDay;
    
    const employee = mockEmployees.find((emp: Employee) => emp.id === workDay.employeeId);
    
    return {
      ...workDay,
      employee: employee || null
    };
  });
  
  return NextResponse.json(workDaysWithEmployees);
}

// POST /api/workdays - создать или обновить рабочий день для сотрудника
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    console.log('Получены данные для сохранения:', data);
    
    // Проверяем обязательные поля
    if (!data.employeeId || !data.date || !data.dayType) {
      return NextResponse.json(
        { error: 'Required fields are missing' },
        { status: 400 }
      );
    }
    
    // Дату храним в виде строки YYYY-MM-DD без времени
    const dateStr = data.date; 
    const workDayId = `wd-${data.employeeId}-${dateStr}`;
    const timeEntryId = `te-${data.employeeId}-${dateStr}`;
    
    console.log(`Создаем/обновляем запись с ID: ${workDayId}, дата: ${dateStr}`);
    
    // Находим сотрудника
    let employee = data.employee;
    
    if (!employee || employee.id !== data.employeeId) {
      employee = mockEmployees.find((emp: Employee) => emp.id === data.employeeId);
    }
    
    // Если сотрудник не найден, создаем базовый объект
    if (!employee) {
      employee = {
        id: data.employeeId,
        name: "Неизвестный сотрудник",
        position: "Должность не указана",
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
    
    // Создаем или обновляем запись времени
    let timeEntry = null;
    const dayType = data.dayType as DayType;
    
    if (dayType === 'WORK_DAY') {
      // Нормализуем формат времени HH:MM
      const normalizeTime = (time: string | null | undefined): string | null => {
        if (!time) return null;
        
        try {
          // Если это уже формат HH:MM
          if (/^\d{1,2}:\d{2}$/.test(time)) {
            const [hours, minutes] = time.split(':').map(Number);
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          }
          
          // Если это ISO строка, извлекаем время
          const match = time.match(/T(\d{2}:\d{2})/);
          if (match && match[1]) {
            return match[1];
          }
          
          return null;
        } catch (e) {
          console.error('Ошибка нормализации времени:', time, e);
          return null;
        }
      };
      
      const startTime = normalizeTime(data.startTime);
      const endTime = normalizeTime(data.endTime);
      const lunchStartTime = normalizeTime(data.lunchStartTime);
      const lunchEndTime = normalizeTime(data.lunchEndTime);
      
      if (startTime || endTime) {
        timeEntry = {
          id: timeEntryId,
          startTime,
          endTime,
          lunchStartTime,
          lunchEndTime,
          workDayId,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }
    }
    
    // Создаем итоговый объект рабочего дня
    const workDay: WorkDay = {
      id: workDayId,
      employeeId: data.employeeId,
      date: dateStr, // Храним как строку
      dayType,
      comment: data.comment || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      timeEntry,
      employee,
      workStats: dayType === 'WORK_DAY' ? {
        tasksCompleted: data.tasksCompleted || 0,
        connectionsEstablished: data.connectionsEstablished || 0
      } : undefined
    };
    
    // Логируем созданный объект
    console.log('Созданный объект рабочего дня:', {
      id: workDay.id,
      employeeId: workDay.employeeId,
      date: workDay.date,
      dayType: workDay.dayType,
      timeEntry: workDay.timeEntry ? {
        startTime: workDay.timeEntry.startTime,
        endTime: workDay.timeEntry.endTime
      } : null
    });
    
    // Обновляем или добавляем запись в базу
    const existingIndex = workDaysData.findIndex(wd => wd.id === workDayId);
    
    if (existingIndex >= 0) {
      console.log(`Обновляем существующую запись с индексом ${existingIndex}`);
      workDaysData[existingIndex] = workDay;
    } else {
      console.log('Добавляем новую запись');
      workDaysData.push(workDay);
    }
    
    // Выводим информацию о базе данных после обновления
    console.log(`База данных содержит ${workDaysData.length} записей`);
    
    // Сохраняем обновленные данные в файловой системе
    saveWorkDaysToFile();
    
    return NextResponse.json(workDay);
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 