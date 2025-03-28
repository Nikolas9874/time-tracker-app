import { NextRequest, NextResponse } from 'next/server'
import { mockEmployees } from '@/lib/mockData'
import { Employee } from '@/lib/types'
import { v4 as uuidv4 } from 'uuid'

// Создаем массив для хранения данных о сотрудниках
let employeesData: Employee[] = []

// Функция для сохранения данных в файл
const saveEmployeesToFile = () => {
  try {
    const fs = require('fs');
    const path = require('path');
    const dataFilePath = path.join(process.cwd(), 'employees_data.json');
    
    fs.writeFileSync(dataFilePath, JSON.stringify(employeesData, null, 2), 'utf8');
    console.log(`Сохранено ${employeesData.length} сотрудников в файл`);
  } catch (e) {
    console.error('Ошибка сохранения сотрудников в файл:', e);
  }
}

// Инициализация базы данных сотрудников
const initEmployeesData = () => {
  // Сначала пытаемся загрузить данные из файловой системы
  try {
    const fs = require('fs');
    const path = require('path');
    const dataFilePath = path.join(process.cwd(), 'employees_data.json');
    
    if (fs.existsSync(dataFilePath)) {
      try {
        const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
        if (Array.isArray(data) && data.length > 0) {
          // Преобразуем даты обратно в объекты Date
          employeesData = data.map((emp: any) => ({
            ...emp,
            createdAt: new Date(emp.createdAt),
            updatedAt: new Date(emp.updatedAt)
          }));
          console.log(`Восстановлено ${employeesData.length} сотрудников из файла`);
          return;
        }
      } catch (e) {
        console.error('Ошибка чтения сотрудников из файла:', e);
      }
    }
  } catch (e) {
    console.error('Ошибка при попытке доступа к файловой системе:', e);
  }
  
  // Если не удалось загрузить из файла, используем тестовые данные
  console.log('===== ИНИЦИАЛИЗАЦИЯ ТЕСТОВЫХ СОТРУДНИКОВ =====');
  employeesData = mockEmployees.map(emp => ({
    ...emp,
    createdAt: new Date(emp.createdAt),
    updatedAt: new Date(emp.updatedAt)
  }));
  console.log(`Инициализировано ${employeesData.length} тестовых сотрудников`);
  
  // Сохраняем тестовые данные в файл
  saveEmployeesToFile();
}

// Инициализируем базу данных при запуске
initEmployeesData();

// GET /api/employees - получить список всех сотрудников
export async function GET(request: NextRequest) {
  console.log(`Запрошен список сотрудников. В базе ${employeesData.length} записей`);
  return NextResponse.json(employeesData)
}

// POST /api/employees - создать нового сотрудника
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    if (!data.name || !data.position) {
      return NextResponse.json(
        { error: 'Name and position are required' },
        { status: 400 }
      )
    }
    
    const employee: Employee = {
      id: uuidv4(),
      name: data.name,
      position: data.position,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    employeesData.push(employee)
    console.log(`Создан новый сотрудник: ${employee.name}, id: ${employee.id}`)
    
    // Сохраняем обновленные данные
    saveEmployeesToFile();
    
    return NextResponse.json(employee)
  } catch (error) {
    console.error('Error creating employee:', error)
    return NextResponse.json(
      { error: 'Failed to create employee' },
      { status: 500 }
    )
  }
}

// DELETE /api/employees/:id - удалить сотрудника
export async function DELETE(request: NextRequest) {
  const url = new URL(request.url)
  const id = url.pathname.split('/').pop()
  
  if (!id) {
    return NextResponse.json(
      { error: 'Employee ID is required' },
      { status: 400 }
    )
  }
  
  const index = employeesData.findIndex(emp => emp.id === id)
  
  if (index === -1) {
    return NextResponse.json(
      { error: 'Employee not found' },
      { status: 404 }
    )
  }
  
  // Удаляем сотрудника
  const deleted = employeesData.splice(index, 1)[0]
  console.log(`Удален сотрудник: ${deleted.name}, id: ${deleted.id}`)
  
  // Сохраняем обновленные данные
  saveEmployeesToFile();
  
  return NextResponse.json({ success: true })
}

// PUT /api/employees/:id - обновить данные сотрудника
export async function PUT(request: NextRequest) {
  const url = new URL(request.url)
  const id = url.pathname.split('/').pop()
  
  if (!id) {
    return NextResponse.json(
      { error: 'Employee ID is required' },
      { status: 400 }
    )
  }
  
  try {
    const data = await request.json()
    
    if (!data.name || !data.position) {
      return NextResponse.json(
        { error: 'Name and position are required' },
        { status: 400 }
      )
    }
    
    const index = employeesData.findIndex(emp => emp.id === id)
    
    if (index === -1) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }
    
    // Обновляем данные сотрудника
    const updated: Employee = {
      ...employeesData[index],
      name: data.name,
      position: data.position,
      updatedAt: new Date()
    }
    
    employeesData[index] = updated
    console.log(`Обновлен сотрудник: ${updated.name}, id: ${updated.id}`)
    
    // Сохраняем обновленные данные
    saveEmployeesToFile();
    
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating employee:', error)
    return NextResponse.json(
      { error: 'Failed to update employee' },
      { status: 500 }
    )
  }
} 