import { NextRequest, NextResponse } from 'next/server';
import { WorkDay } from '@/lib/types';
import { mockWorkDays } from '@/lib/mockData';
import path from 'path';
import fs from 'fs';

// Глобальная переменная для хранения данных о рабочих днях
let workdays: WorkDay[] = [...(mockWorkDays || [])];

/**
 * Обработчик POST-запроса для восстановления данных о рабочих днях из резервной копии
 * 
 * @param request Объект запроса
 * @returns Ответ с результатом операции
 */
export async function POST(request: NextRequest) {
  try {
    // Получаем данные из тела запроса
    const data = await request.json();
    
    if (!data.workdays || !Array.isArray(data.workdays)) {
      return NextResponse.json({ error: 'Некорректный формат данных' }, { status: 400 });
    }
    
    // Валидация данных
    const validWorkdays = data.workdays.filter((workday: any) => 
      workday.id && 
      workday.employeeId && 
      workday.date &&
      typeof workday.id === 'string' && 
      typeof workday.employeeId === 'string' && 
      typeof workday.date === 'string'
    );
    
    if (validWorkdays.length === 0) {
      return NextResponse.json({ error: 'Отсутствуют валидные данные о рабочих днях' }, { status: 400 });
    }
    
    console.log(`Восстановление данных: найдено ${validWorkdays.length} рабочих дней`);
    
    // Обновляем глобальную переменную
    workdays = [...validWorkdays];
    
    // Возвращаем успешный ответ
    return NextResponse.json({ 
      success: true, 
      count: validWorkdays.length,
      message: `Восстановлено ${validWorkdays.length} записей о рабочих днях`
    });
  } catch (error) {
    console.error('Ошибка при восстановлении данных о рабочих днях:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
} 