import React, { useState, useEffect } from 'react'
import { formatTime } from '@/lib/utils'
import { DayType, WorkDay, TimeEntry } from '@/types/workday'
import Button from '@/components/ui/Button'
import { toast } from 'react-hot-toast'
import MobileTimesheetCard from './MobileTimesheetCard'
import { WorkDayCreateRequest, WorkDayUpdateRequest } from '@/types/api'

// Интерфейсы
interface TimesheetTableProps {
  workDays: WorkDay[]
  currentDate: string
  isLoading: boolean
  onSave: (workDay: WorkDayCreateRequest | WorkDayUpdateRequest) => Promise<boolean>
  onDelete: (workDayId: string) => Promise<boolean>
}

// Константы для типов дней
const DAY_TYPE_LABELS: Record<string, string> = {
  'WORK_DAY': 'Рабочий день',
  'DAY_OFF': 'Выходной',
  'VACATION': 'Отпуск',
  'SICK_LEAVE': 'Больничный',
  'ABSENCE': 'Отсутствие',
  'UNPAID_LEAVE': 'Отпуск за свой счет'
}

// Интерфейс для редактируемых данных
interface EditableWorkDayData {
  id?: string;
  dayType: DayType;
  timeEntry: TimeEntry | null;
  tasks: { id: string; name: string; description?: string }[];
  connections: { id: string; name: string; duration?: number }[];
  comment: string;
}

// Интерфейс для состояния сохранения
interface SavingState {
  [key: string]: boolean;
}

// Тип для сотрудника
interface Employee {
  id: string;
  name: string;
  email?: string;
  position?: string;
  department?: string;
}

