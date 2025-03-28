'use client'

import { useState, useEffect } from 'react'
import { formatDateISO } from '@/lib/utils'
import { WorkDay } from '@/lib/types'
import DateNavigation from '@/components/timesheet/DateNavigation'
import TimesheetTable from '@/components/timesheet/TimesheetTable'
import Button from '@/components/ui/Button'

export default function Timesheet() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [workDays, setWorkDays] = useState<WorkDay[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreatingEntries, setIsCreatingEntries] = useState<boolean>(false)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  
  // Функция для загрузки данных о рабочих днях (объявлена вне useEffect)
  const reloadWorkDays = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const dateStr = formatDateISO(currentDate);
      console.log(`Загружаем данные для даты: ${dateStr}`);
      
      const response = await fetch(`/api/workdays?date=${dateStr}`)
      
      if (!response.ok) {
        throw new Error('Не удалось загрузить данные')
      }
      
      const data = await response.json()
      console.log(`Получено ${data.length} записей с сервера`);
      setWorkDays(data)
    } catch (error) {
      console.error('Error reloading work days:', error)
      setError('Произошла ошибка при обновлении данных.')
    } finally {
      setIsLoading(false)
    }
  }
  
  // Загрузка данных о рабочих днях при изменении даты
  useEffect(() => {
    reloadWorkDays()
  }, [currentDate])
  
  // Функция для создания/обновления рабочего дня
  const saveWorkDay = async (data: any) => {
    try {
      setIsSaving(true);
      console.log("Сохраняем данные:", data);
      
      // Отправляем данные на сервер
      const response = await fetch('/api/workdays', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Ошибка сохранения данных')
      }
      
      const savedData = await response.json();
      console.log("Данные успешно сохранены:", savedData);
      
      // Принудительно загружаем данные заново после сохранения
      await reloadWorkDays()
      
      return savedData;
    } catch (error) {
      console.error('Ошибка при сохранении данных:', error)
      alert('Не удалось сохранить данные. Попробуйте еще раз.')
      throw error;
    } finally {
      setIsSaving(false);
    }
  }
  
  // Создание записей табеля для всех сотрудников на текущую дату
  const handleCreateEntriesForCurrentDate = async () => {
    setIsCreatingEntries(true)
    setError(null)
    
    try {
      // Сначала получаем список всех сотрудников
      const employeesResponse = await fetch('/api/employees')
      
      if (!employeesResponse.ok) {
        throw new Error('Не удалось загрузить список сотрудников')
      }
      
      const employees = await employeesResponse.json()
      
      // Проверяем, что получен непустой массив сотрудников
      if (!Array.isArray(employees) || employees.length === 0) {
        throw new Error('Список сотрудников пуст')
      }
      
      const dateStr = formatDateISO(currentDate)
      
      // Создаем записи для каждого сотрудника
      const createdEntries = []
      
      for (const employee of employees) {
        try {
          const response = await fetch('/api/workdays', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              employeeId: employee.id,
              date: dateStr,
              dayType: 'WORK_DAY',
              startTime: null,
              endTime: null,
              lunchStartTime: null,
              lunchEndTime: null,
              tasksCompleted: 0,
              connectionsEstablished: 0,
              employee: employee // передаем полные данные о сотруднике
            })
          })
          
          if (!response.ok) {
            console.error(`Не удалось создать запись для сотрудника ${employee.name}`)
            continue
          }
          
          const createdEntry = await response.json()
          createdEntries.push(createdEntry)
        } catch (err) {
          console.error(`Ошибка при создании записи для сотрудника ${employee.name}:`, err)
          continue
        }
      }
      
      // Обновляем список рабочих дней только если успешно создали записи
      if (createdEntries.length > 0) {
        setWorkDays(createdEntries)
      } else {
        setError('Не удалось создать ни одной записи. Проверьте наличие сотрудников в системе.')
      }
    } catch (error) {
      console.error('Error creating work day entries:', error)
      setError('Произошла ошибка при создании записей табеля. Попробуйте позже.')
    } finally {
      setIsCreatingEntries(false)
    }
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-gray-900">
            Табель учета рабочего времени
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Выберите дату и редактируйте информацию о рабочем дне сотрудников
          </p>
        </div>
        
        <DateNavigation
          currentDate={currentDate}
          setCurrentDate={setCurrentDate}
        />
      </div>
      
      {isLoading && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="flex justify-center">
            <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-gray-500 mt-4">Загрузка данных...</p>
        </div>
      )}
      
      {!isLoading && error && (
        <div className="bg-white rounded-lg shadow-sm border border-red-100 p-6 text-center">
          <div className="flex justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-red-600 mt-3">{error}</p>
        </div>
      )}
      
      {!isLoading && !error && workDays.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-0 text-center overflow-hidden relative">
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-white p-8 z-10">
            <div className="max-w-md mx-auto w-full flex flex-col items-center">
              <div className="relative w-48 h-48 mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-indigo-500">
                  {currentDate.getDate()}
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Нет данных для отображения</h2>
              <p className="text-gray-600 mb-6 max-w-sm">
                На {formatDateISO(currentDate)} не найдено записей табеля учета рабочего времени
              </p>
              <Button 
                onClick={handleCreateEntriesForCurrentDate} 
                disabled={isCreatingEntries}
                size="md"
              >
                {isCreatingEntries ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Создание записей...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Создать записи табеля
                  </div>
                )}
              </Button>
            </div>
          </div>
          
          {/* Декоративные календарные элементы в фоне */}
          <div className="grid grid-cols-7 gap-px bg-gray-200 p-8 h-[500px] opacity-10">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="aspect-square bg-white flex items-center justify-center p-2">
                <div className={`w-full h-full rounded ${i % 9 === 0 ? 'bg-indigo-100' : ''}`}></div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {!isLoading && !error && workDays.length > 0 && (
        <TimesheetTable 
          workDays={workDays}
          onSaveWorkDay={saveWorkDay}
        />
      )}
    </div>
  )
} 