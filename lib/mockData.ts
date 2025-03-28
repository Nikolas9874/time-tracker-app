import { Employee, WorkDay, DayType, UserRole, User } from '@/lib/types'
import { v4 as uuidv4 } from 'uuid'

// Тестовые данные сотрудников
export const mockEmployees: Employee[] = [
  {
    id: 'emp-1',
    name: 'Иванов Иван',
    position: 'Разработчик',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  },
  {
    id: 'emp-2',
    name: 'Петрова Анна',
    position: 'Дизайнер',
    createdAt: new Date('2023-01-02'),
    updatedAt: new Date('2023-01-02')
  },
  {
    id: 'emp-3',
    name: 'Сидоров Алексей',
    position: 'Менеджер проекта',
    createdAt: new Date('2023-01-03'),
    updatedAt: new Date('2023-01-03')
  },
  {
    id: 'emp-4',
    name: 'Смирнова Екатерина',
    position: 'Тестировщик',
    createdAt: new Date('2023-01-04'),
    updatedAt: new Date('2023-01-04')
  },
  {
    id: 'emp-5',
    name: 'Козлов Дмитрий',
    position: 'Системный администратор',
    createdAt: new Date('2023-01-05'),
    updatedAt: new Date('2023-01-05')
  }
]

// Тестовые пользователи
export const mockUsers: User[] = [
  {
    id: 'user-1',
    username: 'admin',
    email: 'admin@example.com',
    // пароль "admin123" (простой текст для тестирования)
    password: 'admin123',
    name: 'Администратор',
    role: 'ADMIN',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'user-2',
    username: 'manager',
    // пароль "manager123" (простой текст для тестирования)
    password: 'manager123',
    name: 'Менеджер',
    role: 'MANAGER',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'user-3',
    username: 'user',
    // пароль "user123" (простой текст для тестирования)
    password: 'user123',
    name: 'Пользователь',
    role: 'USER',
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

// Функция форматирования времени в строку HH:MM
const formatTime = (hours: number, minutes: number): string => {
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

// Функция для генерации демо-данных рабочих дней
const generateWorkDay = (
  employeeId: string, 
  dateStr: string, 
  dayType: DayType = 'WORK_DAY', 
  startHour = 8, 
  endHour = 18
): WorkDay => {
  const id = `wd-${employeeId}-${dateStr}`;
  const timeEntryId = `te-${employeeId}-${dateStr}`;
  
  // Создаем чистую дату без времени для корректного хранения
  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);
  
  // Находим сотрудника по ID
  const employee = mockEmployees.find(emp => emp.id === employeeId)!;
  
  // Создаем запись времени для рабочего дня
  let timeEntry = null;
  
  if (dayType === 'WORK_DAY') {
    timeEntry = {
      id: timeEntryId,
      startTime: formatTime(startHour, 0),
      endTime: formatTime(endHour, 0),
      lunchStartTime: formatTime(13, 0),
      lunchEndTime: formatTime(14, 0),
      workDayId: id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
  
  return {
    id,
    employeeId,
    date,
    dayType,
    comment: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    employee,
    timeEntry,
    workStats: dayType === 'WORK_DAY' ? {
      tasksCompleted: Math.floor(Math.random() * 10),
      connectionsEstablished: Math.floor(Math.random() * 7)
    } : undefined
  };
};

// Создаем новую пустую базу данных
export const mockWorkDays: WorkDay[] = [];

// Получаем текущую дату для демо-данных
const today = new Date();
const todayStr = today.toISOString().split('T')[0];

// Создаем тестовые данные для всех сотрудников на сегодня
mockEmployees.forEach((employee, index) => {
  if (index % 3 === 0) {
    // Рабочий день с утра до вечера (8:00-18:00)
    mockWorkDays.push(generateWorkDay(employee.id, todayStr, 'WORK_DAY', 8, 18));
  } else if (index % 3 === 1) {
    // Рабочий день с короткими часами (10:00-17:00)
    mockWorkDays.push(generateWorkDay(employee.id, todayStr, 'WORK_DAY', 10, 17));
  } else {
    // Отпуск
    mockWorkDays.push(generateWorkDay(employee.id, todayStr, 'VACATION'));
  }
});

// Создаем данные на вчерашний день для демонстрации навигации
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);
const yesterdayStr = yesterday.toISOString().split('T')[0];

mockEmployees.forEach((employee, index) => {
  if (index % 4 === 0) {
    // Больничный
    mockWorkDays.push(generateWorkDay(employee.id, yesterdayStr, 'SICK_LEAVE'));
  } else {
    // Рабочий день
    mockWorkDays.push(generateWorkDay(employee.id, yesterdayStr, 'WORK_DAY', 9, 18));
  }
});

// Активные сессии
let userSessions: Record<string, string> = {}; 