export default function TimesheetTable({
  workDays,
  currentDate,
  isLoading,
  onSave,
  onDelete
}: TimesheetTableProps) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [editableData, setEditableData] = useState<Record<string, EditableWorkDayData>>({})
  const [savingState, setSavingState] = useState<SavingState>({})
  const [isCreatingEntries, setIsCreatingEntries] = useState(false)
  const [isMobileView, setIsMobileView] = useState(false)
  
  // Значения по умолчанию
  const defaultStartTime = '09:00'
  const defaultEndTime = '18:00'
  const defaultLunchStartTime = '13:00'
  const defaultLunchEndTime = '14:00'

  // Определение мобильного вида при загрузке и изменении размера окна
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobileView(window.innerWidth < 768)
    }
    
    // Проверяем при загрузке
    checkIfMobile()
    
    // Добавляем слушатель resize
    window.addEventListener('resize', checkIfMobile)
    
    // Удаляем слушатель при размонтировании
    return () => window.removeEventListener('resize', checkIfMobile)
  }, [])

  // Загрузка сотрудников при монтировании компонента
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const response = await fetch('/api/employees')
        if (!response.ok) {
          throw new Error('Не удалось загрузить список сотрудников')
        }
        const data = await response.json()
        setEmployees(data)
      } catch (error) {
        console.error('Ошибка загрузки сотрудников:', error instanceof Error ? error.message : String(error))
        toast.error('Не удалось загрузить список сотрудников')
      }
    }
    
    loadEmployees()
  }, [])

  // Инициализация редактируемых данных при изменении workDays
  useEffect(() => {
    const newEditableData: Record<string, EditableWorkDayData> = {}
    
    if (Array.isArray(workDays)) {
      workDays.forEach(workDay => {
        if (workDay && workDay.employeeId) {
          newEditableData[workDay.employeeId] = {
            id: workDay.id,
            dayType: workDay.dayType || 'WORK_DAY',
            timeEntry: workDay.timeEntry || null,
            tasks: workDay.tasks || [],
            connections: workDay.connections || [],
            comment: workDay.comment || ''
          }
        }
      })
    }
    
    setEditableData(newEditableData)
  }, [workDays])

  // Обработчик изменения типа дня
  const handleDayTypeChange = (employeeId: string, dayType: string) => {
    setEditableData(prev => {
      // Обеспечиваем существование предыдущих данных
      const prevData = prev[employeeId] || {
        dayType: 'WORK_DAY',
        timeEntry: null,
        tasks: [],
        connections: [],
        comment: ''
      }
      
      return {
        ...prev,
        [employeeId]: {
          ...prevData,
          dayType: dayType as DayType,
          timeEntry: dayType === 'WORK_DAY' 
            ? {
                startTime: new Date(`${currentDate}T${defaultStartTime}`),
                endTime: new Date(`${currentDate}T${defaultEndTime}`),
                lunchStartTime: new Date(`${currentDate}T${defaultLunchStartTime}`),
                lunchEndTime: new Date(`${currentDate}T${defaultLunchEndTime}`)
              }
            : null
        }
      }
    })
  }

  // Обработчик изменения времени
  const handleTimeChange = (
    employeeId: string, 
    field: keyof TimeEntry, 
    timeValue: string
  ) => {
    if (!timeValue) return
    
    setEditableData(prev => {
      // Обеспечиваем существование предыдущих данных
      const prevData = prev[employeeId] || {
        dayType: 'WORK_DAY',
        timeEntry: null,
        tasks: [],
        connections: [],
        comment: ''
      }
      
      // Создаем timeEntry, если его нет
      const prevTimeEntry: TimeEntry = prevData.timeEntry || {
        startTime: new Date(`${currentDate}T${defaultStartTime}`),
        endTime: new Date(`${currentDate}T${defaultEndTime}`)
      }
      
      const dateObj = new Date(`${currentDate}T${timeValue}:00`)
      
      return {
        ...prev,
        [employeeId]: {
          ...prevData,
          timeEntry: {
            ...prevTimeEntry,
            [field]: dateObj
          }
        }
      }
    })
  }

  // Обработчик изменения комментария
  const handleCommentChange = (employeeId: string, comment: string) => {
    setEditableData(prev => {
      // Обеспечиваем существование предыдущих данных
      const prevData = prev[employeeId] || {
        dayType: 'WORK_DAY',
        timeEntry: null,
        tasks: [],
        connections: [],
        comment: ''
      }
      
      return {
        ...prev,
        [employeeId]: {
          ...prevData,
          comment
        }
      }
    })
  }

  // Сохранение данных для сотрудника
  const handleSaveEmployee = async (employeeId: string) => {
    if (!editableData[employeeId]) {
      console.error("Нет данных для сохранения (editableData[employeeId] отсутствует)");
      return;
    }
    
    setSavingState(prev => ({ ...prev, [employeeId]: true }))
    
    try {
      const workDay = workDays.find(wd => wd.employeeId === employeeId)
      const employeeData = editableData[employeeId]
      
      // Сохраняем только необходимые поля
      const dataToSave: WorkDayCreateRequest | WorkDayUpdateRequest = workDay?.id
        ? {
            id: workDay.id,
            employeeId,
            date: currentDate,
            dayType: employeeData.dayType,
            timeEntry: employeeData.dayType === 'WORK_DAY' ? employeeData.timeEntry : null,
            tasks: employeeData.tasks || [],
            connections: employeeData.connections || [],
            comment: employeeData.comment || ''
          } as WorkDayUpdateRequest
        : {
            employeeId,
            date: currentDate,
            dayType: employeeData.dayType,
            timeEntry: employeeData.dayType === 'WORK_DAY' ? employeeData.timeEntry : null,
            tasks: employeeData.tasks || [],
            connections: employeeData.connections || [],
            comment: employeeData.comment || ''
          } as WorkDayCreateRequest;
      
      // Убедимся, что у нас есть необходимые данные для WORK_DAY
      if (dataToSave.dayType === 'WORK_DAY' && (!dataToSave.timeEntry || 
          !dataToSave.timeEntry.startTime || !dataToSave.timeEntry.endTime)) {
        console.error('Неполные данные времени для рабочего дня:', dataToSave.timeEntry);
        toast.error('Некорректные данные времени. Пожалуйста, укажите начало и конец рабочего дня.');
        setSavingState(prev => ({ ...prev, [employeeId]: false }));
        return;
      }
      
      const result = await onSave(dataToSave)
      
      if (result) {
        toast.success('Данные сохранены')
      } else {
        console.error('Ошибка: onSave вернул false');
        toast.error('Не удалось сохранить данные')
      }
    } catch (error) {
      console.error('Ошибка при сохранении:', error instanceof Error ? error.message : String(error))
      toast.error('Не удалось сохранить данные')
    } finally {
      setSavingState(prev => ({ ...prev, [employeeId]: false }))
    }
  }

  // Создание записей для всех сотрудников
  const handleCreateEntriesForAll = async () => {
    setIsCreatingEntries(true)
    
    try {
      // Проверяем, что есть сотрудники
      if (employees.length === 0) {
        toast.error('Не найдены сотрудники для создания записей')
        return
      }
      
      console.log('Найдено сотрудников:', employees.length)
      console.log('Текущие рабочие дни:', workDays.length)
      
      // Фильтруем сотрудников, для которых нет записей
      const employeesWithoutEntries = employees.filter(emp => 
        !workDays.some(wd => wd.employeeId === emp.id)
      )
      
      console.log('Сотрудники без записей:', employeesWithoutEntries.length)
      
      if (employeesWithoutEntries.length === 0) {
        toast.success('Все сотрудники уже имеют записи на эту дату')
        return
      }
      
      let createdCount = 0
      
      for (const employee of employeesWithoutEntries) {
        try {
          const newWorkDay: WorkDayCreateRequest = {
            employeeId: employee.id,
            date: currentDate,
            dayType: 'WORK_DAY',
            timeEntry: {
              startTime: new Date(`${currentDate}T${defaultStartTime}`),
              endTime: new Date(`${currentDate}T${defaultEndTime}`),
              lunchStartTime: new Date(`${currentDate}T${defaultLunchStartTime}`),
              lunchEndTime: new Date(`${currentDate}T${defaultLunchEndTime}`)
            },
            tasks: [],
            connections: [],
            comment: ''
          }
          
          console.log('Создаем запись для сотрудника:', employee.name, 'ID:', employee.id)
          
          const success = await onSave(newWorkDay)
          if (success) {
            createdCount++
          }
        } catch (err) {
          console.error(`Ошибка создания записи для сотрудника ${employee.name}:`, 
            err instanceof Error ? err.message : String(err))
        }
      }
      
      if (createdCount > 0) {
        toast.success(`Создано ${createdCount} записей`)
      } else {
        toast.error('Не удалось создать ни одной записи')
      }
    } catch (error) {
      console.error('Ошибка при создании записей:', error instanceof Error ? error.message : String(error))
      toast.error('Не удалось создать записи: ' + (error instanceof Error ? error.message : String(error)))
    } finally {
      setIsCreatingEntries(false)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mt-4 text-center">
        <div className="flex justify-center mb-3">
          <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <p className="text-gray-500">Загрузка данных...</p>
      </div>
    )
  }

  if (workDays.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mt-4">
        <div className="text-center">
          <div className="flex justify-center mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Нет данных для отображения</h2>
          <p className="text-gray-600 mb-4">Нет записей табеля на выбранную дату</p>
          
          <Button 
            onClick={handleCreateEntriesForAll}
            disabled={isCreatingEntries || employees.length === 0}
          >
            {isCreatingEntries ? 'Создание записей...' : 'Создать записи для всех сотрудников'}
          </Button>
        </div>
      </div>
    )
  }

  // Мобильное представление
  if (isMobileView) {
    return (
      <div className="mt-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Табель рабочего времени</h2>
          
          {employees.length > workDays.length && (
            <Button 
              onClick={handleCreateEntriesForAll}
              disabled={isCreatingEntries}
              variant="outline"
              className="text-sm"
              size="sm"
            >
              {isCreatingEntries ? 'Создание...' : 'Добавить сотрудников'}
            </Button>
          )}
        </div>
        
        {workDays.map(workDay => (
          <MobileTimesheetCard
            key={workDay.id}
            workDay={workDay}
            onSave={onSave}
            onDelete={onDelete}
          />
        ))}
      </div>
    )
  }

  // Десктопное представление (таблица)
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mt-4 overflow-x-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Табель рабочего времени</h2>
        
        {employees.length > workDays.length && (
          <Button 
            onClick={handleCreateEntriesForAll}
            disabled={isCreatingEntries}
            variant="outline"
            className="text-sm"
          >
            {isCreatingEntries ? 'Создание...' : 'Добавить остальных сотрудников'}
          </Button>
        )}
      </div>
      
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Сотрудник
            </th>
            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Тип дня
            </th>
            <th scope="col" className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Начало
            </th>
            <th scope="col" className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Конец
            </th>
            <th scope="col" className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Обед (начало)
            </th>
            <th scope="col" className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Обед (конец)
            </th>
            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Комментарий
            </th>
            <th scope="col" className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Действия
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {workDays.map(workDay => {
            const employeeData = editableData[workDay.employeeId] || {}
            const isSaving = savingState[workDay.employeeId] || false
            
            // Безопасное получение форматированного времени
            const safeFormatTime = (value: any) => {
              try {
                return formatTime(value)
              } catch (e) {
                console.error('Ошибка форматирования времени:', e)
                return '--:--'
              }
            }
            
            return (
              <tr key={workDay.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{workDay.employee?.name || 'Сотрудник'}</div>
                  <div className="text-xs text-gray-500">{workDay.employee?.position || ''}</div>
                </td>
                
                <td className="px-3 py-2 whitespace-nowrap">
                  <select
                    value={employeeData.dayType}
                    onChange={(e) => handleDayTypeChange(workDay.employeeId, e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    disabled={isSaving}
                  >
                    {Object.entries(DAY_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </td>
                
                <td className="px-3 py-2 whitespace-nowrap text-center">
                  <input
                    type="time"
                    value={safeFormatTime(employeeData.timeEntry?.startTime)}
                    onChange={(e) => handleTimeChange(workDay.employeeId, 'startTime', e.target.value)}
                    className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    disabled={employeeData.dayType !== 'WORK_DAY' || isSaving}
                  />
                </td>
                
                <td className="px-3 py-2 whitespace-nowrap text-center">
                  <input
                    type="time"
                    value={safeFormatTime(employeeData.timeEntry?.endTime)}
                    onChange={(e) => handleTimeChange(workDay.employeeId, 'endTime', e.target.value)}
                    className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    disabled={employeeData.dayType !== 'WORK_DAY' || isSaving}
                  />
                </td>
                
                <td className="px-3 py-2 whitespace-nowrap text-center">
                  <input
                    type="time"
                    value={safeFormatTime(employeeData.timeEntry?.lunchStartTime)}
                    onChange={(e) => handleTimeChange(workDay.employeeId, 'lunchStartTime', e.target.value)}
                    className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    disabled={employeeData.dayType !== 'WORK_DAY' || isSaving}
                  />
                </td>
                
                <td className="px-3 py-2 whitespace-nowrap text-center">
                  <input
                    type="time"
                    value={safeFormatTime(employeeData.timeEntry?.lunchEndTime)}
                    onChange={(e) => handleTimeChange(workDay.employeeId, 'lunchEndTime', e.target.value)}
                    className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    disabled={employeeData.dayType !== 'WORK_DAY' || isSaving}
                  />
                </td>
                
                <td className="px-3 py-2 whitespace-nowrap">
                  <input
                    type="text"
                    value={employeeData.comment || ''}
                    onChange={(e) => handleCommentChange(workDay.employeeId, e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Комментарий"
                    disabled={isSaving}
                  />
                </td>
                
                <td className="px-3 py-2 whitespace-nowrap text-center">
                  <div className="flex space-x-2 justify-center">
                    <button
                      onClick={() => handleSaveEmployee(workDay.employeeId)}
                      className="text-indigo-600 hover:text-indigo-900 font-medium text-sm"
                      disabled={isSaving}
                    >
                      {isSaving ? 'Сохранение...' : 'Сохранить'}
                    </button>
                    <button
                      onClick={() => onDelete(workDay.id)}
                      className="text-red-600 hover:text-red-900 font-medium text-sm"
                      disabled={isSaving}
                    >
                      Удалить
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
} 