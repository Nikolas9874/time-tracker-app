import { useState, useEffect } from 'react'
import { WorkDay, DayType, DAY_TYPE_LABELS } from '@/lib/types'
import { formatDateISO, formatTime, calculateDuration } from '@/lib/utils'
import Select from '../ui/Select'
import TimeInput from '../ui/TimeInput'
import Button from '../ui/Button'

interface WorkDayEditorProps {
  workDay: WorkDay
  onSave: (data: {
    employeeId: string;
    date: string;
    dayType: DayType;
    startTime?: string;
    endTime?: string;
    lunchStartTime?: string;
    lunchEndTime?: string;
    comment?: string;
    tasksCompleted?: number;
    connectionsEstablished?: number;
  }) => Promise<void>
}

const WorkDayEditor = ({ workDay, onSave }: WorkDayEditorProps) => {
  const defaultStartTime = '08:00'
  const defaultEndTime = '18:00'
  const defaultLunchStartTime = '13:00'
  const defaultLunchEndTime = '14:00'
  
  const [dayType, setDayType] = useState<DayType>(workDay.dayType)
  const [startTime, setStartTime] = useState<string>(
    workDay.timeEntry?.startTime 
      ? new Date(workDay.timeEntry.startTime).toISOString().substr(11, 5)
      : dayType === 'WORK_DAY' ? defaultStartTime : ''
  )
  const [endTime, setEndTime] = useState<string>(
    workDay.timeEntry?.endTime 
      ? new Date(workDay.timeEntry.endTime).toISOString().substr(11, 5)
      : dayType === 'WORK_DAY' ? defaultEndTime : ''
  )
  const [lunchStartTime, setLunchStartTime] = useState<string>(
    workDay.timeEntry?.lunchStartTime 
      ? new Date(workDay.timeEntry.lunchStartTime).toISOString().substr(11, 5)
      : dayType === 'WORK_DAY' ? defaultLunchStartTime : ''
  )
  const [lunchEndTime, setLunchEndTime] = useState<string>(
    workDay.timeEntry?.lunchEndTime 
      ? new Date(workDay.timeEntry.lunchEndTime).toISOString().substr(11, 5)
      : dayType === 'WORK_DAY' ? defaultLunchEndTime : ''
  )
  const [tasksCompleted, setTasksCompleted] = useState<string>(
    workDay.workStats?.tasksCompleted?.toString() || '0'
  )
  const [connectionsEstablished, setConnectionsEstablished] = useState<string>(
    workDay.workStats?.connectionsEstablished?.toString() || '0'
  )
  const [comment, setComment] = useState<string>(workDay.comment || '')
  const [isLoading, setIsLoading] = useState(false)
  
  // Преобразуем типы дня в опции для селекта
  const dayTypeOptions = Object.entries(DAY_TYPE_LABELS).map(([value, label]) => ({
    value,
    label
  }))
  
  // Функция для расчета чистого рабочего времени (с учетом обеда)
  const calculateNetDuration = () => {
    if (!workDay.date || !(workDay.date instanceof Date)) {
      return '00:00';
    }
    
    const workStart = `${formatDateISO(workDay.date)}T${startTime || defaultStartTime}:00`
    const workEnd = `${formatDateISO(workDay.date)}T${endTime || defaultEndTime}:00`
    const lunchStart = `${formatDateISO(workDay.date)}T${lunchStartTime || defaultLunchStartTime}:00`
    const lunchEnd = `${formatDateISO(workDay.date)}T${lunchEndTime || defaultLunchEndTime}:00`
    
    // Расчет общей продолжительности рабочего дня
    const totalDuration = calculateDuration(workStart, workEnd)
    
    // Расчет продолжительности обеда
    const lunchDuration = calculateDuration(lunchStart, lunchEnd)
    
    // Парсим часы и минуты из строк продолжительности
    const [totalHours, totalMinutes] = totalDuration.split(':').map(Number)
    const [lunchHours, lunchMinutes] = lunchDuration.split(':').map(Number)
    
    // Конвертируем все в минуты
    const totalMinutesCount = totalHours * 60 + totalMinutes
    const lunchMinutesCount = lunchHours * 60 + lunchMinutes
    
    // Вычисляем чистое рабочее время
    const netMinutes = totalMinutesCount - lunchMinutesCount
    
    // Конвертируем обратно в формат часы:минуты
    const netHours = Math.floor(netMinutes / 60)
    const remainingMinutes = netMinutes % 60
    
    return `${String(netHours).padStart(2, '0')}:${String(remainingMinutes).padStart(2, '0')}`
  }
  
  // Обработчик сохранения данных
  const handleSave = async () => {
    setIsLoading(true)
    
    try {
      if (!workDay.date || !(workDay.date instanceof Date)) {
        throw new Error('Некорректная дата рабочего дня');
      }
      
      const dateStr = formatDateISO(workDay.date)
      
      // Форматируем время как ISO строки для рабочего дня
      let formattedStartTime = null
      let formattedEndTime = null 
      let formattedLunchStartTime = null
      let formattedLunchEndTime = null
      
      if (dayType === 'WORK_DAY') {
        try {
          // Установка времени по умолчанию, если не заполнено
          const startTimeValue = startTime || defaultStartTime
          const endTimeValue = endTime || defaultEndTime
          const lunchStartTimeValue = lunchStartTime || defaultLunchStartTime
          const lunchEndTimeValue = lunchEndTime || defaultLunchEndTime
          
          // Проверяем, что значения времени имеют правильный формат (HH:MM)
          if (!/^\d{1,2}:\d{2}$/.test(startTimeValue) || 
              !/^\d{1,2}:\d{2}$/.test(endTimeValue) || 
              !/^\d{1,2}:\d{2}$/.test(lunchStartTimeValue) || 
              !/^\d{1,2}:\d{2}$/.test(lunchEndTimeValue)) {
            throw new Error('Некорректный формат времени');
          }
          
          const startDate = new Date(workDay.date.getTime())
          const [startHours, startMinutes] = startTimeValue.split(':').map(Number)
          startDate.setHours(startHours, startMinutes, 0, 0)
          formattedStartTime = startDate.toISOString()
          
          const endDate = new Date(workDay.date.getTime())
          const [endHours, endMinutes] = endTimeValue.split(':').map(Number)
          endDate.setHours(endHours, endMinutes, 0, 0)
          formattedEndTime = endDate.toISOString()
          
          const lunchStartDate = new Date(workDay.date.getTime())
          const [lunchStartHours, lunchStartMinutes] = lunchStartTimeValue.split(':').map(Number)
          lunchStartDate.setHours(lunchStartHours, lunchStartMinutes, 0, 0)
          formattedLunchStartTime = lunchStartDate.toISOString()
          
          const lunchEndDate = new Date(workDay.date.getTime())
          const [lunchEndHours, lunchEndMinutes] = lunchEndTimeValue.split(':').map(Number)
          lunchEndDate.setHours(lunchEndHours, lunchEndMinutes, 0, 0)
          formattedLunchEndTime = lunchEndDate.toISOString()
        } catch (err) {
          console.error('Ошибка форматирования времени:', err)
          // В случае ошибки форматирования времени, используем null для всех полей
          formattedStartTime = null
          formattedEndTime = null
          formattedLunchStartTime = null
          formattedLunchEndTime = null
        }
      }
      
      // Преобразуем статистику в числа с проверкой
      const tasksCompletedNumber = parseInt(tasksCompleted, 10) || 0
      const connectionsEstablishedNumber = parseInt(connectionsEstablished, 10) || 0
      
      const payload = {
        employeeId: workDay.employeeId,
        date: dateStr,
        dayType,
        comment: comment || undefined,
        tasksCompleted: tasksCompletedNumber,
        connectionsEstablished: connectionsEstablishedNumber
      }
      
      // Добавляем время только если это рабочий день
      if (dayType === 'WORK_DAY') {
        Object.assign(payload, {
          startTime: formattedStartTime,
          endTime: formattedEndTime,
          lunchStartTime: formattedLunchStartTime,
          lunchEndTime: formattedLunchEndTime
        })
      }
      
      await onSave(payload)
    } catch (error) {
      console.error('Error saving work day:', error)
      alert('Ошибка при сохранении данных. Попробуйте еще раз.')
    } finally {
      setIsLoading(false)
    }
  }
  
  // Если тип дня изменился на "Рабочий день", устанавливаем время по умолчанию
  useEffect(() => {
    if (dayType === 'WORK_DAY') {
      if (!startTime) setStartTime(defaultStartTime)
      if (!endTime) setEndTime(defaultEndTime)
      if (!lunchStartTime) setLunchStartTime(defaultLunchStartTime)
      if (!lunchEndTime) setLunchEndTime(defaultLunchEndTime)
    } else {
      setStartTime('')
      setEndTime('')
      setLunchStartTime('')
      setLunchEndTime('')
      setTasksCompleted('0')
      setConnectionsEstablished('0')
    }
  }, [dayType])
  
  return (
    <div className="rounded-md border border-gray-200 overflow-hidden bg-white text-xs">
      <div className="p-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-900">
            {workDay.employee?.name || 'Сотрудник'}
          </h3>
          <p className="text-2xs text-gray-500">
            {formatDateISO(workDay.date)}
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Select
            options={dayTypeOptions}
            value={dayType}
            onChange={(e) => setDayType(e.target.value as DayType)}
            className="text-xs h-8 w-40"
          />
          
          <Button
            onClick={handleSave}
            disabled={isLoading}
            size="sm"
            className="px-3 py-1 h-8 text-xs"
          >
            {isLoading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-0.5 mr-1.5 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Сохранение
              </div>
            ) : (
              'Сохранить'
            )}
          </Button>
        </div>
      </div>
      
      <div className="p-3">
        {dayType === 'WORK_DAY' && (
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-1">
                <label className="block text-2xs font-medium text-gray-700 mb-1">Приход</label>
                <TimeInput
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  placeholder={defaultStartTime}
                  className="h-7 text-xs"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-2xs font-medium text-gray-700 mb-1">Уход</label>
                <TimeInput
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  placeholder={defaultEndTime}
                  className="h-7 text-xs"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-2xs font-medium text-gray-700 mb-1">Начало обеда</label>
                <TimeInput
                  value={lunchStartTime}
                  onChange={(e) => setLunchStartTime(e.target.value)}
                  placeholder={defaultLunchStartTime}
                  className="h-7 text-xs"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-2xs font-medium text-gray-700 mb-1">Конец обеда</label>
                <TimeInput
                  value={lunchEndTime}
                  onChange={(e) => setLunchEndTime(e.target.value)}
                  placeholder={defaultLunchEndTime}
                  className="h-7 text-xs"
                />
              </div>
            </div>
              
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-indigo-50 rounded p-2 text-center">
                <p className="text-2xs text-indigo-600 mb-0.5">Общее время</p>
                <p className="font-medium text-indigo-800 text-sm">
                  {calculateDuration(
                    `${formatDateISO(workDay.date)}T${startTime || defaultStartTime}:00`,
                    `${formatDateISO(workDay.date)}T${endTime || defaultEndTime}:00`
                  )}
                </p>
              </div>
              <div className="bg-green-50 rounded p-2 text-center">
                <p className="text-2xs text-green-600 mb-0.5">Чистое время</p>
                <p className="font-medium text-green-800 text-sm">
                  {calculateNetDuration()}
                </p>
              </div>
            </div>
              
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-2xs font-medium text-gray-700 mb-1">
                  Выполнено заданий
                </label>
                <input
                  type="number"
                  min="0"
                  value={tasksCompleted}
                  onChange={(e) => setTasksCompleted(e.target.value)}
                  className="w-full h-7 text-xs rounded border-gray-300"
                />
              </div>
              <div>
                <label className="block text-2xs font-medium text-gray-700 mb-1">
                  Количество подключений
                </label>
                <input
                  type="number"
                  min="0"
                  value={connectionsEstablished}
                  onChange={(e) => setConnectionsEstablished(e.target.value)}
                  className="w-full h-7 text-xs rounded border-gray-300"
                />
              </div>
            </div>
          </div>
        )}
        
        <div className={dayType === 'WORK_DAY' ? 'mt-3' : ''}>
          <label className="block text-2xs font-medium text-gray-700 mb-1">
            Комментарий
          </label>
          <textarea
            className="w-full rounded border-gray-300 px-2 py-1.5 text-xs"
            rows={2}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Введите комментарий (необязательно)"
          />
        </div>
      </div>
    </div>
  )
}

export default WorkDayEditor 