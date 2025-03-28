'use client';

import React, { useState, useEffect, useMemo } from 'react'
import { formatTime, calculateDuration, formatDateISO } from '@/lib/utils'
import { WorkDay, DAY_TYPE_LABELS, DayType } from '@/lib/types'
import Select from '../ui/Select'
import TimeInput from '../ui/TimeInput'
import Button from '../ui/Button'
import MobileTimesheetCard from './MobileTimesheetCard'
import { useMediaQuery } from '@/hooks/useMediaQuery'

interface TimesheetTableProps {
  workDays: WorkDay[]
  onSaveWorkDay: (data: any) => Promise<void>
}

const TimesheetTable = ({ workDays, onSaveWorkDay }: TimesheetTableProps) => {
  // Hooks для определения размера экрана
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Проверяем, что workDays является массивом
  const validWorkDays = Array.isArray(workDays) ? workDays : []
  
  // Состояние для редактируемых данных
  const [editableWorkDays, setEditableWorkDays] = useState<{[key: string]: {
    dayType: DayType;
    startTime: string;
    endTime: string;
    lunchStartTime: string;
    lunchEndTime: string;
    tasksCompleted: string;
    connectionsEstablished: string;
    comment: string;
  }}>({})
  
  // Состояние для загрузки
  const [savingEmployees, setSavingEmployees] = useState<{[key: string]: boolean}>({})
  const [isBatchSaving, setIsBatchSaving] = useState(false)
  
  // Значения по умолчанию для рабочего дня
  const defaultStartTime = '08:00'
  const defaultEndTime = '18:00'
  const defaultLunchStartTime = '13:00'
  const defaultLunchEndTime = '14:00'
  
  // Преобразуем типы дня в опции для селекта
  const dayTypeOptions = Object.entries(DAY_TYPE_LABELS).map(([value, label]) => ({
    value,
    label
  }))
  
  // При изменении workDays инициализируем редактируемые данные
  useEffect(() => {
    console.log('Инициализация данных таблицы с', validWorkDays.length, 'записями')
    const newEditableWorkDays: {[key: string]: any} = {}
    
    validWorkDays.forEach(workDay => {
      if (!workDay || !workDay.employeeId) {
        console.warn('Пропускаем некорректную запись:', workDay)
        return
      }
      
      console.log('Инициализация данных для записи:', workDay.id, workDay.employeeId, workDay.dayType)
      
      // Получаем и выводим данные о времени для отладки
      if (workDay.timeEntry) {
        console.log('Данные времени из базы:', {
          startTime: workDay.timeEntry.startTime,
          endTime: workDay.timeEntry.endTime,
          lunchStartTime: workDay.timeEntry.lunchStartTime,
          lunchEndTime: workDay.timeEntry.lunchEndTime
        })
      } else {
        console.log('Нет данных о времени в записи')
      }
      
      // Получаем время из записи (теперь это строки)
      const startTime = workDay.timeEntry?.startTime || defaultStartTime
      const endTime = workDay.timeEntry?.endTime || defaultEndTime
      const lunchStartTime = workDay.timeEntry?.lunchStartTime || defaultLunchStartTime
      const lunchEndTime = workDay.timeEntry?.lunchEndTime || defaultLunchEndTime
      
      newEditableWorkDays[workDay.employeeId] = {
        dayType: workDay.dayType,
        startTime: workDay.dayType === 'WORK_DAY' ? startTime : '',
        endTime: workDay.dayType === 'WORK_DAY' ? endTime : '',
        lunchStartTime: workDay.dayType === 'WORK_DAY' ? lunchStartTime : '',
        lunchEndTime: workDay.dayType === 'WORK_DAY' ? lunchEndTime : '',
        tasksCompleted: (workDay.workStats?.tasksCompleted || 0).toString(),
        connectionsEstablished: (workDay.workStats?.connectionsEstablished || 0).toString(),
        comment: workDay.comment || ''
      }
    })
    
    console.log('Инициализировано данных:', Object.keys(newEditableWorkDays).length)
    setEditableWorkDays(newEditableWorkDays)
  }, [validWorkDays])
  
  // Обработчик изменения типа дня
  const handleDayTypeChange = (employeeId: string, dayType: DayType) => {
    setEditableWorkDays(prev => {
      const updatedData = { ...prev }
      
      updatedData[employeeId] = {
        ...updatedData[employeeId],
        dayType
      }
      
      if (dayType === 'WORK_DAY') {
        updatedData[employeeId].startTime = defaultStartTime
        updatedData[employeeId].endTime = defaultEndTime
        updatedData[employeeId].lunchStartTime = defaultLunchStartTime
        updatedData[employeeId].lunchEndTime = defaultLunchEndTime
      } else {
        updatedData[employeeId].startTime = ''
        updatedData[employeeId].endTime = ''
        updatedData[employeeId].lunchStartTime = ''
        updatedData[employeeId].lunchEndTime = ''
        updatedData[employeeId].tasksCompleted = '0'
        updatedData[employeeId].connectionsEstablished = '0'
      }
      
      return updatedData
    })
  }
  
  // Обработчик изменения данных
  const handleChange = (employeeId: string, field: string, value: string) => {
    setEditableWorkDays(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        [field]: value
      }
    }))
  }
  
  // Функция для расчета чистого рабочего времени
  const calculateNetDuration = (workDay: WorkDay, employeeData: any) => {
    if (!workDay || !workDay.date) return '--:--'
    
    const workDate = new Date(workDay.date)
    if (!(workDate instanceof Date) || isNaN(workDate.getTime())) return '--:--'
    
    // Если тип дня не рабочий, возвращаем пустое значение
    if (employeeData.dayType !== 'WORK_DAY') return '--:--'
    
    const { startTime, endTime, lunchStartTime, lunchEndTime } = employeeData
    
    if (!startTime || !endTime || !lunchStartTime || !lunchEndTime) return '--:--'
    
    // Создаем даты для расчета
    const startDate = new Date(workDate)
    const [startHours, startMinutes] = startTime.split(':').map(Number)
    startDate.setHours(startHours, startMinutes, 0, 0)
    
    const endDate = new Date(workDate)
    const [endHours, endMinutes] = endTime.split(':').map(Number)
    endDate.setHours(endHours, endMinutes, 0, 0)
    
    const lunchStartDate = new Date(workDate)
    const [lunchStartHours, lunchStartMinutes] = lunchStartTime.split(':').map(Number)
    lunchStartDate.setHours(lunchStartHours, lunchStartMinutes, 0, 0)
    
    const lunchEndDate = new Date(workDate)
    const [lunchEndHours, lunchEndMinutes] = lunchEndTime.split(':').map(Number)
    lunchEndDate.setHours(lunchEndHours, lunchEndMinutes, 0, 0)
    
    // Расчет общего времени
    const totalMs = endDate.getTime() - startDate.getTime()
    const lunchMs = lunchEndDate.getTime() - lunchStartDate.getTime()
    
    const netMs = totalMs - lunchMs
    
    // Пересчет в часы и минуты
    const hours = Math.floor(netMs / (1000 * 60 * 60))
    const minutes = Math.floor((netMs % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours < 0 || minutes < 0) return '--:--'
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  }
  
  // Функция для получения общего рабочего времени
  const getTotalWorkTime = (workDay: WorkDay, employeeData: any) => {
    if (!workDay || !workDay.date || employeeData.dayType !== 'WORK_DAY') return '--:--'
    if (!employeeData.startTime || !employeeData.endTime) return '--:--'
    
    const workDate = new Date(workDay.date)
    
    // Создаем даты для расчета
    const startDate = new Date(workDate)
    const [startHours, startMinutes] = employeeData.startTime.split(':').map(Number)
    startDate.setHours(startHours, startMinutes, 0, 0)
    
    const endDate = new Date(workDate)
    const [endHours, endMinutes] = employeeData.endTime.split(':').map(Number)
    endDate.setHours(endHours, endMinutes, 0, 0)
    
    // Расчет общего времени
    const totalMs = endDate.getTime() - startDate.getTime()
    
    // Пересчет в часы и минуты
    const hours = Math.floor(totalMs / (1000 * 60 * 60))
    const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours < 0 || minutes < 0) return '--:--'
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  }
  
  // Сохранение данных для одного сотрудника
  const handleSaveEmployee = async (workDay: WorkDay) => {
    const employeeId = workDay.employeeId
    
    if (!editableWorkDays[employeeId]) {
      console.error(`Нет данных для сотрудника ${employeeId}`)
      return
    }
    
    // Устанавливаем состояние загрузки для данного сотрудника
    setSavingEmployees(prev => ({ ...prev, [employeeId]: true }))
    
    try {
      const employeeData = editableWorkDays[employeeId]
      console.log(`Сохранение данных для сотрудника ${employeeId}`, employeeData)
      
      // Форматируем дату для отправки (только дата без времени)
      const dateStr = formatDateISO(workDay.date instanceof Date 
        ? workDay.date 
        : new Date(workDay.date)) // Формат YYYY-MM-DD

      // Проверяем, есть ли данные о времени
      let timeData = {}
      
      if (employeeData.dayType === 'WORK_DAY') {
        try {
          // Проверка формата времени
          const timeRegex = /^\d{1,2}:\d{2}$/
          if (!timeRegex.test(employeeData.startTime) || 
              !timeRegex.test(employeeData.endTime) || 
              !timeRegex.test(employeeData.lunchStartTime) || 
              !timeRegex.test(employeeData.lunchEndTime)) {
            throw new Error('Некорректный формат времени')
          }
          
          // Нормализуем формат времени (добавляем ведущие нули)
          const normalizeTime = (timeStr: string): string => {
            const [hours, minutes] = timeStr.split(':').map(Number)
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
          }
          
          // Добавляем данные о времени (прямо как строки)
          timeData = {
            startTime: normalizeTime(employeeData.startTime),
            endTime: normalizeTime(employeeData.endTime),
            lunchStartTime: normalizeTime(employeeData.lunchStartTime),
            lunchEndTime: normalizeTime(employeeData.lunchEndTime)
          }
          
          console.log('Отправляемые временные данные:', timeData)
        } catch (error) {
          console.error('Ошибка форматирования времени:', error)
          alert('Ошибка в формате времени. Пожалуйста, используйте формат ЧЧ:ММ (например, 08:00)')
          setSavingEmployees(prev => ({ ...prev, [employeeId]: false }))
          return
        }
      }
      
      // Создаем объект данных для API
      const payload = {
        employeeId,
        date: dateStr, // Используем только дату без времени
        dayType: employeeData.dayType,
        comment: employeeData.comment || null,
        tasksCompleted: parseInt(employeeData.tasksCompleted, 10) || 0,
        connectionsEstablished: parseInt(employeeData.connectionsEstablished, 10) || 0,
        employee: workDay.employee,
        ...timeData // Добавляем временные данные, если они есть
      }
      
      console.log('Отправляем данные:', payload)
      
      // Отправляем данные на сервер и ждем их сохранения
      await onSaveWorkDay(payload)
      
      console.log('Данные успешно сохранены для сотрудника:', employeeId)
    } catch (error) {
      console.error(`Ошибка при сохранении данных для сотрудника ${employeeId}:`, error)
      alert(`Ошибка при сохранении данных для сотрудника ${workDay.employee?.name || employeeId}. Попробуйте еще раз.`)
    } finally {
      // Сбрасываем состояние загрузки
      setSavingEmployees(prev => ({ ...prev, [employeeId]: false }))
    }
  }
  
  // Сохранение данных для всех сотрудников
  const handleSaveAll = async () => {
    setIsBatchSaving(true)
    
    try {
      console.log(`Сохранение данных для ${validWorkDays.length} сотрудников`)
      
      const savingPromises = validWorkDays.map(workDay => {
        if (!workDay || !workDay.employeeId) return null
        return handleSaveEmployee(workDay)
      })
      
      // Исключаем null и ждем выполнения всех промисов
      await Promise.all(savingPromises.filter(Boolean))
      
      // Отображаем сообщение об успешном сохранении
      alert('Все данные успешно сохранены')
    } catch (error) {
      console.error('Ошибка при сохранении всех данных:', error)
    } finally {
      setIsBatchSaving(false)
    }
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-2">
        <Button
          onClick={handleSaveAll}
          disabled={isBatchSaving}
          className="flex items-center"
        >
          {isBatchSaving ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Сохранение...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Сохранить все изменения
            </>
          )}
        </Button>
      </div>
      
      {isMobile ? (
        <div className="space-y-3">
          {validWorkDays.length > 0 ? validWorkDays.map((workDay, index) => {
            if (!workDay || !workDay.employeeId || !editableWorkDays[workDay.employeeId]) {
              console.warn('Пропускаем отображение записи:', workDay?.id || 'неизвестная запись')
              return null;
            }
            
            const employeeData = editableWorkDays[workDay.employeeId];
            const isSaving = savingEmployees[workDay.employeeId] || false;
            
            return (
              <MobileTimesheetCard
                key={workDay.employeeId}
                workDay={workDay}
                employeeData={employeeData}
                index={index}
                isSaving={isSaving}
                netDuration={calculateNetDuration(workDay, employeeData)}
                totalWorkTime={getTotalWorkTime(workDay, employeeData)}
                onDayTypeChange={handleDayTypeChange}
                onChange={handleChange}
                onSave={handleSaveEmployee}
              />
            );
          }) : (
            <div className="card p-6 bg-white text-center text-gray-500">
              <div className="flex flex-col items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>Ошибка загрузки данных. Пожалуйста, попробуйте обновить страницу.</div>
              </div>
            </div>
          )}
          
          {validWorkDays.length > 0 && (
            <div className="bg-gray-50 rounded p-3 text-xs">
              <div className="font-medium mb-1">Всего сотрудников: {validWorkDays.length}</div>
              <div className="text-gray-500 space-y-1">
                <div>Рабочий день - регулярный рабочий день</div>
                <div>Зад. - количество выполненных заданий</div>
                <div>Под. - количество подключений</div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="card p-0 overflow-hidden rounded-lg shadow-sm border border-gray-200">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-700">
                <th scope="col" className="px-2 py-1.5 text-center font-medium w-10">№</th>
                <th scope="col" className="px-2 py-1.5 text-left font-medium">СОТРУДНИК</th>
                <th scope="col" className="px-2 py-1.5 text-left font-medium w-28">ТИП</th>
                <th scope="col" className="px-1 py-1.5 text-center font-medium w-16">НАЧАЛО<br/><span className="text-2xs font-normal text-gray-500">Рабочий день</span></th>
                <th scope="col" className="px-1 py-1.5 text-center font-medium w-16">КОНЕЦ<br/><span className="text-2xs font-normal text-gray-500">Рабочий день</span></th>
                <th scope="col" className="px-1 py-1.5 text-center font-medium w-16">ОБЕД<br/><span className="text-2xs font-normal text-gray-500">Начало</span></th>
                <th scope="col" className="px-1 py-1.5 text-center font-medium w-16">ОБЕД<br/><span className="text-2xs font-normal text-gray-500">Конец</span></th>
                <th scope="col" className="px-1 py-1.5 text-center font-medium w-14">ЧАСЫ<br/><span className="text-2xs font-normal text-gray-500">Нетто/Всего</span></th>
                <th scope="col" className="px-1 py-1.5 text-center font-medium w-14">ЗАД.</th>
                <th scope="col" className="px-1 py-1.5 text-center font-medium w-14">ПОД.</th>
                <th scope="col" className="px-2 py-1.5 text-left font-medium">КОММ.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {validWorkDays.length > 0 ? validWorkDays.map((workDay, index) => {
                if (!workDay || !workDay.employeeId || !editableWorkDays[workDay.employeeId]) {
                  console.warn('Пропускаем отображение записи:', workDay?.id || 'неизвестная запись')
                  return null;
                }
                
                const employeeData = editableWorkDays[workDay.employeeId];
                const isSaving = savingEmployees[workDay.employeeId] || false;
                
                return (
                  <tr key={workDay.employeeId} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                    <td className="px-2 py-1.5 text-center">
                      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-indigo-100 text-indigo-800 font-medium">
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="font-medium text-gray-900 truncate max-w-[150px]">{workDay.employee?.name || 'Сотрудник'}</div>
                      <div className="text-2xs text-gray-500 truncate max-w-[150px]">{workDay.employee?.position || 'Должность'}</div>
                    </td>
                    <td className="px-2 py-1.5">
                      <Select
                        options={dayTypeOptions}
                        value={employeeData.dayType}
                        onChange={(e) => handleDayTypeChange(workDay.employeeId, e.target.value as DayType)}
                        className="text-xs h-7 w-full text-xs"
                        disabled={isSaving}
                      />
                    </td>
                    <td className="px-1 py-1.5 text-center">
                      <TimeInput
                        value={employeeData.startTime}
                        onChange={(e) => handleChange(workDay.employeeId, 'startTime', e.target.value)}
                        className={`h-7 text-xs w-full text-center ${employeeData.dayType !== 'WORK_DAY' ? 'opacity-50' : ''}`}
                        disabled={employeeData.dayType !== 'WORK_DAY' || isSaving}
                      />
                    </td>
                    <td className="px-1 py-1.5 text-center">
                      <TimeInput
                        value={employeeData.endTime}
                        onChange={(e) => handleChange(workDay.employeeId, 'endTime', e.target.value)}
                        className={`h-7 text-xs w-full text-center ${employeeData.dayType !== 'WORK_DAY' ? 'opacity-50' : ''}`}
                        disabled={employeeData.dayType !== 'WORK_DAY' || isSaving}
                      />
                    </td>
                    <td className="px-1 py-1.5 text-center">
                      <TimeInput
                        value={employeeData.lunchStartTime}
                        onChange={(e) => handleChange(workDay.employeeId, 'lunchStartTime', e.target.value)}
                        className={`h-7 text-xs w-full text-center ${employeeData.dayType !== 'WORK_DAY' ? 'opacity-50' : ''}`}
                        disabled={employeeData.dayType !== 'WORK_DAY' || isSaving}
                      />
                    </td>
                    <td className="px-1 py-1.5 text-center">
                      <TimeInput
                        value={employeeData.lunchEndTime}
                        onChange={(e) => handleChange(workDay.employeeId, 'lunchEndTime', e.target.value)}
                        className={`h-7 text-xs w-full text-center ${employeeData.dayType !== 'WORK_DAY' ? 'opacity-50' : ''}`}
                        disabled={employeeData.dayType !== 'WORK_DAY' || isSaving}
                      />
                    </td>
                    <td className="px-1 py-1.5 text-center">
                      <div className="flex flex-col">
                        <span className="text-2xs text-gray-700 font-bold">{getTotalWorkTime(workDay, employeeData)}</span>
                        <span className="text-2xs text-indigo-600 font-medium">{calculateNetDuration(workDay, employeeData)}</span>
                      </div>
                    </td>
                    <td className="px-1 py-1.5 text-center">
                      <input
                        type="number"
                        min="0"
                        value={employeeData.tasksCompleted}
                        onChange={(e) => handleChange(workDay.employeeId, 'tasksCompleted', e.target.value)}
                        className={`w-full h-7 text-xs rounded border-gray-300 text-center ${employeeData.dayType !== 'WORK_DAY' ? 'opacity-50' : ''}`}
                        disabled={employeeData.dayType !== 'WORK_DAY' || isSaving}
                      />
                    </td>
                    <td className="px-1 py-1.5 text-center">
                      <input
                        type="number"
                        min="0"
                        value={employeeData.connectionsEstablished}
                        onChange={(e) => handleChange(workDay.employeeId, 'connectionsEstablished', e.target.value)}
                        className={`w-full h-7 text-xs rounded border-gray-300 text-center ${employeeData.dayType !== 'WORK_DAY' ? 'opacity-50' : ''}`}
                        disabled={employeeData.dayType !== 'WORK_DAY' || isSaving}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="text"
                        placeholder="Комментарий..."
                        value={employeeData.comment}
                        onChange={(e) => handleChange(workDay.employeeId, 'comment', e.target.value)}
                        className="w-full h-7 text-xs rounded border-gray-300"
                        disabled={isSaving}
                      />
                    </td>
                    <td className="px-2 py-1.5 text-center w-20">
                      <Button 
                        onClick={() => handleSaveEmployee(workDay)}
                        disabled={isSaving}
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                      >
                        {isSaving ? '...' : 'Сохранить'}
                      </Button>
                    </td>
                  </tr>
                )
              }) : (
                <tr>
                  <td colSpan={12} className="p-6 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>Ошибка загрузки данных. Пожалуйста, попробуйте обновить страницу.</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 text-gray-700 border-t border-gray-200">
                <td colSpan={3} className="px-2 py-2 text-xs font-medium">
                  Всего сотрудников: {validWorkDays.length}
                </td>
                <td colSpan={9} className="px-2 py-2 text-xs text-right">
                  <div className="text-xs text-gray-500">
                    <span className="mr-3">Рабочий день - регулярный рабочий день</span>
                    <span className="mr-3">Зад. - количество выполненных заданий</span>
                    <span>Под. - количество подключений</span>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}

export default TimesheetTable 