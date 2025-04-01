import React from 'react'
import { formatDate } from '@/lib/utils'
import Button from '@/components/ui/Button'

interface DateNavigationProps {
  currentDate: string
  onDateChange: (date: string) => void
  disabled?: boolean
}

export default function DateNavigation({ 
  currentDate, 
  onDateChange,
  disabled = false
}: DateNavigationProps) {
  
  // Функция для перехода на предыдущий день
  const handlePrevDay = () => {
    const date = new Date(currentDate)
    date.setDate(date.getDate() - 1)
    onDateChange(date.toISOString().split('T')[0])
  }

  // Функция для перехода на следующий день
  const handleNextDay = () => {
    const date = new Date(currentDate)
    date.setDate(date.getDate() + 1)
    onDateChange(date.toISOString().split('T')[0])
  }

  // Функция для перехода на сегодняшний день
  const handleToday = () => {
    const today = new Date()
    onDateChange(today.toISOString().split('T')[0])
  }

  return (
    <div className="flex items-center justify-between bg-white rounded p-4 mb-6 border border-gray-200">
      <div className="flex space-x-2">
        <Button 
          onClick={handlePrevDay} 
          variant="outline"
          disabled={disabled}
        >
          &larr; Пред. день
        </Button>
        <Button 
          onClick={handleToday}
          variant="outline"
          disabled={disabled}
        >
          Сегодня
        </Button>
        <Button 
          onClick={handleNextDay}
          variant="outline"
          disabled={disabled}
        >
          След. день &rarr;
        </Button>
      </div>
      
      <div className="text-lg font-medium">
        {formatDate(new Date(currentDate))}
      </div>
    </div>
  )
} 