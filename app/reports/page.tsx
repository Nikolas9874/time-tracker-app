'use client'

import { useState } from 'react'
import { Report } from '@/lib/types'
import ReportFilters from '@/components/reports/ReportFilters'
import ReportTable from '@/components/reports/ReportTable'

export default function ReportsPage() {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<Report | null>(null)
  
  // Обработчик запроса отчета
  const handleFilterSubmit = async (filters: {
    startDate: string;
    endDate: string;
    employeeId?: string;
  }) => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Формируем URL с параметрами
      const url = new URL('/api/report', window.location.origin)
      url.searchParams.append('startDate', filters.startDate)
      url.searchParams.append('endDate', filters.endDate)
      
      if (filters.employeeId) {
        url.searchParams.append('employeeId', filters.employeeId)
      }
      
      const response = await fetch(url.toString())
      
      if (!response.ok) {
        throw new Error('Не удалось получить отчет')
      }
      
      const data = await response.json()
      setReport(data)
    } catch (error) {
      console.error('Error fetching report:', error)
      setError('Произошла ошибка при загрузке отчета. Попробуйте позже.')
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Отчеты
        </h1>
        <p className="text-gray-600">
          Выберите период и сотрудника для формирования отчета
        </p>
      </div>
      
      <ReportFilters onSubmit={handleFilterSubmit} />
      
      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Загрузка отчета...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-500">{error}</p>
        </div>
      ) : report ? (
        <ReportTable report={report} />
      ) : (
        <div className="text-center py-8 bg-white rounded-md shadow-sm border border-gray-200">
          <p className="text-gray-500">Выберите параметры и нажмите "Сформировать отчет"</p>
        </div>
      )}
    </div>
  )
} 