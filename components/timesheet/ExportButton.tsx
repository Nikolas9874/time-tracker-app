import React from 'react'
import { formatDateLocale } from '@/lib/utils'
import { WorkDay } from '@/types/workday'
import Button from '@/components/ui/Button'

interface ExportButtonProps {
  workDays: WorkDay[]
  currentDate: string
  isLoading: boolean
}

export default function ExportButton({
  workDays,
  currentDate,
  isLoading
}: ExportButtonProps) {
  const handleExport = () => {
    if (!workDays || workDays.length === 0) {
      return
    }

    // Создаем CSV данные
    const headers = [
      'Сотрудник',
      'Должность',
      'Тип дня',
      'Время начала',
      'Время окончания',
      'Начало обеда',
      'Конец обеда',
      'Комментарий'
    ]

    // Преобразование типов дней
    const dayTypeMap: Record<string, string> = {
      'WORK_DAY': 'Рабочий день',
      'DAY_OFF': 'Выходной',
      'VACATION': 'Отпуск',
      'SICK_LEAVE': 'Больничный',
      'ABSENCE': 'Отсутствие',
      'UNPAID_LEAVE': 'Отпуск за свой счет'
    }

    // Форматирование времени
    const formatTimeForExport = (date: Date | string | null | undefined): string => {
      if (!date) return ''
      const d = typeof date === 'string' ? new Date(date) : date
      return d instanceof Date && !isNaN(d.getTime()) 
        ? `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
        : ''
    }

    // Создаем строки данных
    const csvData = workDays.map(day => [
      day.employee?.name || '',
      day.employee?.position || '',
      dayTypeMap[day.dayType] || day.dayType,
      day.dayType === 'WORK_DAY' ? formatTimeForExport(day.timeEntry?.startTime) : '',
      day.dayType === 'WORK_DAY' ? formatTimeForExport(day.timeEntry?.endTime) : '',
      day.dayType === 'WORK_DAY' ? formatTimeForExport(day.timeEntry?.lunchStartTime) : '',
      day.dayType === 'WORK_DAY' ? formatTimeForExport(day.timeEntry?.lunchEndTime) : '',
      day.comment || ''
    ])

    // Объединяем все в CSV
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // Создаем и скачиваем файл
    const date = new Date(currentDate)
    const formattedDate = formatDateLocale(date).replace(/ /g, '_')
    const filename = `Табель_${formattedDate}.csv`
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Button
      onClick={handleExport}
      disabled={isLoading || !workDays || workDays.length === 0}
      variant="outline"
      className="ml-2"
    >
      Экспорт
    </Button>
  )
} 