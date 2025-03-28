import { NextRequest, NextResponse } from 'next/server';
import { Employee, WorkDay } from '@/lib/types';
import { mockEmployees, mockWorkDays } from '@/lib/mockData';
import { v4 as uuidv4 } from 'uuid';

// Глобальные переменные для хранения данных
let employees: Employee[] = [...mockEmployees];
let workdays: WorkDay[] = [...mockWorkDays];

/**
 * Обработчик POST-запроса для обновления данных из внешнего источника
 * 
 * @param request Объект запроса
 * @returns Ответ с результатом операции
 */
export async function POST(request: NextRequest) {
  try {
    // В реальном приложении здесь был бы запрос к внешнему API
    // Для демонстрации мы генерируем новые тестовые данные
    
    const added = {
      employees: 0,
      workdays: 0
    };
    
    const updated = {
      employees: 0,
      workdays: 0
    };
    
    // Симулируем добавление нового сотрудника
    const newEmployee: Employee = {
      id: `emp-${uuidv4().slice(0, 8)}`,
      name: `Новый Сотрудник ${new Date().getTime().toString().slice(-4)}`,
      position: 'Стажер',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    employees.push(newEmployee);
    added.employees++;
    
    // Симулируем обновление информации о случайном сотруднике
    if (employees.length > 1) {
      const randomIndex = Math.floor(Math.random() * (employees.length - 1));
      employees[randomIndex] = {
        ...employees[randomIndex],
        position: `${employees[randomIndex].position} (обновлено)`,
        updatedAt: new Date()
      };
      updated.employees++;
    }
    
    // Симулируем добавление нового рабочего дня для нового сотрудника
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const newWorkDay: WorkDay = {
      id: `wd-${newEmployee.id}-${todayStr}`,
      employeeId: newEmployee.id,
      date: todayStr,
      dayType: 'WORK_DAY',
      comment: 'Создано автоматически',
      timeEntry: {
        id: `te-${newEmployee.id}-${todayStr}`,
        startTime: '09:00',
        endTime: '18:00',
        lunchStartTime: '13:00',
        lunchEndTime: '14:00',
        workDayId: `wd-${newEmployee.id}-${todayStr}`,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      employee: newEmployee,
      workStats: {
        tasksCompleted: Math.floor(Math.random() * 5),
        connectionsEstablished: Math.floor(Math.random() * 3)
      }
    };
    
    workdays.push(newWorkDay);
    added.workdays++;
    
    // Возвращаем успешный ответ с информацией о количестве добавленных и обновленных записей
    return NextResponse.json({
      success: true,
      added: added.employees + added.workdays,
      updated: updated.employees + updated.workdays,
      details: {
        added,
        updated
      },
      message: `Данные успешно обновлены. Добавлено ${added.employees + added.workdays} записей, обновлено ${updated.employees + updated.workdays} записей.`
    });
  } catch (error) {
    console.error('Ошибка при обновлении данных:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
} 