import { Employee } from './employee';
import { WorkDay } from './workday';

// Общие типы для ответов API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Типы для API аутентификации
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    username: string;
    role: string;
  };
  token: string;
}

// Типы для API сотрудников
export interface EmployeeResponse extends ApiResponse<Employee[]> {}
export interface SingleEmployeeResponse extends ApiResponse<Employee> {}

export interface EmployeeCreateRequest {
  name: string;
  email?: string;
  position?: string;
  department?: string;
}

export interface EmployeeUpdateRequest {
  id: string;
  name?: string;
  email?: string;
  position?: string;
  department?: string;
}

// Типы для API рабочих дней
export interface WorkDayResponse extends ApiResponse<WorkDay[]> {}
export interface SingleWorkDayResponse extends ApiResponse<WorkDay> {}

export interface WorkDayCreateRequest {
  employeeId: string;
  date: string;
  dayType: string;
  timeEntry?: {
    startTime?: string | Date;
    endTime?: string | Date;
    lunchStartTime?: string | Date | null;
    lunchEndTime?: string | Date | null;
  } | null;
  tasks?: { id: string; name: string; description?: string }[];
  connections?: { id: string; name: string; duration?: number }[];
  comment?: string;
}

export interface WorkDayUpdateRequest {
  id: string;
  employeeId?: string;
  date?: string;
  dayType?: string;
  timeEntry?: {
    startTime?: string | Date;
    endTime?: string | Date;
    lunchStartTime?: string | Date | null;
    lunchEndTime?: string | Date | null;
  } | null;
  tasks?: { id: string; name: string; description?: string }[];
  connections?: { id: string; name: string; duration?: number }[];
  comment?: string;
}

// Тип для ответа API состояния сервера
export interface HealthResponse {
  status: string;
  timestamp: string;
  version: string;
  env: string;
} 