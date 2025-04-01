import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/employees - получить список всех сотрудников
export async function GET(request: NextRequest) {
  try {
    console.log('Запрошен список сотрудников')
    
    // Используем Prisma для получения сотрудников
    const employees = await db.employee.findMany({
      orderBy: {
        name: 'asc'
      }
    })
    
    console.log(`Получено ${employees.length} сотрудников`)
    
    return NextResponse.json(employees)
  } catch (error) {
    console.error('Ошибка при получении сотрудников:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении списка сотрудников' },
      { status: 500 }
    )
  }
}

// POST /api/employees - создать нового сотрудника
export async function POST(request: NextRequest) {
  try {
    console.log('Начало обработки POST запроса для создания сотрудника')
    const data = await request.json()
    
    console.log('Получены данные:', JSON.stringify(data))
    
    if (!data.name) {
      console.log('Ошибка: отсутствует имя сотрудника')
      return NextResponse.json(
        { error: 'Имя сотрудника обязательно' },
        { status: 400 }
      )
    }
    
    // Создаем сотрудника через Prisma
    const employee = await db.employee.create({
      data: {
        name: data.name.trim(),
        position: data.position?.trim() || null,
        department: data.department?.trim() || null,
        email: data.email?.trim() || null
      }
    })
    
    console.log(`Создан новый сотрудник: ${employee.name}, id: ${employee.id}`)
    
    return NextResponse.json(employee)
  } catch (error) {
    console.error('Ошибка при создании сотрудника:', error)
    return NextResponse.json(
      { error: 'Не удалось создать сотрудника' },
      { status: 500 }
    )
  }
}

// PUT /api/employees - обновить данные сотрудника
export async function PUT(request: NextRequest) {
  try {
    console.log('Начало обработки PUT запроса для обновления сотрудника')
    const data = await request.json()
    
    if (!data.id) {
      console.log('Ошибка: ID сотрудника отсутствует')
      return NextResponse.json(
        { error: 'ID сотрудника обязателен' },
        { status: 400 }
      )
    }
    
    if (!data.name) {
      console.log('Ошибка: отсутствует имя сотрудника')
      return NextResponse.json(
        { error: 'Имя сотрудника обязательно' },
        { status: 400 }
      )
    }
    
    // Проверяем существование сотрудника
    const existingEmployee = await db.employee.findUnique({
      where: { id: data.id }
    })
    
    if (!existingEmployee) {
      console.log(`Сотрудник с ID ${data.id} не найден`)
      return NextResponse.json(
        { error: 'Сотрудник не найден' },
        { status: 404 }
      )
    }
    
    // Обновляем сотрудника через Prisma
    const updatedEmployee = await db.employee.update({
      where: { id: data.id },
      data: {
        name: data.name.trim(),
        position: data.position?.trim() || null,
        department: data.department?.trim() || null,
        email: data.email?.trim() || null
      }
    })
    
    console.log(`Обновлен сотрудник: ${updatedEmployee.name}, id: ${updatedEmployee.id}`)
    
    return NextResponse.json(updatedEmployee)
  } catch (error) {
    console.error('Ошибка при обновлении сотрудника:', error)
    return NextResponse.json(
      { error: 'Не удалось обновить сотрудника' },
      { status: 500 }
    )
  }
}

// DELETE /api/employees - удалить сотрудника
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID сотрудника обязателен' },
        { status: 400 }
      )
    }
    
    // Проверяем существование сотрудника
    const existingEmployee = await db.employee.findUnique({
      where: { id }
    })
    
    if (!existingEmployee) {
      return NextResponse.json(
        { error: 'Сотрудник не найден' },
        { status: 404 }
      )
    }
    
    // Удаляем сотрудника через Prisma
    await db.employee.delete({
      where: { id }
    })
    
    console.log(`Удален сотрудник: ${existingEmployee.name}, id: ${existingEmployee.id}`)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Ошибка при удалении сотрудника:', error)
    return NextResponse.json(
      { error: 'Не удалось удалить сотрудника' },
      { status: 500 }
    )
  }
} 