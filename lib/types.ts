// Типы для рабочих дней
export type DayType = 'WORK_DAY' | 'DAY_OFF' | 'VACATION' | 'SICK_LEAVE' | 'ABSENCE' | 'UNPAID_LEAVE'

// Типы ролей пользователей
export type UserRole = 'ADMIN' | 'MANAGER' | 'USER' | 'OPERATOR'

// Модель пользователя
export interface User {
  id: string
  username: string
  email?: string
  password: string // Хранится в хешированном виде
  name: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

// Данные сессии
export interface Session {
  id: string
  userId: string
  token: string
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
  user?: User
}

export interface Employee {
  id: string
  name: string
  position: string
  createdAt: Date
  updatedAt: Date
}

export interface TimeEntry {
  id: string
  startTime: string | null
  endTime: string | null
  lunchStartTime: string | null
  lunchEndTime: string | null
  workDayId: string
  createdAt: Date
  updatedAt: Date
}

export interface WorkDay {
  id: string
  employeeId: string
  date: Date | string
  dayType: DayType
  comment: string | null
  timeEntry: TimeEntry | null
  createdAt: Date
  updatedAt: Date
  employee: Employee
  workStats?: WorkStats
}

// Типы для переводов названий типов дней
export const DAY_TYPE_LABELS: Record<DayType, string> = {
  WORK_DAY: 'Рабочий день',
  DAY_OFF: 'Выходной',
  VACATION: 'Отпуск',
  SICK_LEAVE: 'Больничный',
  ABSENCE: 'Отсутствие',
  UNPAID_LEAVE: 'Неоплачиваемый'
}

// Тип для данных отчета по сотруднику
export interface EmployeeReport {
  employee: Employee
  days: WorkDay[]
  summary: {
    totalDays: number
    workDays: number
    daysOff: number
    vacation: number
    sickLeave: number
    absence: number
    unpaidLeave: number
    totalWorkHours: number
    totalTasks: number         // Количество выполненных задач
    totalConnections: number   // Количество подключений
  }
}

// Тип для полного отчета
export interface Report {
  period: {
    startDate: Date
    endDate: Date
  }
  report: EmployeeReport[]
}

// Интерфейс для статистики рабочего дня
export interface WorkStats {
  tasksCompleted: number // Количество выполненных заданий
  connectionsEstablished: number // Количество подключений
} 