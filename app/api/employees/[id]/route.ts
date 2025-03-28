import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

interface Params {
  params: {
    id: string
  }
}

// GET /api/employees/[id] - получить сотрудника по ID
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = params
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: { workDays: true }
    })
    
    if (!employee) {
      return NextResponse.json(
        { error: 'Сотрудник не найден' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(employee)
  } catch (error) {
    console.error('Error fetching employee:', error)
    return NextResponse.json(
      { error: 'Не удалось получить сотрудника' },
      { status: 500 }
    )
  }
}

// PATCH /api/employees/[id] - обновить сотрудника
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = params
    const body = await request.json()
    const { name, position } = body
    
    if (!name && !position) {
      return NextResponse.json(
        { error: 'Необходимо указать имя или должность' },
        { status: 400 }
      )
    }
    
    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(position && { position })
      }
    })
    
    return NextResponse.json(updatedEmployee)
  } catch (error) {
    console.error('Error updating employee:', error)
    return NextResponse.json(
      { error: 'Не удалось обновить сотрудника' },
      { status: 500 }
    )
  }
}

// DELETE /api/employees/[id] - удалить сотрудника
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = params
    
    // Проверим, существует ли сотрудник
    const employee = await prisma.employee.findUnique({
      where: { id }
    })
    
    if (!employee) {
      return NextResponse.json(
        { error: 'Сотрудник не найден' },
        { status: 404 }
      )
    }
    
    // Удаляем сотрудника (связанные записи будут удалены каскадно согласно схеме)
    await prisma.employee.delete({
      where: { id }
    })
    
    return NextResponse.json(
      { message: 'Сотрудник успешно удален' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting employee:', error)
    return NextResponse.json(
      { error: 'Не удалось удалить сотрудника' },
      { status: 500 }
    )
  }
} 