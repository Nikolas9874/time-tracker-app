'use client'

import { useState, useEffect } from 'react'
import { formatDateISO, formatDate } from '@/lib/utils'
import { WorkDay } from '@/types/workday'
import Link from 'next/link'
import { toast } from 'react-hot-toast'

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [employeeStats, setEmployeeStats] = useState({
    total: 0,
    present: 0,
    absent: 0
  })
  const [workDayStats, setWorkDayStats] = useState({
    avgHours: '--:--',
    totalHours: '--:--'
  })
  const [recentWorkDays, setRecentWorkDays] = useState<WorkDay[]>([])

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        // Загружаем данные на сегодня
        const today = formatDateISO(new Date())
        const response = await fetch(`/api/workdays?date=${today}`)
        
        if (!response.ok) {
          throw new Error('Не удалось загрузить данные')
        }
        
        const workDays = await response.json()
        
        // Расчет статистики
        const totalEmployees = workDays.length
        const presentEmployees = workDays.filter((day: WorkDay) => 
          day.dayType === 'WORK_DAY' && day.timeEntry
        ).length
        const absentEmployees = totalEmployees - presentEmployees
        
        setEmployeeStats({
          total: totalEmployees,
          present: presentEmployees,
          absent: absentEmployees
        })
        
        // Расчет средней и общей продолжительности рабочего дня
        let totalMinutes = 0
        let workdaysWithTime = 0
        
        workDays.forEach((day: WorkDay) => {
          if (day.dayType === 'WORK_DAY' && day.timeEntry) {
            const { startTime, endTime, lunchStartTime, lunchEndTime } = day.timeEntry
            
            if (startTime && endTime) {
              const start = new Date(startTime)
              const end = new Date(endTime)
              
              let diffMinutes = (end.getTime() - start.getTime()) / (1000 * 60)
              
              // Вычитаем время обеда, если оно указано
              if (lunchStartTime && lunchEndTime) {
                const lunchStart = new Date(lunchStartTime)
                const lunchEnd = new Date(lunchEndTime)
                const lunchMinutes = (lunchEnd.getTime() - lunchStart.getTime()) / (1000 * 60)
                diffMinutes -= lunchMinutes
              }
              
              if (diffMinutes > 0) {
                totalMinutes += diffMinutes
                workdaysWithTime++
              }
            }
          }
        })
        
        const avgMinutes = workdaysWithTime > 0 ? Math.round(totalMinutes / workdaysWithTime) : 0
        const avgHours = Math.floor(avgMinutes / 60)
        const avgMinutesRemainder = avgMinutes % 60
        
        const totalHours = Math.floor(totalMinutes / 60)
        const totalMinutesRemainder = Math.round(totalMinutes % 60)
        
        setWorkDayStats({
          avgHours: `${avgHours.toString().padStart(2, '0')}:${avgMinutesRemainder.toString().padStart(2, '0')}`,
          totalHours: `${totalHours.toString().padStart(2, '0')}:${totalMinutesRemainder.toString().padStart(2, '0')}`
        })
        
        // Получаем последние записи
        setRecentWorkDays(workDays.slice(0, 5))
      } catch (err: any) {
        console.error('Ошибка загрузки данных дашборда:', err.message)
        setError(err.message || 'Произошла ошибка при загрузке данных')
        toast.error(err.message || 'Произошла ошибка при загрузке данных')
      } finally {
        setIsLoading(false)
      }
    }
    
    loadDashboardData()
  }, [])
  
  // Статусы для разных типов дней
  const getDayTypeStatus = (dayType: string) => {
    switch (dayType) {
      case 'WORK_DAY': return { 
        label: 'Рабочий день', 
        className: 'bg-green-100 text-green-800'
      }
      case 'DAY_OFF': return { 
        label: 'Выходной', 
        className: 'bg-gray-100 text-gray-800'
      }
      case 'VACATION': return { 
        label: 'Отпуск', 
        className: 'bg-blue-100 text-blue-800'
      }
      case 'SICK_LEAVE': return { 
        label: 'Больничный', 
        className: 'bg-orange-100 text-orange-800'
      }
      case 'ABSENCE': return { 
        label: 'Отсутствие', 
        className: 'bg-red-100 text-red-800'
      }
      case 'UNPAID_LEAVE': return { 
        label: 'Отпуск за свой счет', 
        className: 'bg-purple-100 text-purple-800'
      }
      default: return { 
        label: dayType, 
        className: 'bg-gray-100 text-gray-800' 
      }
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Дашборд</h1>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <div className="flex flex-col items-center">
            <svg className="animate-spin h-4 w-4 text-indigo-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-500">Загрузка данных дашборда...</p>
                    </div>
                      </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
                  </div>
      ) : (
        <>
          {/* Карточки статистики */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-sm font-medium text-gray-500 mb-2">Всего сотрудников сегодня</div>
              <div className="text-3xl font-bold text-gray-800">{employeeStats.total}</div>
                </div>
            
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-sm font-medium text-gray-500 mb-2">На работе</div>
              <div className="text-3xl font-bold text-green-600">{employeeStats.present}</div>
              </div>
            
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-sm font-medium text-gray-500 mb-2">Среднее рабочее время</div>
              <div className="text-3xl font-bold text-blue-600">{workDayStats.avgHours}</div>
                      </div>
            
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-sm font-medium text-gray-500 mb-2">Суммарное рабочее время</div>
              <div className="text-3xl font-bold text-indigo-600">{workDayStats.totalHours}</div>
                      </div>
                    </div>

          {/* Быстрые ссылки */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <Link 
              href="/timesheet" 
              className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-md shadow-sm p-3 flex items-center justify-center transition-colors"
            >
              <span className="font-medium">ТАБЕЛЬ</span>
            </Link>
            
            <Link 
              href="/reports" 
              className="bg-green-500 hover:bg-green-600 text-white rounded-md shadow-sm p-3 flex items-center justify-center transition-colors"
            >
              <span className="font-medium">ОТЧЕТЫ</span>
            </Link>
            
            <Link 
              href="/employees" 
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-md shadow-sm p-3 flex items-center justify-center transition-colors"
            >
              <span className="font-medium">СОТРУДНИКИ</span>
            </Link>
            
            <Link 
              href="/tasks" 
              className="bg-purple-500 hover:bg-purple-600 text-white rounded-md shadow-sm p-3 flex items-center justify-center transition-colors"
            >
              <span className="font-medium">ЗАДАЧИ</span>
            </Link>
          </div>
          
          {/* Последние записи */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <h2 className="text-lg font-semibold mb-4">Последние записи</h2>
            
            {recentWorkDays.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Сотрудник</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Комментарий</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentWorkDays.map(workDay => {
                      const status = getDayTypeStatus(workDay.dayType)
                      
                      return (
                        <tr key={workDay.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{workDay.employee?.name || 'Сотрудник'}</div>
                            <div className="text-xs text-gray-500">{workDay.employee?.position || ''}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{formatDate(new Date(workDay.date))}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${status.className}`}>
                              {status.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {workDay.comment || '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Нет доступных записей</p>
              </div>
            )}
          </div>

          {/* Быстрое действие */}
          <div className="bg-gradient-to-r from-indigo-500 to-blue-500 rounded-lg shadow-md p-6 text-white text-center">
            <h2 className="text-lg font-semibold mb-3">Быстрое действие</h2>
            <p className="mb-4">Создайте новые записи в табеле для сегодняшнего дня</p>
            <Link 
              href="/timesheet" 
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Перейти к табелю
                  </Link>
          </div>
        </>
      )}
    </div>
  )
}
