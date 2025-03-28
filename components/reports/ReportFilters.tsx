import { useState, useEffect } from 'react'
import { Employee } from '@/lib/types'
import { formatDateISO } from '@/lib/utils'
import DatePicker from '../ui/DatePicker'
import Button from '../ui/Button'
import Select from '../ui/Select'

interface ReportFiltersProps {
  onSubmit: (filters: {
    startDate: string;
    endDate: string;
    employeeId?: string;
  }) => void
}

const ReportFilters = ({ onSubmit }: ReportFiltersProps) => {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [endDate, setEndDate] = useState<Date>(new Date())
  const [employeeId, setEmployeeId] = useState<string>('')
  
  // Загрузка списка сотрудников для фильтра
  useEffect(() => {
    const fetchEmployees = async () => {
      setIsLoading(true)
      
      try {
        const response = await fetch('/api/employees')
        
        if (!response.ok) {
          throw new Error('Не удалось загрузить данные сотрудников')
        }
        
        const data = await response.json()
        setEmployees(data)
      } catch (error) {
        console.error('Error fetching employees:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchEmployees()
  }, [])
  
  // Обработчик отправки формы
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    onSubmit({
      startDate: formatDateISO(startDate),
      endDate: formatDateISO(endDate),
      ...(employeeId && { employeeId })
    })
  }
  
  // Формируем массив опций для выбора сотрудника
  const employeeOptions = [
    { value: '', label: 'Все сотрудники' },
    ...employees.map(employee => ({
      value: employee.id,
      label: employee.name
    }))
  ]
  
  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded-md shadow-sm border border-gray-200 mb-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">
        Параметры отчета
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Начальная дата
          </label>
          <DatePicker
            selected={startDate}
            onChange={(date) => date && setStartDate(date)}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Конечная дата
          </label>
          <DatePicker
            selected={endDate}
            onChange={(date) => date && setEndDate(date)}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Сотрудник
          </label>
          <Select
            options={employeeOptions}
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          Сформировать отчет
        </Button>
      </div>
    </form>
  )
}

export default ReportFilters 