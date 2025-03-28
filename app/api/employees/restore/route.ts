import { NextRequest, NextResponse } from 'next/server';
import { Employee } from '@/lib/types';
import { mockEmployees } from '@/lib/mockData';

// Глобальная переменная для хранения данных о сотрудниках
let employees: Employee[] = [...mockEmployees];

/**
 * Обработчик POST-запроса для восстановления данных о сотрудниках из резервной копии
 * 
 * @param request Объект запроса
 * @returns Ответ с результатом операции
 */
export async function POST(request: NextRequest) {
  try {
    // Получаем данные из тела запроса
    const data = await request.json();
    
    if (!data.employees || !Array.isArray(data.employees)) {
      return NextResponse.json({ error: 'Некорректный формат данных' }, { status: 400 });
    }
    
    // Валидация данных
    const validEmployees = data.employees.filter((employee: any) => 
      employee.id && 
      employee.name && 
      employee.position &&
      typeof employee.id === 'string' && 
      typeof employee.name === 'string' && 
      typeof employee.position === 'string'
    );
    
    if (validEmployees.length === 0) {
      return NextResponse.json({ error: 'Отсутствуют валидные данные о сотрудниках' }, { status: 400 });
    }
    
    console.log(`Восстановление данных: найдено ${validEmployees.length} сотрудников`);
    
    // Обновляем глобальную переменную
    employees = [...validEmployees];
    
    // Возвращаем успешный ответ
    return NextResponse.json({ 
      success: true, 
      count: validEmployees.length,
      message: `Восстановлено ${validEmployees.length} записей о сотрудниках`
    });
  } catch (error) {
    console.error('Ошибка при восстановлении данных о сотрудниках:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
} 