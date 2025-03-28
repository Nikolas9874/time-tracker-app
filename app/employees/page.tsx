'use client'

import { useState, useEffect } from 'react'
import { Employee } from '@/lib/types'
import EmployeeList from '@/components/employees/EmployeeList'
import EmployeeForm from '@/components/employees/EmployeeForm'
import Button from '@/components/ui/Button'

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddingEmployee, setIsAddingEmployee] = useState<boolean>(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  
  // Загрузка списка сотрудников
  useEffect(() => {
    const fetchEmployees = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const response = await fetch('/api/employees')
        
        if (!response.ok) {
          throw new Error('Не удалось загрузить данные')
        }
        
        const data = await response.json()
        setEmployees(data)
      } catch (error) {
        console.error('Error fetching employees:', error)
        setError('Произошла ошибка при загрузке данных. Попробуйте позже.')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchEmployees()
  }, [])
  
  // Обработчик добавления нового сотрудника
  const handleAddEmployee = async (data: { name: string; position: string }) => {
    try {
      console.log('Отправляем запрос на создание сотрудника')
      console.log('Данные для создания:', data)
      
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        console.error('Ошибка создания сотрудника:', response.status, errorData)
        throw new Error(`Не удалось создать сотрудника: ${errorData?.error || response.statusText}`)
      }
      
      const newEmployee = await response.json()
      console.log('Созданный сотрудник:', newEmployee)
      
      setEmployees(prev => [...prev, newEmployee])
      setIsAddingEmployee(false)
    } catch (error) {
      console.error('Error adding employee:', error)
      alert(`Ошибка при добавлении сотрудника: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
      throw error
    }
  }
  
  // Обработчик обновления сотрудника
  const handleUpdateEmployee = async (data: { name: string; position: string }) => {
    if (!editingEmployee) return
    
    try {
      console.log(`Отправляем запрос на обновление сотрудника ID: ${editingEmployee.id}`)
      console.log('Данные для обновления:', data)
      
      const response = await fetch(`/api/employees/${editingEmployee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        console.error('Ошибка обновления сотрудника:', response.status, errorData)
        throw new Error(`Не удалось обновить сотрудника: ${errorData?.error || response.statusText}`)
      }
      
      const updatedEmployee = await response.json()
      console.log('Обновлённый сотрудник:', updatedEmployee)
      
      setEmployees(prev => 
        prev.map(employee => 
          employee.id === updatedEmployee.id ? updatedEmployee : employee
        )
      )
      
      setEditingEmployee(null)
    } catch (error) {
      console.error('Error updating employee:', error)
      alert(`Ошибка при обновлении сотрудника: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
      throw error
    }
  }
  
  // Обработчик удаления сотрудника
  const handleDeleteEmployee = async (employee: Employee) => {
    if (!confirm(`Вы уверены, что хотите удалить сотрудника "${employee.name}"?`)) {
      return
    }
    
    try {
      const response = await fetch(`/api/employees/${employee.id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Не удалось удалить сотрудника')
      }
      
      setEmployees(prev => prev.filter(e => e.id !== employee.id))
    } catch (error) {
      console.error('Error deleting employee:', error)
      alert('Произошла ошибка при удалении сотрудника. Попробуйте позже.')
    }
  }
  
  // Обработчик нажатия на кнопку редактирования
  const handleEditClick = (employee: Employee) => {
    setEditingEmployee(employee)
    setIsAddingEmployee(false)
  }
  
  // Обработчик отмены формы
  const handleCancelForm = () => {
    setIsAddingEmployee(false)
    setEditingEmployee(null)
  }
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Управление сотрудниками
        </h1>
        <p className="text-gray-600">
          Добавляйте, редактируйте и удаляйте сотрудников
        </p>
      </div>
      
      {!isAddingEmployee && !editingEmployee && (
        <div className="mb-6">
          <Button onClick={() => setIsAddingEmployee(true)}>
            Добавить сотрудника
          </Button>
        </div>
      )}
      
      {isAddingEmployee && (
        <div className="mb-6">
          <EmployeeForm
            onSubmit={handleAddEmployee}
            onCancel={handleCancelForm}
          />
        </div>
      )}
      
      {editingEmployee && (
        <div className="mb-6">
          <EmployeeForm
            employee={editingEmployee}
            onSubmit={handleUpdateEmployee}
            onCancel={handleCancelForm}
          />
        </div>
      )}
      
      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Загрузка данных...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-500">{error}</p>
        </div>
      ) : (
        <EmployeeList
          employees={employees}
          onEdit={handleEditClick}
          onDelete={handleDeleteEmployee}
        />
      )}
    </div>
  )
} 