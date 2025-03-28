import { useState, useEffect } from 'react'
import { Employee } from '@/lib/types'
import Button from '../ui/Button'

interface EmployeeFormProps {
  employee?: Employee
  onSubmit: (data: { name: string; position: string }) => Promise<void>
  onCancel: () => void
}

const EmployeeForm = ({ employee, onSubmit, onCancel }: EmployeeFormProps) => {
  const [name, setName] = useState(employee?.name || '')
  const [position, setPosition] = useState(employee?.position || '')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)
  const [positionError, setPositionError] = useState<string | null>(null)

  useEffect(() => {
    // Сброс ошибок при изменении полей
    if (name.trim()) setNameError(null);
    if (position.trim()) setPositionError(null);
  }, [name, position]);
  
  const validateForm = (): boolean => {
    let isValid = true;
    
    if (!name.trim()) {
      setNameError('Необходимо указать ФИО сотрудника');
      isValid = false;
    }
    
    if (!position.trim()) {
      setPositionError('Необходимо указать должность');
      isValid = false;
    }
    
    return isValid;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Сброс ошибок
    setError(null)
    setNameError(null)
    setPositionError(null)
    
    // Проверка заполнения полей
    if (!validateForm()) return;
    
    setIsLoading(true)
    
    try {
      await onSubmit({ 
        name: name.trim(), 
        position: position.trim() 
      })
    } catch (error) {
      console.error('Error submitting employee form:', error)
      setError(error instanceof Error ? error.message : 'Произошла ошибка при сохранении данных')
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded-md shadow-sm border border-gray-200">
      <h2 className="text-lg font-medium text-gray-900 mb-4">
        {employee ? 'Редактирование сотрудника' : 'Добавление нового сотрудника'}
      </h2>
      
      {error && (
        <div className="mb-4 p-2 bg-red-50 text-red-600 rounded-md">
          {error}
        </div>
      )}
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          ФИО сотрудника
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`w-full rounded-md border ${nameError ? 'border-red-500' : 'border-gray-300'} px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
          placeholder="Иванов Иван Иванович"
        />
        {nameError && (
          <p className="mt-1 text-sm text-red-500">{nameError}</p>
        )}
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Должность
        </label>
        <input
          type="text"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          className={`w-full rounded-md border ${positionError ? 'border-red-500' : 'border-gray-300'} px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
          placeholder="Разработчик"
        />
        {positionError && (
          <p className="mt-1 text-sm text-red-500">{positionError}</p>
        )}
      </div>
      
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          onClick={onCancel}
          variant="outline"
        >
          Отмена
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? 'Сохранение...' : 'Сохранить'}
        </Button>
      </div>
    </form>
  )
}

export default EmployeeForm 