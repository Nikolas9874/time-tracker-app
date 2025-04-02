'use client'

import { useState, useEffect } from 'react'
import { formatDateISO } from '@/lib/utils'
import DateNavigation from '@/components/timesheet/DateNavigation'
import NewTimesheetTable from '@/components/timesheet/NewTimesheetTable'
import TimesheetStats from '@/components/timesheet/TimesheetStats'
import TimesheetChart from '@/components/timesheet/TimesheetChart'
import ExportButton from '@/components/timesheet/ExportButton'
import { toast } from 'react-hot-toast'
import { WorkDay } from '@/types/workday'

export default function TimesheetPage() {
  const [currentDate, setCurrentDate] = useState(formatDateISO(new Date()))
  const [workDays, setWorkDays] = useState<WorkDay[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCharts, setShowCharts] = useState(false)

  const reloadWorkDays = async (date: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/workdays?date=${date}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Ошибка при загрузке табеля')
      }
      
      const data = await response.json()
      setWorkDays(data)
    } catch (err: any) {
      console.error('Ошибка загрузки рабочих дней:', err.message)
      setError(err.message || 'Произошла ошибка при загрузке данных')
      toast.error(err.message || 'Произошла ошибка при загрузке данных')
    } finally {
      setIsLoading(false)
    }
  }

  // Загружаем данные при изменении даты
  useEffect(() => {
    reloadWorkDays(currentDate)
  }, [currentDate])

  const saveWorkDay = async (workDay: any) => {
    try {
      // Проверяем наличие минимально необходимых полей
      if (!workDay.employeeId || !workDay.date || !workDay.dayType) {
        throw new Error('Не все обязательные поля заполнены')
      }

      console.log('saveWorkDay: Получены данные для сохранения:', {
        id: workDay.id,
        employeeId: workDay.employeeId,
        dayType: workDay.dayType,
        hasTimeEntry: !!workDay.timeEntry,
        timeEntryType: workDay.timeEntry ? typeof workDay.timeEntry : null,
        timeEntryDetails: workDay.timeEntry ? JSON.stringify(workDay.timeEntry).substring(0, 100) : null
      });

      let response
      let requestBody
      
      // Если есть id, обновляем существующую запись, иначе создаем новую
      if (workDay.id) {
        console.log('saveWorkDay: Обновляем существующую запись:', workDay.id);
        requestBody = JSON.stringify(workDay);
        console.log('saveWorkDay: Отправляемые данные (PUT):', requestBody.substring(0, 300));
        
        response = await fetch('/api/workdays', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: requestBody
        })
      } else {
        console.log('saveWorkDay: Создаем новую запись');
        const newWorkDay = {
          ...workDay,
          date: currentDate // Используем текущую выбранную дату
        };
        requestBody = JSON.stringify(newWorkDay);
        console.log('saveWorkDay: Отправляемые данные (POST):', requestBody.substring(0, 300));
        
        response = await fetch('/api/workdays', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: requestBody
        })
      }

      // Проверяем HTTP статус
      console.log('saveWorkDay: Получен HTTP статус:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('saveWorkDay: Ошибка от API:', errorData);
        throw new Error(errorData.error || 'Ошибка при сохранении данных')
      }

      // Получаем обновленную или созданную запись
      const updatedWorkDay = await response.json()
      console.log('saveWorkDay: Получен ответ от API:', {
        id: updatedWorkDay.id,
        employeeId: updatedWorkDay.employeeId,
        dayType: updatedWorkDay.dayType,
        hasTimeEntry: !!updatedWorkDay.timeEntry,
        timeEntryType: updatedWorkDay.timeEntry ? typeof updatedWorkDay.timeEntry : null,
        timeEntryDetails: updatedWorkDay.timeEntry ? JSON.stringify(updatedWorkDay.timeEntry).substring(0, 100) : null
      });
      
      // Обновляем состояние, заменяя запись с тем же ID, если она существует
      // или добавляя новую, если записи с таким ID еще нет
      setWorkDays(prevWorkDays => {
        const workDayIndex = prevWorkDays.findIndex(wd => wd.id === updatedWorkDay.id)
        
        if (workDayIndex !== -1) {
          // Заменяем существующую запись
          const newWorkDays = [...prevWorkDays]
          newWorkDays[workDayIndex] = updatedWorkDay
          console.log('saveWorkDay: Обновили существующую запись в состоянии, индекс:', workDayIndex);
          return newWorkDays
        } else {
          // Добавляем новую запись
          console.log('saveWorkDay: Добавляем новую запись в состояние');
          return [...prevWorkDays, updatedWorkDay]
        }
      })

      toast.success('Данные успешно сохранены')
      return true
    } catch (err: any) {
      console.error('Ошибка сохранения рабочего дня:', err.message)
      toast.error(err.message || 'Произошла ошибка при сохранении данных')
      return false
    }
  }

  const deleteWorkDay = async (workDayId: string) => {
    try {
      const response = await fetch(`/api/workdays?id=${workDayId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Ошибка при удалении данных')
      }

      // Удаляем запись из состояния
      setWorkDays(prevWorkDays => prevWorkDays.filter(wd => wd.id !== workDayId))
      toast.success('Запись успешно удалена')
      return true
    } catch (err: any) {
      console.error('Ошибка удаления рабочего дня:', err.message)
      toast.error(err.message || 'Произошла ошибка при удалении данных')
      return false
    }
  }

  const toggleCharts = () => {
    setShowCharts(!showCharts)
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold">Табель рабочего времени</h1>
        
        <div className="flex mt-4 md:mt-0">
          <button 
            onClick={toggleCharts}
            className="text-blue-600 hover:text-blue-800 mr-4"
          >
            {showCharts ? 'Скрыть графики' : 'Показать графики'}
          </button>
          
          <ExportButton 
            workDays={workDays}
            currentDate={currentDate}
            isLoading={isLoading}
          />
        </div>
      </div>
      
      <DateNavigation 
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        disabled={isLoading}
      />
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4">
          {error}
        </div>
      )}
      
      {/* Статистика */}
      <TimesheetStats
        workDays={workDays}
        currentDate={currentDate}
      />
      
      {/* Графики */}
      {showCharts && (
        <TimesheetChart
          workDays={workDays}
          currentDate={currentDate}
        />
      )}
      
      {/* Таблица */}
      <NewTimesheetTable 
        workDays={workDays}
        currentDate={currentDate}
        isLoading={isLoading}
        onSave={saveWorkDay}
        onDelete={deleteWorkDay}
      />
    </div>
  )
} 