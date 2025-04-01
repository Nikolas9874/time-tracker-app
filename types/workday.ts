import { Employee } from './employee'

export type DayType = 'WORK_DAY' | 'DAY_OFF' | 'VACATION' | 'SICK_LEAVE' | 'ABSENCE' | 'UNPAID_LEAVE'

export interface TimeEntry {
  startTime: Date
  endTime: Date
  lunchStartTime?: Date | null
  lunchEndTime?: Date | null
}

export interface Task {
  id: string
  name: string
  description?: string
}

export interface Connection {
  id: string
  name: string
  duration?: number
}

export interface WorkDay {
  id: string
  employeeId: string
  employee: Employee
  date: string
  dayType: DayType
  timeEntry?: TimeEntry | null
  tasks?: Task[]
  connections?: Connection[]
  comment?: string
} 