'use client'

import { useState, useEffect } from 'react'
import { formatDateISO } from '@/lib/utils'
import { Employee } from '@/types/employee'
import { WorkDay, DayType } from '@/types/workday'
import Button from '@/components/ui/Button'
import WorkdayStats from '@/components/reports/WorkdayStats'
import { toast } from 'react-hot-toast'

interface ReportStats {
  totalHours: number
  totalConnections: number
  totalTasks: number
  daysByType: Record<DayType, number>
}

interface EmployeeReport {
  employee: Employee
  stats: ReportStats
}

interface Filter {
  startDate: string
  endDate: string
  employeeId: string | null
  dayType: DayType | 'all'
  hasConnections: boolean | null
  hasTasks: boolean | null
}

export default function ReportsPage() {
  const [filter, setFilter] = useState<Filter>({
    startDate: formatDateISO(new Date()),
    endDate: formatDateISO(new Date()),
    employeeId: null,
    dayType: 'all',
    hasConnections: null,
    hasTasks: null
  })
  
  const [employees, setEmployees] = useState<Employee[]>([])
  const [reports, setReports] = useState<EmployeeReport[]>([])
  const [workDays, setWorkDays] = useState<WorkDay[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCharts, setShowCharts] = useState(false)

  // Загрузка списка сотрудников
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const response = await fetch('/api/employees')
        if (!response.ok) {
          throw new Error('Ошибка при загрузке списка сотрудников')
        }
        const data = await response.json()
        setEmployees(data)
      } catch (error) {
        console.error('Ошибка:', error)
        toast.error('Не удалось загрузить список сотрудников')
      }
    }
    loadEmployees()
  }, [])

  // Функция для расчета часов между двумя временами
  const calculateHours = (startTime: string | null, endTime: string | null, lunchStart?: string | null, lunchEnd?: string | null) => {
    if (!startTime || !endTime) return 0

    const [startHours, startMinutes] = startTime.split(':').map(Number)
    const [endHours, endMinutes] = endTime.split(':').map(Number)
    
    let totalMinutes = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes)
    
    if (lunchStart && lunchEnd) {
      const [lunchStartHours, lunchStartMinutes] = lunchStart.split(':').map(Number)
      const [lunchEndHours, lunchEndMinutes] = lunchEnd.split(':').map(Number)
      const lunchMinutes = (lunchEndHours * 60 + lunchEndMinutes) - (lunchStartHours * 60 + lunchStartMinutes)
      totalMinutes -= Math.max(0, lunchMinutes)
    }
    
    return Math.max(0, totalMinutes / 60)
  }

  // Функция для форматирования времени из объекта Date
  const formatTime = (date: Date | null | undefined): string | null => {
    if (!date) return null
    
    try {
      // Проверяем, является ли date строкой
      if (typeof date === 'string') {
        date = new Date(date)
      }
      
      // Проверяем, валидный ли объект Date
      if (!(date instanceof Date) || isNaN(date.getTime())) {
        return null
      }
      
      return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    } catch (error) {
      console.error('Ошибка форматирования времени:', error)
      return null
    }
  }

  // Обновление фильтра
  const updateFilter = (name: keyof Filter, value: any) => {
    setFilter(prev => ({ ...prev, [name]: value }))
  }

  // Загрузка отчетов
  const loadReports = async () => {
    setIsLoading(true)
    try {
      const url = new URL('/api/workdays', window.location.origin)
      url.searchParams.append('startDate', filter.startDate)
      url.searchParams.append('endDate', filter.endDate)
      if (filter.employeeId) {
        url.searchParams.append('employeeId', filter.employeeId)
      }

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Ошибка при загрузке данных')
      }

      let workDays: WorkDay[] = await response.json()
      
      // Применение дополнительных фильтров
      if (filter.dayType !== 'all') {
        workDays = workDays.filter(day => day.dayType === filter.dayType)
      }
      
      if (filter.hasConnections !== null) {
        workDays = workDays.filter(day => 
          filter.hasConnections 
            ? day.connections && day.connections.length > 0
            : !day.connections || day.connections.length === 0
        )
      }
      
      if (filter.hasTasks !== null) {
        workDays = workDays.filter(day => 
          filter.hasTasks 
            ? day.tasks && day.tasks.length > 0
            : !day.tasks || day.tasks.length === 0
        )
      }

      setWorkDays(workDays)
      
      const reportsByEmployee = new Map<string, EmployeeReport>()

      // Обработка каждого рабочего дня
      workDays.forEach(workDay => {
        if (!reportsByEmployee.has(workDay.employeeId)) {
          reportsByEmployee.set(workDay.employeeId, {
            employee: workDay.employee,
            stats: {
              totalHours: 0,
              totalConnections: 0,
              totalTasks: 0,
              daysByType: {
                WORK_DAY: 0,
                DAY_OFF: 0,
                VACATION: 0,
                SICK_LEAVE: 0,
                ABSENCE: 0,
                UNPAID_LEAVE: 0
              }
            }
          })
        }

        const report = reportsByEmployee.get(workDay.employeeId)!
        report.stats.daysByType[workDay.dayType]++

        if (workDay.dayType === 'WORK_DAY' && workDay.timeEntry) {
          const startTime = formatTime(workDay.timeEntry.startTime)
          const endTime = formatTime(workDay.timeEntry.endTime)
          const lunchStartTime = formatTime(workDay.timeEntry.lunchStartTime)
          const lunchEndTime = formatTime(workDay.timeEntry.lunchEndTime)

          report.stats.totalHours += calculateHours(
            startTime,
            endTime,
            lunchStartTime,
            lunchEndTime
          )
        }

        if (workDay.tasks) {
          report.stats.totalTasks += workDay.tasks.length
        }

        if (workDay.connections) {
          report.stats.totalConnections += workDay.connections.length
        }
      })

      setReports(Array.from(reportsByEmployee.values()))
      if (workDays.length > 0) {
        setShowCharts(true)
      }
    } catch (error) {
      console.error('Ошибка:', error)
      toast.error('Не удалось загрузить отчеты')
      setShowCharts(false)
    } finally {
      setIsLoading(false)
    }
  }

  // Сброс фильтров
  const resetFilters = () => {
    setFilter({
      startDate: formatDateISO(new Date()),
      endDate: formatDateISO(new Date()),
      employeeId: null,
      dayType: 'all',
      hasConnections: null,
      hasTasks: null
    })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Отчеты по сотрудникам</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Фильтры</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Начальная дата
            </label>
            <input
              type="date"
              value={filter.startDate}
              onChange={(e) => updateFilter('startDate', e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Конечная дата
            </label>
            <input
              type="date"
              value={filter.endDate}
              onChange={(e) => updateFilter('endDate', e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Сотрудник
            </label>
            <select
              value={filter.employeeId || ''}
              onChange={(e) => updateFilter('employeeId', e.target.value || null)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Все сотрудники</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Тип дня
            </label>
            <select
              value={filter.dayType}
              onChange={(e) => updateFilter('dayType', e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="all">Все типы</option>
              <option value="WORK_DAY">Рабочий день</option>
              <option value="DAY_OFF">Выходной</option>
              <option value="VACATION">Отпуск</option>
              <option value="SICK_LEAVE">Больничный</option>
              <option value="ABSENCE">Отсутствие</option>
              <option value="UNPAID_LEAVE">Отпуск за свой счет</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Наличие задач
            </label>
            <select
              value={filter.hasTasks === null ? '' : filter.hasTasks ? 'true' : 'false'}
              onChange={(e) => {
                const value = e.target.value === '' ? null : e.target.value === 'true'
                updateFilter('hasTasks', value)
              }}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Не важно</option>
              <option value="true">Есть задачи</option>
              <option value="false">Нет задач</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Наличие связей
            </label>
            <select
              value={filter.hasConnections === null ? '' : filter.hasConnections ? 'true' : 'false'}
              onChange={(e) => {
                const value = e.target.value === '' ? null : e.target.value === 'true'
                updateFilter('hasConnections', value)
              }}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Не важно</option>
              <option value="true">Есть связи</option>
              <option value="false">Нет связей</option>
            </select>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={loadReports}
            disabled={isLoading}
          >
            {isLoading ? 'Загрузка...' : 'Сформировать отчет'}
          </Button>
          <Button
            onClick={resetFilters}
            variant="outline"
            disabled={isLoading}
          >
            Сбросить фильтры
          </Button>
        </div>
      </div>

      {reports.length > 0 ? (
        <>
          <div className="overflow-x-auto bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Результаты</h2>
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Сотрудник
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Рабочих дней
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Часов
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Задач
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Связей
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Выходных
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Отпуск
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Больничный
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Отсутствие
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.map((report) => (
                  <tr key={report.employee.id}>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {report.employee.name}
                    </td>
                    <td className="px-4 py-2 text-sm text-center text-gray-900">
                      {report.stats.daysByType.WORK_DAY}
                    </td>
                    <td className="px-4 py-2 text-sm text-center text-gray-900">
                      {report.stats.totalHours.toFixed(1)}
                    </td>
                    <td className="px-4 py-2 text-sm text-center text-gray-900">
                      {report.stats.totalTasks}
                    </td>
                    <td className="px-4 py-2 text-sm text-center text-gray-900">
                      {report.stats.totalConnections}
                    </td>
                    <td className="px-4 py-2 text-sm text-center text-gray-900">
                      {report.stats.daysByType.DAY_OFF}
                    </td>
                    <td className="px-4 py-2 text-sm text-center text-gray-900">
                      {report.stats.daysByType.VACATION}
                    </td>
                    <td className="px-4 py-2 text-sm text-center text-gray-900">
                      {report.stats.daysByType.SICK_LEAVE}
                    </td>
                    <td className="px-4 py-2 text-sm text-center text-gray-900">
                      {report.stats.daysByType.ABSENCE}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {showCharts && (
            <WorkdayStats workDays={workDays} employees={employees} />
          )}
        </>
      ) : (
        <div className="text-center text-gray-500 mt-4 bg-white rounded-lg shadow-md p-6">
          {isLoading ? 'Загрузка данных...' : 'Нет данных для отображения'}
        </div>
      )}
    </div>
  )
} 